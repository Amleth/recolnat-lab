/**
 * Created by dmitri on 12/12/16.
 */
'use strict';

import UserConstants from '../constants/UserConstants';

import AppDispatcher from '../dispatcher/AppDispatcher';

export default {
  setLanguage: (code) => {
    AppDispatcher.dispatch({
      actionType: UserConstants.ActionTypes.USER_SET_LANGUAGE,
      code: code
    })
  },
}
