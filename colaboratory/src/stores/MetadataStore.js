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
import SocketActions from '../actions/SocketActions';

import conf from '../conf/ApplicationConfiguration';

class MetadataStore extends EventEmitter {
  constructor(socket) {
    super(socket);
    this.socket = socket;
    this.metadata = {};
    this.metadataIds = {};
    this.externalMetadata = {
    };
    this.setMaxListeners(1000);
  }

  getMetadataAbout(id) {
    if(this.metadata[id]) {
      return JSON.parse(JSON.stringify(this.metadata[id]));
    }
    if(this.socket.get(id)) {
      // No need to clone it, socket already returns a clone
      return this.socket.get(id);
    }
    return null;
  }

  getExternalMetadata(id) {
    if(this.externalMetadata[id]) {
      return JSON.parse(JSON.stringify(this.externalMetadata[id]));
    }
    return null;
  }

  getAnnotationsOfEntity(id, callback) {
    window.setTimeout(SocketActions.request.bind(null, {
      actionDetail: 'get-annotations-of-entity',
      entity: id
    }, callback), 10);
  }

  listUserDownloads(callback) {
    window.setTimeout(SocketActions.request.bind(null, {
      actionDetail: 'list-user-downloads',
    }, callback), 10)
  }

  metadataUpdated(metadata) {
    if(metadata.forbidden || metadata.deleted) {
      // Do not delete, let components update first
      this.metadata[metadata.uid].deleted = true;
    }
    else {
      this.metadata[metadata.uid] = JSON.parse(JSON.stringify(metadata));
    }
    this.emitUpdateEvent(metadata.uid);
  }

  emitUpdateEvent(id) {
    // console.log('meta updated emit '+ id);
    this.emit(MetadataEvents.METADATA_UPDATE + '_' + id, id);
    this.emit(MetadataEvents.METADATA_UPDATE, id);
  }

  emitExternalMetadataUpdateEvent(id) {
    // console.log('meta updated emit '+ id);
    this.emit(MetadataEvents.EXTERNAL_METADATA_UPDATE + '_' + id, id);
    this.emit(MetadataEvents.EXTERNAL_METADATA_UPDATE, id);
  }

  getOriginalSource(id) {
    console.log('getOriginalSource');
    let meta = this.metadata[id];
    if(!meta) {
      // Get metadata and restart this operation
      this.addMetadataUpdateListener(id, this.getOriginalSource.bind(this, id));
      return;
    }
    if(meta.type === 'Specimen') {
      if(meta.originalSource) {
        this.addMetadataUpdateListener(meta.originalSource, this.originalSourceObtained.bind(this, meta.originalSource, id));
      }
    }
  }

  originalSourceObtained(originalSourceId, specimenId) {
    console.log('originalSourceObtained');
    console.log('originalSourceId ' + originalSourceId);
    console.log('originalSourceObtained ' + specimenId);
    let meta = this.metadata[originalSourceId];
    if(!meta) {
      return;
    }
    console.log(JSON.stringify(meta));
    let id = meta.idInOriginSource;
    let type = meta.typeInOriginSource;
    let source = meta.origin;
    switch(source.toLowerCase()) {
      case 'recolnat':
        console.log('recolnat ext');
        switch(type.toLowerCase()) {
          case 'specimen':
            console.log('recolnat specimen ext, calling API');
            request.get('https://api.recolnat.org/erecolnat/v1/specimens/' + id)
              .end((err, res) => {
                if(err) {
                  console.error('Could not retrieve resource data from recolnat about ' + id);
                }
                else {
                  console.log('recolnat API received response');
                  let specimen = JSON.parse(res.text);
                  this.externalMetadata[specimenId] = specimen;
                  this.emitExternalMetadataUpdateEvent(specimenId);
                }
              });
            break;
          default:
            console.error('No handler for ReColNat object type ' + type);
            break;
        }
        break;
      default:
        console.error('Unknown data source ' + source);
        break;
    }
  }

  addExternalMetadataUpdateListener(id, callback) {
    if(id) {
      this.on(MetadataEvents.EXTERNAL_METADATA_UPDATE + '_' + id, callback);
      // if(!this.externalMetadata[id]) {
      //   this.on(MetadataEvents.EXTERNAL_METADATA_UPDATE + '_' + id, callback);
      // }

      if(this.externalMetadata[id]) {
        if(this.externalMetadata[id] !== 'loading') {
          window.setTimeout(function(){callback(id)}, 10);
          // window.setTimeout(this.emitExternalMetadataUpdateEvent.bind(this, id), 10);
        }
      }
      else {
        this.externalMetadata[id] = 'loading';
        window.setTimeout(this.getOriginalSource.bind(this, id), 10);
      }
    }
  }

  removeExternalMetadataUpdateListener(id, callback) {
    if(id) {
      this.removeListener(MetadataEvents.EXTERNAL_METADATA_UPDATE + '_' + id, callback);
    }
    else {
      this.removeListener(MetadataEvents.EXTERNAL_METADATA_UPDATE, callback);
    }
  }

  addMetadataUpdateListener(id, callback) {
    if(id) {
      this.on(MetadataEvents.METADATA_UPDATE + '_' + id, callback);
      if(!this.metadataIds[id]) {
        this.metadataIds[id] = id;
        window.setTimeout(SocketActions.registerListener.bind(null, id, this.metadataUpdated.bind(this)), 10);
      }
      else {
        // Metadata was already available, just callback
        window.setTimeout(function() {callback(id)}, 10);
      }
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
