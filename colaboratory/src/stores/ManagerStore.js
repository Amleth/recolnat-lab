/**
 * Created by dmitri on 15/01/16.
 */
'use strict';

import {EventEmitter} from 'events';
import request from 'superagent';

import AppDispatcher from '../dispatcher/AppDispatcher';

import ManagerConstants from '../constants/ManagerConstants';

import ManagerEvents from './events/ManagerEvents';

import ManagerActions from '../actions/ManagerActions';

import conf from '../conf/ApplicationConfiguration';

class ManagerStore extends EventEmitter {
  constructor() {
    super();

    this.isVisible = true;
    this.selectedNode = {
      id: null,
      name: null,
      type: null,
      parent: null,
      linkToParent: null
    };
    this.sets = [];
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
          this.reloadWorkbenches();
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
        //case ManagerConstants.ActionTypes.SET_ACTIVE_ENTITY_IN_SET:
        //  var setIdx = null;
        //  var itemId = null;
        //  if(action.parentSetId) {
        //    // Find indices
        //    this.sets.forEach(function(s, idx) {
        //      if(s) {
        //        if (s.uid == action.parentSetId) {
        //          setIdx = idx;
        //        }
        //      }
        //    });
        //    itemId = action.entityId;
        //  }
        //  else if(action.setIndex != undefined) {
        //    setIdx = action.setIndex;
        //    if(setIdx == -1) {
        //      itemId = this.studyContainer.studies[action.entityIndex].core.uid;
        //    }
        //    else {
        //      itemId = this.sets[setIdx].children[action.entityIndex].uid;
        //    }
        //  }
        //  else {
        //    console.error('Unprocessable action content ' + JSON.stringify(action));
        //    break;
        //  }
        //  this.setActive(setIdx, itemId);
        //  this.emit(ManagerEvents.BASKET_UPDATE);
        //  break;
        case ManagerConstants.ActionTypes.ADD_BASKET_ITEMS_TO_SET:
          this.addBasketItemsToSet(action.items, action.workbench, action.keepInBasket);
          break;
        default:
          break;
      }
    });
  }

  getSets() {
    return this.sets;
  }

  getStudies() {
    return this.studyContainer;
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
    return this.basket;
  }

  getBasketSelection() {
    return Object.keys(this.basketSelection);
  }

  getBasketItem(id) {
    for(var i = 0; i < this.basket.length; ++i) {
      if(this.basket[i].uid == id) {
        return this.basket[i];
      }
    }
  }

  //setActive(wbIdx, itemId) {
  //  //console.log('setActive(' + wbIdx + ',' + itemId + ')');
  //  if(wbIdx == -1) {
  //    this.base.activeId = itemId;
  //  }
  //  else {
  //    this.workbenches[wbIdx].activeId = itemId;
  //  }
  //}

  getManagerVisibility() {
    return this.isVisible;
  }

  getSelected() {
    return this.selectedNode;
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
    var setsIds = Object.keys(this.sets);
    for(var i = 0; i < setsIds.length; ++i) {
      var id = setsIds[i];
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
          delete this.sets[id];
        }
        else {
          var newSet = JSON.parse(res.text);

          if (this.sets[index]) {
            newSet.activeId = this.sets[index].activeId;
          }
          this.sets[index] = newSet;
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
      setIdx = this.sets.length;
    }
    var previousSet = null;
    if(this.sets[setIdx]) {
      previousSet = JSON.parse(JSON.stringify(this.sets[setIdx]));
    }

    this.sets[setIdx] = {
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
          this.sets.splice(setIdx);
          this.emit(ManagerEvents.UPDATE_MANAGER_DISPLAY);
        }
        else {
          //console.log("Received response " + res.text);
          var nSet = JSON.parse(res.text);
          if(replacementCallback) {
            //console.log('running callback');
            replacementCallback(nSet);
          }
          else {
            if(workbenchPostProcessCallback) {
              workbenchPostProcessCallback(nSet, previousSet);
            }

            this.sets[setIdx] = nSet;
            if(splice) {
              this.sets.splice(setIdx+1);
            }
          }
          //console.log('emit screen update event');
          this.emit(ManagerEvents.UPDATE_MANAGER_DISPLAY);
        }
      });
  }

  addBasketItemsToWorkbench(items, workbenchId, keepInBasket) {

    if(!workbenchId) {
      alert('Vous devez choisir une étude de destination');
      return;
    }

    for(var i = 0; i < items.length; ++i) {
      var itemId = items[i];
      var itemUuid = itemId.slice(0, 8) + '-'
        + itemId.slice(8, 12) + '-'
        + itemId.slice(12, 16) + '-'
        + itemId.slice(16, 20) + '-'
        + itemId.slice(20);

      var itemData = this.getBasketItem(itemId);
      //console.log('uuid=' + itemUuid);
      (function(uuid, workbench, id, data) {
        request.post(conf.actions.virtualWorkbenchServiceActions.import)
          .set('Content-Type', "application/json")
          .send({workbench: workbench})
          .send({recolnatSpecimenUUID: uuid})
          .send({url: data.image[0].url})
          .send({thumburl: data.image[0].thumburl})
          .send({catalogNumber: data.catalognumber})
          .send({name: data.scientificname})
          .withCredentials()
          .end((err, res) => {
            if (err) {
              alert('Import de ' + data.scientificname + ' a échoué. Les autres planches ne sont pas impactées');
              console.error(err);
            }
            else {
              //console.log(res);
              ManagerActions.reloadDisplayedSets();
              ManagerActions.changeBasketSelectionState(id, false);
              if (!keepInBasket) {
                ManagerActions.removeItemFromBasket(id);
              }
            }
          });
      })(itemUuid, workbenchId, itemId, itemData)
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

  addBasketUpdateListener(callback) {
    this.on(ManagerEvents.BASKET_UPDATE, callback);
  }

  removeBasketUpdateListener(callback) {
    this.removeListener(ManagerEvents.BASKET_UPDATE, callback);
  }
}

export default ManagerStore;