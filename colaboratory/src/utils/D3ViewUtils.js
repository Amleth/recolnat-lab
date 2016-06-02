/**
 * Created by dmitri on 12/05/16.
 */
'use strict';

import d3 from 'd3';

import D3EventHandlers from './D3EventHandlers';

import Classes from '../constants/CommonSVGClasses';
import ViewConstants from '../constants/ViewConstants';

import markerSVG from '../images/marker.svg';

export default class D3ViewUtils {
  static drawBenchData(data, self) {
    //console.log('drawing ' + JSON.stringify(data.map(function(d) {
    //    return {url: d.url, thumb: d.thumbnail};
    //  })));
    var root = d3.select('.' + Classes.OBJECTS_CONTAINER_CLASS);
    var children = root.selectAll('.' + Classes.CHILD_GROUP_CLASS)
      .data(data, d => d.link);

    children.enter()
      .append('g')
      .attr('class', Classes.CHILD_GROUP_CLASS)
      .attr('id', d => 'GROUP-' + d.link)
      .attr('transform', d => d.x == null ? null : 'translate(' + d.x + ',' + d.y + ')scale(' + d.displayHeight/d.height + ')');
    children.exit().remove();
    children.attr('transform', d => d.x == null ? null : 'translate(' + d.x + ',' + d.y + ')scale(' + d.displayHeight/d.height + ')');

    // BEGIN under image update
    var under = children.selectAll('.' + Classes.UNDER_CHILD_CLASS).data(d => [d], d => d.link);
    under.enter()
      .append('g')
      .attr('class', d => Classes.UNDER_CHILD_CLASS)
      .attr('id', d => 'UNDER-' + d.link);
    under.exit().remove();
    under.attr('id', d => 'UNDER-' + d.link);

    var border = under.selectAll('.' + Classes.BORDER_CLASS).data(d => [d], d => d.link);
    border.enter()
      .append("rect")
      .attr('class', Classes.BORDER_CLASS)
      .attr('id', d => 'BORDER-' + d.link)
      .attr('x', -4)
      .attr('y', -104)
      .attr('rx', 15)
      .attr('ry', 15)
      .attr('width', d => d.width + 8)
      .attr('height', d => d.height + 148)
      .style('fill', '#AAAAAA');
    border.exit().remove();
    border.attr('width', d => d.width + 8)
      .attr('height', d => d.height + 148);

    var name = under.selectAll('.' + Classes.NAME_CLASS).data(d => [d], d => d.link);
    name.enter().append('text')
      .attr('class', Classes.NAME_CLASS)
      .attr('id', d => 'NAME-' + d.link)
      .attr('x', 10)
      .attr('y', -40)
      .attr('width', d => d.width + 8)
      .attr('height', d => d.height + 148)
      .attr('dy', '.20em')
      .attr('font-family', 'Verdana')
      .attr('font-size', '80px')
      .attr('fill', 'white')
      .text(d => d.name);
    name.exit().remove();
    name.attr('width', d => d.width + 8)
      .attr('height', d => d.height + 148)
      .text(d => d.name);

    var resizer = under.selectAll('.' + Classes.RESIZE_CLASS).data(d => [d], d => d.link);
    resizer.enter().append("rect")
      .attr('class', Classes.RESIZE_CLASS)
      .attr('id', d => 'RESIZE-' + d.link)
      .attr('x', d => d.width)
      .attr('y', d => d.height)
      .attr('width', d => 5/self.view.scale * d.height/ d.displayHeight)
      .attr('height', d => 5/self.view.scale* d.height/ d.displayHeight)
      .call(D3EventHandlers.dragResize())
      .style('stroke-width', d => 1/self.view.scale * d.height/ d.displayHeight)
      .style('stroke', 'rgb(0,0,0)')
      .style('fill-opacity', '0.0')
      .style('cursor', '-webkit-nwse-resize')
      .style('cursor', 'nwse-resize');
    resizer.exit().remove();
    resizer.attr('x', d => d.width)
      .attr('y', d => d.height)
      .attr('width', d => 5/self.view.scale * d.height/ d.displayHeight)
      .attr('height', d => 5/self.view.scale* d.height/ d.displayHeight)
      .style('stroke-width', d => 1/self.view.scale * d.height/ d.displayHeight);

    var mover = under.selectAll('.' + Classes.MOVE_CLASS).data(d => [d], d => d.link);
    mover.enter().append("rect")
      .attr('class', Classes.MOVE_CLASS)
      .attr('id', d => 'MOVE-' + d.link)
      .attr('x', d => d.width/2)
      .attr('y', d => -5/self.view.scale * d.height/ d.displayHeight)
      .attr('width', d => 5/self.view.scale * d.height/ d.displayHeight)
      .attr('height', d => 5/self.view.scale* d.height/ d.displayHeight)
      .call(D3EventHandlers.dragMove())
      .style('stroke-width', d => 1/self.view.scale * d.height/ d.displayHeight)
      .style('stroke', 'rgb(0,0,0)')
      .style('fill-opacity', '0.0')
      .style('cursor', '-webkit-grab')
      .style('cursor', 'grab');
    mover.exit().remove();
    mover.attr('x', d => d.width/2)
      .attr('y', d => -5/self.view.scale * d.height/ d.displayHeight)
      .attr('width', d => 5/self.view.scale * d.height/ d.displayHeight)
      .attr('height', d => 5/self.view.scale* d.height/ d.displayHeight)
      .style('stroke-width', d => 1/self.view.scale * d.height/ d.displayHeight);
    // END under image update

    var image = children.selectAll('.' + Classes.IMAGE_CLASS).data(d => [d], d => d.link);
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
    var over = children.selectAll('.' + Classes.OVER_CHILD_CLASS).data(d => [d], d => d.link);
    over.enter().append('g')
      .attr('class', Classes.OVER_CHILD_CLASS)
      .attr('id', d=> 'OVER-' + d.link);
    over.exit().remove();

    over = children.selectAll('.' + Classes.OVER_CHILD_CLASS);

    var annotations = over.selectAll('.' + Classes.ANNOTATIONS_CONTAINER_CLASS).data(d => [d], d => d.link);
    annotations.enter().append('g')
      .attr('class', Classes.ANNOTATIONS_CONTAINER_CLASS)
      .attr('id', d=> 'ANNOTATIONS-' + d.link);
    annotations.exit().remove();

    annotations = over.selectAll('.' + Classes.ANNOTATIONS_CONTAINER_CLASS);

var paths = annotations.selectAll('.' + Classes.PATH_CONTAINER_CLASS).data(d => [d], d => d.link);
    paths.enter().append('g')
      .attr('class', Classes.PATH_CONTAINER_CLASS)
      .attr('id', d => 'PATHS-' + d.link);
    paths.exit().remove();

    var path = paths.selectAll('.' + Classes.PATH_CLASS).data(d => d.tois, d => d.uid);
    path.enter().append('polyline')
      .attr('class', Classes.PATH_CLASS)
      .attr('id', d => 'PATH-' + d.uid)
      .attr('fill', 'none')
      .attr('stroke', 'red')
      .attr('points', d => d.polygonVertices.replace(/\]/g, '').replace(/\[/g, '').replace(/\,/g, ' '))
      .attr('stroke-width', 4);
    path.exit().remove();
    path.attr('points', d => d.polygonVertices.replace(/\]/g, '').replace(/\[/g, '').replace(/\,/g, ' '));

    var points = annotations.selectAll('.' + Classes.POI_CONTAINER_CLASS).data(d => [d], d => d.link);
    points.enter().append('g')
      .attr('class', Classes.POI_CONTAINER_CLASS)
      .attr('id', d => 'POIS-' + d.link);
    points.exit().remove();

    var point = points.selectAll('.' + Classes.POI_CLASS).data(d => d.pois, d => d.uid);
    point.enter().append('g')
      .attr('class', Classes.POI_CLASS)
      .attr('id', d => 'POI-' + d.uid)
      .attr('transform', d => 'translate(' + d.x + ',' + d.y + ')')
      .append('svg:image')
      .attr('height', 60)
      .attr('width', 60)
      .attr('xlink:href', markerSVG)
      .attr("x", -30)
      .attr("y", -60);
    point.exit().remove();
    point.attr('transform', d => 'translate(' + d.x + ',' + d.y + ')');

    var regions = annotations.selectAll('.' + Classes.ROI_CONTAINER_CLASS).data(d => [d], d => d.link);
    regions.enter().append('g')
      .attr('class', Classes.ROI_CONTAINER_CLASS)
      .attr('id', d => 'ROIS-' + d.link);
    regions.exit().remove();

    var region = regions.selectAll('.' + Classes.ROI_CLASS).data(d => d.rois, d => d.uid);
    region.enter().append('polygon')
      .attr('class', Classes.ROI_CLASS)
      .attr('id', d => 'ROI-' + d.uid)
      .attr('points', d => d.polygonVertices.replace(/\]/g, '').replace(/\[/g, '').replace(/\,/g, ' '))
      .attr('fill', 'blue')
      .attr('fill-opacity', 0.3);
    region.exit().remove();
    region.attr('points', d => d.polygonVertices.replace(/\]/g, '').replace(/\[/g, '').replace(/\,/g, ' '));
    // END over image update
  }

  static displayLoadedImage(data, image) {
    // console.log('image=' + image.src);
    // console.log('data=' + data.link);
    //console.log('loaded ' + image.src);
    var group = d3.selectAll("." + Classes.CHILD_GROUP_CLASS);

    group.select("#IMAGE-" + data.link)
      .attr("xlink:href", image.src);

    // this.loadData.imagesLoaded += 1;
    // window.setTimeout(function() {
    //   ViewActions.changeLoaderState('Chargement des images en cours... ' + self.loadData.imagesLoaded + '/' + self.loadData.imagesToLoad )},10);
    //
    // if(this.loadData.imagesLoaded >= this.loadData.imagesToLoad) {
    //   D3FreeSpace.endLoad();
    // }
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
}
