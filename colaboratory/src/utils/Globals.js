/**
 * Created by dmitri on 18/12/15.
 */
'use strict';

import request from 'superagent';

import ModeActions from '../actions/ModeActions';

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
      var edge = {start: {x: edges[0].start.x, y: edges[0].start.y}, end: {x: edges[0].end.x, y: edges[0].end.y}};
      edges.splice(0, 1);
      return edge;
    }
    for(var i = 0; i < edges.length; ++i) {
      var edge = {start: {x: edges[i].start.x, y: edges[i].start.y}, end: {x: edges[i].end.x, y: edges[i].end.y}};
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
    for(var i = 0; i < edges.length; ++i) {
      var edge = edges[i];
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
    var count = 0;
    for(var i = 0; i < edges.length; ++i) {
      var edge = edges[i];
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
    for(var i = 0; i < edges.length; ++i) {
      var edge = edges[i];
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
   * @param imageId
   * @param store
   * @returns {*}
   */
  static getEXIFScalingData(imageMetadata) {
    if(imageMetadata) {
      if(imageMetadata.exif) {
        if(imageMetadata.exif["X Resolution"]) {
          var xResolution = imageMetadata.exif["X Resolution"].split(" ");
          var dotsPerUnit = _.parseInt(xResolution[0]);
          var mmPerPixel = null;
          var unit = imageMetadata.exif["Resolution Units"];
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

  static getName(entity) {
    return entity.name;
  }

  static setMode(mode) {
    ModeActions.changeMode(mode);
  }

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

}

export default GlobalFunctions;
