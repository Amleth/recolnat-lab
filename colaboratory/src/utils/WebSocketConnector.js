'use strict';

import {EventEmitter} from 'events';
import uuid from 'node-uuid';
import _ from 'lodash';

import ServerActions from '../actions/ServerActions.js';
import ToolActions from '../actions/ToolActions';
import ViewActions from '../actions/ViewActions';

import SocketEvents from '../stores/events/SocketEvents';

import ServerConstants from '../constants/ServerConstants.js'
import ViewConstants from '../constants/ViewConstants.js';

import AppDispatcher from '../dispatcher/AppDispatcher';

import conf from '../conf/ApplicationConfiguration';

var W3CWebSocket = require('websocket').w3cwebsocket;

// Simulation de la communication avec le serveur & de l'état de sa BDD
class API extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(1000);
    // Maps each resource id to corresponding stored data
    this.idToData = {};
    // Maps each resource id to listeners to call when
    this.idToListeners = {};
    this.entities = {};
    this.websocketServerMethod = "";
    this.websocket = null;
    this.ping = null;
    var that = this;



    AppDispatcher.register((action) => {
      // Receive needs from other client-side components and dispatch messages to WebSocket
      switch (action.actionType) {
        case SocketConstants.ActionTypes.REGISTER_CALLBACK:
        this.addResourceListener(action.id, action.callback);
        break;
        case SocketConstants.ActionTypes.REMOVE_CALLBACK:
        this.removeResourceListener(action.id, action.callback);
        default:
          break;
      }
    });
  }

  openWebsocket() {
    if(this.websocket == null) {
      var self = this;
      var websocket = new W3CWebSocket(conf.wss, this.websocketServerMethod, conf.wss);

      websocket.onerror = function (message) {
        console.error('Connection failed with error: ' + JSON.stringify(message));
      };

      websocket.onopen = function (message) {
        console.log('Client connected ' + JSON.stringify(message));
        // Received resource is user data
        var user = JSON.parse(message.data).resource;
        this.emit(SocketEvents.RESOURCE_UPDATED + '_user', user);
        // Send a ping every minute to prevent timeout
        self.ping = window.setInterval(self.sendPing.bind(self), 60000);
      };

      websocket.onclose = function (message) {
        console.log('Connection closed ' + JSON.stringify(message));
        self.clearInterval(self.ping);
        this.emit(SocketEvents.RESOURCE_UPDATED + '_user', null);
      };

      websocket.onmessage = this.receiveServerMessage.bind(this);

      this.websocket = websocket;
    }
  }

  receiveServerMessage(message) {
    var jsonMessage = JSON.parse(message.data);
    switch(jsonMessage.action) {
      case ServerConstants.ActionTypes.Receive.RESOURCE:
      var resource = jsonMessage.resource;
      this.idToData[resource.uid] = resource;
      this.emit(SocketEvents.RESOURCE_UPDATED + "_" + resource.uid);
      break;
      case ServerConstants.ActionTypes.Receive.DONE:
      console.log("Got OK from server");
      break;
      case ServerConstants.ActionTypes.Receive.DENIED:
      console.log("Got DENIED from server");
      break;
      default:
      console.error("No switch implemented for action " + jsonMessage.action);
      break;
    }
  }

  closeWebsocket() {
    if(this.websocket) {
      this.websocket.close(1000, "User logged out");
      this.websocket = null;
    }
  }

  subscribe(id) {
    var message = {
      action: ServerConstants.ActionTypes.Send.SUBSCRIBE,
      id: id
    };

    this.sendPayloadWhenReady(message);
  }

  unsubscribe(id) {
    var message = {
      action: ServerConstants.ActionTypes.Send.UNSUBSCRIBE,
      id: id
    };

    this.sendPayloadWhenReady(message);
  }

  /**
   * Retrieve current data.
   */
  fetchData(workbenchUri) {
    if(workbenchUri) {
      //console.log("Fetching data");
      var payload = {
        workbench: workbenchUri,
        action: ServerConstants.ActionTypes.SERVER_CHILD_ENTITIES
      };
      this.sendPayloadWhenReady.call(this, payload);
    }
  }

  sendPayloadWhenReady(json) {
    if (this.websocket) {
      if (this.websocket.readyState === this.websocket.CONNECTING) {
        //console.log("waiting for connection");
        this.setTimeout(this.sendPayloadWhenReady.bind(this, json), 1000, this, json);
      }
      else {
        this.websocket.send(JSON.stringify(json));
      }
    }
    else {
      console.error("Websocket not connected");
    }
  }

  sendPing() {
    this.websocket.send('PING');
  }

  addResourceListener(id, callback) {
    if(this.idToData[id]) {
      window.setTimeout((function(callback, data) {
        callback(data);
      })(callback, this.idToData[id]), 10);
    }
    this.on(SocketEvents.RESOURCE_UPDATED + '_' + id, callback);

    if(this.listenerCount(SocketEvents.RESOURCE_UPDATED + '_' + id) === 1) {
      this.subscribe(id);
    }
  }

  removeResourceListener(id, callback) {
    this.removeListener(SocketEvents.RESOURCE_UPDATED + '_' + id);
    if(this.listenerCount(SocketEvents.RESOURCE_UPDATED + '_' + id) === 0) {
      this.unsubscribe(id);
    }
  }

}

export default API;
