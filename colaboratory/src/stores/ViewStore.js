/**
 * Created by dmitri on 05/10/15.
 */
"use strict";

import {EventEmitter} from 'events';
import request from 'superagent';

import AppDispatcher from "../dispatcher/AppDispatcher";

import ViewConstants from '../constants/ViewConstants';

import ViewEvents from './events/ViewEvents';

import MetadataActions from '../actions/MetadataActions';

import conf from '../conf/ApplicationConfiguration';

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

    AppDispatcher.register((action) => {
      //console.log("Received action " + JSON.stringify(action));
      switch (action.actionType) {
        case ViewConstants.ActionTypes.Local.UPDATE_VIEWPORT:
          this.setViewportData(action.x, action.y, action.width, action.height, action.scale);
          this.emit(ViewEvents.UPDATE_VIEWPORT);
          break;
        case ViewConstants.ActionTypes.Local.VIEW_FIT_ALL:
          this.emit(ViewEvents.FIT_SET_IN_VIEW);
          break;
        case ViewConstants.ActionTypes.Local.UPDATE_VIEW_PROPERTIES:
          this.setViewProperties(action.properties);
          this.emit(ViewEvents.UPDATE_VIEW_PROPERTIES);
          break;
        case ViewConstants.ActionTypes.Local.LOADER_CHANGE_STATE:
          this.setLoaderText(action.text);
          this.emit(ViewEvents.UPDATE_LOADER);
          break;
        case ViewConstants.ActionTypes.Server.VIEW_PLACE_ENTITY:
          this.sendPlaceRequest(action.viewId, action.entityId, action.x, action.y);
          break;
        case ViewConstants.ActionTypes.Server.VIEW_MOVE_ENTITY:
          this.sendMoveRequest(action.viewId, action.entityId, action.linkId, action.x, action.y);
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

  sendPlaceRequest(viewId, entityId, x, y) {
    request.post(conf.actions.viewServiceActions.place)
      .send({view: viewId})
      .send({entity: entityId})
      .send({x: x})
      .send({y: y})
      .withCredentials()
      .end((err, res) => {
        if(err) {
          console.error(err);
          alert('Erreur pendant le placement: ' + err);
        }
        else {
          MetadataActions.updateLabBenchFrom(viewId);

        }
      });
  }

  sendMoveRequest(viewId, entityId, linkId, x, y) {
    request.post(conf.actions.viewServiceActions.move)
      .send({view: viewId})
      .send({entity: entityId})
      .send({link: linkId})
      .send({x: x})
      .send({y: y})
      .withCredentials()
      .end((err, res) => {
        if(err) {
          console.error(err);
          alert('Erreur pendant le placement: ' + err);
        }
        else {
          MetadataActions.updateLabBenchFrom(viewId);
        }
      });
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