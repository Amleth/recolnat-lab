/**
 * Store for view data : viewport, object size, loader text, filters.
 *
 * Created by dmitri on 05/10/15.
 */
"use strict";

import {EventEmitter} from 'events';

import AppDispatcher from "../dispatcher/AppDispatcher";

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
    this.viewport.scale = 0.01;
    this.viewport.animate = false;
    this.viewport.topFromWindow = null;
    this.viewport.leftFromWindow = null;

    this.properties = {};
    this.properties.sizeOfTextAndObjects = 1.0;

    this.loader = {};
    this.loader.text = null;

    this.displayedTypes = {
      borders: true,
      regions: false,
      points: false,
      trails: false,
      angles: false
    };

    AppDispatcher.register((action) => {
      switch (action.actionType) {
        case ViewConstants.ActionTypes.Local.UPDATE_VIEWPORT:
          this.setViewportData(action.x, action.y, action.width, action.height, action.scale, action.animate);
          this.emit(ViewEvents.UPDATE_VIEWPORT);
          break;
        case ViewConstants.ActionTypes.Local.UPDATE_VIEWPORT_LOCATION:
          this.setViewportLocationInWindow(action.top, action.left);
          this.emit(ViewEvents.UPDATE_VIEWPORT);
          break;
        case ViewConstants.ActionTypes.Local.VIEW_FIT_ALL:
          this.emit(ViewEvents.FIT_SET_IN_VIEW);
          break;
        case ViewConstants.ActionTypes.Local.UPDATE_VIEW_PROPERTIES:
          this.setViewProperties(action.properties);
          this.emit(ViewEvents.UPDATE_VIEW_PROPERTIES);
          break;
        case ViewConstants.ActionTypes.Local.UPDATE_VIEW_FILTERS:
          this.setDisplayFilters(action.filters);
          this.emit(ViewEvents.UPDATE_VIEW_FILTERS);
          break;
        case ViewConstants.ActionTypes.Local.LOADER_CHANGE_STATE:
          this.setLoaderText(action.text);
          this.emit(ViewEvents.UPDATE_LOADER);
          break;
        default:
          break;
      }
    });
  }

  getDisplayedTypes() {
    return this.displayedTypes;
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

  setDisplayFilters(filters) {
    this.displayedTypes.borders = filters.borders !== undefined?filters.borders:this.displayedTypes.borders;
    this.displayedTypes.regions = filters.regions !== undefined?filters.regions:this.displayedTypes.regions;
    this.displayedTypes.points = filters.points !== undefined?filters.points:this.displayedTypes.points;
    this.displayedTypes.trails = filters.trails !== undefined?filters.trails:this.displayedTypes.trails;
    this.displayedTypes.angles = filters.angles !== undefined?filters.angles:this.displayedTypes.angles;
  }

  getLoader() {
    return this.loader;
  }

  setViewportData(x, y, width, height, scale, animate) {
    if(x && Number.isFinite(x)) {
      this.viewport.left = x;
    }
    if(y && Number.isFinite(y)) {
      this.viewport.top = y;
    }
    if(width && Number.isFinite(width)) {
      this.viewport.width = width;
    }
    if(height && Number.isFinite(height)) {
      this.viewport.height = height;
    }
    if(scale && Number.isFinite(scale)) {
      this.viewport.scale = scale;
    }
    this.viewport.animate = animate;
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
    this.on(ViewEvents.FIT_SET_IN_VIEW, callback);
  }

  removeFitViewListener(callback) {
    this.removeListener(ViewEvents.FIT_SET_IN_VIEW, callback);
  }

  addViewPropertiesUpdateListener(callback) {
    this.on(ViewEvents.UPDATE_VIEW_PROPERTIES, callback);
  }

  removeViewPropertiesUpdateListener(callback) {
    this.removeListener(ViewEvents.UPDATE_VIEW_PROPERTIES, callback);
  }

  addFilterUpdateListener(callback) {
    this.on(ViewEvents.UPDATE_VIEW_FILTERS, callback);
  }

  removeFilterUpdateListener(callback) {
    this.removeListener(ViewEvents.UPDATE_VIEW_FILTERS, callback);
  }

  addLoaderListener(callback) {
    this.on(ViewEvents.UPDATE_LOADER, callback);
  }

  removeLoaderListener(callback) {
    this.removeListener(ViewEvents.UPDATE_LOADER, callback);
  }
}

export default ViewStore;
