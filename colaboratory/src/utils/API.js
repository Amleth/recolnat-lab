'use strict';

import uuid from 'node-uuid';
import _ from 'lodash';
import request from 'superagent';

import ServerActions from '../actions/ServerActions.js';
import ToolActions from '../actions/ToolActions';
import ViewActions from '../actions/ViewActions';

import ServerConstants from '../constants/ServerConstants.js'
import ViewConstants from '../constants/ViewConstants.js';

import AppDispatcher from '../dispatcher/AppDispatcher';

import conf from '../conf/ApplicationConfiguration';

var W3CWebSocket = require('websocket').w3cwebsocket;

// Simulation de la communication avec le serveur & de l'état de sa BDD
class API {
  constructor() {
    this.entities = {};
    this.websocketServerUrl = conf.urls.virtualWorkbenchWebsocketService;
    this.websocketServerMethod = "";
    this.sessionId = null;
    this.websocket = null;
    this.ping = null;
    var that = this;



    AppDispatcher.register((action) => {
      //console.log('API received view ACTION', action.actionType);
      switch (action.actionType) {
        case ViewConstants.ActionTypes.Server.VIEW_MOVE_ENTITY:
          //console.log("Demande de déplacement de l'entité", action.id, "à la position", action.x, action.y, "transmise au serveur.");
          var actionJSON = {workbench: action.workbench, object: action.id, action: ServerConstants.ActionTypes.SERVER_CHILD_ENTITY_MOVED, x: action.x, y: action.y};
          //console.log("Sending to server " + JSON.stringify(actionJSON));
          that.sendPayloadWhenReady(that, actionJSON);
          break;
        default:
          break;
      }
    });
  }

  openWebsocket() {
    if(this.websocket == null) {
      // Get authorization token
      request.get(conf.actions.authenticationServiceActions.getToken)
      .withCredentials()
        .set('Accept', 'application/json')
      .end((err, res) => {
        if(err) {
          console.error("Connection refused");
        }
        else {
          // Get token
          var response = JSON.parse(res.text);
          var token = response.token;
          // Create websocket
          if (token) {
            var websocket = new W3CWebSocket(this.websocketServerUrl, this.websocketServerMethod, this.websocketServerUrl);

            var self = this;

            websocket.onerror = function (message) {
              console.error('Connection failed with error: ' + JSON.stringify(message));
            };
            websocket.onopen = function (message) {
              console.log('Client connected ' + JSON.stringify(message));
              self.ping = window.setInterval(self.sendPing.bind(self), 60000);
            };
            websocket.onclose = function (message) {
              console.log('Connection closed ' + JSON.stringify(message));
              self.clearInterval(self.ping);
              self.sessionId = null;
            };
            websocket.onmessage = function (message) {
              //console.log("Received " + message);
              var response = JSON.parse(message.data);
              //console.log("Received data " + response.toString());
              switch (response.action) {
                case ServerConstants.ActionTypes.SERVER_CHILD_ENTITY_MOVED:
                  // move
                  //console.log("Received MOVE action from server " + JSON.stringify(response));
                  ServerActions.childEntityMoved(response.object, response.x, response.y);
                  break;
                case ServerConstants.ActionTypes.SERVER_NEW_CHILD_ENTITY_CREATED:
                  //add
                  console.error("Add not implemented");
                  break;
                case ServerConstants.ActionTypes.SERVER_CHILD_ENTITY_REMOVED:
                  //delete
                  console.error("Delete not implemented");
                  break;
                case ServerConstants.ActionTypes.SERVER_SESSION_OPEN:
                  console.log("Obtained session id " + response.session);
                  self.sessionId = response.session;
                  break;
                case ServerConstants.ActionTypes.SERVER_CHILD_ENTITIES:
                  window.setTimeout(function () {
                    ViewActions.changeLoaderState('Données du serveur reçues...')
                  }, 1);
                  //console.log("Received workbench " + response.workbench.toString());
                  ServerActions.childEntities(response.workbench);
                  break;
                default:
                  // action not implemented
                  console.error("Response to action " + response.action + " not implemented");
                  break;
              }
            };

            this.websocket = websocket;
          }
        }
      });


    }
  }

  closeWebsocket() {
    if(this.websocket) {
      this.websocket.close(1000, "User logged out");
      this.websocket = null;
    }
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
      this.sendPayloadWhenReady(this, payload);
    }
  }

  sendPayloadWhenReady(that, json) {
    if (that.websocket) {
      if (that.websocket.readyState === that.websocket.CONNECTING || !that.sessionId) {
        //console.log("waiting for connection");
        setTimeout(that.sendPayloadWhenReady, 1000, that, json);
      }
      else {
        json.sender = that.sessionId;
        //console.log("sending message " + JSON.stringify(json));
        that.websocket.send(JSON.stringify(json));
      }
    }
    else {
      console.error("Websocket not connected");
    }
  }

  sendPing() {
    this.websocket.send('PING');
  }

}

export default API;