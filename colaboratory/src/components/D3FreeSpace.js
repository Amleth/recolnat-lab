'use strict';

import {EventEmitter} from 'events';
import d3 from 'd3';

import ViewActions from '../actions/ViewActions.js';
import MinimapActions from "../actions/MinimapActions.js";
import ToolActions from "../actions/ToolActions.js";
import MenuActions from '../actions/MenuActions';

import Classes from '../constants/CommonSVGClasses';
import TypeConstants from '../constants/TypeConstants';

import ShapesConf from "../conf/shapes";

import workbenchImageUrl from '../images/book_300.png';
import markerSVG from '../images/marker.svg';

class D3FreeSpace {
  constructor() {
    this.zoom = d3.behavior.zoom()
      //.scaleExtent([0.1, 100])
      .on('zoom', () => {
        ViewActions.updateViewport(
          d3.event.translate[0],
          d3.event.translate[1],
          d3.select('svg').node().parentNode.offsetWidth,
          d3.select('svg').node().parentNode.offsetHeight,
          d3.event.scale
        );
      });

    this.view = {};
    this.view.x = 0;
    this.view.y = 0;
    this.view.scale = 1.0;
    this.store = null;

    this.workbench = null;
    this.displayData = {
      xMin: Number.POSITIVE_INFINITY,
      xMax: Number.NEGATIVE_INFINITY,
      yMin: Number.POSITIVE_INFINITY,
      yMax: Number.NEGATIVE_INFINITY};
  }

  create(el, props) {
    this.el = el;

    var self = this;
    let svg = d3.select(el).append('svg')
      .attr('width', props.width)
      .attr('height', props.height)
      .on('contextmenu', function(d,i) {
        self.contextMenu.call(this, self);
      })
      .on('click', function(d,i) {
        if (d3.event.button == 0) {
          self.leftClick.call(this, self);
        }
      })
      .call(this.zoom)
      .style('cursor', 'default');

    var root = svg.append('g').attr('class', Classes.ROOT_CLASS);
    root.append('g').attr('class', Classes.OBJECTS_CONTAINER_CLASS);
    root.append('g').attr('class', Classes.ACTIVE_TOOL_DISPLAY_CLASS);

  }

  // External methods
  clearDisplay() {
    d3.select("." + Classes.OBJECTS_CONTAINER_CLASS).selectAll("*").remove();
    d3.select("." + Classes.ACTIVE_TOOL_DISPLAY_CLASS).selectAll("*").remove();
  }

  setDataStore(store) {
    this.store = store;
  }

  newWorkbench(childEntities, workbench) {
    this.displayData.xMin = Number.POSITIVE_INFINITY;
    this.displayData.xMax = Number.NEGATIVE_INFINITY;
    this.displayData.yMin = Number.POSITIVE_INFINITY;
    this.displayData.yMax = Number.NEGATIVE_INFINITY;

    this.drawChildEntities(childEntities, workbench);
  }

  updateChildEntities(childEntities) {
    // Position, transparency
    var children = d3.selectAll('.' + Classes.CHILD_GROUP_CLASS).data(childEntities, function(d) {return d.id});
    for(var i = 0; i < childEntities.length; ++i) {
      var entity = childEntities[i];

      var group = d3.select("#GROUP-" + entity.id);
      var image = d3.select("#NODE-" + entity.id);

      if(group.empty() || image.empty()) {
        continue;
      }

      // Update position
      this.updateAllAttributes(entity.id);

      this.displayData.xMin = Math.min(this.displayData.xMin, entity.x-20);
      this.displayData.yMin = Math.min(this.displayData.yMin, entity.y-20);

      this.displayData.xMax = Math.max(parseInt(image.attr("width")) + entity.x + 20, this.displayData.xMax);
      this.displayData.yMax = Math.max(parseInt(image.attr("height")) + entity.y + 20, this.displayData.yMax);

      // TODO Update transparency
    }
  }

  updateWorkbenchMetadata(metadata){
    // Remove borders around selections
    d3.selectAll('.' + Classes.BORDER_CLASS)
      .style('fill', '#AAAAAA');

    if(metadata.selected) {
      d3.select('#BORDER-' + metadata.selected.id)
        .style('stroke', '#708D23')
        .style('fill', '#708D23');

      var image = d3.select('#NODE-' + metadata.selected.id);
      window.setTimeout((function(url, width, height, x, y) {
          return function() {
            MinimapActions.initMinimap(url, width, height, x, y);
          };
        })(image.attr("xlink:href"), image.datum().width, image.datum().height, image.datum().x, image.datum().y),
        10);
    }
    else {
      window.setTimeout(function() {
        MinimapActions.unsetMinimap();
      }, 10);
    }
  }

