'use strict';

/**
 * Defines languages available in application. Each language must have a corresponding language file defined in src/data/i18n
 * localized: The displayed name in its original language
 * flag: Flag of the country (see Semantic-UI doc on country flags)
 */
let Application = {
  languages: [
    {code: 'en', localized: 'English', flag: 'gb'},
    {code: 'fr', localized: 'Français', flag: 'fr'}
  ]
};

/**
 * URLs of external elements to integrate in the interface: menu bar origin (for cross-validation) & url, CAS login & signup urls
 */
let Integration = {
  recolnatMenuBarOrigin: 'https://wp5test.recolnat.org',
  recolnatMenuBarUrl: 'https://wp5test.recolnat.org/menu',
  recolnatBasketIframeUrl: 'https://wp5test.recolnat.org/basket',
  casLoginUrl: 'https://cas.recolnat.org/login',
  casSignupUrl: 'https://api.recolnat.org/erecolnat/signup/#/register'
};

/**
 * Locations of service APIs & export downloads.
 */
let Services = {
  laboratoryRESTService: 'https://wp5test.recolnat.org/services/labo-dev/rest',
  laboratorySocketService: 'wss://wp5test.recolnat.org/services/labo-dev/websockets/colaboratory',
  downloadsBaseURL: 'https://wp5test.recolnat.org/exports/'
};

/**
 * Adresses of REST endpoints
 */
let Endpoints = {
  tagService: Services.laboratoryRESTService + '/tags',
  downloadsService: Services.laboratoryRESTService + '/downloads'
};

/**
 * Actions available for each endpoint
 */
let Actions = {
  tags: {
    queryKey: Endpoints.tagService + '/query/key',
    queryTag: Endpoints.tagService + '/query/tag'
  },
  downloads: {
    exports: Endpoints.downloadsService + '/exports'
  }
};

/**
 * Actions available for the websocket (these go into the actionDetail message parameter).
 */
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
  createTagDefinition: 'create-tag-definition',
  tagEntity: 'tag-entity',
  listUserDownloads: 'list-user-downloads',
  prepareSetForDownload: 'prepare-set-for-download'
};


export default {app: Application, wss: Services.laboratorySocketService, services: Services, urls: Endpoints, actions: Actions, integration: Integration, socket: SocketActions};
