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
    this.workbenches = [];
    this.base = {
      root: {
        id: 'root',
        name: 'Chargement des dossiers...',
        type: 'bag'
      },
      favorites: {
        id: 'favorites',
        name: 'Chargement des favoris...',
        type: 'bag'
      },
      recent: {
        id: 'recent',
        name: 'Chargement des études récentes...',
        type: 'bag'
      },
      activeIdx: null
    };

    this.basket = [];
    this.basketSelection = {};

    AppDispatcher.register((action) => {
      switch(action.actionType) {
        case ManagerConstants.ActionTypes.TOGGLE_WORKBENCH_MANAGER_VISIBILITY:
          this.isVisible = action.visible;
          this.emit(ManagerEvents.TOGGLE_WORKBENCH_MANAGER_VISIBILITY);
          break;
        case ManagerConstants.ActionTypes.SET_SELECTED_NODE:
          if(action.selection) {
            console.log(JSON.stringify(action.selection));
            this.selectedNode = {
              id: action.selection.id,
              name: action.selection.name,
              type: action.selection.type,
              parent: action.selection.parent,
              linkToParent: action.selection.linkToParent
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
        case ManagerConstants.ActionTypes.RELOAD_DISPLAYED_WORKBENCHES:
          this.reloadWorkbenches();
          break;
        case ManagerConstants.ActionTypes.BASKET_CHANGE_SELECTION:
          this.updateBasketSelection(action.id, action.selected);
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
        case ManagerConstants.ActionTypes.SET_ACTIVE_IN_WORKBENCH:
          this.setActive(action.workbenchIndex, action.itemIndex);
          this.emit(ManagerEvents.BASKET_UPDATE);
          break;
        default:
          break;
      }
    });
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
      if(item.id == id) {
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
      if(this.basket[i].id == id) {
        return this.basket[i];
      }
    }
  }

  setActive(wbIdx, itemIdx) {
    if(wbIdx == -1) {
      this.base.activeIdx = itemIdx;
    }
    else {
      this.workbenches[wbIdx].activeIdx = itemIdx;
    }
  }

  getManagerVisibility() {
    return this.isVisible;
  }

  getSelected() {
    return this.selectedNode;
  }

  getBaseData() {
    var children = [];
    children.push(this.base.root);
    children.push(this.base.favorites);
    children.push(this.base.recent);
    return ManagerStore.buildWorkbench('zero', 'Etudes utilisateur', children, null, this.base.activeIdx);
  }

  getWorkbenches() {
    return this.workbenches;
  }

  getWorkbench(id) {
    for(var i = 0; i < this.workbenches.length; ++i) {
      var workbench = this.workbenches[i];
      console.log('wb=' + JSON.stringify(workbench));
      console.log('id=' + id);
      if(workbench.id == id) {
        return workbench;
      }
      for(var j = 0; j < workbench.children.length; ++j) {
        var child = workbench.children[j];
        if(child.id == id) {
          return child;
        }
      }
    }
    return null;
  }

  static buildWorkbench(id, name, children, parents, active = -1) {
    return {
      id: id,
      name: name,
      children: children,
      parents: parents,
      activeIdx: active
    };
  }

  reloadWorkbenches() {
    var rememberActiveItemInWorkbench = function(wb, oldWb) {
      wb.activeIdx = oldWb.activeIdx;
    };

    var self = this;
    this.workbenches.forEach(function(workbench, index) {
      this.requestGraphAround(workbench.id, 'bag', index, undefined, rememberActiveItemInWorkbench.bind(self));
    }, this);
  }

  loadRootWorkbench() {
    var updateRootCallback = function(data) {
      this.base.root.name = data.current.name;
      this.base.root.id = data.current.id;
      this.base.root.children = _.sortBy(data.children, 'name');
    };

    this.requestGraphAround('root', 'bag', -1, updateRootCallback.bind(this));
  }

  requestGraphAround(id, type, wbIdx, replacementCallback = undefined, workbenchPostProcessCallback = undefined, splice = false) {
    if(type == 'item') {
      //alert("L'élément sélectionné n'est pas un bureau de travail");
      return;
    }
    request
      .get(conf.urls.virtualWorkbenchService)
      .query({id: id})
      .set('Accept', 'application/json')
      .withCredentials()
      .end((err, res)=> {
        if(err) {
          console.error("Error occurred when retrieving workbench. Server returned: " + err);
        }
        else {
          console.log("Received response " + res.text);
          var response = JSON.parse(res.text);
          if(replacementCallback) {
            console.log('running callback');
            replacementCallback(response);
          }
          else {
            var workbench = ManagerStore.buildWorkbench(response.current.id,
              response.current.name,
              _.sortBy(response.children, 'name'),
              _.sortBy(response.parents, 'name'));

            if(workbenchPostProcessCallback) {
              workbenchPostProcessCallback(workbench, this.workbenches[wbIdx]);
            }

            this.workbenches[wbIdx] = workbench;
            if(splice) {
              this.workbenches.splice(wbIdx+1);
            }
          }
          console.log('emit screen update event');
          this.emit(ManagerEvents.UPDATE_MANAGER_DISPLAY);
        }
      });
  }

  addManagerVisibilityListener(callback) {
    this.on(ManagerEvents.TOGGLE_WORKBENCH_MANAGER_VISIBILITY, callback);
  }

  removeManagerVisibilityListener(callback) {
    this.removeListener(ManagerEvents.TOGGLE_WORKBENCH_MANAGER_VISIBILITY, callback);
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