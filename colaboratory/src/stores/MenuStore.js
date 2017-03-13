/**
 * Store for the context menu. Can also be used for any component which requires knowledge of content at a click location.
 *
 * Created by dmitri on 04/01/16.
 */
'use strict';

import {EventEmitter} from 'events';

import AppDispatcher from '../dispatcher/AppDispatcher';

import MenuConstants from '../constants/MenuConstants';

import MenuEvents from './events/MenuEvents';

class MenuStore extends EventEmitter {
  constructor() {
    super();

    /**
     * Array of Objects corresponding to the list of items at click location.
     * Each Object must have at least the following fields : {parent, link, data: {uid}}
     *  * @field parent String UID of the parent element (if applicable)
     *  * @field link String UID of the link to parent element (if applicable)
     *  * @field uid String UID of the element
     * @type {Array}
     */
    this.itemsAtCursorRightClick = [];
    this.click = {};
    this.click.x = null;
    this.click.y = null;

    // Register a reaction to an action.
    AppDispatcher.register((action) => {
      switch (action.actionType) {
        case MenuConstants.ActionTypes.EDITOR_CONTEXT_MENU:
          this.itemsAtCursorRightClick = action.items;
          this.click.x = action.x;
          this.click.y = action.y;
          this.emit(MenuEvents.DISPLAY_CONTEXT_MENU);
          break;
        default:
          break;
      }
    });
  }

  getElements() {
    return this.itemsAtCursorRightClick;
  }

  getClickLocation() {
    return this.click;
  }

  addContextMenuListener(callback) {
    this.on(MenuEvents.DISPLAY_CONTEXT_MENU, callback);
  }

  removeContextMenuListener(callback) {
    this.removeListener(MenuEvents.DISPLAY_CONTEXT_MENU, callback);
  }
}

export default MenuStore;