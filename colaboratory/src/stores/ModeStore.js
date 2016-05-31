/**
 * Created by dmitri on 20/04/16.
 */
/**
 * Created by dmitri on 05/10/15.
 */
"use strict";

import {EventEmitter} from 'events';

import AppDispatcher from "../dispatcher/AppDispatcher";

import ModeConstants from "../constants/ModeConstants";

import ModeEvents from './events/ModeEvents';

class ModeStore extends EventEmitter {
  constructor() {
    super();

    this.mode = ModeConstants.Modes.SET;
    this.setMaxListeners(100);

    AppDispatcher.register((action) => {
      switch (action.actionType) {
        case ModeConstants.ActionTypes.CHANGE_MODE:
          this.mode = action.mode;
          this.emit(ModeEvents.MODE_CHANGED_EVENT);
          break;
        default:
          break;
      }
    });
  }

  getMode() {
    return this.mode;
  }

  isInSetMode() {
    return this.mode == ModeConstants.Modes.SET;
  }

  isInOrganisationMode() {
    return this.mode == ModeConstants.Modes.ORGANISATION;
  }

  isInObservationMode() {
    return this.mode == ModeConstants.Modes.OBSERVATION;
  }

  isInTabularMode() {
    return this.mode == ModeConstants.Modes.TABULAR;
  }

  addModeChangeListener(callback) {
    this.on(ModeEvents.MODE_CHANGED_EVENT, callback);
  }

  removeModeChangeListener(callback) {
    this.removeListener(ModeEvents.MODE_CHANGED_EVENT, callback);
  }
}

export default ModeStore;