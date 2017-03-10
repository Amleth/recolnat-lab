/**
 * Simple store used for the drag and drop action, to provide consistent behavior across browsers. This store is used to keep the data about the item being dragged in order to transmit it from dragged item to drop area.
 *
 * Created by dmitri on 03/02/16.
 */
'use strict';

class DragNDropStore {
  constructor() {
    this.data = {};
    this.type = null;
  }

  /**
   * Sets the action information
   * @param type String type of drag action. Checked by drop areas for compatibility with data
   * @param data Object data to transmit to the drop area
   */
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

  /**
   * Resets the store. Call after finishing the drag&drop action.
   */
  reset() {
    this.data = {};
    this.type = null;
  }
}

export default DragNDropStore;