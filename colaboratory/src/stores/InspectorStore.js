/**
 * Created by dmitri on 03/05/16.
 */
'use strict';

import {EventEmitter} from 'events';

import AppDispatcher from "../dispatcher/AppDispatcher";

import InspectorConstants from '../constants/InspectorConstants';

import ViewEvents from './events/ViewEvents';

class InspectorStore extends EventEmitter {
  constructor() {
    super();

    this.elementsToInspect = [];

    AppDispatcher.register((action) => {
      switch (action.actionType) {
        case InspectorConstants.ActionTypes.SET_DATA:
          this.setInspectorContent(action.data);
          this.emit(ViewEvents.INSPECTOR_CONTENT_CHANGE);
          break;
        default:
          break;
      }
    });
  }

  setInspectorContent(content) {
    this.elementsToInspect = content;
  }

  getInspectorContent() {
    return JSON.parse(JSON.stringify(this.elementsToInspect));
  }

  addContentChangeListener(callback) {
    this.on(ViewEvents.INSPECTOR_CONTENT_CHANGE, callback);
  }

  removeContentChangeListener(callback) {
    this.removeListener(ViewEvents.INSPECTOR_CONTENT_CHANGE, callback);
  }
}

export default InspectorStore;