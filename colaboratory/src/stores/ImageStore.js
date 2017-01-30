/**
 * Created by dmitri on 29/02/16.
 */
'use strict';

import {EventEmitter} from 'events';

import AppDispatcher from '../dispatcher/AppDispatcher';

import ViewConstants from '../constants/ViewConstants';

import imageNotFound from '../images/image-not-found.png';

class ImageStore extends EventEmitter {
  constructor() {
    super();
    this.imageLoadedEvent = 'IMAGE_imageLoaded';

    this.imagesLoading = {};
    this.imagesLoaded = {};

    AppDispatcher.register((action) => {
      switch(action.actionType) {
        case ViewConstants.ActionTypes.Local.SCHEDULE_IMAGE_LOAD:
          this.loadImage(action.source, action.callback);
          this.emit(this.imageLoadedEvent);
          break;
        default:
          break;
      }
    })
  }

  loadImage(source, callback) {
    if(this.imagesLoaded[source]) {
      // Image is already loaded in store, call callback immediately (with timeout)
      window.setTimeout((function(callback, image) {
        callback(image);
      })(callback, this.imagesLoaded[source].image),10);
    }
    else if(this.imagesLoading[source]) {
      // Image is already loading, add callback to queue
      this.imagesLoading[source].callbacks.push(callback);
    }
    else {
      // New image source, begin loading
      this.imagesLoading[source] = {
        source: source,
        callbacks: [callback],
        image: new Image()
      };

      this.imagesLoading[source].image.onload = this.imageLoaded.bind(this, source);

      //console.log(this.currentlyLoadingImage.image);
      this.imagesLoading[source].image.onerror = function() {
        console.error('Could not load image ' + this.src);
        this.src = imageNotFound;
      };

      this.imagesLoading[source].image.src = source;
    }
  }

  imageLoaded(source) {
    this.imagesLoaded[source] = {
      image: this.imagesLoading[source].image,
      source: source
    };

    for(let i = 0; i < this.imagesLoading[source].callbacks.length; ++i) {
      let callback = this.imagesLoading[source].callbacks[i];
      window.setTimeout(
        (function(callback, image) {callback(image);})
        (callback, this.imagesLoaded[source].image),
        10);
    }

    delete this.imagesLoading[source];

    this.emit(this.imageLoadedEvent);
  }

  countLoadingImages() {
    return Object.keys(this.imagesLoading).length;
  }

  addLoadingStateChangeListener(callback) {
    this.on(this.imageLoadedEvent, callback);
  }

  removeLoadingStateChangeListener(callback) {
    this.removeListener(this.imageLoadedEvent, callback);
  }

}

export default ImageStore;
