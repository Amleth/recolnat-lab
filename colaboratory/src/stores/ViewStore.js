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

    this.properties = {};
    this.properties.sizeOfTextAndObjects = 1.0;

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
        default:
          break;
      }
    });
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
}

export default ViewStore;