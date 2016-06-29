/**
 * Created by dmitri on 07/04/16.
 */
'use strict';

import AppDispatcher from '../dispatcher/AppDispatcher';
import ModalConstants from '../constants/ModalConstants';

export default {
  showModal: (modalId, targetData = undefined, onSuccess = undefined, onError = undefined) => {
    AppDispatcher.dispatch({
      actionType: ModalConstants.ActionTypes.SHOW_MODAL,
      id: modalId,
      target: targetData,
      onSuccess: onSuccess,
      onError: onError
    });
  },

  runSuccess: () => {
    AppDispatcher.dispatch({
      actionType: ModalConstants.ActionTypes.SUCCESS
    });
  },

  runError: () => {
    AppDispatcher.dispatch({
      actionType: ModalConstants.ActionTypes.ERROR
    });
  }
}