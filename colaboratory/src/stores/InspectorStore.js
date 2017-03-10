/**
 * Stores data for the Inspector / Properties panel and the List of Annotations / Tags
 *
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
    this.annotationListSelection = {
      imageId: null,
      setId: null
    };

    AppDispatcher.register((action) => {
      switch (action.actionType) {
        case InspectorConstants.ActionTypes.SET_DATA:
          this.setInspectorContent(action.data);
          this.emit(ViewEvents.INSPECTOR_CONTENT_CHANGE);
          break;
        case InspectorConstants.ActionTypes.SET_IMAGE:
          if(this.annotationListSelection.imageId != action.id) {
            this.annotationListSelection.imageId = action.id;
            this.emit(ViewEvents.ANNOTATION_LIST_CONTENT_CHANGE);
          }
          break;
        case InspectorConstants.ActionTypes.SET_SET:
          if(this.annotationListSelection.setId != action.id) {
            this.annotationListSelection.setId = action.id;
            this.emit(ViewEvents.ANNOTATION_LIST_CONTENT_CHANGE);
          }
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

  getAnnotationListSelection() {
    return JSON.parse(JSON.stringify(this.annotationListSelection));
  }

  addAnnotationSelectionListener(callback) {
    this.on(ViewEvents.ANNOTATION_LIST_CONTENT_CHANGE, callback);
  }

  removeAnnotationSelectionListener(callback) {
    this.removeListener(ViewEvents.ANNOTATION_LIST_CONTENT_CHANGE, callback);
  }

  addContentChangeListener(callback) {
    this.on(ViewEvents.INSPECTOR_CONTENT_CHANGE, callback);
  }

  removeContentChangeListener(callback) {
    this.removeListener(ViewEvents.INSPECTOR_CONTENT_CHANGE, callback);
  }
}

export default InspectorStore;