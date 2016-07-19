/**
 * Created by Dmitri Voitsekhovitch on 20/08/15.
 */
"use strict";

import React from 'react';

var ToolConfiguration = {
  lineMeasure: {
    id: "measure",
    tooltip: "Cliquez sur l'image pour commencer une nouvelle mesure"
  },
  newRegionOfInterest: {
    id: "newRoI",
    tooltip: "Cliquez sur l'image pour placer le premier point du polygone."
  },
  newPointOfInterest: {
    id: "newPoI",
    tooltip: "Cliquez sur l'image pour créer un point."
  },
  newPath: {
    id: "createPath",
    tooltip: "Cliquez sur l'image pour placer le premier point du tracé."
  },
  annotation: {
    id: "createAnnotation",
    tooltip: "Cliquez sur un élément de l'image pour y ajouter des annotations."
  },
  exportFragments: {
    id: "exportFragments",
    tooltip: "Cliquez sur une zone pour l'ajouter à l'export."
  },
  moveObject: {
    id: 'moveObject',
    tooltip: 'Faites glisser une image pour la déplacer.'
  },
  moveView: {
    id: 'moveView',
    tooltip: ''
  },
  selectObject: {
    id: 'selectObject',
    tooltip: 'Cliquez sur une image pour la sélectionner'
  },
  newAngle: {
    id: 'createNewAngleMeasure',
    tooltip: <p>Étape 1/4<br />Cliquez sur une image pour placer le sommet de l'angle à mesurer.</p>
  },
  nothing: {
    id: "null",
    tooltip: ""
  }
};

export default ToolConfiguration;
