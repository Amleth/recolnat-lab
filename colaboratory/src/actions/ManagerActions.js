'use strict';

import AppDispatcher from '../dispatcher/AppDispatcher';
import ManagerConstants from '../constants/ManagerConstants';

export default {
  toggleWorkbenchManagerVisibility: (visible) => {
    AppDispatcher.dispatch({
      actionType: ManagerConstants.ActionTypes.TOGGLE_WORKBENCH_MANAGER_VISIBILITY,
      visible: visible
    });
  },

  setSelectedWorkbenchGraphNode: (id, type, name, parentId, linkToParentId) => {
    AppDispatcher.dispatch({
      actionType: ManagerConstants.ActionTypes.SET_SELECTED_NODE,
      selection: {
        id: id,
        type: type,
        name: name,
        linkToParent: linkToParentId,
        parent: parentId
      }
    });
  },

  setActiveItemInWorkbench: (wbIdx, itemIdx) => {
    AppDispatcher.dispatch({
      actionType: ManagerConstants.ActionTypes.SET_ACTIVE_IN_WORKBENCH,
      workbenchIndex: wbIdx,
      itemIndex: itemIdx
    });
  },

  reloadDisplayedWorkbenches: () => {
    AppDispatcher.dispatch({
      actionType: ManagerConstants.ActionTypes.RELOAD_DISPLAYED_WORKBENCHES
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
