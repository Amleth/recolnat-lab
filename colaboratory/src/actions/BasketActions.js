/**
 * Created by dmitri on 22/06/16.
 *
 * Constants for Explore basket actions.
 */
'use strict';

import AppDispatcher from '../dispatcher/AppDispatcher';
import BasketConstants from '../constants/BasketConstants';

export default {
  reloadBasket: () => {
    AppDispatcher.dispatch({
      actionType: BasketConstants.ActionTypes.RELOAD_BASKET
    });
  },

  changeBasketSelectionState: (id, state) => {
    AppDispatcher.dispatch({
      actionType: BasketConstants.ActionTypes.BASKET_CHANGE_SELECTION,
      id: id,
      selected: state
    });
  },

  setBasket: (basket) => {
    AppDispatcher.dispatch({
      actionType: BasketConstants.ActionTypes.SET_BASKET,
      basket: basket
    });
  },

  removeItemFromBasket: (id) => {
    AppDispatcher.dispatch({
      actionType: BasketConstants.ActionTypes.BASKET_REMOVE_ITEM,
      item: id
    });
  }
};
