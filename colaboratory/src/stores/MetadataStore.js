/**
 * Created by dmitri on 05/04/16.
 */
'use strict';

import {EventEmitter} from 'events';
import request from 'superagent';

import AppDispatcher from '../dispatcher/AppDispatcher';

import MetadataConstants from '../constants/MetadataConstants';

import MetadataEvents from './events/MetadataEvents';

import MetadataActions from '../actions/MetadataActions';

import conf from '../conf/ApplicationConfiguration';

class MetadataStore extends EventEmitter {
  constructor() {
    super();
    this.metadata = {};

    // Register a reaction to an action.
    AppDispatcher.register((action) => {
      switch (action.actionType) {
        case MetadataConstants.ActionTypes.RELOAD_METADATA:
          if(action.entityId) {
            this.downloadMetadata(action.entityId);
          }
          else {
            this.downloadAllMetadataFromServer();
          }
          break;
        default:
          break;
      }
    });
  }

  getMetadataAbout(id) {
    if(this.metadata[id]) {
      return JSON.parse(JSON.stringify(this.metadata[id]));
    }
    return null;
  }

  getContainingImageId(id) {
    var metadata = this.metadata[id];
  }

  downloadMetadata(id) {
    //console.log('downloadMetadata(' + id + ')');
    request.get(conf.actions.databaseActions.getData)
      .query({id: id})
      .withCredentials()
      .end((err, res) => {
        if(err) {
          console.log(err);
          this.metadata[id] = undefined;
          //delete this.metadata[id];
        }
        else {
          this.metadata[id] = JSON.parse(res.text);
        }
        this.emitUpdateEvent(id);
      });
  }

  downloadAllMetadataFromServer() {
    var ids = Object.keys(this.metadata);
    for(var i = 0; i < ids.length; ++i) {
      this.getMetadataAbout(ids[i]);
    }
  }

  emitUpdateEvent(id) {
    this.emit(MetadataEvents.METADATA_UPDATE + '_' + id, id);
    this.emit(MetadataEvents.METADATA_UPDATE, id);
  }

  addMetadataUpdateListener(id, callback) {
    if(id) {
      this.on(MetadataEvents.METADATA_UPDATE + '_' + id, callback);
    }
    else {
      this.on(MetadataEvents.METADATA_UPDATE, callback);
    }
  }

  removeMetadataUpdateListener(id, callback) {
    if(id) {
      this.removeListener(MetadataEvents.METADATA_UPDATE + '_' + id, callback);
    }
    else {
      this.removeListener(MetadataEvents.METADATA_UPDATE, callback);
    }
  }
}

export default MetadataStore;