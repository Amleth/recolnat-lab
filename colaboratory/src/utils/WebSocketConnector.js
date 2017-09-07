'use strict';

import {EventEmitter} from 'events';
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
    // Contains message ids (from messageCounter) for messages which have not been answered yet.
    this.pendingMessages = {};

    this.websocketServerMethod = '';
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
          this.pendingMessages[this.messageCounter] = 'loading';
          if (action.callback) {
            this.once(this.messageCounter, action.callback);
          }
          window.setTimeout(this.sendPayloadWhenReady.bind(this, action.message), 10);
          this.emit(SocketEvents.STATUS_CHANGE);
          break;
        case SocketConstants.ActionTypes.GET:
          this.messageCounter++;
          this.pendingMessages[this.messageCounter] = 'loading';
          action.message.messageId = this.messageCounter;
          action.message.action = ServerConstants.ActionTypes.Send.GET;
          this.once(this.messageCounter, action.callback);
          window.setTimeout(this.sendPayloadWhenReady.bind(this, action.message), 10);
          this.emit(SocketEvents.STATUS_CHANGE);
          break;
        default:
          break;
      }
    });

    this.openWebsocket();
    this.openInterval = null;
  }

  openWebsocket() {
    if (this.websocket == null) {
      window.clearInterval(this.openInterval);
      let self = this;
      let websocket = new W3CWebSocket(conf.wss, this.websocketServerMethod, conf.wss);

      websocket.onerror = function (message) {
        console.error('Connection failed with error: ' + JSON.stringify(message));
      };

      websocket.onopen = function (message) {
        console.log('Client connected ' + JSON.stringify(message));
        self.messageCounter = 0;
        self.pendingMessages = {};

        self.ping = window.setInterval(self.sendPing.bind(self), 60000);
        // If ids are present, re-subscribe to them as it means the socket was closed prematurely
        let ids = Object.keys(self.idToData);
        for (let i = 0; i < ids.length; ++i) {
          self.subscribe(ids[i]);
        }
        self.emit(SocketEvents.STATUS_CHANGE);
      };

      websocket.onclose = function (message) {
        console.log('Connection closed ' + JSON.stringify(message));
        window.clearInterval(self.ping);
        self.user = null;
        self.idToData['user'] = null;
        self.pendingMessages = {};
        self.websocket = null;

        self.emitResourceUpdate('user');
        self.emit(SocketEvents.STATUS_CHANGE);
        self.openInterval = window.setInterval(self.openWebsocket.bind(self), 1000);
      };

      websocket.onmessage = this.receiveServerMessage.bind(this);

      this.websocket = websocket;
    }
  }

  get(id) {
    if (this.idToData[id]) {
      return JSON.parse(JSON.stringify(this.idToData[id]));
    }
    return null;
  }

  receiveServerMessage(message) {
    if (message.data === 'PONG') {
      //console.log('PING/PONG success');
      return;
    }
    if (message.data === 500) {
      console.error('Internal server error');
      return;
    }
    //console.log('got message ' + message.data);
    let jsonMessage = JSON.parse(message.data);
    if (jsonMessage.id) {
      delete this.pendingMessages[jsonMessage.id];
      this.emit(SocketEvents.STATUS_CHANGE);
    }
    if (jsonMessage.error) {
      switch (jsonMessage.error) {
        case 500:
          console.error('Internal server error');
          break;
        default:
          console.error('No error handler for code ' + jsonMessage.error);
      }
      return;
    }
    if (jsonMessage.forbidden) {
      this.idToData[jsonMessage.forbidden] = {
        uid: jsonMessage.forbidden,
        forbidden: true
      };
      this.emitResourceUpdate(jsonMessage.forbidden);
      this.unsubscribe(jsonMessage.forbidden);
      return;
    }
    switch (jsonMessage.action) {
      case ServerConstants.ActionTypes.Receive.RESOURCE:
        let resource = jsonMessage.resource;
        if (resource.type === 'User' && this.user === null) {
          console.log('User data received');
          this.idToData['user'] = resource;
          this.user = resource;
          this.emitResourceUpdate('user');
        }
        this.idToData[resource.uid] = resource;
        this.emitResourceUpdate(resource.uid);
        break;
      case ServerConstants.ActionTypes.Receive.DONE:
        //console.log('Got OK from server');
        this.emit(jsonMessage.id, jsonMessage);
        break;
      case ServerConstants.ActionTypes.Receive.DENIED:
        //console.log("Got DENIED from server " + message.data);
        jsonMessage.clientProcessError = true;
        this.emit(jsonMessage.id, jsonMessage);
        break;
      default:
        console.error('No switch implemented for action ' + jsonMessage.action);
        break;
    }
  }

  closeWebsocket() {
    if (this.websocket) {
      this.websocket.close(1000, 'User logged out');
      this.websocket = null;
    }
  }

  subscribe(id) {
    //console.log('subscribing ' + id);
    this.messageCounter++;
    this.pendingMessages[this.messageCounter] = 'loading';
    this.emit(SocketEvents.STATUS_CHANGE);
    let message = {
      action: ServerConstants.ActionTypes.Send.SUBSCRIBE,
      messageId: this.messageCounter,
      id: id
    };

    window.setTimeout(this.sendPayloadWhenReady.bind(this, message), 10);
  }

  unsubscribe(id) {
    let message = {
      action: ServerConstants.ActionTypes.Send.UNSUBSCRIBE,
      id: id
    };

    window.setTimeout(this.sendPayloadWhenReady.bind(this, message), 10);
  }

  sendPayloadWhenReady(json) {
    if (this.websocket) {
      if (this.websocket.readyState === this.websocket.CONNECTING) {
        console.log('waiting for connection');
        window.setTimeout(this.sendPayloadWhenReady.bind(this, json), 1000, this, json);
      }
      else {
        this.websocket.send(JSON.stringify(json));
      }
    }
    else {
      console.warn('Websocket not connected');
    }
  }

  sendPing() {
    this.websocket.send('PING');
  }

  countPendingMessages() {
    let ids = Object.keys(this.pendingMessages);
    return ids.length;
  }

  emitResourceUpdate(id) {
    this.emit(SocketEvents.RESOURCE_UPDATED + '_' + id, this.idToData[id]);
  }

  addResourceListener(id, callback) {
    this.on(SocketEvents.RESOURCE_UPDATED + '_' + id, callback);
    if (this.listenerCount(SocketEvents.RESOURCE_UPDATED + '_' + id) === 1) {
      window.setTimeout(this.subscribe.bind(this, id), 10);
    }

    if (this.idToData[id]) {
      window.setTimeout(this.emitResourceUpdate.bind(this, id), 10);
    }
  }

  removeResourceListener(id, callback) {
    this.removeListener(SocketEvents.RESOURCE_UPDATED + '_' + id, callback);
    if (this.listenerCount(SocketEvents.RESOURCE_UPDATED + '_' + id) === 0) {
      this.unsubscribe(id);
    }
  }

  addStateChangeListener(callback) {
    this.on(SocketEvents.STATUS_CHANGE, callback);
  }

  removeStateChangeListener(callback) {
    this.remove(SocketEvents.STATUS_CHANGE, callback);
  }

}

export default Connector;
