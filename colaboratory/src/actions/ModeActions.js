/**
 * Actions to regulate transitions between modes (Set, Observation, Organisation, Tabular)
 *
 * Created by dmitri on 20/04/16.
 */
'use strict';
import AppDispatcher from '../dispatcher/AppDispatcher';
import ModeConstants from '../constants/ModeConstants';

export default {
  /**
   * Change the mode
   * @param mode String id of the mode to switch to (see ModeConstants.Modes for valid values)
   */
  changeMode: (mode) => {
    AppDispatcher.dispatch({
      actionType: ModeConstants.ActionTypes.CHANGE_MODE,
      mode: mode
    });
  }
}