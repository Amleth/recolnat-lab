'use strict';

// Each language must have a corresponding language file defined in src/data/i18n
let Application = {
  languages: [
    {code: 'en', localized: 'English', flag: 'gb'},
    {code: 'fr', localized: 'Français', flag: 'fr'}
  ]
};

let Integration = {
  recolnatMenuBarOrigin: 'https://www.recolnat.org',
  recolnatMenuBarUrl: 'https://www.recolnat.org/menu',
  casLoginUrl: 'https://cas.recolnat.org/login',
  casSignupUrl: 'https://api.recolnat.org/erecolnat/signup/#/register'
};

let Services = {
  laboratoryRESTService: 'https://wp5test.recolnat.org/services/test',
  laboratorySocketService: 'wss://wp5test.recolnat.org/services/test/websockets/colaboratory',
  downloadsBaseURL: 'https://wp5test.recolnat.org/exports-test/'
};

let Endpoints = {
  authenticationService: Services.laboratoryRESTService + '/authentication',
  dataAccessService: Services.laboratoryRESTService + '/database',
  imageService: Services.laboratoryRESTService + '/image',
  setService: Services.laboratoryRESTService + '/set',
  studyService: Services.laboratoryRESTService + '/study',
  userProfileService: Services.laboratoryRESTService + '/user-profile',
  viewService: Services.laboratoryRESTService + '/view',

  virtualWorkbenchWebsocketService: Services.laboratorySocketService + '/virtual-workbench'
};

let Actions = {
  imageServiceActions: {
    getImage: Endpoints.imageService + "/get-image",
    getSpecimen: Endpoints.imageService + "/get-specimen",
    createRegionOfInterest: Endpoints.imageService + "/create-roi",
    createPointOfInterest: Endpoints.imageService + "/create-poi",
    createTrailOfInterest: Endpoints.imageService + "/create-toi",
    createAngleOfInterest: Endpoints.imageService + "/create-aoi",
    addMeasureStandard: Endpoints.imageService + "/add-measure-standard"
  },

  setServiceActions: {
    getSet: Endpoints.setService + "/get-set",
    createSet: Endpoints.setService + "/create-set",
    deleteFromSet: Endpoints.setService + "/delete-element-from-set",
    link: Endpoints.setService + "/link",
    copy: Endpoints.setService + "/copy",
    cutPaste: Endpoints.setService + "/cutpaste",
    importRecolnatSpecimen: Endpoints.setService + "/import-recolnat-specimen",
    importExternalImages: Endpoints.setService + "/import-external-images"
  },

  viewServiceActions: {
    place: Endpoints.viewService + '/place',
    move: Endpoints.viewService + '/move',
    resize: Endpoints.viewService + '/resize'
  },

  studyServiceActions: {
    listUserStudies: Endpoints.studyService + "/list-user-studies",
    getStudy: Endpoints.studyService + "/get-study",
    createStudy: Endpoints.studyService + "/create-study"
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
    remove: Endpoints.dataAccessService + '/remove',
    getLog: Endpoints.dataAccessService + '/get-change-log',
    addAnnotation: Endpoints.dataAccessService + '/add-annotation',
    editProperties: Endpoints.dataAccessService + '/edit-properties'
  }
};

let SocketActions = {
  createRegionOfInterest: "create-roi",
  createPointOfInterest: "create-poi",
  createTrailOfInterest: "create-toi",
  createAngleOfInterest: "create-aoi",
  addMeasureStandard: "add-measure-standard",
  createSet: "create-set",
  deleteFromSet: "delete-element-from-set",
  deleteFromView: "delete-element-from-view",
  link: "link",
  copy: "copy",
  cutPaste: "cutpaste",
  importRecolnatSpecimen: "import-recolnat-specimen",
  importExternalImage: "import-external-image",
  place: 'place',
  move: 'move',
  resize: 'resize',
  createStudy: "create-study",
  remove: 'remove',
  addAnnotation: 'add-annotation',
  editProperties: 'edit-properties',
  listUserDownloads: 'list-user-downloads',
  prepareSetForDownload: 'prepare-set-for-download'
};


export default {app: Application, wss: Services.laboratorySocketService, services: Services, urls: Endpoints, actions: Actions, integration: Integration, socket: SocketActions};
