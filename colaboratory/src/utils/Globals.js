/**
 * Created by dmitri on 18/12/15.
 */
'use strict'

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
}

export default GlobalFunctions;