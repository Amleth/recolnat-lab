/**
 * Collection of static methods to use as D3 event handlers.
 *
 * Created by dmitri on 27/04/16.
 */
'use strict';

import d3 from 'd3';

import MetadataActions from '../actions/MetadataActions';
import ViewActions from '../actions/ViewActions';

import Classes from '../constants/CommonSVGClasses';

import ServiceMethods from '../utils/ServiceMethods';

import conf from '../conf/ApplicationConfiguration';

class D3EventHandlers {

  /**
   * Resize an image or other content on the bench.
   * D3 behavior
   */
  static dragResize() {
    return d3.behavior.drag()
      .origin(d => d)
      .on('dragstart', D3EventHandlers.startImageResize)
      .on('drag', D3EventHandlers.resizeImageBorders)
      .on('dragend', D3EventHandlers.fixImageSize);
  }

  /**
   * Begins resizing the element denoted by data 'd'.
   * d must contain properties 'height', 'width' and 'link' (the latter is the UID of the link between a View and an Entity displayed in the View).
   * Creates an element in bench with id=RESIZE_WINDOW which is used as shadow to display the new size.
   */
  static startImageResize(d) {
    //console.log('resize start');
    d3.event.sourceEvent.preventDefault();
    d3.event.sourceEvent.stopPropagation();
    d.newHeight = d.height;
    d.newWidth = d.width;
    //console.log(JSON.stringify(d));
    d3.select('#OVER-' + d.link)
      .append('rect')
      .attr('id', 'RESIZE_WINDOW')
      .attr('x', 0)
      .attr('y', 0)
      .attr('height', d.newHeight)
      .attr('width', d.newWidth)
      .style('stroke-width', 1)
      .style('stroke', 'rgb(0,0,0)')
      .style('fill', 'rgb(10,20,180)')
      .style('fill-opacity', '0.4');
  }

  /**
   * Changes the size of an entity's shadow (RESIZE_WINDOW) while user is dragging.
   * Minimum height & width blocked to 100px, the shadow will not go below these values in order to avoid 'image reversal' bug.
   */
  static resizeImageBorders(d) {
    var oldHeight = d.newHeight;
    if(d.newHeight + d3.event.dy > 100) {
      d.newHeight = d.newHeight + d3.event.dy;
      d.newWidth = d.newWidth * d.newHeight / oldHeight;
    }

    d3.select('#RESIZE_WINDOW')
      .attr('height', d.newHeight)
      .attr('width', d.newWidth);
  }

  /**
   * Finish resize, remove shadow and set new width & height for entity (sends message to server).
   * Negative new height or width not allowed and results in alert (which cannot be easily localized, hence should never happen).
   */
  static fixImageSize(d) {
    var link = d.link;
    var view = d.view;
    var entity = d.entity;
    var height = d.newHeight* d.displayHeight/ d.height;
    var width = d.newWidth* d.displayHeight/ d.height;

    if(width <= 0 || height <= 0) {
      alert('La hauteur et la largeur doivent être positives');
      return;
    }

    ServiceMethods.resize(view, link, entity, width, height);

    d3.select('#RESIZE_WINDOW').remove();
    d.newHeight = null;
    d.newWidth = null;
  }

  /**
   * Defines the D3 behavior used to drag entities around the lab bench.
   */
  static dragMove() {
    return d3.behavior.drag()
      .origin(d => d)
      .on('dragstart', D3EventHandlers.startImageMove)
      .on('drag', D3EventHandlers.moveImageGhost)
      .on('dragend', D3EventHandlers.fixImagePosition);
  }

  /**
   * Begins the drag-move by creating a new ghost image of the entity being dragged. The entity is not moved until drag finishes.
   */
  static startImageMove(d) {
    if(d3.event.sourceEvent.which == 1) {
      d3.event.sourceEvent.preventDefault();
      d3.event.sourceEvent.stopPropagation();
      d3.select('#OVER-' + d.link)
        .append('svg:image')
        .attr('id', 'MOVE_OBJECT')
        .attr('x', 0)
        .attr('y', 0)
        .attr('height', d.height)
        .attr('width', d.width)
        .attr('xlink:href', d.thumbnail)
        .classed('dragging', true)
        .style('opacity', 0.3);

      d3.select('svg')
        .style('cursor', '-webkit-grabbing')
        .style('cursor', 'grabbing');
      d.tx = 0;
      d.ty = 0;
    }
  }

  /**
   * Moves the ghost image around while user is dragging it.
   */
  static moveImageGhost(d) {
      d.tx = d.tx + d3.event.dx;
      d.ty = d.ty + d3.event.dy;

      d3.select('#MOVE_OBJECT')
        .attr('x', d.tx)
        .attr('y', d.ty);
  }

  /**
   * Removes ghost image and sends new image position to server.
   */
  static fixImagePosition(d) {
    if(d3.event.sourceEvent.which == 1) {
      ServiceMethods.move(d.view, d.link, d.entity, d.x+ (d.tx)* d.displayHeight/ d.height, d.y+ (d.ty)* d.displayHeight/ d.height);

      d3.select('#MOVE_OBJECT').remove();

      d3.select('svg')
        .style('cursor', '-webkit-auto')
        .style('cursor', 'auto');

      d.tx = 0;
      d.ty = 0;
    }
  }

}

export default D3EventHandlers;
