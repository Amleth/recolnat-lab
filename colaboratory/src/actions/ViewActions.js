'use strict';

import AppDispatcher from '../dispatcher/AppDispatcher';
import ViewConstants from '../constants/ViewConstants';

export default {
  moveEntity: (wb, id, x, y) => {
    AppDispatcher.dispatch({
      actionType: ViewConstants.ActionTypes.Server.VIEW_MOVE_ENTITY,
      workbench: wb,
      id: id,
      x: x,
      y: y
    });
  },

  setActiveWorkbench: (wb) => {
    AppDispatcher.dispatch({
      actionType: ViewConstants.ActionTypes.Server.VIEW_SET_WORKBENCH,
      workbench: wb
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

  updateViewport: (x, y, width, height, scale) => {
    //console.log('updateViewport(' + x + ',' + y + ',' + width + ',' + height + ',' + scale + ')');
    AppDispatcher.dispatch({
      actionType: ViewConstants.ActionTypes.Local.UPDATE_VIEWPORT,
      x: x,
      y: y,
      height: height,
      width: width,
      scale: scale
    });
  },

  updateMetadata: (id) => {
    AppDispatcher.dispatch({
      actionType: ViewConstants.ActionTypes.Local.RELOAD_METADATA,
      entityId: id
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

  loadImage: (source, onLoadCallback) => {
    AppDispatcher.dispatch({
      actionType: ViewConstants.ActionTypes.Local.SCHEDULE_IMAGE_LOAD,
      source: source,
      callback: onLoadCallback
    });
  },

  displayMetadataAboutEntity: (id) => {
    AppDispatcher.dispatch({
      actionType: ViewConstants.ActionTypes.Local.METADATA_ABOUT_ENTITY_REQUESTED,
      entityId: id
    });
  }
}