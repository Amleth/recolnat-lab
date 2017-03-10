/**
 * Stores the state of the ReColNat basket and selected items.
 *
 * Created by dmitri on 22/06/16.
 */
'use strict';

import {EventEmitter} from 'events';

import AppDispatcher from '../dispatcher/AppDispatcher';

import BasketConstants from '../constants/BasketConstants';

import BasketEvents from './events/BasketEvents';

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
            for(let i = 0; i < this.basket.length; ++i) {
              this.updateBasketSelection(this.basket[i].id, action.selected);
            }
          }
          this.emit(BasketEvents.BASKET_UPDATE);
          break;
        case BasketConstants.ActionTypes.SET_BASKET:
          this.basket = action.basket;
          for(let i = 0; i < this.basket.length; ++i) {
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

    let self = this;
    xdLocalStorage.init({
      iframeUrl: conf.integration.recolnatBasketIframeUrl,
      initCallback: function() {
        self.basketReady = true;
      }
    });
  }

  /**
   * Reads basket content and stores it in the store. If the basket is not available, sleeps for 500ms and tries again.
   */
  reloadBasket() {
    if(!this.basketReady) {
      window.setTimeout(this.reloadBasket.bind(this), 500);
      // alert('Le panier est indisponible, réessayez dans quelques secondes');
      return;
    }

    let self = this;

    xdLocalStorage.getItem('panier_erecolnat', function(data) {
      let basket;
      if (data.value == null) {
        basket = [];
      }
      else {
        basket = JSON.parse(data.value);
      }
      self.basket = basket;
      for(let i = 0; i < self.basket.length; ++i) {
        self.updateBasketSelection(self.basket[i].id, true);
      }
      self.emit(BasketEvents.BASKET_UPDATE);
    });
  }

  /**
   * Sets the selection state of the given basket item. Selection is internal to the application and not stored in the shared basket.
   * @param id String id of the item
   * @param selected Boolean true=selected, false=not selected
   */
  updateBasketSelection(id, selected) {
    if(selected) {
      this.basketSelection[id] = {};
    }
    else {
      delete this.basketSelection[id];
    }
  }

  /**
   * Removes the item with the given id from the shared basket.
   * @param id String id of the item to remove
   */
  removeItemFromBasket(id) {
    let index = null;
    this.basket.forEach(function(item, idx) {
      if(item.uid == id) {
        index = idx;
      }
    });
    this.basket.splice(index, 1);
    xdLocalStorage.setItem('panier_erecolnat', JSON.stringify(this.basket));
  }

  /**
   * Checks whether the given item is selected
   * @param id String id of the item to check
   * @returns {boolean} true=selected, false=not selected
   */
  isInBasketSelection(id) {
    return !(this.basketSelection[id] == undefined);
  }

  /**
   * Returns a deep copy of the basket.
   */
  getBasket() {
    return JSON.parse(JSON.stringify(this.basket));
  }

  /**
   * Returns the list of items selected in the basket
   * @returns {Array} List of strings : ids of selected basket items
   */
  getBasketSelection() {
    return Object.keys(this.basketSelection);
  }

  /**
   * Returns the data in the basket about the provided id
   * @param id String id of the basket item
   */
  getBasketItem(id) {
    for(let i = 0; i < this.basket.length; ++i) {
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
