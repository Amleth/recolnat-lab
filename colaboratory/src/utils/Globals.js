/**
 * Created by dmitri on 18/12/15.
 */
'use strict';

import uuid from 'node-uuid';

import ModeConstants from '../constants/ModeConstants';

import ModeActions from '../actions/ModeActions';
import ManagerActions from '../actions/ManagerActions';
import MetadataActions from '../actions/MetadataActions';
import ToolActions from '../actions/ToolActions';
import InspectorActions from '../actions/InspectorActions';

import conf from '../conf/ApplicationConfiguration';

class GlobalFunctions {

  /**
   * Finds first edge starting "roughly" (i.e. delta-dependent in pixels) at (x,y) and remove it from edges. Returns the removed edge.
   * @param x
   * @param y
   * @param edges list of edges, modified in place by removing the edge if found
   * @param delta value (in pixels) used to match suitability of the coordinates
   * @returns {{start: {x: *, y: *}, end: {x: *, y: *}}}
   */
  static getNextEdge(x, y, edges, delta) {
    if(x == null || y == null || edges.length == 1) {
      let edge = {start: {x: edges[0].start.x, y: edges[0].start.y}, end: {x: edges[0].end.x, y: edges[0].end.y}};
      edges.splice(0, 1);
      return edge;
    }
    for(let i = 0; i < edges.length; ++i) {
      let edge = {start: {x: edges[i].start.x, y: edges[i].start.y}, end: {x: edges[i].end.x, y: edges[i].end.y}};
      if(edge.start.x-delta < x && edge.start.x +delta > x
        && edge.start.y-delta < y && edge.start.y +delta > y) {
        edges.splice(i, 1);
        return edge;
      }
    }
  }

  /**
   * Matches a vertex at coordinates (x,y) +- delta.
   * Comparison must allow a +- 5 px interval for matching (can't expect the user to click on a precise pixel).
   * @param x
   * @param y
   * @param edges
   * @param delta
   * @returns {x,y} object corresponding to the matched vertex if found, this a new object, not a reference to the existing array
   */
  static matchVertex(x, y, edges, delta) {
    for(let i = 0; i < edges.length; ++i) {
      let edge = edges[i];
      if(edge.start.x-delta < x && edge.start.x +delta > x
        && edge.start.y-delta < y && edge.start.y +delta > y) {
        return {x: edge.start.x, y: edge.start.y};
      }
      if(edge.end.x-delta < x && edge.end.x +delta > x
        && edge.end.y-delta < y && edge.end.y +delta > y) {
        return {x: edge.end.x, y: edge.end.y};
      }
    }
    return null;
  }

  /**
   * Counts the number of edges starting or ending with the given coordinates (+- delta)
   * @param x
   * @param y
   * @param edges
   * @param delta
   * @returns {number}
   */
  static countEdges(x, y, edges, delta) {
    let count = 0;
    for(let i = 0; i < edges.length; ++i) {
      let edge = edges[i];
      if(edge.start.x-delta < x && edge.start.x +delta > x
        && edge.start.y-delta < y && edge.start.y +delta > y) {
        count++;
      }
      else if(edge.end.x-delta < x && edge.end.x +delta > x
        && edge.end.y-delta < y && edge.end.y +delta > y) {
        count++;
      }
    }
    return count;
  }

  /**
   * Moves all edges starting and ending with the given old coordinates (+- delta) to the new coordinates. Operations are done in place, modifying input array.
   * @param oldX
   * @param oldY
   * @param newX
   * @param newY
   * @param edges
   * @param delta
   */
  static updateEdgesPosition(oldX, oldY, newX, newY, edges, delta) {
    for(let i = 0; i < edges.length; ++i) {
      let edge = edges[i];
      if(edge.start.x-delta < oldX && edge.start.x +delta > oldX
        && edge.start.y-delta < oldY && edge.start.y +delta > oldY) {
        edge.start.x = newX;
        edge.start.y = newY;
      }
      if(edge.end.x-delta < oldX && edge.end.x +delta > oldX
        && edge.end.y-delta < oldY && edge.end.y +delta > oldY) {
        edge.end.x = newX;
        edge.end.y = newY;
      }
    }
  }

  /**
   * Returns number of mm per pixel
   * @param imageMetadata data of an Image
   * @returns {*}
   */
  static getEXIFScalingData(imageMetadata) {
    if(imageMetadata) {
      if(imageMetadata.exif) {
        if(imageMetadata.exif["X Resolution"]) {
          let xResolution = imageMetadata.exif["X Resolution"].split(" ");
          let dotsPerUnit = _.parseInt(xResolution[0]);
          let mmPerPixel = null;
          let unit = imageMetadata.exif["Resolution Units"];
          if(!unit) {
            console.error("EXIF has X Resolution but no Resolution Units");
            return mmPerPixel;
          }
          if(unit.toUpperCase() == "INCH" || unit.toUpperCase() == "INCHES") {
            mmPerPixel = 25.4/dotsPerUnit;
          }
          else if(unit.toUpperCase() == "CM") {
            mmPerPixel = 10/dotsPerUnit;
          }
          else if(unit.toUpperCase() == "MM") {
            mmPerPixel = 1/dotsPerUnit;
          }
          else {
            console.error("Unprocessed unit " + unit);
          }
          return mmPerPixel;
        }
      }
    }
    return null;
  }

