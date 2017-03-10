/**
 * Store for images. When a component asks for an image to be loaded in the background this is the store handling the action and storing the image. Loaded images are stored internally for later calls.
 *
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

  /**
   * Begin loading an image. Checks if the image is already stored.
   * @param source String url of the image
   * @param callback Function callback for when the image finishes loading with success (or when the placeholder is loaded if the image is not available)
   */
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

      this.imagesLoading[source].image.onerror = function() {
        console.error('Could not load image ' + this.src);
        this.src = imageNotFound;
      };

      this.imagesLoading[source].image.src = source;
    }
  }

  /**
   * Called when an image is done loading. Checks the state of the image and calls all registered callbacks for this image.
   * @param source String url of the image which finished loading
   */
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

  /**
   * Returns the number of images currently loading or waiting to be loaded.
   * @returns {Number}
   */
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
