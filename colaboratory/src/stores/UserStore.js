/**
 * Created by dmitri on 24/11/15.
 */
'use strict';

import {EventEmitter} from 'events';

import AppDispatcher from '../dispatcher/AppDispatcher';

import UserEvents from './events/UserEvents';

import SocketActions from '../actions/SocketActions';

import UserConstants from '../constants/UserConstants';

import conf from '../conf/ApplicationConfiguration';

// import en from '../data/i18n/en';
// import fr from '../data/i18n/fr';
// import es from '../data/i18n/es';

class UserStore extends EventEmitter {
  constructor() {
    super();

    this.setMaxListeners(1000);

    this.userAuthorized = false;
    this.userRplusId = null;
    this.userLogin = null;
    this.userData = null;

    this.languageMaps = {};
    for(let i = 0; i < conf.app.languages.length; ++i) {
      this.languageMaps[conf.app.languages[i].code] = require('../data/i18n/' + conf.app.languages[i].code + '.js');
    }

    this.langMap = null;
    this.language = localStorage.getItem('lang');
    if(!this.language) {
      localStorage.setItem("lang", "en");
      this.language = 'en';
    }
    this.setLanguage(this.language);

    AppDispatcher.register((action) => {
      switch(action.actionType) {
        case UserConstants.ActionTypes.USER_SET_LANGUAGE:
          this.setLanguage(action.code);
          this.emit(UserEvents.PREFS_CHANGE_LANGUAGE);
          break;
      }
    });

    // Perform initial check
    window.setTimeout(SocketActions.registerListener.bind(null, 'user', this.userConnected.bind(this)), 10);
  }

  userConnected(user) {
    if(user) {
      this.userRplusId = user.uid;
      this.userLogin = user.name;
      this.userAuthorized = true;
      this.userData = user;
      this.emit(UserEvents.USER_LOG_IN);
    }
    else {
      this.userAuthorized = false;
      this.userRplusId = null;
      this.userLogin = null;
      this.userData = null;
      this.emit(UserEvents.USER_LOG_OUT);
    }
  }

  setLanguage(language) {
    switch(language) {
      case 'es':
      case 'fr':
      case 'en':
        this.language = language;
        this.langMap = this.languageMaps[language];
        localStorage.setItem('lang', language);
        break;
      default:
        console.warn('No language ' + language);
        this.setLanguage('en');
    }
  }

  getLanguage() {
    return this.language;
  }

  getText(key) {
    if(this.langMap[key]) {
      return this.langMap[key];
    }
    else {
      console.error('No corresponding string for key ' + key + ' in ' + this.language);
    }
    if(this.languageMaps.en[key]) {
      return this.languageMaps.en[key];
    } else {
      console.error('No corresponding string for key in English i18n: ' + key);
      return '#';
    }
  }

  getInterpolatedText(key, text) {
    let string = this.langMap.interpolated[key];
    if(!string) {
      console.error('No corresponding interpolated string for key ' + key + ' in ' + this.language);
      string = this.languageMaps.en.interpolated[key];
      if(!string) {
        console.error('No corresponding interpolated string for key in English i18n: ' + key);
        return '#';
      }
    }

    for(let i = text.length-1; i > -1; --i) {
      string = string.replace('%' + i, text[i]);
    }

    return string;
  }

  getOntologyField(key) {
    switch(this.language) {
      case 'es':
        return this.langMap.darwinCore[key]?this.langMap.darwinCore[key]:this.languageMaps.en.darwinCore[key];
      case 'fr':
        return this.langMap.darwinCore[key]?this.langMap.darwinCore[key]:this.languageMaps.en.darwinCore[key];
      case 'en':
      default:
        if(!this.languageMaps.en.darwinCore[key]) {
          console.error('No corresponding string for key in English DarwinCore i18n: ' + key);
        }
        return this.languageMaps.en.darwinCore[key]?this.languageMaps.en.darwinCore[key]:'#';
    }
  }

  getUser() {
    return {rPlusId: this.userRplusId, login: this.userLogin};
  }

  getUserData() {
    return this.userData;
  }

  isUserAuthorized() {
    return this.userAuthorized;
  }

  addLanguageChangeListener(callback) {
    this.on(UserEvents.PREFS_CHANGE_LANGUAGE, callback);
  }

  removeLanguageChangeListener(callback) {
    this.removeListener(UserEvents.PREFS_CHANGE_LANGUAGE, callback);
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
