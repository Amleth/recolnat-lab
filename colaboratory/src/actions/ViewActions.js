/**
 * Actions on the view (most only produce results when lab bench is active)
 */
'use strict';

import AppDispatcher from '../dispatcher/AppDispatcher';
import ViewConstants from '../constants/ViewConstants';

export default {
  /**
   * Places an entity in a view at the given coordinates. It is expected the entity is not in the view when this action is called.
   * @param viewId String UID of the View
   * @param entityId String UID of the entity to be placed
   * @param x Integer x-coordinate where the entity should be placed (in D3 coordinate space)
   * @param y Integer y-coordinate where the entity should be placed (in D3 coordinate space)
   */
  placeEntity: (viewId, entityId, x, y) => {
    AppDispatcher.dispatch({
      actionType: ViewConstants.ActionTypes.Server.VIEW_PLACE_ENTITY,
      viewId: viewId,
      entityId: entityId,
      x: x,
      y: y
    });
  },

  /**
   * Move the entity designated by {viewId, entityId, linkId} to the given coordinates (in D3 coordinate space). The entity must be already in the view to call this.
   * @param viewId String UID of the view
   * @param entityId String UID of the entity
   * @param linkId String UID of the link between view and entity. This is important in the case where the entity is shown multiple times in the view.
   * @param x Integer x-coordinate to move to
   * @param y Integer y-coordinate to move to
   */
  moveEntity: (viewId, entityId, linkId, x, y) => {
    AppDispatcher.dispatch({
      actionType: ViewConstants.ActionTypes.Server.VIEW_MOVE_ENTITY,
      viewId: viewId,
      entityId: entityId,
      linkId: linkId,
      x: x,
      y: y
    });
  },

  /**
   * Sets the id of the active set in LabBenchStore
   * @param setId String UID of the Set
   */
  setActiveSet: (setId) => {
    AppDispatcher.dispatch({
      actionType: ViewConstants.ActionTypes.Server.VIEW_SET_DISPLAYED_SET,
      id: setId
    });
  },

  /**
   * Sets the id of the active view in LabBenchStore. Not used yet as only one View per Set
   * @param viewId String UID of the View
   */
  setActiveView: (viewId) => {
    AppDispatcher.dispatch({
      actionType: ViewConstants.ActionTypes.Local.SET_ACTIVE_VIEW,
      id: viewId
    });
  },

  /**
   * Changes the selected entity in the displayed lab bench. This is used by tools and palettes.
   * @param id String UID of the entity to be selected
   * @param data Object data of the entity (usually the D3 datum)
   */
  changeSelection: (id, data) => {
    AppDispatcher.dispatch({
      actionType: ViewConstants.ActionTypes.Local.VIEW_SET_SELECTION,
      selection: {id: id, data: data}
    });
  },

  /**
   * Changes the view to fit all entities in it
   */
  fitView: () => {
    AppDispatcher.dispatch({
      actionType: ViewConstants.ActionTypes.Local.VIEW_FIT_ALL
    });
  },

  /**
   * Changes the viewport data.
   * @param x Integer left of the viewport (D3 coordinates)
   * @param y Integer top of the viewport (D3 coordinates)
   * @param width Integer width of the viewport (in browser window pixels)
   * @param height Integer height of the viewport (in browser window pixels)
   * @param scale Integer current display scale transformation factor (D3 transform)
   * @param animate Boolean optional, specifies if the transition should be progressive (true) or instant (false, default)
   */
  updateViewport: (x, y, width, height, scale, animate = false) => {
    //console.log('updateViewport(' + x + ',' + y + ',' + width + ',' + height + ',' + scale + ')');
    AppDispatcher.dispatch({
      actionType: ViewConstants.ActionTypes.Local.UPDATE_VIEWPORT,
      x: x,
      y: y,
      height: height,
      width: width,
      scale: scale,
      animate: animate
    });
  },

  /**
   * Change viewport location in browser window
   * @param top Integer top of the viewport (browser window coordinates)
   * @param left Integer left of the viewport (browser window coordinates)
   */
  updateViewportLocation: (top, left) => {
    AppDispatcher.dispatch({
      actionType: ViewConstants.ActionTypes.Local.UPDATE_VIEWPORT_LOCATION,
      top: top,
      left: left
    });
  },

  /**
   * Change various properties of the view, such as the size of displayed objects (not used)
   * @param properties
   */
  updateViewProperties: (properties) => {
    AppDispatcher.dispatch({
      actionType: ViewConstants.ActionTypes.Local.UPDATE_VIEW_PROPERTIES,
      properties: properties
    });
  },

  /**
   * Change display filters (turn on or off display of spatial anchors)
   * @param filters Object specifies which values to change, values not provided in this object are not changed. See ViewStore.displayedTypes for available filters
   */
  updateDisplayFilters: (filters) => {
    AppDispatcher.dispatch({
      actionType: ViewConstants.ActionTypes.Local.UPDATE_VIEW_FILTERS,
      filters: filters
    });
  },

  /**
   * Changes the text displayed in the lab bench loader. If null, the loader is not displayed
   * @param text Text to use. May contain HTML
   */
  changeLoaderState: (text) => {
    AppDispatcher.dispatch({
      actionType: ViewConstants.ActionTypes.Local.LOADER_CHANGE_STATE,
      text: text
    });
  },

  /**
   * Request for an image to be loaded in the background.
   * @param source String url of the image to load
   * @param onLoadCallback Function (optional) callback to be called when image is loaded. Callback is provided the Image element when loaded.
   */
  loadImage: (source, onLoadCallback = function() {}) => {
    AppDispatcher.dispatch({
      actionType: ViewConstants.ActionTypes.Local.SCHEDULE_IMAGE_LOAD,
      source: source,
      callback: onLoadCallback
    });
  }
}
