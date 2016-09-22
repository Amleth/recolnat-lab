'use strict';

import {EventEmitter} from 'events';
import uuid from 'node-uuid';
import _ from 'lodash';

import SocketEvents from '../stores/events/SocketEvents';

import SocketConstants from '../constants/SocketConstants.js';
import ServerConstants from '../constants/ServerConstants.js';

import AppDispatcher from '../dispatcher/AppDispatcher';

import conf from '../conf/ApplicationConfiguration';

var W3CWebSocket = require('websocket').w3cwebsocket;

// Simulation de la communication avec le serveur & de l'état de sa BDD
class Connector extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(1000);
    // Maps each resource id to corresponding stored data
    this.idToData = {};
    // Counts number of messages and serves as message id for this session. Only message which have a custom answer (i.e. UPDATE) need to be id'd.
    this.messageCounter = 0;
    // Associates a message id (from messageCounter variable) to two callbacks : success and error
    this.messageIdToCallback = {};
    this.websocketServerMethod = "";
    this.websocket = null;
    this.ping = null;
    this.user = null;

    AppDispatcher.register((action) => {
      // Receive needs from other client-side components and dispatch messages to WebSocket
      switch (action.actionType) {
        case SocketConstants.ActionTypes.OPEN:
          this.openWebsocket();
          break;
        case SocketConstants.ActionTypes.CLOSE:
          this.closeWebsocket();
          break;
        case SocketConstants.ActionTypes.REGISTER_CALLBACK:
          this.addResourceListener(action.id, action.callback);
          break;
        case SocketConstants.ActionTypes.REMOVE_CALLBACK:
          this.removeResourceListener(action.id, action.callback);
          break;
        case SocketConstants.ActionTypes.SEND:
          this.messageCounter++;
          action.message.messageId = this.messageCounter;
          if(action.callback) {
            this.once(this.messageCounter, action.callback);
          }
          window.setTimeout(this.sendPayloadWhenReady.bind(this, action.message), 10);
          break;
        default:
          break;
      }
    });

    this.openWebsocket();
    this.openInterval = null;
  }

  openWebsocket() {
    if(this.websocket == null) {
      window.clearInterval(this.openInterval);
      var self = this;
      var websocket = new W3CWebSocket(conf.wss, this.websocketServerMethod, conf.wss);

      websocket.onerror = function (message) {
        console.error('Connection failed with error: ' + JSON.stringify(message));
      };

      websocket.onopen = function (message) {
        console.log('Client connected ' + JSON.stringify(message));
        self.messageCounter = 0;

        self.ping = window.setInterval(self.sendPing.bind(self), 60000);
      };

      websocket.onclose = function (message) {
        console.log('Connection closed ' + JSON.stringify(message));
        window.clearInterval(self.ping);
        self.user = null;
        self.idToData['user'] = null;
        self.websocket = null;
        self.emitResourceUpdate('user');
        self.openInterval = window.setInterval(self.openWebsocket.bind(self), 1000);
      };

      websocket.onmessage = this.receiveServerMessage.bind(this);

      this.websocket = websocket;
    }
  }

  receiveServerMessage(message) {
    if(message.data === "PONG") {
      console.log('PING/PONG success');
      return;
    }
    if(message.data === 500) {
      console.error("Internal server error");
      return;
    }
    console.log('got message ' + message.data);
    var jsonMessage = JSON.parse(message.data);
    switch(jsonMessage.action) {
      case ServerConstants.ActionTypes.Receive.RESOURCE:
        var resource = jsonMessage.resource;
        if(resource.type === "User" && this.user === null) {
          console.log('User data received');
          this.idToData['user'] = resource;
          this.user = resource;
          this.emitResourceUpdate('user');
        }
        this.idToData[resource.uid] = resource;
        this.emitResourceUpdate(resource.uid);
        break;
      case ServerConstants.ActionTypes.Receive.DONE:
        console.log("Got OK from server");
        this.emit(jsonMessage.id, jsonMessage);
        break;
      case ServerConstants.ActionTypes.Receive.DENIED:
        console.log("Got DENIED from server " + message.data);
        jsonMessage.clientProcessError = true;
        this.emit(jsonMessage.id, jsonMessage);
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
    console.log('subscribing ' + id);
    var message = {
      action: ServerConstants.ActionTypes.Send.SUBSCRIBE,
      id: id
    };

    window.setTimeout(this.sendPayloadWhenReady.bind(this, message), 10);
  }

  unsubscribe(id) {
    var message = {
      action: ServerConstants.ActionTypes.Send.UNSUBSCRIBE,
      id: id
    };

    window.setTimeout(this.sendPayloadWhenReady.bind(this, message), 10);
  }

  sendPayloadWhenReady(json) {
    if (this.websocket) {
      if (this.websocket.readyState === this.websocket.CONNECTING) {
        //console.log("waiting for connection");
        window.setTimeout(this.sendPayloadWhenReady.bind(this, json), 1000, this, json);
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

  emitResourceUpdate(id) {
    this.emit(SocketEvents.RESOURCE_UPDATED + '_' + id, this.idToData[id]);
  }

  addResourceListener(id, callback) {
    console.log("Added listener for " + JSON.stringify(id));

    this.on(SocketEvents.RESOURCE_UPDATED + '_' + id, callback);

    console.log('listeners for ' + id + ' : ' + this.listenerCount(SocketEvents.RESOURCE_UPDATED + '_' + id));
    if(this.listenerCount(SocketEvents.RESOURCE_UPDATED + '_' + id) === 1) {
      this.subscribe(id);
    }

    if(this.idToData[id]) {
      this.emitResourceUpdate(id);
    }
  }

  removeResourceListener(id, callback) {
    this.removeListener(SocketEvents.RESOURCE_UPDATED + '_' + id, callback);
    if(this.listenerCount(SocketEvents.RESOURCE_UPDATED + '_' + id) === 0) {
      this.unsubscribe(id);
    }
  }

}

export default Connector;
