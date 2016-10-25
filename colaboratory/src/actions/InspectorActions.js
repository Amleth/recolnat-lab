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
  },

  setImageInAnnotationList: (id) => {
    AppDispatcher.dispatch({
      actionType: InspectorConstants.ActionTypes.SET_IMAGE,
      id: id
    });
  },

  setSetInAnnotationList: (id) => {
    AppDispatcher.dispatch({
      actionType: InspectorConstants.ActionTypes.SET_SET,
      id: id
    });
  }
}