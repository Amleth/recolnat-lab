/**
 * Created by dmitri on 24/11/15.
 */
'use strict';

import {EventEmitter} from 'events';
import request from 'superagent';

import AppDispatcher from '../dispatcher/AppDispatcher';

import UserEvents from './events/UserEvents';

import ModalActions from '../actions/ModalActions';

import ModalConstants from '../constants/ModalConstants';

import conf from '../conf/ApplicationConfiguration';

class UserStore extends EventEmitter {
  constructor() {
    super();

    this.userAuthorized = false;
    this.userRplusId = null;
    this.userLogin = null;

    // Perform initial check
    this.checkAuthStatus();
    // Check if user is still logged in every minute
    this.loginCheck = window.setTimeout(this.checkAuthStatus.bind(this),
      60000*10
    );
  }

  checkAuthStatus() {
    request.get(conf.actions.authenticationServiceActions.isUserAuthenticated)
      .withCredentials()
      .end((err, res) => {
        if(err) {
          this.userAuthorized = false;
          this.userRplusId = null;
          this.userLogin = null;
          this.loginCheck = window.setTimeout(this.checkAuthStatus.bind(this), 5000);
          this.emit(UserEvents.USER_LOG_OUT);
        }
        else {
          if(!this.userAuthorized) {
            var response = JSON.parse(res.text);
            this.userAuthorized = true;
            this.userRplusId = response.userId;
            this.userLogin = response.userLogin;
            this.loginCheck = window.setTimeout(this.checkAuthStatus.bind(this), 60000*10);
            this.emit(UserEvents.USER_LOG_IN);
          }
        }
      });
  }

  getUser() {
    return {rPlusId: this.userRplusId, login: this.userLogin};
  }

  isUserAuthorized() {
    return this.userAuthorized;
  }

  addUserLogInListener(callback) {
    this.on(UserEvents.USER_LOG_IN, callback);
  }

  removeUserLogInListener(callback) {
    this.removeListener(UserEvents.USER_LOG_IN, callback);
  }

  addUserLogOutListener(callback) {
    this.on(UserEvents.USER_LOG_OUT, callback);
  }

  removeUserLogOutListener(callback) {
    this.removeListener(UserEvents.USER_LOG_OUT, callback);
  }
}

export default UserStore;