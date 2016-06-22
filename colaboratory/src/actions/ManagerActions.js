'use strict';

import AppDispatcher from '../dispatcher/AppDispatcher';
import ManagerConstants from '../constants/ManagerConstants';

export default {
  toggleSetManagerVisibility: (visible) => {
    AppDispatcher.dispatch({
      actionType: ManagerConstants.ActionTypes.TOGGLE_SET_MANAGER_VISIBILITY,
      visible: visible
    });
  },

  loadStudiesAndSets: () => {
    AppDispatcher.dispatch({
      actionType: ManagerConstants.ActionTypes.RELOAD
    });
  },

  select: (id, type = null, name = null, parentId = null, linkToParentId = null) => {
    AppDispatcher.dispatch({
      actionType: ManagerConstants.ActionTypes.SET_SELECTED_NODE,
        id: id,
        type: type,
        name: name,
        linkToParent: linkToParentId,
        parent: parentId
    });
  },

  selectEntityInSet: (setIdx, entityIdx) => {
    AppDispatcher.dispatch({
      actionType: ManagerConstants.ActionTypes.SET_ACTIVE_ENTITY_IN_SET,
      setIndex: setIdx,
      entityIndex: entityIdx
    });
  },

  selectEntityInSetById: (parentSetId, entityId) => {
    AppDispatcher.dispatch({
      actionType: ManagerConstants.ActionTypes.SET_ACTIVE_ENTITY_IN_SET,
      parentSetId: parentSetId,
      entityId: entityId
    })
  },

  reloadDisplayedSets: () => {
    AppDispatcher.dispatch({
      actionType: ManagerConstants.ActionTypes.RELOAD_DISPLAYED_SETS
    });
  },

  changeBasketSelectionState: (id, state) => {
    AppDispatcher.dispatch({
      actionType: ManagerConstants.ActionTypes.BASKET_CHANGE_SELECTION,
      id: id,
      selected: state
    });
  },

  setBasket: (basket) => {
    AppDispatcher.dispatch({
      actionType: ManagerConstants.ActionTypes.SET_BASKET,
      basket: basket
    });
  },

  removeItemFromBasket: (id) => {
    AppDispatcher.dispatch({
      actionType: ManagerConstants.ActionTypes.BASKET_REMOVE_ITEM,
      item: id
    });
  }
};
