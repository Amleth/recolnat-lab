/**
 * Actions which interact with the WebSocketConnector.
 */
'use strict';

import AppDispatcher from '../dispatcher/AppDispatcher';
import SocketConstants from '../constants/SocketConstants';

export default {
  /**
   * Add a listener for changes on a resource with provided UID. WebSocketConnector is expected to subscribe to the resource if data is not immediately available.
   * @param id String UID of the resource to subscribe to
   * @param callback Function to be called when data is available or changes
   */
  registerListener: (id, callback) => {
    AppDispatcher.dispatch({
      actionType: SocketConstants.ActionTypes.REGISTER_CALLBACK,
      id: id,
      callback: callback
    })
  },

  /**
   * Removes a listener for a specific resource. If this is the last listener, WebSocketConnector is expected to unsubscribe from this resource.
   * @param id
   * @param callback
   */
  removeListener: (id, callback) => {
    AppDispatcher.dispatch({
      actionType: SocketConstants.ActionTypes.REMOVE_CALLBACK,
      id: id,
      callback: callback
    })
  },

  /**
   * Send a message to the server expecting only a response to confirm the message has been received.
   * @param message Object message to be sent
   * @param callback Function optional callback to be called when reception confirmed.
   */
  send: (message, callback) => {
    AppDispatcher.dispatch({
      actionType: SocketConstants.ActionTypes.SEND,
      message: message,
      callback: callback
    })
  },

  /**
   * Request one-time information from the server.
   * @param message Object representing the request
   * @param callback Function to be called when data is received.
   */
  request: (message, callback) => {
    AppDispatcher.dispatch({
      actionType: SocketConstants.ActionTypes.GET,
      message: message,
      callback: callback
    })
  }
}
