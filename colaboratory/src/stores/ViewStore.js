/**
 * Created by dmitri on 05/10/15.
 */
"use strict";

import {EventEmitter} from 'events';

import AppDispatcher from "../dispatcher/AppDispatcher";

import EditorConstants from "../constants/EditorConstants";
import ViewConstants from '../constants/ViewConstants';

import ViewEvents from './events/ViewEvents';

class ViewStore extends EventEmitter {
  constructor() {
    super();

    this.viewport = {};
    this.viewport.height = null;
    this.viewport.width = null;
    this.viewport.top = 0;
    this.viewport.left = 0;
    this.viewport.scale = 1.0;
    this.viewport.topFromWindow = null;
    this.viewport.leftFromWindow = null;

    this.properties = {};
    this.properties.sizeOfTextAndObjects = 1.0;

    this.loader = {};
    this.loader.text = null;

    this.metadataModalAbout = null;

    AppDispatcher.register((action) => {
      //console.log("Received action " + JSON.stringify(action));
      switch (action.actionType) {
        case ViewConstants.ActionTypes.Local.UPDATE_VIEWPORT:
          this.setViewportData(action.x, action.y, action.width, action.height, action.scale);
          this.emit(ViewEvents.UPDATE_VIEWPORT);
          break;
        case ViewConstants.ActionTypes.Local.VIEW_FIT_ALL:
          this.emit(ViewEvents.FIT_WORKBENCH_IN_VIEW);
          break;
        case ViewConstants.ActionTypes.Local.UPDATE_VIEW_PROPERTIES:
          this.setViewProperties(action.properties);
          this.emit(ViewEvents.UPDATE_VIEW_PROPERTIES);
          break;
        case ViewConstants.ActionTypes.Local.LOADER_CHANGE_STATE:
          this.setLoaderText(action.text);
          this.emit(ViewEvents.UPDATE_LOADER);
          break;
        case ViewConstants.ActionTypes.Local.METADATA_ABOUT_ENTITY_REQUESTED:
          this.metadataModalAbout = action.entityId;
          this.emit(ViewEvents.SHOW_ENTITY_METADATA_MODAL);
          break;
        default:
          break;
      }
    });
  }

  getMetadataModalEntity() {
    return this.metadataModalAbout;
  }

  setLoaderText(text) {
    if(!text) {
      this.loader.text = null;
    }
    else if(text.length == 0) {
      this.loader.text = null;
    }
    else {
      this.loader.text = text;
    }
  }

  getLoader() {
    return this.loader;
  }

  setViewportData(x, y, width, height, scale) {
    if(x) {
      this.viewport.left = x;
    }
    if(y) {
      this.viewport.top = y;
    }
    if(width) {
      this.viewport.width = width;
    }
    if(height) {
      this.viewport.height = height;
    }
    if(scale) {
      this.viewport.scale = scale;
    }
  }

  setViewportLocationInWindow(top, left) {
    if(top) {
      this.viewport.topFromWindow = top;
    }
    if(left) {
      this.viewport.leftFromWindow = left;
    }
  }

  setViewProperties(props) {
    if(props.sizeOfTextAndObjects) {
      this.properties.sizeOfTextAndObjects = props.sizeOfTextAndObjects;
    }
  }

  getViewProperties() {
    return this.properties;
  }

  getView() {
    return this.viewport;
  }

  addViewportListener(callback) {
    this.on(ViewEvents.UPDATE_VIEWPORT, callback);
  }

  removeViewportListener(callback) {
    this.removeListener(ViewEvents.UPDATE_VIEWPORT, callback);
  }

  addFitViewListener(callback) {
    this.on(ViewEvents.FIT_WORKBENCH_IN_VIEW, callback);
  }

  removeFitViewListener(callback) {
    this.removeListener(ViewEvents.FIT_WORKBENCH_IN_VIEW, callback);
  }

  addViewPropertiesUpdateListener(callback) {
    this.on(ViewEvents.UPDATE_VIEW_PROPERTIES, callback);
  }

  removeViewPropertiesUpdateListener(callback) {
    this.removeListener(ViewEvents.UPDATE_VIEW_PROPERTIES, callback);
  }

  addLoaderListener(callback) {
    this.on(ViewEvents.UPDATE_LOADER, callback);
  }

  removeLoaderListener(callback) {
    this.removeListener(ViewEvents.UPDATE_LOADER, callback);
  }

  addMetadataListener(callback) {
    this.on(ViewEvents.SHOW_ENTITY_METADATA_MODAL, callback);
  }

  removeMetadataListener(callback) {
    this.removeListener(ViewEvents.SHOW_ENTITY_METADATA_MODAL, callback);
  }
}

export default ViewStore;