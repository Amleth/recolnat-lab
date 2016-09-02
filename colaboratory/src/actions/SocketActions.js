'use strict';

import AppDispatcher from '../dispatcher/AppDispatcher';
import SocketConstants from '../constants/SocketConstants';

export default {
  registerListener: (id, callback) => {
    AppDispatcher.dispatch({
      actionType: SocketConstants.ActionTypes.REGISTER_CALLBACK,
      id: id,
      callback: callback
    })
  },

  removeListener: (id, callback) => {
    AppDispatcher.dispatch({
      actionType: SocketConstants.ActionTypes.REMOVE_CALLBACK,
      id: id,
      callback: callback
    })
  },

  send: (message, callback) => {
    AppDispatcher.dispatch({
      actionType: SocketConstants.ActionTypes.SEND,
      message: message,
      callback: callback
    })
  }
}
