/**
 * Created by dmitri on 31/01/17.
 */
'use strict';

import ServiceMethods from './ServiceMethods';

class ImagePlacer {
  constructor(viewId, images, positions, allPlacedCallback) {
    this.viewId = viewId;
    this.images = images;
    this.positions = positions;
    this.allPlacedCallback = allPlacedCallback;
    this.placed = 0;
  }

  imagePlaced() {
    this.placed++;
    if(this.placed === this.images.length) {
      this.allPlacedCallback(this.viewId, this.images, this.positions);
    }
  }

  run() {
    if(this.images.length !== this.positions.length) {
      console.error('Number of images and positions must be the same. Got ' + this.images.length + ' images and ' + this.positions.length + ' positions.');
      return;
    }
    for(let i = 0; i < this.images.length; ++i) {
      let image = this.images[i];
      let pos = this.positions[i];
      ServiceMethods.place(this.viewId, image, pos.x, pos.y, this.imagePlaced.bind(null, this.viewId));
    }
  }
}

export default ImagePlacer;