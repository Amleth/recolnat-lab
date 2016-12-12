/**
 * Created by dmitri on 22/06/16.
 */
'use strict';

import {EventEmitter} from 'events';
import UUID from 'node-uuid';

import AppDispatcher from '../dispatcher/AppDispatcher';

import BasketConstants from '../constants/BasketConstants';

import BasketEvents from './events/BasketEvents';

import ManagerActions from '../actions/ManagerActions';
import ViewActions from '../actions/ViewActions';

import Globals from '../utils/Globals';

import conf from '../conf/ApplicationConfiguration';

class BasketStore extends EventEmitter {
  constructor() {
    super();

    this.setMaxListeners(500);

    this.basket = [];
    this.basketSelection = {};
    this.basketReady = false;

    AppDispatcher.register((action) => {
      switch(action.actionType) {
        case BasketConstants.ActionTypes.RELOAD_BASKET:
          this.reloadBasket();
          break;
        case BasketConstants.ActionTypes.BASKET_CHANGE_SELECTION:
          if(action.id) {
            this.updateBasketSelection(action.id, action.selected);
          }
          else {
            for(var i = 0; i < this.basket.length; ++i) {
              this.updateBasketSelection(this.basket[i].id, action.selected);
            }
          }
          this.emit(BasketEvents.BASKET_UPDATE);
          break;
        case BasketConstants.ActionTypes.SET_BASKET:
          this.basket = action.basket;
          for(var i = 0; i < this.basket.length; ++i) {
            this.updateBasketSelection(this.basket[i].id, true);
          }
          this.emit(BasketEvents.BASKET_UPDATE);
          break;
        case BasketConstants.ActionTypes.BASKET_REMOVE_ITEM:
          this.updateBasketSelection(action.item, false);
          this.removeItemFromBasket(action.item);
          this.emit(BasketEvents.BASKET_UPDATE);
          break;
        default:
          break;
      }
    });

    var self = this;
    xdLocalStorage.init({
      iframeUrl:'https://wp5test.recolnat.org/basket',
      initCallback: function() {
        self.basketReady = true;
      }
    });
  }

  reloadBasket() {
    if(!this.basketReady) {
      window.setTimeout(this.reloadBasket.bind(this), 500);
      // alert('Le panier est indisponible, réessayez dans quelques secondes');
      return;
    }

    var self = this;

    xdLocalStorage.getItem('panier_erecolnat', function(data) {
      var basket;
      if (data.value == null) {
        basket = [];
      }
      else {
        basket = JSON.parse(data.value);
      }
      self.basket = basket;
        for(var i = 0; i < self.basket.length; ++i) {
          self.updateBasketSelection(self.basket[i].id, true);
        }
      self.emit(BasketEvents.BASKET_UPDATE);
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

  addBasketUpdateListener(callback) {
    this.on(BasketEvents.BASKET_UPDATE, callback);
  }

  removeBasketUpdateListener(callback) {
    this.removeListener(BasketEvents.BASKET_UPDATE, callback);
  }
}

export default BasketStore;