  updateEntitiesMetadata(metadata) {
    for(var i = 0; i < metadata.length; ++i) {
      var metadataAboutId = metadata[i];
      var id = metadataAboutId.id;
      if(metadataAboutId.pois) {
        this.displayPointsOfInterest(id, metadataAboutId.pois);
      }
      if(metadataAboutId.rois) {
        this.displayRegionsOfInterest(id, metadataAboutId.rois);
      }
      if(metadataAboutId.paths) {
        this.displayPaths(id, metadataAboutId.paths);
      }
    }
  }

  updateViewWithProperties(properties) {
    d3.selectAll('.' + Classes.POI_CLASS)
      .attr('transform', d => 'translate(' + d.x + ',' + d.y + ')scale(' + properties.sizeOfTextAndObjects + ')');
  }

  fitViewportToData() {
    let group = d3.select('.' + Classes.ROOT_CLASS);

    var scale = 1.0;
    if(this.displayData.xMin == Number.POSITIVE_INFINITY ||
      this.displayData.xMax == Number.NEGATIVE_INFINITY ||
      this.displayData.yMin == Number.POSITIVE_INFINITY ||
      this.displayData.yMax == Number.NEGATIVE_INFINITY ) {
      console.log("Not enough data to calculate fitness");
      return;
    }

    var xLen = this.displayData.xMax - this.displayData.xMin;
    var yLen = this.displayData.yMax - this.displayData.yMin;
    var scaleX = (d3.select('svg').node().parentNode.offsetWidth / xLen);
    var scaleY = (d3.select('svg').node().parentNode.offsetHeight / yLen);
    if (scaleX > scaleY) {
      scale = scaleY;
    }
    else {
      scale = scaleX;
    }

    var x = -this.displayData.xMin*scale;
    var y = -this.displayData.yMin*scale;

    window.setTimeout(function() {
        ViewActions.updateViewport(
          x,
          y,
          d3.select('svg').node().parentNode.offsetWidth,
          d3.select('svg').node().parentNode.offsetHeight,
          scale);
      },
      10);
  }

  updateViewport(x, y, width, height, scale) {
    this.view.x = x;
    this.view.y = y;
    this.view.scale = scale;

    this.viewportTransition();
  }

//
// Internal methods
//

  viewportTransition() {
    this.zoom.translate([this.view.x, this.view.y]);
    this.zoom.scale(this.view.scale);

    d3.select('.' + Classes.ROOT_CLASS)
      .transition()
      .duration(250)
      .ease('linear')
      .attr('transform', 'translate(' + this.view.x + "," + this.view.y + ")scale(" + this.view.scale + ')');
  }

  drawChildEntities(childEntities, workbench) {
    let group = d3.select('.' + Classes.OBJECTS_CONTAINER_CLASS);
    var elements = [];
    var bags = [];
    var contentToLoad = childEntities.length;
    var contentLoaded = 0;

    for (var j = 0; j < childEntities.length; ++j) {
      var child = childEntities[j];
      child.workbench = workbench;
      this.displayData.xMin = Math.min(this.displayData.xMin, child.x-60);
      this.displayData.yMin = Math.min(this.displayData.yMin, child.y-60);
      elements.push(child);
    }

    // Append new entries
    var children = group.selectAll('.' + Classes.CHILD_GROUP_CLASS).data(elements);
    var childGroupEnter = children.enter().append('g')
      .attr('class', Classes.CHILD_GROUP_CLASS)
      .attr('id', d => 'GROUP-' + d.id)
      .attr('transform', d => 'translate(1000000,1000000)');

    var underChildGroupEnter = childGroupEnter
      .append('g')
      .attr('class', Classes.UNDER_CHILD_CLASS)
      .attr('id', d => 'UNDER-' + d.id);

    underChildGroupEnter.append("rect")
      .attr('class', Classes.BORDER_CLASS)
      .attr('id', d => 'BORDER-' + d.id)
      .attr('x', -4)
      .attr('y', -104)
      .attr('rx', 15)
      .attr('ry', 15)
      .style('fill', '#AAAAAA');

    underChildGroupEnter.append('text')
      .attr('id', d => 'NAME-' + d.id)
      .attr('x', 10)
      .attr('y', -40)
      .attr('dy', '.20em')
      .attr('font-family', 'Verdana')
      .attr('font-size', '80px')
      .attr('fill', 'white')
      .text(d => d.name);

    childGroupEnter
      .append('svg:image')
      .attr('class', Classes.IMAGE_CLASS)
      .attr('id', d => 'NODE-' + d.id)
      .attr("x", 0)
      .attr("y", 0);

    var overChildClassEnter = childGroupEnter.append('g')
      .attr('class', Classes.OVER_CHILD_CLASS)
      .attr('id', d=> 'OVER-' + d.id);

    overChildClassEnter.append('g')
      .attr('class', Classes.ANNOTATIONS_CONTAINER_CLASS)
      .attr('id', d=> 'ANNOTATIONS-' + d.id);

    var self = this;

    for(var i = 0; i < elements.length; ++i) {
      var element = elements[i];
      window.setTimeout((function (elt) {
        return function () {
          var img = new Image();
          img.src = elt.url;
          img.onload = function () {
            var group = d3.selectAll("." + Classes.CHILD_GROUP_CLASS);

            var height = this.height;
            var width = this.width;
            var url = this.src;

            group.each(function(d, i) {
              if(d.id == elt.id) {
                d.height = height;
                d.width = width;
                d.url = url;
              }
            });

            group.select("#NODE-" + elt.id)
              .attr("height", d => d.height)
              .attr("width", d => d.width)
              .attr("xlink:href", d => d.url);

            group.select("#BORDER-" + elt.id)
              .attr('width', d => d.width + 8)
              .attr('height', d => d.height + 148);
            //.style('stroke-width', '4px');

            group.select("#NAME-" + elt.id)
              .attr('width', d => d.width + 8)
              .attr('height', d => d.height + 148);

            self.updateAllAttributes(elt.id);

            self.displayData.xMax = Math.max(this.width + elt.x+60, self.displayData.xMax);
            self.displayData.yMax = Math.max(this.height + elt.y+60, self.displayData.yMax);

            self.fitViewportToData();

            ++contentLoaded;
            window.setTimeout(function() {
              ToolActions.updateTooltipData('Chargement des images en cours... ' + contentLoaded + '/' + contentToLoad )},10);

            if(contentLoaded >= contentToLoad) {
              window.setTimeout(function() {
                ToolActions.updateTooltipData('Chargement terminé')},10);

              window.setTimeout(function() {
                ToolActions.updateTooltipData('')},5000);
            }
          };
        }
      })(element), 50);
    }
  }

