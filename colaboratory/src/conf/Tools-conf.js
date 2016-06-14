/**
 * Created by Dmitri Voitsekhovitch on 20/08/15.
 */
"use strict";

var ToolConfiguration = {
  lineMeasure: {
    id: "measure",
    tooltip: "Cliquez sur l'image pour commencer la mesure"
  },
  newRegionOfInterest: {
    id: "newRoI",
    tooltip: "Cliquez sur l'image pour créer un nouveau point. Cliquez sur le premier point pour fermer le polygone."
  },
  newPointOfInterest: {
    id: "newPoI",
    tooltip: "Cliquez sur l'image pour créer un point."
  },
  newPath: {
    id: "createPath",
    tooltip: "Cliquez sur l'image pour créer un nouveau point."
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
  nothing: {
    id: "null",
    tooltip: ""
  }
};

export default ToolConfiguration;
