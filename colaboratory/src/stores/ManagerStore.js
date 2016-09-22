/**
 * Created by dmitri on 15/01/16.
 */
'use strict';

import {EventEmitter} from 'events';
import UUID from 'node-uuid';

import AppDispatcher from '../dispatcher/AppDispatcher';

import ManagerConstants from '../constants/ManagerConstants';

import ManagerEvents from './events/ManagerEvents';

import ManagerActions from '../actions/ManagerActions';
import ViewActions from '../actions/ViewActions';
import SocketActions from '../actions/SocketActions';

import Globals from '../utils/Globals';

import conf from '../conf/ApplicationConfiguration';

class ManagerStore extends EventEmitter {
  constructor() {
    super();

    this.setMaxListeners(500);
    this.isVisible = true;
    this.selectedNode = {
      id: null,
      name: null,
      type: null,
      parent: null,
      linkToParent: null
    };

    this.displayedSets = [];

    this.userCoreSet = {};
    this.listenersById = {};
    this.setIdToPosition = {};

    AppDispatcher.register((action) => {
      switch(action.actionType) {
        case ManagerConstants.ActionTypes.TOGGLE_SET_MANAGER_VISIBILITY:
          this.isVisible = action.visible;
          this.emit(ManagerEvents.TOGGLE_SET_MANAGER_VISIBILITY);
          break;
        case ManagerConstants.ActionTypes.SET_SELECTED_NODE:
          //console.log(JSON.stringify(action));
          if(action.id) {
            this.selectedNode = {
              id: action.id,
              name: action.name,
              type: action.type,
              parent: action.parent,
              linkToParent: action.linkToParent
            };
            if(action.type == 'Set') {
              var parentIndex = this.indexOfDisplayedSet(action.parent);
              this.requestGraphAround(action.id, action.type, parentIndex+1, true);
            }
          }
          else {
            this.selectedNode = {
              id: null,
              name: null,
              type: null,
              parent: null,
              linkToParent: null
            };
          }

          this.emit(ManagerEvents.SET_SELECTED_NODE);
          break;
        case ManagerConstants.ActionTypes.SET_ACTIVE_ENTITY_IN_SET:
          var setIdx = null;
          var itemId = null;
          if(action.parentSetId) {
            // Find indices
            this.displayedSets.forEach(function(s, idx) {
              if(s) {
                if (s.uid == action.parentSetId) {
                  setIdx = idx;
                }
              }
            });
            itemId = action.entityId;
          }
          else if(action.setIndex != undefined) {
            setIdx = action.setIndex;
            if(setIdx == -1) {
              itemId = this.studyContainer.studies[action.entityIndex].core.uid;
            }
            else {
              itemId = this.displayedSets[setIdx].subsets[action.entityIndex].uid;
            }
          }
          else {
            console.error('Unprocessable action content ' + JSON.stringify(action));
            break;
          }
          console.log('setting selection in set ' + setIdx + ' to ' + itemId);
          this.setSelected(setIdx, itemId);
          this.emit(ManagerEvents.SET_SELECTED_NODE);
          break;
        default:
          break;
      }
    });

    //console.log('register listener user');
    window.setTimeout(SocketActions.registerListener.bind(null, 'user', this.setCoreSet.bind(this)), 10);
    this.listenersById['user'] = this.setCoreSet.bind(this);
  }

  setCoreSet(user) {
    if(user) {
      this.requestGraphAround(user.coreSet, 'Set', 0, true);
    }
  }

  //receiveCoreSetUpdate(coreSet) {
  //  this.userCoreSet = JSON.parse(JSON.stringify(coreSet));
  //  this.setIdToPosition[coreSet.uid] = 0;
  //  this.displayedSets[0] = coreSet;
  //  this.emit(ManagerEvents.UPDATE_MANAGER_DISPLAY);
  //}

  getCoreSet() {
    return JSON.parse(JSON.stringify(this.userCoreSet));
  }

  indexOfDisplayedSet(id) {
    for(var i = 0; i < this.displayedSets.length; ++i) {
      if(this.displayedSets[i].uid == id) {
        return i;
      }
    }
    return -1;
  }

  getSets() {
    return JSON.parse(JSON.stringify(this.displayedSets));
  }

  setSelected(setIdx, itemId) {
    if(setIdx == -1) {
      this.studyContainer.selectedId = itemId;
    }
    else {
        this.displayedSets[setIdx].selectedId = itemId;
    }
  }

  getActiveId(index) {
    return this.displayedSets[index].selectedId;
  }

  getManagerVisibility() {
    return this.isVisible;
  }

  getSelected() {
    return JSON.parse(JSON.stringify(this.selectedNode));
  }

  receiveSetData(data) {
    //console.log('received set data ' + JSON.stringify(data));
    var setIndex = this.setIdToPosition[data.uid];
    if(setIndex === undefined || setIndex === null) {
      // This set is no longer displayed, we should think about unsubscribing as well
      console.warn('Set is not in display ' + data.uid);
      return;
    }
    var newData = JSON.parse(JSON.stringify(data));
    newData.hash = UUID.v4();

    var oldData = this.displayedSets[setIndex];
    if(oldData.uid === data.uid) {
      newData.selectedId = oldData.selectedId;
    }
    this.displayedSets[setIndex] = newData;
    this.emit(ManagerEvents.UPDATE_MANAGER_DISPLAY);
  }

  requestGraphAround(id, type, setIdx, splice = false) {
    //console.log('requestGraphAround(' + id + ',' + type + ',' + setIdx + ',' + splice +')');
    if(type !== 'Set') {
      console.log('Type is not Set');
      return;
    }
    if(setIdx == null) {
      setIdx = this.displayedSets.length;
    }
    else {
      if(this.setIdToPosition[id] === setIdx) {
        console.log('Set already in right position and being listened to');
        return;
      }
    }

    if(splice) {
      var removed = this.displayedSets.splice(setIdx);
      for(var i =0; i < removed.length; ++i) {
        this.setIdToPosition[removed[i].uid] = null;
        window.setTimeout(SocketActions.removeListener.bind(null, removed[i].uid, this.listenersById[removed[i].uid]), 10);
        delete this.listenersById[removed[i].uid];
      }
    }

    this.setIdToPosition[id] = setIdx;

    this.displayedSets[setIdx] = {
      uid: id,
      loading: true
    };
    this.emit(ManagerEvents.UPDATE_MANAGER_DISPLAY);

    if(!this.listenersById[id]) {
      this.listenersById[id] = this.receiveSetData.bind(this);
      //console.log('register listener' + id);
      window.setTimeout(SocketActions.registerListener.bind(null, id, this.receiveSetData.bind(this)), 10);
    }
  }

  addManagerVisibilityListener(callback) {
    this.on(ManagerEvents.TOGGLE_SET_MANAGER_VISIBILITY, callback);
  }

  removeManagerVisibilityListener(callback) {
    this.removeListener(ManagerEvents.TOGGLE_SET_MANAGER_VISIBILITY, callback);
  }

  addSelectionChangeListener(callback) {
    this.on(ManagerEvents.SET_SELECTED_NODE, callback);
  }

  removeSelectionChangeListener(callback) {
    this.removeListener(ManagerEvents.SET_SELECTED_NODE, callback);
  }

  addManagerUpdateListener(callback) {
    this.on(ManagerEvents.UPDATE_MANAGER_DISPLAY, callback);
  }

  removeManagerUpdateListener(callback) {
    this.removeListener(ManagerEvents.UPDATE_MANAGER_DISPLAY, callback);
  }
}

export default ManagerStore;
