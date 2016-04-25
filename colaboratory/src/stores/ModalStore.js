/**
 * Created by dmitri on 07/04/16.
 */
'use strict';

import {EventEmitter} from 'events';

import AppDispatcher from '../dispatcher/AppDispatcher';

import ModalConstants from '../constants/ModalConstants';

import ModalEvents from './events/ModalEvents';

class ModalStore extends EventEmitter {
  constructor() {
    super();

    this.displayedModalId = null;

    AppDispatcher.register((action) => {
      switch(action.actionType) {
        case ModalConstants.ActionTypes.SHOW_MODAL:
          console.log('store modal ' + action.id);
          this.displayedModalId = action.id;
          this.emit(ModalEvents.SHOW_MODAL);
          break;
        default:
          break;
      }
    });
  }

  getModalId() {
    return this.displayedModalId;
  }

  addModalChangeListener(callback) {
    this.on(ModalEvents.SHOW_MODAL, callback);
  }

  removeModalChangeListener(callback) {
    this.removeListener(ModalEvents.SHOW_MODAL, callback);
  }

}

export default ModalStore;