  updateAllAttributes(id) {
    d3.select('#GROUP-' + id)
      .transition()
      .duration(200)
      .attr('transform', d => 'translate(' + d.x + ',' + d.y + ')');

    window.setTimeout(function() {
      ToolActions.reset();
    }, 10);
  }

  displayPaths(id, paths) {
    var annotationContainerGroup = d3.select("#ANNOTATIONS-" + id);
    annotationContainerGroup.selectAll('.' + Classes.PATH_CONTAINER_CLASS).remove();
    if(d3.select('#GROUP-' + id).empty()) {
      return;
    }

    var pathContainerGroup = annotationContainerGroup.append('g')
      .attr('class', Classes.PATH_CONTAINER_CLASS)
      .attr('id', 'PATHS-' + id);

    var pathContainerGroupEnter = pathContainerGroup.selectAll('.' + Classes.PATH_CLASS)
      .data(paths);

    pathContainerGroupEnter
      .enter()
      .append('polyline')
      .attr('class', Classes.PATH_CLASS)
      .attr('id', d => 'PATH-' + d.id)
      .attr('fill', 'none')
      .attr('stroke', 'red')
      .attr('points', d => d.vertices)
      .attr('stroke-width', 4);
  }

  displayPointsOfInterest(id, pois) {
    var annotationContainerGroup = d3.select("#ANNOTATIONS-" + id);
    annotationContainerGroup.selectAll("." + Classes.POI_CONTAINER_CLASS).remove();
    if(d3.select('#GROUP-' + id).empty()) {
      return;
    }

    var poiContainerGroup = annotationContainerGroup.append('g')
      .attr('class', Classes.POI_CONTAINER_CLASS)
      .attr('id', 'POIS-' + id);

    var poiContainerGroupEnter = poiContainerGroup.selectAll('.' + Classes.POI_CLASS).data(pois);

    var poiGroupEnter = poiContainerGroupEnter
      .enter()
      .append('g')
      .attr('class', Classes.POI_CLASS)
      .attr('id', d => 'POI-' + d.id)
      .attr('transform', d => 'translate(' + d.x + ',' + d.y + ')');

    poiGroupEnter.append('svg:title')
      .text(d => d.text);

    poiGroupEnter.append('rect')
      .attr('rx', 5)
      .attr('ry', 5)
      .attr('width', 50)
      .attr('height', 30)
      .attr("x", -25)
      .attr("y", -55)
      .attr('fill', d => "rgb(" + JSON.parse(d.color)[0] + "," + JSON.parse(d.color)[1] + "," + JSON.parse(d.color)[2] + ")");

    poiGroupEnter.append('svg:image')
      .attr("height", 60)
      .attr("width", 60)
      .attr('xlink:href', markerSVG)
      .attr("x", -30)
      .attr("y", -60);


    poiGroupEnter.append('text')
      .text(d => d.letters)
      .attr('x', 0)
      .attr('y', -40)
      .attr('dy', '.35em')
      .attr('text-anchor', 'middle')
      .attr('font-size', '20px')
      .attr('font-family', 'sans-serif')
      .attr('fill', d => "rgb(" + (255 - JSON.parse(d.color)[0]) + "," + (255 - JSON.parse(d.color)[1]) + "," + (255 - JSON.parse(d.color)[2]) + ")")
    ;
  }

