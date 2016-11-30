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
  constructor() {
    super();
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
    return null;
  }

  getExternalMetadata(id) {
    if(this.externalMetadata[id]) {
      return JSON.parse(JSON.stringify(this.externalMetadata[id]));
    }
    return null;
  }

  getContainingImageId(id) {
    var metadata = this.metadata[id];
  }

  getAnnotationsOfEntity(id, callback) {
    window.setTimeout(SocketActions.request.bind(null, {
      actionDetail: 'get-annotations-of-entity',
      entity: id
    }, callback), 10);
  }

  metadataUpdated(metadata) {
    if(metadata.forbidden) {
      delete this.metadata[metadata.uid];
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
    var meta = this.metadata[id];
    if(!meta) {
      // Get metadata and restart this operation
      this.addMetadataUpdateListener(id, this.getOriginalSource.bind(this, id));
      return;
    }
    if(meta.type == 'Specimen') {
      if(meta.originalSource) {
        this.addMetadataUpdateListener(meta.originalSource, this.originalSourceObtained.bind(this, meta.originalSource, id));
      }
    }
  }

  originalSourceObtained(originalSourceId, specimenId) {
    var meta = this.metadata[originalSourceId];
    if(!meta) {
      return;
    }
    var id = meta.idInOriginSource;
    var type = meta.typeInOriginSource;
    var source = meta.origin;
    switch(source.toLowerCase()) {
      case 'recolnat':
        switch(type.toLowerCase()) {
          case 'specimen':
            request.get('https://api.recolnat.org/erecolnat/v1/specimens/' + id)
              .end((err, res) => {
                if(err) {
                  console.error('Could not retrieve resource data from recolnat about ' + id);
                }
                else {
                  var specimen = JSON.parse(res.text);
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
      if(!this.externalMetadata[id]) {
        this.on(MetadataEvents.EXTERNAL_METADATA_UPDATE + '_' + id, callback);
      }

      if(this.externalMetadata[id]) {
        if(this.externalMetadata[id] !== 'loading') {
          window.setTimeout(this.emitExternalMetadataUpdateEvent.bind(this, id), 10);
        }
      }
      else {
        window.setTimeout(this.getOriginalSource.bind(this, id), 10);
        this.externalMetadata[id] = 'loading';
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
