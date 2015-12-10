/**
 * Created by dmitri on 05/10/15.
 */
'use strict';
import AppDispatcher from '../dispatcher/AppDispatcher';
import MinimapConstants from '../constants/MinimapConstants';

export default {
  initMinimap: (imgUrl, imgWidth, imgHeight, xZero, yZero) => {
    AppDispatcher.dispatch({
      actionType: MinimapConstants.ActionTypes.INIT_MINIMAP,
      url: imgUrl,
      imgWidth: imgWidth,
      imgHeight: imgHeight,
      xZero: xZero,
      yZero: yZero
    });
  },

  unsetMinimap: () => {
    AppDispatcher.dispatch({
      actionType: MinimapConstants.ActionTypes.UNSET_MINIMAP
    });
  }
}