  displayRegionsOfInterest(id, regions) {
    var annotationContainerGroup = d3.select("#ANNOTATIONS-" + id);
    annotationContainerGroup.selectAll("." + Classes.ROI_CONTAINER_CLASS).remove();

    var roiContainerGroup = annotationContainerGroup.append('g')
      .attr('class', Classes.ROI_CONTAINER_CLASS)
      .attr('id', 'ROIS-' + id);

    var roiContainerGroupEnter = roiContainerGroup.selectAll('.' + Classes.ROI_CLASS).data(regions);

    roiContainerGroupEnter
      .enter()
      .append('polygon')
      .attr('class', Classes.ROI_CLASS)
      .attr('id', d => 'ROI-' + d.id)
      .attr('points', d => d.vertices)
      .attr('fill', 'blue')
      .attr('fill-opacity', 0.3);
  }

  findObjectsAtCoords(coordinates) {
    var objects = [];
    if(!this.store) {
      // Component not even mounted yet
      console.error("Visualisation component not mounted");
      return objects;
    }
    var store = this.store;

    // Find images, use images to narrow search
    var groups = d3.selectAll('.' + Classes.CHILD_GROUP_CLASS);
    groups.each(
      function(d, i) {
        var box = d3.select('#GROUP-' + d.id).node().getBoundingClientRect();

        if(D3FreeSpace.coordsInBoundingBox(coordinates, box)) {
          objects.push({id: d.id, type: TypeConstants.sheet});
          // Process objects in sheet
          var metadata = store.getEntityMetadata(d.id);
          // Find polygons
          for (var m = 0; m < metadata.rois.length; ++m) {
            var polygon = metadata.rois[m];
            var polygonBox = d3.select('#ROI-' + polygon.id).node().getBoundingClientRect();
            if (D3FreeSpace.coordsInBoundingBox(coordinates, polygonBox)) {
              if(objects.indexOf({id: polygon.id, type: TypeConstants.region}) < 0) {
                objects.push({id: polygon.id, type: TypeConstants.region});
              }
            }
          }

          // Find paths
          for (var j = 0; j < metadata.paths.length; ++j) {
            var path = metadata.paths[j];
            var pathBox = d3.select('#PATH-' + path.id).node().getBoundingClientRect();
            if(D3FreeSpace.coordsInBoundingBox(coordinates, pathBox)) {
              if(objects.indexOf({id: path.id, type: TypeConstants.path}) < 0) {
                objects.push({id: path.id, type: TypeConstants.path});
              }
            }
          }

          // Find points
          for (var n = 0; n < metadata.pois.length; ++n) {
            var poi = metadata.pois[n];
            var poiBox = d3.select('#POI-' + poi.id).node().getBoundingClientRect();
            if(D3FreeSpace.coordsInBoundingBox(coordinates, poiBox)) {
              if(objects.indexOf({id: poi.id, type: TypeConstants.point}) < 0) {
                objects.push({id: poi.id, type: TypeConstants.point});
              }
            }
          }
        }
      }
    );
    return objects;
  }

  static coordsInBoundingBox(coordinates, box) {
    return coordinates[0] > box.left &&
      coordinates[0] < box.right &&
      coordinates[1] > box.top &&
      coordinates[1] < box.bottom;
  }

  leftClick(d, i) {
    if(d3.event.defaultPrevented) {
      return;
    }
    d3.event.preventDefault();
    var coords = d3.mouse(this);
    //var objectsAtEvent = self.findObjectsAtCoords.call(self, coords);
    // TODO input the right data
    ToolActions.runTool(
      coords[0],
      coords[1],
      {
        data: {},
        objects: [],
        button: d3.event.button
      });
  }

  contextMenu(self) {
    d3.event.preventDefault();
    var coords = d3.mouse(this);
    var objectsAtEvent = self.findObjectsAtCoords([d3.event.clientX, d3.event.clientY]);
    console.log(JSON.stringify(objectsAtEvent));
    MenuActions.displayContextMenu(d3.event.clientX, d3.event.clientY, objectsAtEvent);
  }

}

export default D3FreeSpace;