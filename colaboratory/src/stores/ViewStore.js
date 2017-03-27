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

    // Maps uid of an entity to an array of display colors (in #XXXXXX notation)
    this.colors = {};

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
        case ViewConstants.ActionTypes.Local.UPDATE_VIEW_COLORS:
          this.setColor(action.id, action.color, action.add);
          this.emit(ViewEvents.UPDATE_VIEW_FILTERS);
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
    if(filters.all) {
      this.displayedTypes = {
        borders: true,
        regions: true,
        points: true,
        trails: true,
        angles: true
      };
      return;
    }
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

  setColor(id, color, add) {
    if(add) {
      if(!this.colors[id]) {
        this.colors[id] = [];
      }
      if(_.indexOf(this.colors[id], color) < 0) {
        this.colors[id].unshift(color);
      }
    }
    else {
      this.colors[id] = _.without(this.colors[id], color);
      if(this.colors[id].length === 0) {
        delete this.colors[id];
      }
    }
  }

  getColors() {
    return JSON.parse(JSON.stringify(this.colors));
  }

  /**
   * Returns the latest color associated to the given entity id
   * @param entityId
   */
  getColor(entityId) {
    if(!this.colors[entityId]) {
      return null;
    }
    return JSON.parse(JSON.stringify(this.colors[entityId][0]));
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
