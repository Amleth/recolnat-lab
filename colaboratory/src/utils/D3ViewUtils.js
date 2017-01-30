/**
 * Created by dmitri on 12/05/16.
 */
'use strict';

import d3 from 'd3';

import D3EventHandlers from './D3EventHandlers';

import Classes from '../constants/CommonSVGClasses';
import ViewConstants from '../constants/ViewConstants';

import ViewActions from '../actions/ViewActions';

import markerSVG from '../images/poi.svg';
import resizeIcon from '../images/resize_nw.svg';
import resizeHandleIcon from '../images/resize-handle.svg';
import moveIcon from '../images/hand_hex.svg';

export default class D3ViewUtils {
  static drawBenchData(data, self) {
    let root = d3.select('.' + Classes.OBJECTS_CONTAINER_CLASS);
    let children = root.selectAll('.' + Classes.CHILD_GROUP_CLASS)
      .data(data, d => d.link);
    let displays = self.viewstore.getDisplayedTypes();

    children.enter()
      .append('g')
      .attr('class', Classes.CHILD_GROUP_CLASS)
      .attr('id', d => 'GROUP-' + d.link)
      .attr('transform', function(d) {
        return d.x === null|| d.y === null || d.displayHeight === null || d.height === null ? '' : 'translate(' + d.x + ',' + d.y + ')scale(' + (d.displayHeight / d.height) + ')'});
    children.exit().remove();
    children.attr('transform', d => d.x === null|| d.y === null || d.displayHeight === null || d.height === null ? '' : 'translate(' + d.x + ',' + d.y + ')scale(' + (d.displayHeight/d.height) + ')');

    // BEGIN under image update
      let under = children.selectAll('.' + Classes.UNDER_CHILD_CLASS).data(d => [d], d => d.link);
      under.enter()
        .append('g')
        .attr('class', d => Classes.UNDER_CHILD_CLASS)
        .attr('id', d => 'UNDER-' + d.link);
      under.exit().remove();
      under.attr('id', d => 'UNDER-' + d.link);

    if(displays.borders) {
      let borderAreas = under.selectAll('.' + Classes.BORDER_CLASS).data(d => [d], d => d.link);
      borderAreas.enter()
        .append('rect')
        .attr('class', Classes.BORDER_CLASS)
        .attr('id', d => 'BORDER-' + d.link)
        .attr('x', d => -5 / self.view.scale * d.height / d.displayHeight)
        .attr('y', d => -20 / self.view.scale * d.height / d.displayHeight)
        .attr('width', d => d.width + 10 / self.view.scale * d.height / d.displayHeight)
        .attr('height', d => d.height + 30 / self.view.scale * d.height / d.displayHeight)
        .style('fill', '#AAAAAA');
      borderAreas.exit().remove();
      borderAreas
        .attr('x', d => -5 / self.view.scale * d.height / d.displayHeight)
        .attr('y', d => -20 / self.view.scale * d.height / d.displayHeight)
        .attr('width', d => d.width + 10 / self.view.scale * d.height / d.displayHeight)
        .attr('height', d => d.height + 30 / self.view.scale * d.height / d.displayHeight);

      let namePath = under.selectAll('.' + Classes.NAME_PATH_CLASS).data(d => [d], d => d.link);
      namePath.enter()
        .append('path')
        .attr('id', d => 'NAME-PATH-' + d.link)
        .attr('class', Classes.NAME_PATH_CLASS)
        .attr('d', d => 'M 0 ' + -5 / self.view.scale + ' L ' + d.width + ' ' + -5 / self.view.scale)
        .style('pointer-events', 'none');
      namePath.exit().remove();
      namePath
        .attr('d', d => 'M 0 ' + -5 / self.view.scale + ' L ' + d.width + ' ' + -5 / self.view.scale)
        .style('pointer-events', 'none');

      let name = under.selectAll('.' + Classes.NAME_CLASS).data(d => [d], d => d.link);
      name.enter().append('text')
        .attr('class', Classes.NAME_CLASS)
        .attr('id', d => 'NAME-' + d.link)
        .attr('x', 10)
        .attr('font-family', 'Verdana')
        .attr('font-size', d => 14 / self.view.scale * d.height / d.displayHeight + 'px')
        .attr('fill', 'white')
        .append('textPath')
        .attr('xlink:href', d => '#NAME-PATH-' + d.link)
        .style('pointer-events', 'none')
        .text(d => d.name);
      name.exit().remove();
      name.attr('font-size', d => 14 / self.view.scale * d.height / d.displayHeight + 'px')
        .select('textPath')
        .style('pointer-events', 'none')
        .text(d => d.name);

      let resizer = under.selectAll('.' + Classes.RESIZE_CLASS).data(d => [d], d => d.link);
      resizer.enter()
        .append('svg:image')
        .attr('xlink:href', resizeHandleIcon)
        .attr('class', Classes.RESIZE_CLASS)
        .attr('id', d => 'RESIZE-' + d.link)
        .attr('x', d => d.width - 5 / self.view.scale * d.height / d.displayHeight)
        .attr('y', d => d.height)
        .attr('width', d => 10 / self.view.scale * d.height / d.displayHeight)
        .attr('height', d => 10 / self.view.scale * d.height / d.displayHeight)
        .call(D3EventHandlers.dragResize())
        .style('cursor', '-webkit-nwse-resize')
        .style('cursor', 'nwse-resize');
      resizer.exit().remove();
      resizer
        .attr('x', d => d.width - 5 / self.view.scale * d.height / d.displayHeight)
        .attr('y', d => d.height)
        .attr('width', d => 10 / self.view.scale * d.height / d.displayHeight)
        .attr('height', d => 10 / self.view.scale * d.height / d.displayHeight);

      if (self.modestore.isInObservationMode()) {
        borderAreas.style('cursor', '-webkit-grab')
          .style('cursor', 'grab')
          .call(D3EventHandlers.dragMove());
      }
    }
    else {
      under.selectAll('.' + Classes.BORDER_CLASS).remove();
      under.selectAll('.' + Classes.NAME_PATH_CLASS).remove();
      under.selectAll('.' + Classes.NAME_CLASS).remove();
      under.selectAll('.' + Classes.RESIZE_CLASS).remove();
    }
    // END under image update


    let image = children.selectAll('.' + Classes.IMAGE_CLASS).data(d => [d], d => d.link);
    image.enter().append('svg:image')
      .attr('class', Classes.IMAGE_CLASS)
      .attr('id', d => 'IMAGE-' + d.link)
      .attr("height", d => d.height)
      .attr("width", d => d.width)
      .attr("x", 0)
      .attr("y", 0);
    image.exit().remove();
    image.attr("height", d => d.height)
      .attr("width", d => d.width);

    // BEGIN over image update
    let over = children.selectAll('.' + Classes.OVER_CHILD_CLASS).data(d => [d], d => d.link);
    over.enter().append('g')
      .attr('class', Classes.OVER_CHILD_CLASS)
      .attr('id', d=> 'OVER-' + d.link);
    over.exit().remove();

    over = children.selectAll('.' + Classes.OVER_CHILD_CLASS);

    let annotations = over.selectAll('.' + Classes.ANNOTATIONS_CONTAINER_CLASS).data(d => [d], d => d.link);
    annotations.enter().append('g')
      .attr('class', Classes.ANNOTATIONS_CONTAINER_CLASS)
      .attr('id', d=> 'ANNOTATIONS-' + d.link);
    annotations.exit().remove();

    annotations = over.selectAll('.' + Classes.ANNOTATIONS_CONTAINER_CLASS);

    if(displays.angles) {
      let angle = annotations.selectAll('.' + Classes.AOI_CLASS).data(d => d.aois, d => d.uid);
      angle.enter().append('polyline')
        .attr('class', Classes.AOI_CLASS)
        .attr('id', d => 'AOI-' + d.uid)
        .attr('fill', 'none')
        .attr('stroke', 'red')
        .attr('points', d => d.polygonVertices.replace(/\]/g, '').replace(/\[/g, '').replace(/\,/g, ' '))
        .attr('stroke-width', 4)
        .style('pointer-events', 'none');
      angle.exit().remove();
      angle.attr('points', d => d.polygonVertices.replace(/\]/g, '').replace(/\[/g, '').replace(/\,/g, ' '));
    }
    else {
      annotations.selectAll('.' + Classes.AOI_CLASS).remove();
    }

    if(displays.trails) {
      let path = annotations.selectAll('.' + Classes.PATH_CLASS).data(d => d.tois, d => d.uid);
      path.enter().append('polyline')
        .attr('class', Classes.PATH_CLASS)
        .attr('id', d => 'PATH-' + d.uid)
        .attr('fill', 'none')
        .attr('stroke', 'red')
        .attr('points', d => d.polygonVertices.replace(/\]/g, '').replace(/\[/g, '').replace(/\,/g, ' '))
        .attr('stroke-width', 4)
        .style('pointer-events', 'none');
      path.exit().remove();
      path.attr('points', d => d.polygonVertices.replace(/\]/g, '').replace(/\[/g, '').replace(/\,/g, ' '));
    }
    else {
      annotations.selectAll('.' + Classes.PATH_CLASS).remove();
    }

    if(displays.points) {
      let point = annotations.selectAll('.' + Classes.POI_CLASS).data(d => d.pois, d => d.uid);
      let poi = point.enter().append('g')
        .attr('class', Classes.POI_CLASS)
        .attr('id', d => 'POI-' + d.uid)
        .attr('transform', d => 'translate(' + d.x + ',' + d.y + ')')
        .style('pointer-events', 'none');
      poi.append('svg:image')
        .attr('height', 100)
        .attr('width', 60)
        .attr('xlink:href', markerSVG)
        .attr("x", -30)
        .attr("y", -100);
      point.exit().remove();
      point.attr('transform', d => 'translate(' + d.x + ',' + d.y + ')');
    }
    else {
      annotations.selectAll('.' + Classes.POI_CLASS).remove();
    }

    if(displays.regions) {
      let region = annotations.selectAll('.' + Classes.ROI_CLASS).data(d => d.rois, d => d.uid);
      region.enter().append('polygon')
        .attr('class', Classes.ROI_CLASS)
        .attr('id', d => 'ROI-' + d.uid)
        .attr('points', d => d.polygonVertices.replace(/\]/g, '').replace(/\[/g, '').replace(/\,/g, ' '))
        .attr('fill', 'blue')
        .attr('fill-opacity', 0.3)
        .style('pointer-events', 'none');
      region.exit().remove();
      region.attr('points', d => d.polygonVertices.replace(/\]/g, '').replace(/\[/g, '').replace(/\,/g, ' '));
    }
    else {
      annotations.selectAll('.' + Classes.ROI_CLASS).remove();
    }
    // END over image update
  }

