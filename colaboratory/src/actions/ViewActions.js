'use strict';

import AppDispatcher from '../dispatcher/AppDispatcher';
import ViewConstants from '../constants/ViewConstants';

export default {
  placeEntity: (viewId, entityId, x, y) => {
    AppDispatcher.dispatch({
      actionType: ViewConstants.ActionTypes.Server.VIEW_PLACE_ENTITY,
      viewId: viewId,
      entityId: entityId,
      x: x,
      y: y
    });
  },

  moveEntity: (viewId, entityId, linkId, x, y) => {
    AppDispatcher.dispatch({
      actionType: ViewConstants.ActionTypes.Server.VIEW_MOVE_ENTITY,
      viewId: viewId,
      entityId: entityId,
      linkId: linkId,
      x: x,
      y: y
    });
  },

  setActiveSet: (setId) => {
    AppDispatcher.dispatch({
      actionType: ViewConstants.ActionTypes.Server.VIEW_SET_DISPLAYED_SET,
      id: setId
    });
  },

  setActiveView: (viewId) => {
    AppDispatcher.dispatch({
      actionType: ViewConstants.ActionTypes.Local.SET_ACTIVE_VIEW,
      id: viewId
    });
  },

  changeSelection: (id, data) => {
    AppDispatcher.dispatch({
      actionType: ViewConstants.ActionTypes.Local.VIEW_SET_SELECTION,
      selection: {id: id, data: data}
    });
  },

  fitView: () => {
    AppDispatcher.dispatch({
      actionType: ViewConstants.ActionTypes.Local.VIEW_FIT_ALL
    });
  },

  updateViewport: (x, y, width, height, scale, animate = false) => {
    //console.log('updateViewport(' + x + ',' + y + ',' + width + ',' + height + ',' + scale + ')');
    AppDispatcher.dispatch({
      actionType: ViewConstants.ActionTypes.Local.UPDATE_VIEWPORT,
      x: x,
      y: y,
      height: height,
      width: width,
      scale: scale,
      animate: animate
    });
  },

  updateViewportLocation: (top, left) => {
    AppDispatcher.dispatch({
      actionType: ViewConstants.ActionTypes.Local.UPDATE_VIEWPORT_LOCATION,
      top: top,
      left: left
    });
  },

  updateViewProperties: (properties) => {
    AppDispatcher.dispatch({
      actionType: ViewConstants.ActionTypes.Local.UPDATE_VIEW_PROPERTIES,
      properties: properties
    });
  },

  changeLoaderState: (text) => {
    AppDispatcher.dispatch({
      actionType: ViewConstants.ActionTypes.Local.LOADER_CHANGE_STATE,
      text: text
    });
  },

  loadImage: (source, onLoadCallback = function() {}) => {
    AppDispatcher.dispatch({
      actionType: ViewConstants.ActionTypes.Local.SCHEDULE_IMAGE_LOAD,
      source: source,
      callback: onLoadCallback
    });
  }
}