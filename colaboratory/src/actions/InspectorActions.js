/**
 * Created by dmitri on 24/05/16.
 *
 * Constants for the Inspector & list of measures components.
 */
'use strict';

import AppDispatcher from '../dispatcher/AppDispatcher';
import InspectorConstants from '../constants/InspectorConstants';

export default {
  /**
   * Set the entities to display in Inspector
   * @param data List of entity ids (strings) to display in inspector
   */
  setInspectorData: (data = []) => {
    AppDispatcher.dispatch({
      actionType: InspectorConstants.ActionTypes.SET_DATA,
      data: data
    });
  },

  /**
   * Set the Image/Specimen whose measures/tags are to be displayed.
   * @param id
   */
  setImageInAnnotationList: (id) => {
    AppDispatcher.dispatch({
      actionType: InspectorConstants.ActionTypes.SET_IMAGE,
      id: id
    });
  },

  /**
   * Set the Set whose measures/tags are to be displayed.
   * @param id
   */
  setSetInAnnotationList: (id) => {
    AppDispatcher.dispatch({
      actionType: InspectorConstants.ActionTypes.SET_SET,
      id: id
    });
  }
}