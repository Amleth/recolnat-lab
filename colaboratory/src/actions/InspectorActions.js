/**
 * Created by dmitri on 24/05/16.
 */
'use strict';

import AppDispatcher from '../dispatcher/AppDispatcher';
import InspectorConstants from '../constants/InspectorConstants';

export default {
  setInspectorData: (data = []) => {
    AppDispatcher.dispatch({
      actionType: InspectorConstants.ActionTypes.SET_DATA,
      data: data
    });
  }
}