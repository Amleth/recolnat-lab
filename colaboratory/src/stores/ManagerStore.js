/**
 * Created by dmitri on 15/01/16.
 */
'use strict';

import {EventEmitter} from 'events';
import request from 'superagent';
import UUID from 'node-uuid';

import AppDispatcher from '../dispatcher/AppDispatcher';

import ManagerConstants from '../constants/ManagerConstants';

import ManagerEvents from './events/ManagerEvents';

import ManagerActions from '../actions/ManagerActions';
import ViewActions from '../actions/ViewActions';

import Globals from '../utils/Globals';
import REST from '../utils/REST';

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
    this.studyContainer = {
      name: 'Mes études',
      studies: [],
      activeId: null
    };

    this.basket = [];
    this.basketSelection = {};

    AppDispatcher.register((action) => {
      switch(action.actionType) {
        case ManagerConstants.ActionTypes.TOGGLE_SET_MANAGER_VISIBILITY:
          this.isVisible = action.visible;
          this.emit(ManagerEvents.TOGGLE_SET_MANAGER_VISIBILITY);
          break;
        case ManagerConstants.ActionTypes.RELOAD:
          this.loadStudies();
          this.reloadDisplayedSets();
          this.emit(ManagerEvents.UPDATE_MANAGER_DISPLAY);
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
              this.requestGraphAround(action.id, action.type, parentIndex+1, undefined, Globals.preserveSetSelection, true);
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
        case ManagerConstants.ActionTypes.RELOAD_DISPLAYED_SETS:
          this.reloadDisplayedSets();
          break;
        case ManagerConstants.ActionTypes.BASKET_CHANGE_SELECTION:
          if(action.id) {
            this.updateBasketSelection(action.id, action.selected);
          }
          else {
            for(var i = 0; i < this.basket.length; ++i) {
              this.updateBasketSelection(this.basket[i].id, action.selected);
            }
          }
          this.emit(ManagerEvents.BASKET_UPDATE);
          break;
        case ManagerConstants.ActionTypes.SET_BASKET:
          this.basket = action.basket;
          this.emit(ManagerEvents.BASKET_UPDATE);
          break;
        case ManagerConstants.ActionTypes.BASKET_REMOVE_ITEM:
          this.removeItemFromBasket(action.item);
          this.emit(ManagerEvents.BASKET_UPDATE);
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
          this.setSelected(setIdx, itemId);
          this.emit(ManagerEvents.UPDATE_MANAGER_DISPLAY);
          break;
        case ManagerConstants.ActionTypes.ADD_BASKET_ITEMS_TO_SET:
          this.addBasketItemsToSet(action.set, action.keepInBasket);
          break;
        default:
          break;
      }
    });
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

  getStudies() {
    return JSON.parse(JSON.stringify(this.studyContainer));
  }

  updateBasketSelection(id, selected) {
    if(selected) {
      this.basketSelection[id] = {};
    }
    else {
      delete this.basketSelection[id];
    }
  }

  removeItemFromBasket(id) {
    var index = null;
    this.basket.forEach(function(item, idx) {
      if(item.uid == id) {
        index = idx;
      }
    });
    this.basket.splice(index, 1);
    xdLocalStorage.setItem('panier_erecolnat', JSON.stringify(this.basket));
  }

  isInBasketSelection(id) {
    return !(this.basketSelection[id] == undefined);
  }

  getBasket() {
    return JSON.parse(JSON.stringify(this.basket));
  }

  getBasketSelection() {
    return Object.keys(this.basketSelection);
  }

  getBasketItem(id) {
    for(var i = 0; i < this.basket.length; ++i) {
      if(this.basket[i].id == id) {
        return JSON.parse(JSON.stringify(this.basket[i]));
      }
    }
  }

  setSelected(setIdx, itemId) {
    // console.log('setSelected(' + setIdx + ',' + itemId + ')');
    if(setIdx == -1) {
      this.studyContainer.selectedId = itemId;
    }
    else {
      this.displayedSets[setIdx].selectedId = itemId;
    }
  }

  getManagerVisibility() {
    return this.isVisible;
  }

  getSelected() {
    return JSON.parse(JSON.stringify(this.selectedNode));
  }

  loadStudies() {
    request.get(conf.actions.studyServiceActions.listUserStudies)
      .set('Accept', 'application/json')
      .withCredentials()
      .end((err, res)=> {
        if(err) {
          console.error(err);
          this.studyContainer.error = true;
          //alert('Impossible de charger vos études');
        }
        else {
          var studies = JSON.parse(res.text);
          //console.log(res.text);
          this.studyContainer.error = false;
          this.studyContainer.studies = _.sortBy(studies, function(s) {return s.name});
          this.emit(ManagerEvents.UPDATE_MANAGER_DISPLAY);
        }
      });
  }

  reloadDisplayedSets() {
    //var setsIds = Object.keys(this.displayedSets);
    for(var i = 0; i < this.displayedSets.length; ++i) {
      var id = this.displayedSets[i].uid;
      this.reloadSet(id, i);
    }
  }

  reloadSet(id, index) {
    request.get(conf.actions.setServiceActions.getSet)
      .query({id: id})
      .withCredentials()
      .end((err, res) => {
        if (err) {
          console.error(err);
          delete this.displayedSets[index];
        }
        else {
          var newSet = JSON.parse(res.text);
          newSet.hash = UUID.v4();

          if (this.displayedSets[index]) {
            newSet.selectedId = this.displayedSets[index].selectedId;
          }
          this.displayedSets[index] = newSet;
        }
        this.emit(ManagerEvents.UPDATE_MANAGER_DISPLAY);
      });
  }

  requestGraphAround(id, type, setIdx, replacementCallback = undefined, workbenchPostProcessCallback = undefined, splice = false) {
    if(type == 'item') {
      //alert("L'élément sélectionné n'est pas un bureau de travail");
      return;
    }
    if(setIdx == null) {
      setIdx = this.displayedSets.length;
    }
    var previousSet = null;
    if(this.displayedSets[setIdx]) {
      previousSet = JSON.parse(JSON.stringify(this.displayedSets[setIdx]));
    }

    if(splice) {
      this.displayedSets.splice(setIdx);
    }

    this.displayedSets[setIdx] = {
      uid: id,
      loading: true
    };
    this.emit(ManagerEvents.UPDATE_MANAGER_DISPLAY);

    request
      .get(conf.actions.setServiceActions.getSet)
      .query({id: id})
      .set('Accept', 'application/json')
      .withCredentials()
      .end((err, res)=> {
        if(err) {
          console.error("Error occurred when retrieving workbench. Server returned: " + err);
          this.displayedSets.splice(setIdx);
          this.emit(ManagerEvents.UPDATE_MANAGER_DISPLAY);
        }
        else {
          //console.log("Received response " + res.text);
          //console.log("Previous set " + JSON.stringify(previousSet));
          var nSet = JSON.parse(res.text);
          nSet.hash = UUID.v4();
          if(replacementCallback) {
            //console.log('running callback');
            replacementCallback(nSet);
          }
          else {
            if(workbenchPostProcessCallback) {
              workbenchPostProcessCallback(nSet, previousSet);
            }


            this.displayedSets[setIdx] = nSet;

          }
          //console.log('emit screen update event');
          this.emit(ManagerEvents.UPDATE_MANAGER_DISPLAY);
        }
      });
  }

  addBasketItemsToSet(specimens, targetSetId, keepInBasket) {

    var specimenImportSuccess = function(response) {
      ManagerActions.reloadDisplayedSets();
      ManagerActions.changeBasketSelectionState(null, false);
      var items = this.getBasketSelection();
      if(!keepInBasket) {
        for (var j = 0; j < items.length; ++j) {
          this.removeItemFromBasket(items[j]);
        }
      }
      window.setTimeout(ViewActions.changeLoaderState.bind(null, null), 10);
      this.emit(ManagerEvents.BASKET_UPDATE);
    }

    var specimenImportFailure = function(error) {
      alert("Problème lors de l'import. Veuillez réessayer plus tard.");
    }

    REST.importRecolnatSpecimensIntoSet(specimens, targetSetId, specimenImportSuccess.bind(this), specimenImportFailure);
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

  addBasketUpdateListener(callback) {
    this.on(ManagerEvents.BASKET_UPDATE, callback);
  }

  removeBasketUpdateListener(callback) {
    this.removeListener(ManagerEvents.BASKET_UPDATE, callback);
  }
}

export default ManagerStore;
