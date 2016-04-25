/**
 * Created by dmitri on 20/04/16.
 */
'use strict';
import AppDispatcher from '../dispatcher/AppDispatcher';
import ModeConstants from '../constants/ModeConstants';

export default {
  changeMode: (mode) => {
    AppDispatcher.dispatch({
      actionType: ModeConstants.ActionTypes.CHANGE_MODE,
      mode: mode
    });
  }
}