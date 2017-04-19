/**
 * List of class names to be used for SVG components
 */
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

  // Stuff in the UNDER_CHILD_CLASS
  // Class for the border (a rect)
  BORDER_CLASS: 'border',
  // The textPath along which the name is drawn (for overflow reasons)
  NAME_PATH_CLASS: 'namePath',
  // The actual <text> element containing the name for the image
  NAME_CLASS: 'nameText',
  // <rect> which when dragged resizes an image
  RESIZE_CLASS: 'imageGroupResize',
  // <rect> which, when dragged, moves an image
  MOVE_CLASS: 'imageGroupMove',
  // End UNDER_CHILD_CLASS

  OBJECTS_CONTAINER_CLASS: 'objectsContainer',

  ACTIVE_TOOL_DISPLAY_CLASS: 'activeToolDisplay',

  // Stuff in OVER_CHILD_CLASS
  ANNOTATIONS_CONTAINER_CLASS: 'annotationsContainer',
  POI_CLASS: "pointOfInterest",
  PATH_CLASS: 'path',
  ROI_CLASS: 'regionOfInterest',
  AOI_CLASS: 'angleOfInterest',
};