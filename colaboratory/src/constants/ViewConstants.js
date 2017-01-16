'use strict';

export default {
  ActionTypes: {
    Server: {
      /**
       * Values must be mirrored with ServerConstants for simple referral.
       */
      VIEW_SET_DISPLAYED_SET: 20,
      VIEW_MOVE_ENTITY: 22,
      VIEW_PLACE_ENTITY: 23
    },
    Local: {
      UPDATE_VIEWPORT: "VIEW_UPDATE_VIEWPORT",
      UPDATE_VIEWPORT_LOCATION: "VIEW_UPDATE_VIEWPORT_LOCATION",
      UPDATE_VIEW_PROPERTIES: "VIEW_UPDATE_VIEW_PROPERTIES",
      SET_ACTIVE_VIEW: 'VIEW_SET_ACTIVE_VIEW',
      VIEW_SET_SELECTION: "VIEW_SET_SELECTION",
      VIEW_FIT_ALL: "VIEW_FIT_ALL",
      GO_TO_ITEM_IDX: "VIEW_GO_TO_ITEM_IDX",
      // RELOAD_METADATA: "VIEW_RELOAD_METADATA",
      LOADER_CHANGE_STATE: "VIEW_LOADER_CHANGE_STATE",
      SCHEDULE_IMAGE_LOAD: "VIEW_SCHEDULE_IMAGE_LOAD"
    }
  },
  zIndices: {
    topPane: 502,
    leftPane: 500,
    rightPane: 500,
    leftPaneCloseButton: 499,
    rightPaneCloseButton: 499,
    topPaneCloseButton: 502,
    mainMenu: 9000,
    contextMenu: 9001,
    modalDimmer: 10000,
    loginRequiredModal: 10001
  },
  imageQuality: {
    Low: 1,
    High: 2,
    Original: 3
  }
};
