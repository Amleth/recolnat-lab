'use strict';

export default {
  ActionTypes: {
    Server: {
      /**
       * Values must be mirrored with ServerConstants for simple referral.
       */
      VIEW_SET_WORKBENCH: 20,
      VIEW_MOVE_ENTITY: 22
    },
    Local: {
      UPDATE_VIEWPORT: "UPDATE_VIEWPORT",
      UPDATE_VIEW_PROPERTIES: "UPDATE_VIEW_PROPERTIES",
      VIEW_SET_SELECTION: "VIEW_SET_SELECTION",
      VIEW_FIT_ALL: "VIEW_FIT_ALL",
      GO_TO_ITEM_IDX: "GO_TO_ITEM_IDX",
      RELOAD_METADATA: "RELOAD_METADATA",
      LOADER_CHANGE_STATE: "LOADER_CHANGE_STATE",
      SCHEDULE_IMAGE_LOAD: "SCHEDULE_IMAGE_LOAD"
    }
  }
};