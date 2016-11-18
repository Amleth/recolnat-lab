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
    this.targetData = null;
    this.onSuccess = function() {};
    this.onError = function() {};
    this.setMaxListeners(50);

    AppDispatcher.register((action) => {
      switch(action.actionType) {
        case ModalConstants.ActionTypes.SHOW_MODAL:
          //console.log('store modal ' + action.id);
          this.displayedModalId = action.id;
          if(action.target) {
            this.targetData = JSON.parse(JSON.stringify(action.target));
          }
          else {
            this.targetData = action.target;
          }
          if(action.id) {
            if (action.onSuccess) {
              this.onSuccess = action.onSuccess;
            }
            else {
              this.onSuccess = function () {
              };
            }
            if (action.onError) {
              this.onError = action.onError;
            }
            else {
              this.onError = function () {
              };
            }
          }
          this.emit(ModalEvents.SHOW_MODAL);
          break;
        case ModalConstants.ActionTypes.SUCCESS:
          this.runSuccessCallback();
          break;
        case ModalConstants.ActionTypes.ERROR:
          this.runErrorCallback();
          break;
        default:
          break;
      }
    });
  }

  getTargetData() {
    return this.targetData;
  }

  getModalId() {
    return this.displayedModalId;
  }

  runSuccessCallback(data) {
    this.onSuccess(data);
  }

  runErrorCallback(data) {
    this.onError(data);
  }

  addModalChangeListener(callback) {
    this.on(ModalEvents.SHOW_MODAL, callback);
  }

  removeModalChangeListener(callback) {
    this.removeListener(ModalEvents.SHOW_MODAL, callback);
  }

}

export default ModalStore;
