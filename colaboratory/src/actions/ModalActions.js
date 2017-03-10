/**
 * Actions to run over modals. All modals must be initially invisible in the DOM.
 *
 * Created by dmitri on 07/04/16.
 */
'use strict';

import AppDispatcher from '../dispatcher/AppDispatcher';
import ModalConstants from '../constants/ModalConstants';

export default {
  /**
   * Shows the modal denoted by id.
   * @param modalId String id of the modal to show.
   * @param targetData Object (optional) data to pass to the modal. Each modal has its own structure expectations.
   * @param onSuccess Function (optional) callback to be called if modal action succeeds.
   * @param onError Function (optional) callback to be called if modal action fails.
   */
  showModal: (modalId, targetData = undefined, onSuccess = undefined, onError = undefined) => {
    AppDispatcher.dispatch({
      actionType: ModalConstants.ActionTypes.SHOW_MODAL,
      id: modalId,
      target: targetData,
      onSuccess: onSuccess,
      onError: onError
    });
  },

  /**
   * Run the callback stored in case of modal success
   */
  runSuccess: () => {
    AppDispatcher.dispatch({
      actionType: ModalConstants.ActionTypes.SUCCESS
    });
  },

  /**
   * Run the callback stored in case of modal error
   */
  runError: () => {
    AppDispatcher.dispatch({
      actionType: ModalConstants.ActionTypes.ERROR
    });
  }
}