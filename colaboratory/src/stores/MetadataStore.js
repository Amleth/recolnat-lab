/**
 * Stores metadata (both from the Colaboratory database and from external sources such as the central Recolnat database) for all entities.
 *
 * Created by dmitri on 05/04/16.
 */
'use strict';

import {EventEmitter} from 'events';
import request from 'superagent';

import MetadataEvents from './events/MetadataEvents';
import SocketActions from '../actions/SocketActions';

class MetadataStore extends EventEmitter {
  constructor(socket) {
    super(socket);

    this.socket = socket;

    /**
     * Metadata by id.
     *
     * @type {{}}
     */
    this.metadata = {};

    /**
     * Metadata ids for entities which are waiting for a server answer
     * @type {{}}
     */
    this.metadataIds = {};

    /**
     * External metadata for entities which have an OriginalSource
     * @type {{}}
     */
    this.externalMetadata = {};

    this.setMaxListeners(1000);
  }

  /**
   * Get metadata about a given id. If no metadata is available in this store, check the websocket connector. Otherwise returns null.
   * @param id
   * @returns {null}
   */
  getMetadataAbout(id) {
    //console.log('§§§§§§§§', 'MetadataStore', 'getMetadataAbout', 'id:', id);
    if (this.metadata[id]) {
      return JSON.parse(JSON.stringify(this.metadata[id]));
    }
    if (this.socket.get(id)) {
      // No need to clone it, socket already returns a clone
      return this.socket.get(id);
    }
    return null;
  }

  /**
   * Get external metadata about the entity with the given id. For this method to return anything, this id must correspond to an entity which is linked with an OriginalSource.
   * @param id
   * @returns {null}
   */
  getExternalMetadata(id) {
    //console.log('§§§§§§§§', 'MetadataStore', 'getExternalMetadata', 'id:', id);
    if (this.externalMetadata[id]) {
      return JSON.parse(JSON.stringify(this.externalMetadata[id]));
    }
    return null;
  }

  setExternalMetadata(specimenId, metadata) {
    //console.log('§§§§§§§§', 'MetadataStore', 'setExternalMetadata', 'specimenId:', specimenId, 'metadata:', metadata);
    this.externalMetadata[specimenId] = metadata;
    this.emitExternalMetadataUpdateEvent(specimenId);
  }

  /**
   * Retrieves a list of annotations corresponding to this entity and returns it through the provided callback. This is run once and no data is kept in the store.
   * @param id
   * @param callback
   */
  getAnnotationsOfEntity(id, callback) {
    window.setTimeout(SocketActions.request.bind(null, {
      actionDetail: 'get-annotations-of-entity',
      entity: id
    }, callback), 10);
  }

  /**
   * Retrieves a list of downloads (exports) available for the user and returns it through the provided callback.
   * @param callback
   */
  listUserDownloads(callback) {
    window.setTimeout(SocketActions.request.bind(null, {
      actionDetail: 'list-user-downloads',
    }, callback), 10)
  }

  /**
   * Stores the received metadata. If previously stored metadata is deleted on server, it is kept locally
   * @param metadata
   */
  metadataUpdated(metadata) {
    //console.log('§§§§§§§§', 'MetadataStore', 'metadataUpdated', 'metadata:', metadata);
    if (metadata.forbidden || metadata.deleted) {
      // Do not delete, let components update first
      this.metadata[metadata.uid].deleted = true;
    }
    else {
      this.metadata[metadata.uid] = JSON.parse(JSON.stringify(metadata));
    }
    this.emitUpdateEvent(metadata.uid);
  }

  emitUpdateEvent(id) {
    //console.log('§§§§§§§§', 'MetadataStore', 'emitUpdateEvent', 'id:', id);
    // console.log('meta updated emit '+ id);
    this.emit(MetadataEvents.METADATA_UPDATE + '_' + id, id);
    this.emit(MetadataEvents.METADATA_UPDATE, id);
  }

