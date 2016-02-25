/**
 * Created by dmitri on 24/11/15.
 */
'use strict';

import {EventEmitter} from 'events';
import request from 'superagent';

import AppDispatcher from '../dispatcher/AppDispatcher';

import UserEvents from './events/UserEvents';

import conf from '../conf/ApplicationConfiguration';

class UserStore extends EventEmitter {
  constructor() {
    super();

    this.userAuthorized = false;
    this.userRplusId = null;
    this.userLogin = null;

    //request.get(conf.actions.authenticationServiceActions.setTestCookie)
    //  .withCredentials()
    //  .end((err, res) => {
         //Check if user is logged in
        //this.checkAuthStatus();
      //});

    // Perform initial check
    this.checkAuthStatus();
    // Check if user is still logged in every minute
    this.loginCheck = window.setInterval(this.checkAuthStatus.bind(this),
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
            this.emit(UserEvents.USER_LOG_OUT);
        }
        else {
          if(!this.userAuthorized) {
            var response = JSON.parse(res.text);
            this.userAuthorized = true;
            this.userRplusId = response.userId;
            this.userLogin = response.userLogin;
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