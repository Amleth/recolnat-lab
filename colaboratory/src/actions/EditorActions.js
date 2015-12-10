'use strict';

import AppDispatcher from '../dispatcher/AppDispatcher';
import EditorConstants from '../constants/EditorConstants';

export default {
  setActiveImage: (id, imageData) => {
    console.log("EditorActions: Setting active image to " + id);
    AppDispatcher.dispatch({
      actionType: EditorConstants.ActionTypes.EDITOR_SET_IMAGE,
      id: id,
      data: imageData
    });
  },

  reloadImage: () => {
    AppDispatcher.dispatch({
      actionType: EditorConstants.ActionTypes.EDITOR_RELOAD
    });
  },

  setEditorReady: (state) => {
    console.log("EditorActions setEditorReady: " + state);
    AppDispatcher.dispatch({
      actionType: EditorConstants.ActionTypes.EDITOR_READY,
      ready: state
    });
  },

  displayContextMenu: (x, y, elements) => {
    AppDispatcher.dispatch({
      actionType: EditorConstants.ActionTypes.EDITOR_CONTEXT_MENU,
      x: x,
      y: y,
      items: elements
    });
  }
};
