/**
 * Constants for interacting with the view.
 */
'use strict';

export default {
  // Actions, the Server/Local distinction is inherited from the time of the REST API. No real reason to keep them separate now.
  ActionTypes: {
    Server: {
      VIEW_SET_DISPLAYED_SET: 20,
    },
    Local: {
      UPDATE_VIEWPORT: "VIEW_UPDATE_VIEWPORT",
      UPDATE_VIEWPORT_LOCATION: "VIEW_UPDATE_VIEWPORT_LOCATION",
      UPDATE_VIEW_PROPERTIES: "VIEW_UPDATE_VIEW_PROPERTIES",
      UPDATE_VIEW_FILTERS: "VIEW_UPDATE_VIEW_FILTERS",
      UPDATE_VIEW_COLORS: "VIEW_UPDATE_VIEW_COLORS",
      SET_ACTIVE_VIEW: 'VIEW_SET_ACTIVE_VIEW',
      VIEW_SET_SELECTION: "VIEW_SET_SELECTION",
      VIEW_FIT_ALL: "VIEW_FIT_ALL",
      LOADER_CHANGE_STATE: "VIEW_LOADER_CHANGE_STATE",
      SCHEDULE_IMAGE_LOAD: "VIEW_SCHEDULE_IMAGE_LOAD"
    }
  },
  // z-indices for various components with fixed/absolute position
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
  // Quality of images corresponds to their size (thumbnail, intermediate, original)
  imageQuality: {
    Low: 1,
    High: 2,
    Original: 3
  }
};
