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
    this.imagesToLoad = {};
    this.imagesLoaded = {};

    this.loader = window.setInterval(this.loadNextImage.bind(this), 250);
    this.imageFailsLoadingCheck = window.setInterval(this.restartCurrentLoad.bind(this), 10000);
    this.currentlyLoadingImage = null;

    AppDispatcher.register((action) => {
      switch(action.actionType) {
        case ViewConstants.ActionTypes.Local.SCHEDULE_IMAGE_LOAD:
          this.addImageToLoad(action.source, action.callback);
          break;
        default:
          break;
      }
    })
  }

  addImageToLoad(source, callback) {
    // Check if image is already loaded
    if(this.imagesLoaded[source]) {
      //console.log("Image already loaded " + JSON.stringify(this.imagesLoaded[source]));
      // Image is already loaded, just call callback
      window.setTimeout((function(callback, image) {
        callback(image);
      })(callback, this.imagesLoaded[source].image),10);
      //callback(this.imagesLoaded[source].image);
    }
    else if(this.currentlyLoadingImage) {
      //console.log("Image currently loading " + this.currentlyLoadingImage.image);
      if (this.currentlyLoadingImage.source = source) {
        // Image is currently loading, add callback
        this.currentlyLoadingImage.callbacks.push(callback);
      }
    }
    else if(this.imagesToLoad[source]) {
      //console.log("Image already scheduled to load " + this.imagesToLoad[source].image);
      // Image is waiting to be loaded already, add callback to existing
      this.imagesToLoad[source].callbacks.push(callback);
    }
    else {
      //console.log("Image will be scheduled to load ");
      // Add new image to load queue
      this.imagesToLoad[source] = {
        source: source,
        callbacks: [callback]
      };
    }
  }

  loadNextImage() {
    // Check if the current image is done loading (if any)
    if(this.currentlyLoadingImage) {
      if(!this.currentlyLoadingImage.image.complete) {
        // An image is already loading and is not finished.
        return;
      }
      else {
        // The current image is done loading, add it to imagesLoaded
        this.imagesLoaded[this.currentlyLoadingImage.source] = {
          source: this.currentlyLoadingImage.source,
          image: this.currentlyLoadingImage.image
        };

        //console.log(JSON.stringify(this.currentlyLoadingImage));

        // Call the callbacks
        for(var i = 0; i < this.currentlyLoadingImage.callbacks.length; ++i) {
          window.setTimeout((function (image, callback) {
            callback(image);
          })(this.currentlyLoadingImage.image, this.currentlyLoadingImage.callbacks[i]), 100);
        }

        // Clear the current pointer
        this.currentlyLoadingImage = null;
      }
    }
    // Schedule next image to load
    var keys = Object.keys(this.imagesToLoad);
    if(keys.length > 0) {
      var image = this.imagesToLoad[keys[0]];
      this.currentlyLoadingImage = {
        source: image.source,
        callbacks: image.callbacks,
        image: new Image()
      };

      delete this.imagesToLoad[keys[0]];

      //console.log(this.currentlyLoadingImage.image);
      var self = this;
      this.currentlyLoadingImage.image.onload = function() {
        self.loadNextImage.bind(self);
      };

      //console.log(this.currentlyLoadingImage.image);
      this.currentlyLoadingImage.image.onerror = function() {
        this.src = imageNotFound;
      };

      this.currentlyLoadingImage.image.src = this.currentlyLoadingImage.source;
    }
  }

  restartCurrentLoad() {
    if(this.currentlyLoadingImage) {
      this.currentlyLoadingImage.image.src = '';
      this.imagesToLoad[this.currentlyLoadingImage.source] = {
        source: this.currentlyLoadingImage.source,
        callbacks: this.currentlyLoadingImage.callbacks
      };
      this.currentlyLoadingImage = null;
    }
  }

}

export default ImageStore;