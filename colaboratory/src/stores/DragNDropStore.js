/**
 * Created by dmitri on 03/02/16.
 */
'use strict';

class DragNDropStore {
  constructor() {
    this.data = {};
    this.type = null;
  }

  setAction(type, data) {
    this.type = type;
    this.data = data;
  }

  getType(){
    return this.type;
  }

  getData() {
    return this.data;
  }

  reset() {
    this.data = {};
    this.type = null;
  }
};

export default DragNDropStore;