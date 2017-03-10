/**
 * Type constants for actions communicating between stores and WebSocketConnector
 *
 * Created by dmitri on 26/08/16.
 */
'use strict';

export default {
  ActionTypes: {
    OPEN: 'SOCKET_OPEN',
    CLOSE: 'SOCKET_CLOSE',
    REGISTER_CALLBACK: 'SOCKET_REGISTER_CALLBACK',
    REMOVE_CALLBACK: 'SOCKET_REMOVE_CALLBACK',
    SEND: 'SOCKET_SEND',
    GET: 'SOCKET_GET'
  }
};
