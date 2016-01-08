/**
 * Created by dmitri on 04/01/16.
 */
'use strict';

import AppDispatcher from '../dispatcher/AppDispatcher';
import MenuConstants from '../constants/MenuConstants';

export default {
  displayContextMenu: (x, y, elements) => {
    AppDispatcher.dispatch({
      actionType: MenuConstants.ActionTypes.EDITOR_CONTEXT_MENU,
      x: x,
      y: y,
      items: elements
    });
  }
};