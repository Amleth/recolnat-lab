'use strict';

let Application = {
  languages: [
    {code: 'en', localized: 'English', flag: 'gb'},
    {code: 'fr', localized: 'Français', flag: 'fr'}
  ]
};

let Integration = {
  recolnatMenuBarOrigin: 'https://localhost:8181',
  recolnatMenuBarUrl: 'https://localhost:8181/menu',
  recolnatBasketIframeUrl: 'https://localhost:8181/basket',
  casLoginUrl: 'https://cas.recolnat.org/login',
  casSignupUrl: 'https://api.recolnat.org/erecolnat/signup/#/register'
};

let Services = {
  laboratoryRESTService: 'https://localhost:8181/rest',
  laboratorySocketService: 'wss://localhost:8181/colaboratory-socket-0.9.3/colaboratory',
  downloadsBaseURL: 'https://localhost:18181/exports/'
};

let Endpoints = {
  tagService: Services.laboratoryRESTService + '/tags',
  downloadsService: Services.laboratoryRESTService + '/downloads'
};

let Actions = {
  tags: {
    queryKey: Endpoints.tagService + '/query/key',
    queryTag: Endpoints.tagService + '/query/tag'
  },
  downloads: {
    exports: Endpoints.downloadsService + '/exports'
  }
};

let SocketActions = {
  createRegionOfInterest: 'create-roi',
  createPointOfInterest: 'create-poi',
  createTrailOfInterest: 'create-toi',
  createAngleOfInterest: 'create-aoi',
  addMeasureStandard: 'add-measure-standard',
  createSet: 'create-set',
  deleteFromSet: 'delete-element-from-set',
  deleteFromView: 'delete-element-from-view',
  link: 'link',
  copy: 'copy',
  cutPaste: 'cutpaste',
  importRecolnatSpecimen: 'import-recolnat-specimen',
  importExternalImage: 'import-external-image',
  place: 'place',
  move: 'move',
  resize: 'resize',
  createStudy: 'create-study',
  remove: 'remove',
  addAnnotation: 'add-annotation',
  editProperties: 'edit-properties',
  createTagDefinition: 'create-tag-definition',
  tagEntity: 'tag-entity',
  listUserDownloads: 'list-user-downloads',
  prepareSetForDownload: 'prepare-set-for-download'
};

export default {
  app: Application,
  wss: Services.laboratorySocketService,
  services: Services,
  urls: Endpoints,
  actions: Actions,
  integration: Integration,
  socket: SocketActions
};
