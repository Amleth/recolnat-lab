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
    this.metadataToLoad = [];
    this.metadataLoading = [];
    this.setMaxListeners(1000);

    // Register a reaction to an action.
    AppDispatcher.register((action) => {
      switch (action.actionType) {
        case MetadataConstants.ActionTypes.RELOAD_METADATA:
          if(action.entities) {
            for(var i = 0; i < action.entities.length; ++i) {
              if(this.metadata[action.entities[i]]) {
                // this.emitUpdateEvent(action.entities[i]);
              }
              if(_.contains(this.metadataToLoad, action.entities[i])) {
                //console.log('already enqueued ' + action.entities[i]);
                continue;
              }
              if(_.contains(this.metadataLoading, action.entities[i])) {
                //console.log('already loading ' + action.entities[i]);
                continue;
              }
              //console.log('adding to queue ' + action.entities[i]);
              this.metadataToLoad.push(action.entities[i]);
            }
          }
          else {
            var keys = Object.keys(this.metadata);
            Array.prototype.push.apply(this.metadataToLoad, keys);
            //this.downloadAllMetadataFromServer();
          }
          //this.checkDownloadStatus();
          break;
        default:
          break;
      }
    });

    window.setInterval(this.checkDownloadStatus.bind(this), 1000);
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

  checkDownloadStatus() {
    //console.log('------ checkDownloadStatus');
    if(this.metadataLoading.length > 0) {
      //console.log('waiting for ' + this.metadataLoading.length + " elements");
      return;
    }
    //this.metadataLoading = JSON.parse(JSON.stringify(this.metadataToLoad));
    //console.log('queue empty, adding ' + this.metadataToLoad.length + " elements");
    this.metadataLoading = [];
    // for(var i = 0; i < 50; ++i) {
    //   if(i >= this.metadataToLoad.length) {
    //     break;
    //   }
    //   this.metadataLoading.push(this.metadataToLoad[i]);
    // }
    this.metadataLoading = this.metadataToLoad.splice(0, 50);
    // Array.prototype.push.apply(this.metadataLoading, this.metadataToLoad);
    // this.metadataToLoad = [];
    if(this.metadataLoading.length > 0) {
      this.downloadMetadata(this.metadataLoading);
    }
    //console.log('----------');
  }

  downloadMetadata(ids) {
    //console.log('downloadMetadata(' + ids + ')');
    request.post(conf.actions.databaseActions.getData)
      .send(ids)
      .withCredentials()
      .timeout(120000)
      .end((err, res) => {
        if(err) {
          console.log(err);
          for(var i = 0; i < ids.length; ++i) {
            this.metadata[ids[i]] = undefined;
            this.emitUpdateEvent(ids[i]);
          }
          this.metadataLoading = [];
        }
        else {
          //console.log('response ' + res.text);
          var metadatas = JSON.parse(res.text);
          this.metadataLoading = [];
          for(var i = 0; i < metadatas.length; ++i) {
            var metadata = metadatas[i];

            this.metadata[metadata.uid] = metadata;
            this.emitUpdateEvent(metadata.uid);
          }
        }
      });
  }

  downloadAllMetadataFromServer() {
    var ids = Object.keys(this.metadata);
    this.getMetadataAbout(ids);
  }

  emitUpdateEvent(id) {
    // console.log('meta updated emit '+ id);
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
