/**
 * Created by dmitri on 24/11/15.
 */
'use strict';

import {EventEmitter} from 'events';

import AppDispatcher from '../dispatcher/AppDispatcher';

import UserEvents from './events/UserEvents';

import ModalActions from '../actions/ModalActions';
import SocketActions from '../actions/SocketActions';

import ModalConstants from '../constants/ModalConstants';

import conf from '../conf/ApplicationConfiguration';

class UserStore extends EventEmitter {
  constructor() {
    super();

    this.userAuthorized = false;
    this.userRplusId = null;
    this.userLogin = null;

    // Perform initial check
    window.setTimeout(SocketActions.registerListener.bind(null, 'user', this.userConnected.bind(this)), 10);

  }

  userConnected(user) {
    if(user) {
      this.userRplusId = user.uid;
      this.userLogin = user.name;
      this.userAuthorized = true;
      this.emit(UserEvents.USER_LOG_IN);
    }
    else {
      this.userAuthorized = false;
      this.userRplusId = null;
      this.userLogin = null;
      this.emit(UserEvents.USER_LOG_OUT);
    }
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