  /**
   * These getters are mostly used for sorting by parameter in _ functions which require a callback.
   */
  static getName(entity) {
    return entity.name;
  }

  /**
   * Retrieves 'creationDate' or 'created' or 'date' in that order of precedence
   * @param entity
   * @returns {*}
   */
  static getCreationDate(entity) {
    if(!entity) {
      return 0;
    }
    if(entity.creationDate) {
      return entity.creationDate;
    }
    if(entity.created) {
      return entity.created;
    }
    if(entity.date) {
      return entity.date;
    }
  }

  // static setMode(mode) {
  //   window.setTimeout(
  //     ModeActions.changeMode.bind(null, mode), 10
  //   );
  //   window.setTimeout(
  //     ToolActions.setTool.bind(null, null), 10
  //   );
  //   switch(mode) {
  //     case ModeConstants.Modes.OBSERVATION:
  //       window.setTimeout(
  //         MetadataActions.updateLabBenchFrom, 10
  //       );
  //       break;
  //     case ModeConstants.Modes.ORGANISATION:
  //       window.setTimeout(
  //         MetadataActions.updateLabBenchFrom, 10
  //       );
  //       break;
  //     case ModeConstants.Modes.SET:
  //       window.setTimeout(
  //         ManagerActions.reloadDisplayedSets, 10
  //       );
  //       break;
  //     case ModeConstants.Modes.TABULAR:
  //       break;
  //     default:
  //       break;
  //   }
  // }

  static isCoordsInBoundingBox(coordinates, box) {
    return coordinates[0] >= box.left &&
      coordinates[0] <= box.right &&
      coordinates[1] >= box.top &&
      coordinates[1] <= box.bottom;
  }

  static preserveSetSelection(newSet, oldSet) {
    if(oldSet) {
      if(oldSet.uid == newSet.uid) {
        if (oldSet.selectedId) {
          newSet.selectedId = oldSet.selectedId;
        }
      }
    }
  }

  static isElementInViewport(boundingClientRect) {
    if(boundingClientRect.bottom <= 0 ||
      boundingClientRect.top >= window.innerHeight ||
      boundingClientRect.right <= 0 ||
      boundingClientRect.left >= window.innerWidth) {
      return false;
    }
    return true;
    // return boundingClientRect.top >= 0 &&
    // boundingClientRect.left >= 0 &&
    // boundingClientRect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    // boundingClientRect.right <= (window.innerWidth || document.documentElement.clientWidth);
  }

  static noActiveTool() {
    window.setTimeout(ToolActions.setTool.bind(null, null), 10);
  }

  static setSavedEntityInInspector(message) {
    if(message.clientProcessError) {
      console.error("Save failed.");
      // alert("L'enregistrement a échoué. Veuillez retenter plus tard.");
      return;
    }
    window.setTimeout(InspectorActions.setInspectorData.bind(null, [message.data.id]), 10);
  }

  /**
   * Checks pos integer to be within min & max bounds; returns either pos, min or max. Used to check a vertex is not dragged outside its parent image.
   * @param pos
   * @param max
   * @param min
   * @returns {number}
   */
  static getBoundedPosition(pos, max, min) {
    return Math.min(Math.max(pos, min), max);
  }

  /**
   * Workaround for filling the autocomplete list of a browser. Normally a page must be reloaded in order for the list to be filled. However this is not possible in a single-page application. This method uses an invisible iframe, copies a form into it and reloads the iframe.
   * @param formDOMNode
   * @param formSubmitCallback
   * @param e
   */
  static saveAutofill(formDOMNode, formSubmitCallback, e) {
    e.preventDefault();
    // e.stopPropagation();

    let cloneForm = formDOMNode.cloneNode(true);
    cloneForm.id = "form";
    // let frame = document.getElementById("collaboratoryBlankHiddenTarget").cloneNode(true);
    let frame = document.createElement('iframe');
    frame.src = "";
    frame.name = "temp_" + uuid.v4();
    frame.style = "display:none";

    document.body.appendChild(frame);
    frame.contentWindow.document.body.appendChild(cloneForm);

    let frameForm = frame.contentWindow.document.getElementById("form");
    frameForm.target = "";
    frameForm.action = "about:blank";
    frameForm.submit();
    window.setTimeout( () => document.body.removeChild(frame), 100);

    formDOMNode.onSubmit = formSubmitCallback;
  }

  /**
   * Generates a random color code (# + 6 hex)
   */
  static getRandomColor() {
    let alphabet = '0123456789ABCDEF';
    let color = '#';
    for(let i = 0; i < 6; ++i) {
      color += alphabet[Math.floor(Math.random()*10)];
    }
    return color;
  }
}

export default GlobalFunctions;
