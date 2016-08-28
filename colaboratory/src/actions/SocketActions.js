'use strict';

import AppDispatcher from '../dispatcher/AppDispatcher';
import SocketConstants from '../constants/SocketConstants';

export default {
  registerListener: (id, callback) => {
    AppDispatcher.dispatch(
      actionType: SocketConstants.ActionTypes.REGISTER_CALLBACK,
      id: id,
      callback: callback
    )
  },

  removeListener: (id, callback) => {
    AppDispatcher.dispatch(
      actionType:
      SocketConstants.ActionTypes.REMOVE_CALLBACK,
      id: id,
      callback: callback
    )
  }
  // childEntities: (entities) => {
  //   AppDispatcher.dispatch({
  //     actionType: ServerConstants.ActionTypes.SERVER_CHILD_ENTITIES,
  //     entities: entities
  //   });
  // },
  // childEntityMoved: (id, x, y) => {
  //   AppDispatcher.dispatch({
  //     actionType: ServerConstants.ActionTypes.SERVER_CHILD_ENTITY_MOVED,
  //     id: id,
  //     x: x,
  //     y: y
  //   });
  // },
  // childEntityCreated: (id, x, y, colour, radius) => {
  //   AppDispatcher.dispatch({
  //     actionType: ServerConstants.ActionTypes.SERVER_NEW_CHILD_ENTITY_CREATED,
  //     id: id,
  //     x: x,
  //     y: y,
  //     colour: colour,
  //     radius: radius
  //   });
  // },
  // childEntityRemoved: (id) => {
  //   AppDispatcher.dispatch({
  //     actionType: ServerConstants.ActionTypes.SERVER_CHILD_ENTITY_REMOVED,
  //     id: id
  //   })
  // }
}
