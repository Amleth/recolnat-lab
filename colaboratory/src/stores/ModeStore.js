/**
 * Created by dmitri on 20/04/16.
 */
/**
 * Created by dmitri on 05/10/15.
 */
"use strict";

import {EventEmitter} from 'events';

import AppDispatcher from "../dispatcher/AppDispatcher";

import ToolActions from '../actions/ToolActions';
import MetadataActions from '../actions/MetadataActions';
import ManagerActions from '../actions/ManagerActions';
import ViewActions from '../actions/ViewActions';

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
        this.setMode(action.mode);
          this.mode = action.mode;
          this.emit(ModeEvents.MODE_CHANGED_EVENT);
          break;
        default:
          break;
      }
    });
  }

  setMode(mode) {
    if(mode === this.mode) return;

    // window.setTimeout(
    //   ModeActions.changeMode.bind(null, mode), 10
    // );
    window.setTimeout(
      ToolActions.setTool.bind(null, null), 10
    );
    switch(mode) {
      case ModeConstants.Modes.OBSERVATION:
      // window.setTimeout(ViewActions.changeLoaderState.bind(null, "Chargement en cours."), 10);
        window.setTimeout(MetadataActions.loadLabBench, 10);
        break;
      case ModeConstants.Modes.ORGANISATION:
      // window.setTimeout(ViewActions.changeLoaderState.bind(null, "Chargement en cours."), 10);
        window.setTimeout(MetadataActions.loadLabBench, 10);
        break;
      case ModeConstants.Modes.SET:
        window.setTimeout(ManagerActions.reloadDisplayedSets, 10);
        break;
      case ModeConstants.Modes.TABULAR:
        break;
      default:
        break;
    }
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
