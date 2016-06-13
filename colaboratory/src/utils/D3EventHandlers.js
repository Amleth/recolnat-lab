/**
 * Created by dmitri on 27/04/16.
 */
'use strict';

import d3 from 'd3';
import request from 'superagent';

import MetadataActions from '../actions/MetadataActions';
import ViewActions from '../actions/ViewActions';

import Classes from '../constants/CommonSVGClasses';

import conf from '../conf/ApplicationConfiguration';

class D3EventHandlers {
  static dragResize() {
    return d3.behavior.drag()
      .origin(d => d)
      .on('dragstart', D3EventHandlers.startImageResize)
      .on('drag', D3EventHandlers.resizeImageBorders)
      .on('dragend', D3EventHandlers.fixImageSize);
  }

  static startImageResize(d) {
    console.log('resize start');
    d3.event.sourceEvent.preventDefault();
    d3.event.sourceEvent.stopPropagation();
    d.newHeight = d.height;
    d.newWidth = d.width;
    console.log(JSON.stringify(d));
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

  static resizeImageBorders(d) {
    //console.log('resize(' + d.newHeight + ')');
    var oldHeight = d.newHeight;
    d.newHeight = d.newHeight + d3.event.dy;
    d.newWidth = d.newWidth*d.newHeight/oldHeight;

    d3.select('#RESIZE_WINDOW')
      .attr('height', d.newHeight)
      .attr('width', d.newWidth);
  }

  static fixImageSize(d) {
    console.log('resize end(' + d.newHeight + ')');
    console.log('s dH/h=' + d.newHeight* d.displayHeight/ d.height);

    var link = d.link;
    var view = d.view;
    var entity = d.entity;
    var height = d.newHeight* d.displayHeight/ d.height;
    var width = d.newWidth* d.displayHeight/ d.height;

    request.post(conf.actions.viewServiceActions.resize)
      .send({link: link})
      .send({view: view})
      .send({entity: entity})
      .send({height: height})
      .send({width: width})
      .withCredentials()
      .end((err, res) => {
        if(err) {
          console.error(err);
        }
        MetadataActions.updateLabBenchFrom(view);
      });
    d3.select('#RESIZE_WINDOW').remove();
    d.newHeight = null;
    d.newWidth = null;
  }

  static dragMove() {
    return d3.behavior.drag()
      .origin(d => d)
      .on('dragstart', D3EventHandlers.startImageMove)
      .on('drag', D3EventHandlers.moveImageGhost)
      .on('dragend', D3EventHandlers.fixImagePosition);
  }

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

  static moveImageGhost(d) {
      //d.x = d3.event.x;
      //d.y = d3.event.y;
      d.tx = d.tx + d3.event.dx;
      d.ty = d.ty + d3.event.dy;

      d3.select('#MOVE_OBJECT')
        //.attr('transform', 'translate(' + d.tx + ',' + d.ty + ')')
        .attr('x', d.tx)
        .attr('y', d.ty);
  }

  static fixImagePosition(d) {
    if(d3.event.sourceEvent.which == 1) {
      ViewActions.moveEntity(d.view, d.entity, d.link, d.x+ (d.tx)* d.displayHeight/ d.height, d.y+ (d.ty)* d.displayHeight/ d.height);

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