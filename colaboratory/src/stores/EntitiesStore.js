'use strict';

import {EventEmitter} from 'events';
import request from 'superagent';
import fs from "filereader-stream";

import AppDispatcher from '../dispatcher/AppDispatcher';

import ServerConstants from '../constants/ServerConstants';
import ViewConstants from '../constants/ViewConstants';
import EditorConstants from '../constants/EditorConstants';

import EntitiesEvents from './events/EntitiesEvents';

import ToolActions from '../actions/ToolActions';
import EditorActions from '../actions/ManagerActions';
import ViewActions from '../actions/ViewActions';

import conf from '../conf/ApplicationConfiguration';

class EntitiesStore extends EventEmitter {
  constructor() {
    super();
    this.items = {};
    this.bags = {};
    this.metadata = {};
    this.workbench = null;
    this.selection = null;

    // Register a reaction to an action.
    AppDispatcher.register((action) => {
      //console.log('EntitiesStore received ACTION', action.actionType);
      switch (action.actionType) {
        case ViewConstants.ActionTypes.Server.VIEW_SET_WORKBENCH:
          //console.log('Store received new workbench ' + action.workbench);
          window.setTimeout(function() {
            ViewActions.changeLoaderState("Chargement en cours.")}, 1);
          this.select(null, null);
          this.setWorkbenchId(action.workbench);
          this.emit(EntitiesEvents.CHANGE_DISPLAYED_WORKBENCH);
          this.emit(EntitiesEvents.CHANGE_SELECTED_ENTITY);
          break;
        case ServerConstants.ActionTypes.SERVER_CHILD_ENTITIES:
          //console.log("Storing entities " + JSON.stringify(action.entities));
          this.setAll(action.entities);
          //this.select(null, null);
          this.downloadAllMetadataFromServer();
          var items = this.getItems();
          if(items.length > 0) {
            //this.select(items[0].id, items[0]);
            window.setTimeout(function() {
              ViewActions.changeSelection(items[0].id, items[0]);
            }, 100);
          }

          //this.emit(EntitiesEvents.CHANGE_SELECTED_ENTITY);
          this.emit(EntitiesEvents.CHANGE_DISPLAYED_ENTITIES);
          this.emit(EntitiesEvents.METADATA_UPDATE);
          break;
        case ServerConstants.ActionTypes.SERVER_CHILD_ENTITY_MOVED:
          this.update(action.id, action.x, action.y);
          this.emit(EntitiesEvents.CHANGE_DISPLAYED_ENTITIES);
          break;
        case ViewConstants.ActionTypes.Local.VIEW_SET_SELECTION:
          //console.log("EntitiesStore setting new selection " + action.selection.id);
          this.select(action.selection.id, action.selection.data);
          this.emit(EntitiesEvents.CHANGE_SELECTED_ENTITY);
          break;
        case ViewConstants.ActionTypes.Local.RELOAD_METADATA:
          if(action.entityId) {
            this.downloadEntityMetadataFromServer(action.entityId);
          }
          else {
            this.downloadAllMetadataFromServer();
          }
          break;
        default:
          //console.log('selected=' + JSON.stringify(this.selection));
          break;
      }
    });
  }

  setWorkbenchId(workbench) {
    this.workbench = workbench;
  }

  getWorkbenchId() {
    return this.workbench;
  }

  create(id, x, y) {
    this.items[id] = {
      id: id,
      x: x,
      y: y
    };

  }

  update(id, x, y) {
    if(this.items[id]) {
      this.items[id].x = x;
      this.items[id].y = y;
    }
    else if(this.bags[id]) {
      this.bags[id].x = x;
      this.bags[id].y = y;
    }
    else {
      console.error("Received update request from server for object " + id + " but it is not a known item or bag");
    }
  }

  destroy(id) {
    if(this.items[id]) {
      delete this.items[id];
    }
    else if(this.bags[id]) {
      delete this.bags[id];
    }
    else {
      console.error("Received destroy request from server for object " + id + " but it is not a known item or bag");
    }
  }

  setAll(entities) {
    this.items = [];
    this.bags = [];
    for(var i = 0; i < entities.length; ++i) {
      if(entities[i].type == "item") {
        this.items.push(entities[i]);
      }
      else if(entities[i] == 'bag') {
        this.bags.push(entities[i]);
      }
    }
    this.items = _.indexBy(this.items, 'id');
    this.bags = _.indexBy(this.bags, 'id');
  }

  getItems() {
    return _.values(this.items);
  }

  getAllMetadata() {
    return _.values(this.metadata);
  }

