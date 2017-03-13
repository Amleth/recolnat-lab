/**
 * Store for the data displayed in the SetManager
 *
 * Created by dmitri on 15/01/16.
 */
'use strict';

import {EventEmitter} from 'events';
import UUID from 'node-uuid';

import AppDispatcher from '../dispatcher/AppDispatcher';

import ManagerConstants from '../constants/ManagerConstants';

import ManagerEvents from './events/ManagerEvents';

import SocketActions from '../actions/SocketActions';

class ManagerStore extends EventEmitter {
  constructor() {
    super();

    this.setMaxListeners(500);

    /**
     * Global selected node (set or item).
     * @field id String UID of the node (set, specimen or image UID)
     * @field name String plain text name of the selection
     * @field type String type of the entity in database
     * @field parent String UID of the parent set
     * @field linkToParent String UID of the link (edge) between this node and its parent. This is important as the same entity may appear multiple times within a Set, however each time the link UID is different.
     * @type {{id: null, name: null, type: null, parent: null, linkToParent: null}}
     */
    this.selectedNode = {
      id: null,
      name: null,
      type: null,
      parent: null,
      linkToParent: null
    };

    /**
     * List of sets to be displayed in the manager (and their content). Each entry in this array is one column in the manager.
     * @type {Array}
     */
    this.displayedSets = [];

    this.userCoreSet = {};
    this.listenersById = {};
    this.setIdToPosition = {};

    AppDispatcher.register((action) => {
      switch(action.actionType) {
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
              let parentIndex = this.indexOfDisplayedSet(action.parent);
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
          let setIdx = null;
          let itemId = null;
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
          //console.log('setting selection in set ' + setIdx + ' to ' + itemId);
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

  getCoreSet() {
    return JSON.parse(JSON.stringify(this.userCoreSet));
  }

  /**
   * Returns the index of the first displayed set corresponding to the provided id.
   * @param id
   * @returns {number}
   */
  indexOfDisplayedSet(id) {
    for(let i = 0; i < this.displayedSets.length; ++i) {
      if(this.displayedSets[i].uid == id) {
        return i;
      }
    }
    return -1;
  }

  getSets() {
    return JSON.parse(JSON.stringify(this.displayedSets));
  }

  /**
   * Sets the selected item in a specific set (not the global selection).
   * @param setIdx
   * @param itemId
   */
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

  getSelected() {
    return JSON.parse(JSON.stringify(this.selectedNode));
  }

  /**
   * Receives data about a Set and stores it, keeping the old local selection if any. Adds a hash to the Set in order to be able to find out easily when a set changes without parsing all of its data.
   * @param data
   */
  receiveSetData(data) {
    let setIndex = this.setIdToPosition[data.uid];
    if(setIndex === undefined || setIndex === null) {
      // This set is no longer displayed, we should think about unsubscribing as well
      console.warn('Set is not in display ' + data.uid);
      return;
    }
    let newData = JSON.parse(JSON.stringify(data));
    newData.hash = UUID.v4();

    let oldData = this.displayedSets[setIndex];
    if(oldData.uid === data.uid) {
      newData.selectedId = oldData.selectedId;
    }
    this.displayedSets[setIndex] = newData;
    this.emit(ManagerEvents.UPDATE_MANAGER_DISPLAY);
  }

  /**
   * Retrieve a Set from the server and store it at the given index, clearing all following indexes if necessary.
   * @param id String UID of the Set to request
   * @param type String type corresponding to the UID, if not 'Set' this function does nothing
   * @param setIdx Integer (optional) index at which to store the set. If no index is provided, it will be pushed to the end.
   * @param splice Boolean (optional) if true will remove all sets after the provided index. False by default.
   */
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
      let removed = this.displayedSets.splice(setIdx);
      for(let i =0; i < removed.length; ++i) {
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
