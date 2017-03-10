/**
 * Global list of tool ids. Might be more appropriate to move it into ToolConstants file instead.
 *
 * Created by Dmitri Voitsekhovitch on 20/08/15.
 */
"use strict";

import React from 'react';

let ToolConfiguration = {
  lineMeasure: {
    id: "measure"
  },
  newRegionOfInterest: {
    id: "newRoI"
  },
  newPointOfInterest: {
    id: "newPoI"
  },
  newPath: {
    id: "createPath"
  },
  newMeasureStandard: {
    id: "newMeasureStandard"
  },
  annotation: {
    id: "createAnnotation"
  },
  exportFragments: {
    id: "exportFragments"
  },
  moveObject: {
    id: 'moveObject'
  },
  moveView: {
    id: 'moveView'
  },
  selectObject: {
    id: 'selectObject'
  },
  newAngle: {
    id: 'createNewAngleMeasure'
  },
  nothing: {
    id: "null"
  }
};

export default ToolConfiguration;