  static displayLoadedImage(data, image) {
    let group = d3.selectAll("." + Classes.CHILD_GROUP_CLASS);

    group.select("#IMAGE-" + data.link)
      .attr("xlink:href", image.src);
  }

  static getImageUrlFromVisibleProportion(d, view) {
    let proportion = (d.displayHeight) / (view.yMax - view.yMin);
    if(proportion < 0.2) {
      return D3ViewUtils.getImageUrlFromQuality(d, ViewConstants.imageQuality.Low);
    } else if(proportion < 0.7) {
      return D3ViewUtils.getImageUrlFromQuality(d, ViewConstants.imageQuality.High);
    } else {
      return D3ViewUtils.getImageUrlFromQuality(d, ViewConstants.imageQuality.Original);
    }
  }

  static getImageUrlFromQuality(data, quality) {
    switch(quality) {
      case ViewConstants.imageQuality.Low:
        return data.thumbnail;
      case ViewConstants.imageQuality.High:
        // http://imager.mnhn.fr/imager2/w400/2012/11/20/6/P00048663.jpg
        return data.thumbnail.replace('v25', 'w400');
      case ViewConstants.imageQuality.Original:
        return data.url;
      default:
        return data.thumbnail;
    }
  }

  static animateOutline(id) {
    let d3Node = d3.select('#' + id);
    d3Node
      .classed('outline', true)
      .style('outline-style', 'solid')
      .style('outline-width', '2px');

      function repeat() {
        d3Node.style('outline-color', 'black')
          .transition()
          .duration(500)
          .ease('linear')
          .style('outline-color', 'white')
          .transition()
          .duration(500)
          .ease('linear')
          .style('outline-color', 'black')
        .each('end', repeat);
      }
    repeat();
  }

