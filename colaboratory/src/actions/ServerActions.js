'use strict';

import AppDispatcher from '../dispatcher/AppDispatcher';
import ServerConstants from '../constants/ServerConstants';

export default {
  childEntities: (entities) => {
    AppDispatcher.dispatch({
      actionType: ServerConstants.ActionTypes.SERVER_CHILD_ENTITIES,
      entities: entities
    });
  },
  childEntityMoved: (id, x, y) => {
    AppDispatcher.dispatch({
      actionType: ServerConstants.ActionTypes.SERVER_CHILD_ENTITY_MOVED,
      id: id,
      x: x,
      y: y
    });
  },
  childEntityCreated: (id, x, y, colour, radius) => {
    AppDispatcher.dispatch({
      actionType: ServerConstants.ActionTypes.SERVER_NEW_CHILD_ENTITY_CREATED,
      id: id,
      x: x,
      y: y,
      colour: colour,
      radius: radius
    });
  },
  childEntityRemoved: (id) => {
    AppDispatcher.dispatch({
      actionType: ServerConstants.ActionTypes.SERVER_CHILD_ENTITY_REMOVED,
      id: id
    })
  }
}