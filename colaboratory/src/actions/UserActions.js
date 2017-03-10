/**
 * Actions on the user or user profile options.
 *
 * Created by dmitri on 12/12/16.
 */
'use strict';

import UserConstants from '../constants/UserConstants';

import AppDispatcher from '../dispatcher/AppDispatcher';

export default {
  /**
   * Sets the language of the application.
   * @param code String code of the language to use (see ApplicationConfiguration)
   */
  setLanguage: (code) => {
    AppDispatcher.dispatch({
      actionType: UserConstants.ActionTypes.USER_SET_LANGUAGE,
      code: code
    })
  },
}
