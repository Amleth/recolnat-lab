/**
 * Actions for the minimap component.
 *
 * Created by dmitri on 05/10/15.
 */
'use strict';
import AppDispatcher from '../dispatcher/AppDispatcher';
import MinimapConstants from '../constants/MinimapConstants';

export default {
  /**
   * Initializes the minimap with given parameters
   * @param imgUrl String url of the image to display in minimap
   * @param imgWidth Integer natural width of the image as displayed in the View
   * @param imgHeight Integer natural height of the image as displayed in the View
   * @param xZero Integer x-coordinate of the image in the View
   * @param yZero Integer y-coordinate of the image in the View
   */
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

  /**
   * Clears the current minimap image
   */
  unsetMinimap: () => {
    AppDispatcher.dispatch({
      actionType: MinimapConstants.ActionTypes.UNSET_MINIMAP
    });
  }
}