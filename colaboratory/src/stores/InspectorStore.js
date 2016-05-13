/**
 * Created by dmitri on 03/05/16.
 */
'use strict';

import {EventEmitter} from 'events';

import AppDispatcher from "../dispatcher/AppDispatcher";

import MenuConstants from '../constants/MenuConstants';

import ViewEvents from './events/ViewEvents';

class InspectorStore extends EventEmitter {
  constructor() {
    super();

    this.elementsToInspect = [];

    AppDispatcher.register((action) => {
      switch (action.actionType) {
        case MenuConstants.ActionTypes.INSPECT_ELEMENTS:
          this.setInspectorContent(action.elements);
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
    return this.elementsToInspect;
  }

  addContentChangeListener(callback) {
    this.on(ViewEvents.INSPECTOR_CONTENT_CHANGE, callback);
  }

  removeContentChangeListener(callback) {
    this.removeListener(ViewEvents.INSPECTOR_CONTENT_CHANGE, callback);
  }
}

export default InspectorStore;