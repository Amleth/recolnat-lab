'use strict';

var ApplicationConfiguration = {
  imageEditorService: 'http://wp5test.recolnat.org/image-editor',
  virtualWorkbenchService: 'http://wp5test.recolnat.org/virtual-workbench',
  authenticationService: 'http://wp5test.recolnat.org/authentication',
  virtualWorkbenchWebsocketService: 'ws://wp5test.recolnat.org/websockets/virtual-workbench',
  specialUserSessionId: 'special'
};

var ApplicationConfigurationExtended = {
  imageEditorServiceActions: {
    getImageData: ApplicationConfiguration.imageEditorService,
    createPolygon: ApplicationConfiguration.imageEditorService + "/create-polygon",
    createPointOfInterest: ApplicationConfiguration.imageEditorService + "/create-vertex",
    createPath: ApplicationConfiguration.imageEditorService + "/create-path",
    addAnnotation: ApplicationConfiguration.imageEditorService + "/add-annotation",
    addScalingData: ApplicationConfiguration.imageEditorService + "/add-scaling-data"
  },

  virtualWorkbenchServiceActions: {
    createNewWorkbench: ApplicationConfiguration.virtualWorkbenchService + '/create-new-workbench',
    deleteWorkbench : ApplicationConfiguration.virtualWorkbenchService + '/delete-workbench',
    copypaste: ApplicationConfiguration.virtualWorkbenchService + '/copypaste',
    cutpaste: ApplicationConfiguration.virtualWorkbenchService + '/cutpaste',
    import: ApplicationConfiguration.virtualWorkbenchService + '/import',
    importSheet: ApplicationConfiguration.virtualWorkbenchService + '/import-item-to-workbench',
    listUserWorkbenches: ApplicationConfiguration.virtualWorkbenchService + "/list-user-workbenches",
    addItemsToWorkbench: ApplicationConfiguration.virtualWorkbenchService + "/add-items-to-workbench"
  },

  authenticationServiceActions: {
    isUserAuthenticated: ApplicationConfiguration.authenticationService + '/is-user-authenticated',
    setTestCookie: ApplicationConfiguration.authenticationService + '/set-test-cookie',
    getToken: ApplicationConfiguration.authenticationService + '/get-token',
    checkToken: ApplicationConfiguration.authenticationService + '/check-token'
  }
};


export default {urls: ApplicationConfiguration, actions: ApplicationConfigurationExtended};