  static stopOutlineAnimation(id) {
    d3.select('#' + id).classed('outline', false).interrupt().transition()
      .style('outline-color', null)
      .style('outline-width', null)
      .style('outline-style', 'none')
      ;
  }

  static zoomToObject(d3selector, view) {
    // Retrieve object coordinates and size in browser window
    let object = d3.select(d3selector);
    let winLoc = object.node().getBoundingClientRect();
    let oldHeight = winLoc.height;
    let oldWidth = winLoc.width;
    let oldScale = view.scale;

    // Calculate fitting area
    let scale = 1.0;
    if(oldHeight > oldWidth) {
      scale = (view.height * oldScale) / (oldHeight);
    }
    else {
      scale = (view.width * oldScale) / (oldWidth);
    }
    scale = scale*0.90;

    // Leave half empty screen as margin to center the object in the viewport
    let marginX = (view.width - oldWidth*scale/view.scale)/2;
    let marginY = (view.height - oldHeight*scale/view.scale)/2;

    // Dispatch action
    window.setTimeout(ViewActions.updateViewport.bind(null,
      (view.left - winLoc.left + view.leftFromWindow)*scale/view.scale + marginX,
      (view.top - winLoc.top + view.topFromWindow)*scale/view.scale + marginY,
      null,
      null,
      scale,
      true
    ), 10);
  }

  static isElementInView(data, view) {
    return !((data.x + data.displayWidth) < view.xMin
    || data.x > view.xMax
    || (data.y + data.displayHeight) < view.yMin
    || data.y > view.yMax);
  }
}
