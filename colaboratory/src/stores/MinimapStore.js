/**
 * Created by hector on 04/08/15.
 */
"use strict";

import {EventEmitter} from 'events';

import AppDispatcher from "../dispatcher/AppDispatcher";

import MinimapConstants from "../constants/MinimapConstants";

import MinimapEvents from './events/MinimapEvents';

class MinimapStore extends EventEmitter {
  constructor() {
    super();

    this.image = {};
    this.image.url = null;
    this.image.height = null;
    this.image.width = null;
    this.image.xZero = 0;
    this.image.yZero = 0;

    AppDispatcher.register((action) => {
      switch (action.actionType) {
        case MinimapConstants.ActionTypes.INIT_MINIMAP:
          this.initializeMinimap(action.url, action.imgWidth, action.imgHeight, action.xZero, action.yZero);
          this.emit(MinimapEvents.INIT_MINIMAP);
          break;
        case MinimapConstants.ActionTypes.UNSET_MINIMAP:
          this.initializeMinimap(null, null, null, 0, 0);
          this.emit(MinimapEvents.INIT_MINIMAP);
          break;
        default:
          break;
      }
    });
  }

  initializeMinimap(url, imageWidth, imageHeight, xZero, yZero) {
    this.image.url = url;
    this.image.height = imageHeight;
    this.image.width = imageWidth;
    this.image.xZero = xZero;
    this.image.yZero = yZero;
  }

  getImage() {
    return this.image;
  }

  addInitListener(callback) {
    this.on(MinimapEvents.INIT_MINIMAP, callback);
  }

  removeInitListener(callback) {
    this.removeListener(MinimapEvents.INIT_MINIMAP, callback);
  }
}

export default MinimapStore;