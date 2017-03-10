/**
 * Actions used in the SetManager component.
 */
'use strict';

import AppDispatcher from '../dispatcher/AppDispatcher';
import ManagerConstants from '../constants/ManagerConstants';

export default {
  /**
   * Set the (global) selected element in set manager
   * @param id UID of the entity
   * @param type Type of the entity, same as the type in database
   * @param name Displayed name of the entity
   * @param parentId UID of the parent entity
   * @param linkToParentId UID of the edge linking parent to child
   */
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

  /**
   * Set the (local to a specific Set) selected element in set manager by indexes
   * @param setIdx Index of the Set in the ManagerStore list of displayed Sets.
   * @param entityIdx Index of the entity to select in the Set.
   */
  selectEntityInSet: (setIdx, entityIdx) => {
    AppDispatcher.dispatch({
      actionType: ManagerConstants.ActionTypes.SET_ACTIVE_ENTITY_IN_SET,
      setIndex: setIdx,
      entityIndex: entityIdx
    });
  },

  /**
   * Same as selectEntityInSet, using UIDs instead of indexes. Note, do not use this if you think the same entity is used multiple times in a Set.
   * @param parentSetId
   * @param entityId
   */
  selectEntityInSetById: (parentSetId, entityId) => {
    AppDispatcher.dispatch({
      actionType: ManagerConstants.ActionTypes.SET_ACTIVE_ENTITY_IN_SET,
      parentSetId: parentSetId,
      entityId: entityId
    })
  },

  /**
   * Select or unselect an item in the Explore basket.
   * @param id UID of the element in the basket
   * @param state true = element is selected; false = element is not selected
   */
  changeBasketSelectionState: (id, state) => {
    AppDispatcher.dispatch({
      actionType: ManagerConstants.ActionTypes.BASKET_CHANGE_SELECTION,
      id: id,
      selected: state
    });
  },

  /**
   * Removes the item with the given ID from the Explore basket. Note, this element is removed both from the store and the global basket component.
   * @param id UID of the basket item to remove
   */
  removeItemFromBasket: (id) => {
    AppDispatcher.dispatch({
      actionType: ManagerConstants.ActionTypes.BASKET_REMOVE_ITEM,
      item: id
    });
  }
};
