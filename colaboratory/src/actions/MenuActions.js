/**
 * Created by dmitri on 04/01/16.
 *
 * Actions for the context menu (radial)
 */
'use strict';

import AppDispatcher from '../dispatcher/AppDispatcher';
import MenuConstants from '../constants/MenuConstants';

export default {
  /**
   * Indicates the menu should be displayed at location x,y using context for the  entities provided
   * @param x
   * @param y
   * @param elements Object containing the following keys : 'images', 'aois', 'rois', 'tois', 'pois'. Each key corresponds to an array of Objects where each object contains the properties of the entities.
   */
  displayContextMenu: (x, y, elements) => {
    AppDispatcher.dispatch({
      actionType: MenuConstants.ActionTypes.EDITOR_CONTEXT_MENU,
      x: x,
      y: y,
      items: elements
    });
  }
};