  getMetadataAbout(id) {
    if(this.items[id]) {
      return this.items[id];
    }

    if(this.bags[id]) {
      return this.bags[id];
    }

    var allObjectsMetadata = this.getAllMetadata();
    for(var i = 0; i < allObjectsMetadata.length; ++i) {
      var objectMetadata = allObjectsMetadata[i];
      //console.log(JSON.stringify(objectMetadata));
      if(objectMetadata.pois) {
        for(var j = 0; j < objectMetadata.pois.length; ++j) {
          var poi = objectMetadata.pois[j];
          if(poi.id == id) {
            return poi;
          }
        }
      }
      if(objectMetadata.rois) {
        for(var j = 0; j < objectMetadata.rois.length; ++j) {
          var roi = objectMetadata.rois[j];
          if(roi.id == id) {
            return roi;
          }
        }
      }
      if(objectMetadata.paths) {
        for(var j = 0; j < objectMetadata.paths.length; ++j) {
          var path = objectMetadata.paths[j];
          if(path.id == id) {
            return path;
          }
        }
      }
    }
  }

  getContainingImageId(id) {
    var allObjectsMetadata = this.getAllMetadata();
    for(var i = 0; i < allObjectsMetadata.length; ++i) {
      var objectMetadata = allObjectsMetadata[i];
      //console.log(JSON.stringify(objectMetadata));
      if(objectMetadata.pois) {
        for(var j = 0; j < objectMetadata.pois.length; ++j) {
          var poi = objectMetadata.pois[j];
          if(poi.id == id) {
            return objectMetadata.id;
          }
        }
      }
      if(objectMetadata.rois) {
        for(var j = 0; j < objectMetadata.rois.length; ++j) {
          var roi = objectMetadata.rois[j];
          if(roi.id == id) {
            return objectMetadata.id;
          }
        }
      }
      if(objectMetadata.paths) {
        for(var j = 0; j < objectMetadata.paths.length; ++j) {
          var path = objectMetadata.paths[j];
          if(path.id == id) {
            return objectMetadata.id;
          }
        }
      }
    }
  }

  getSelectedMetadata() {
    if(this.selection) {
      return this.metadata[this.selection.id];
    }
    return null;
  }

  getEntityMetadata(id) {
    return this.metadata[id];
  }

  getSelectedImage() {
    if(this.selection) {
      return this.items[this.selection.id];
    }
    return null;
  }

  getSelectedImageId() {
    if(this.selection) {
      return this.selection.id;
    }
    return null;
  }

  getBags() {
    return _.values(this.bags);
  }

  downloadAllMetadataFromServer() {
    //console.log('Downloading metadata');
    var items = this.getItems();
    for(var i = 0; i < items.length; ++i) {
      //console.log('Downloading metadata for ' + items[i].id);
      request.post(conf.actions.imageEditorServiceActions.getImageData)
        .send({id: items[i].id})
        .withCredentials()
        .end((err, res) => {
            if(err) {
              console.error("Could not get data about object " + err);
            }
            else {
              var metadata = JSON.parse(res.text);
              //console.log(JSON.stringify(metadata));
              this.metadata[metadata.id] = metadata;
              this.emit(EntitiesEvents.METADATA_UPDATE);
            }
          }

        )
    }
  }

  downloadEntityMetadataFromServer(id) {
    request.post(conf.actions.imageEditorServiceActions.getImageData)
      .send({id: id})
      .withCredentials()
      .end((err, res) => {
          if(err) {
            console.error("Could not get data about object " + err);
          }
          else {
            var metadata = JSON.parse(res.text);
            //console.log(JSON.stringify(metadata));
            this.metadata[metadata.id] = metadata;
            this.emit(EntitiesEvents.METADATA_UPDATE);
          }
        }
      );
  }

  select(id, data) {
    if(id) {
      this.selection = {id : id, data: data};
    }
    else {
      this.selection = null;
    }
  }

  getSelectedEntity() {
    return this.selection;
  }

  addChangeEntitiesListener(callback) {
    this.on(EntitiesEvents.CHANGE_DISPLAYED_ENTITIES, callback);
  }

  removeChangeEntitiesListener(callback) {
    this.removeListener(EntitiesEvents.CHANGE_DISPLAYED_ENTITIES, callback);
  }

  addChangeWorkbenchListener(callback) {
    this.on(EntitiesEvents.CHANGE_DISPLAYED_WORKBENCH, callback);
  }

  removeChangeWorkbenchListener(callback) {
    this.removeListener(EntitiesEvents.CHANGE_DISPLAYED_WORKBENCH, callback);
  }

  addChangeSelectionListener(callback) {
    this.on(EntitiesEvents.CHANGE_SELECTED_ENTITY, callback);
  }

  removeChangeSelectionListener(callback) {
    this.removeListener(EntitiesEvents.CHANGE_SELECTED_ENTITY, callback);
  }

  addMetadataUpdateListener(callback) {
    this.on(EntitiesEvents.METADATA_UPDATE, callback);
  }

  removeMetadataUpdateListener(callback) {
    this.removeListener(EntitiesEvents.METADATA_UPDATE, callback);
  }
}

export default EntitiesStore;