  emitExternalMetadataUpdateEvent(id) {
    //console.log('§§§§§§§§', 'MetadataStore', 'emitExternalMetadataUpdateEvent', 'id:', id);
    // console.log('meta updated emit '+ id);
    this.emit(MetadataEvents.EXTERNAL_METADATA_UPDATE + '_' + id, id);
    this.emit(MetadataEvents.EXTERNAL_METADATA_UPDATE, id);
  }

  getOriginalSource(id) {
    //console.log('§§§§§§§§', 'MetadataStore', 'getOriginalSource', 'id:', id);
    let meta = this.metadata[id];
    if (!meta) {
      // Get metadata and restart this operation
      this.addMetadataUpdateListener(id, this.getOriginalSource.bind(this, id));
      return;
    }
    if (meta.type === 'Specimen') {
      if (meta.originalSource) {
        this.addMetadataUpdateListener(meta.originalSource, this.originalSourceObtained.bind(this, meta.originalSource, id));
      }
    }
  }

  originalSourceObtained(originalSourceId, specimenId) {
    console.log('§§§§§§§§', '@@@@@@@@', 'MetadataStore', 'originalSourceObtained', {originalSourceId, specimenId});
    let meta = this.metadata[originalSourceId];
    if (!meta) {
      return;
    }
    console.log(JSON.stringify(meta));
    let id = meta.idInOriginSource;
    let type = meta.typeInOriginSource;
    let source = meta.origin;
    switch (source.toLowerCase()) {
      case 'recolnat':
        console.log('recolnat ext');
        switch (type.toLowerCase()) {
          case 'specimen':
            console.log('recolnat specimen ext, calling API');
            request.get('https://api.recolnat.org/erecolnat/v1/specimens/' + id)
              .end((err, res) => {
                if (err) {
                  console.error('Could not retrieve resource data from recolnat about ' + id);
                }
                else {
                  console.log('recolnat API received response');
                  let specimen = JSON.parse(res.text);
                  this.setExternalMetadata(specimenId, specimen);
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
    //console.log('§§§§§§§§', 'MetadataStore', 'addExternalMetadataUpdateListener', 'id:', id, 'callback:', callback);
    if (id) {
      this.on(MetadataEvents.EXTERNAL_METADATA_UPDATE + '_' + id, callback);
      if (this.externalMetadata[id]) {
        if (this.externalMetadata[id] !== 'loading') {
          window.setTimeout(function () {
            callback(id)
          }, 10);
        }
      }
      else {
        this.externalMetadata[id] = 'loading';
        window.setTimeout(this.getOriginalSource.bind(this, id), 10);
      }
    }
  }

  removeExternalMetadataUpdateListener(id, callback) {
    //console.log('§§§§§§§§', 'MetadataStore', 'removeExternalMetadataUpdateListener', 'id:', id, 'callback:', callback);
    if (id) {
      this.removeListener(MetadataEvents.EXTERNAL_METADATA_UPDATE + '_' + id, callback);
    }
    else {
      this.removeListener(MetadataEvents.EXTERNAL_METADATA_UPDATE, callback);
    }
  }

  addMetadataUpdateListener(id, callback) {
    //console.log('§§§§§§§§', 'MetadataStore', 'addMetadataUpdateListener', 'id:', id, 'callback:', callback);
    if (id) {
      this.on(MetadataEvents.METADATA_UPDATE + '_' + id, callback);
      if (!this.metadataIds[id]) {
        this.metadataIds[id] = id;
        window.setTimeout(SocketActions.registerListener.bind(null, id, this.metadataUpdated.bind(this)), 10);
      }
      else {
        // Metadata was already available, just callback
        window.setTimeout(function () {
          callback(id)
        }, 10);
      }
    }
    else {
      this.on(MetadataEvents.METADATA_UPDATE, callback);
    }
  }

  removeMetadataUpdateListener(id, callback) {
    //console.log('§§§§§§§§', 'MetadataStore', 'removeMetadataUpdateListener', 'id:', id, 'callback:', callback);
    if (id) {
      this.removeListener(MetadataEvents.METADATA_UPDATE + '_' + id, callback);
    }
    else {
      this.removeListener(MetadataEvents.METADATA_UPDATE, callback);
    }
  }
}

export default MetadataStore;
