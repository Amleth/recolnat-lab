/**
 * Created by dmitri on 05/04/16.
 */
'use strict';

import AppDispatcher from '../dispatcher/AppDispatcher';
import MetadataConstants from '../constants/MetadataConstants';

export default {
  updateMetadata: (ids = null) => {
    AppDispatcher.dispatch({
      actionType: MetadataConstants.ActionTypes.RELOAD_METADATA,
      entities: ids
    });
  },

  setLabBenchId: (id = null) => {
    AppDispatcher.dispatch({
      actionType: MetadataConstants.ActionTypes.SET_LAB_BENCH,
      id: id
    })
  },

  loadLabBench: (id) => {
    AppDispatcher.dispatch({
      actionType: MetadataConstants.ActionTypes.LOAD_LAB_BENCH,
      id: id
    });
  },

  updateLabBenchFrom: (id) => {
    AppDispatcher.dispatch({
      actionType: MetadataConstants.ActionTypes.UPDATE_LAB_BENCH,
      id: id
    });
  }
}
