'use strict';

var Services = {
  laboratoryRESTService: 'https://wp5prod.recolnat.org',
  laboratorySocketService: 'wss://wp5prod.recolnat.org/websockets'
};

var Endpoints = {
  imageEditorService: Services.laboratoryRESTService + '/image-editor',
  virtualWorkbenchService: Services.laboratoryRESTService + '/virtual-workbench',
  authenticationService: Services.laboratoryRESTService + '/authentication',
  userProfileService: Services.laboratoryRESTService + '/user-profile',
  dataAccessService: Services.laboratoryRESTService + '/database',
  virtualWorkbenchWebsocketService: Services.laboratorySocketService + '/virtual-workbench'
};

var Actions = {
  imageEditorServiceActions: {
    getImageData: Endpoints.imageEditorService + "/get-image",
    createPolygon: Endpoints.imageEditorService + "/create-polygon",
    createPointOfInterest: Endpoints.imageEditorService + "/create-vertex",
    createPath: Endpoints.imageEditorService + "/create-path",
    addAnnotation: Endpoints.imageEditorService + "/add-annotation",
    addScalingData: Endpoints.imageEditorService + "/add-scaling-data"
  },

  virtualWorkbenchServiceActions: {
    createNewWorkbench: Endpoints.virtualWorkbenchService + '/create-new-workbench',
    deleteWorkbench : Endpoints.virtualWorkbenchService + '/delete-workbench',
    copypaste: Endpoints.virtualWorkbenchService + '/copypaste',
    cutpaste: Endpoints.virtualWorkbenchService + '/cutpaste',
    import: Endpoints.virtualWorkbenchService + '/import',
    importSheet: Endpoints.virtualWorkbenchService + '/import-item-to-workbench',
    listUserWorkbenches: Endpoints.virtualWorkbenchService + "/list-user-workbenches",
    addItemsToWorkbench: Endpoints.virtualWorkbenchService + "/add-items-to-workbench"
  },

  authenticationServiceActions: {
    isUserAuthenticated: Endpoints.authenticationService + '/is-user-authenticated',
    setTestCookie: Endpoints.authenticationService + '/set-test-cookie',
    getToken: Endpoints.authenticationService + '/get-token',
    checkToken: Endpoints.authenticationService + '/check-token'
  },

  userProfileServiceActions: {
    getRecentActivity: Endpoints.userProfileService + '/get-recent-activity'
  },

  databaseActions: {
    getData: Endpoints.dataAccessService + '/get-data',
    getLog: Endpoints.dataAccessService + '/get-change-log'
  }
};


export default {urls: Endpoints, actions: Actions};