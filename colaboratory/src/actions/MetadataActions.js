/**
 * Created by dmitri on 05/04/16.
 */
'use strict';

import AppDispatcher from '../dispatcher/AppDispatcher';
import MetadataConstants from '../constants/MetadataConstants';

export default {
  /**
   * Sets the id of a Set in the LabBenchStore. Does not start loading the Set yet.
   * @param id
   */
  setLabBenchId: (id = null) => {
    AppDispatcher.dispatch({
      actionType: MetadataConstants.ActionTypes.SET_LAB_BENCH,
      id: id
    })
  },

  /**
   * Sets and loads the id of a Set in the LabBenchStore.
   * @param id
   */
  loadLabBench: (id) => {
    AppDispatcher.dispatch({
      actionType: MetadataConstants.ActionTypes.LOAD_LAB_BENCH,
      id: id
    });
  }
}
