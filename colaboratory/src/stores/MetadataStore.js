/**
 * Created by dmitri on 05/04/16.
 */
'use strict';

import {EventEmitter} from 'events';

import AppDispatcher from '../dispatcher/AppDispatcher';

import MetadataConstants from '../constants/MetadataConstants';

import MetadataEvents from './events/MetadataEvents';

import MetadataActions from '../actions/MetadataActions';
import SocketActions from '../actions/SocketActions';

import conf from '../conf/ApplicationConfiguration';

class MetadataStore extends EventEmitter {
  constructor() {
    super();
    this.metadata = {};
    this.metadataIds = {};
    this.setMaxListeners(1000);
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

  metadataUpdated(metadata) {
    this.metadata[metadata.uid] = JSON.parse(JSON.stringify(metadata));
    this.emitUpdateEvent(metadata.uid);
  }

  emitUpdateEvent(id) {
    // console.log('meta updated emit '+ id);
    this.emit(MetadataEvents.METADATA_UPDATE + '_' + id, id);
    this.emit(MetadataEvents.METADATA_UPDATE, id);
  }

  addMetadataUpdateListener(id, callback) {
    if(id) {
      this.on(MetadataEvents.METADATA_UPDATE + '_' + id, callback);
      if(!this.metadataIds[id]) {
        this.metadataIds[id] = id;
        window.setTimeout(SocketActions.registerListener.bind(null, id, this.metadataUpdated.bind(this)), 10);
      }
      //else {
      //  window.setTimeout(this.emitUpdateEvent.bind(this, id), 10);
      //}
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
