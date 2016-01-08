/**
 * Created by dmitri on 04/01/16.
 */
'use strict';

import {EventEmitter} from 'events';

import AppDispatcher from '../dispatcher/AppDispatcher';

import MenuConstants from '../constants/MenuConstants';

import EntitiesEvents from './events/EntitiesEvents';
import MenuEvents from './events/MenuEvents';

import MenuActions from '../actions/MenuActions';

import conf from '../conf/ApplicationConfiguration';

class MenuStore extends EventEmitter {
  constructor() {
    super();

    this.itemsAtCursorRightClick = [];
    this.click = {};
    this.click.x = null;
    this.click.y = null;

    // Register a reaction to an action.
    AppDispatcher.register((action) => {
      //console.log('EntitiesStore received ACTION', action.actionType);
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