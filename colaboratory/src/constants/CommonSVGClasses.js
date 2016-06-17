'use strict';

export default {
  // Class for container which contains everything
  ROOT_CLASS: 'workbenchRootSvg',

  /**
   *Class for all containers which are supposed to contain a single image. Such a group contains three children:
   * - UNDER_CHILD_CLASS with everything that should be displayed under (in z-stack terms) the image such as the border
   * - IMAGE CLASS the image itself,
   * - OVER_CHILD_CLASS with everything that should be above the image (again, above in the z-stack) such as annotations
   */
  CHILD_GROUP_CLASS: 'childGroup',
  // Stuff that should appear under the child goes in this group
  UNDER_CHILD_CLASS: 'underChild',
  // The image element itself goes here
  IMAGE_CLASS: 'image',
  // Stuff that should be drawn over the child goes here
  OVER_CHILD_CLASS: 'overChild',
  // Class for the border (a rect)
  BORDER_CLASS: 'border',
  // Class of the bar appearing above an image
  TOP_BAR_CLASS: 'topBar',
  // The textPath along which the name is drawn (for overflow reasons)
  NAME_PATH_CLASS: 'namePath',
  // The actual <text> element containing the name for the image
  NAME_CLASS: 'nameText',
  // Class of the bar appearing above an image
  BOTTOM_BAR_CLASS: 'bottomBar',
  // <rect> which when dragged resizes an image
  RESIZE_CLASS: 'imageGroupResize',
  // <rect> which, when dragged, moves an image
  MOVE_CLASS: 'imageGroupMove',

  OBJECTS_CONTAINER_CLASS: 'objectsContainer',

  ANNOTATIONS_CONTAINER_CLASS: 'annotationsContainer',

  ACTIVE_TOOL_DISPLAY_CLASS: 'activeToolDisplay',
  POI_CONTAINER_CLASS: "pointOfInterestContainer",
  POI_CLASS: "pointOfInterest",

  PATH_CONTAINER_CLASS: 'pathContainer',
  PATH_CLASS: 'path',

  ROI_CONTAINER_CLASS: 'regionOfInterestContainer',
  ROI_CLASS: 'regionOfInterest',

  // TODO check the following stuff to see if it useful

  IMAGE_CONTAINER_CLASS: 'imageContainer'


};