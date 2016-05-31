'use strict';

import {EventEmitter} from 'events';
import d3 from 'd3';

import ViewActions from '../actions/ViewActions.js';
import MinimapActions from "../actions/MinimapActions.js";
import ToolActions from "../actions/ToolActions.js";
import MenuActions from '../actions/MenuActions';
import InspectorActions from '../actions/InspectorActions';

import Classes from '../constants/CommonSVGClasses';
import TypeConstants from '../constants/TypeConstants';

import D3EventHandlers from '../utils/D3EventHandlers';
import D3ViewUtils from '../utils/D3ViewUtils';
import Globals from '../utils/Globals';

import LineMeasure from '../tools/impl/LineMeasure';

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

    this.viewId = null;
    this.view = {};
    this.view.x = 0;
    this.view.y = 0;
    this.view.scale = 1.0;
    this.metadatastore = null;
    this.benchstore = null;
    this.viewstore = null;
    this.imageSourceLevel = 0;
    this.loadData = {
      imagesToLoad: 0,
      imagesLoaded: 0
    };

    this._onEndDragFromInbox = () => {
      const addFromInbox = () => this.fixShadow();
      return addFromInbox.apply(this);
    };

    //this.setView = null;
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
      .on('dragover', function(d, i) {
        d3.event.preventDefault();
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

  setMetadataStore(store) {
    this.metadatastore = store;
  }

  setLabBenchStore(store) {
    this.benchstore = store;
  }

  setViewStore(store) {
    this.viewstore = store;
  }

  newLabBench() {
    this.displayData.xMin = Number.POSITIVE_INFINITY;
    this.displayData.xMax = Number.NEGATIVE_INFINITY;
    this.displayData.yMin = Number.POSITIVE_INFINITY;
    this.displayData.yMax = Number.NEGATIVE_INFINITY;
  }

  loadView(viewId) {
    //this.setView = viewId;
    this.drawChildEntities();
  }

  updateViewWithProperties(properties) {
    //console.log('updateView');
    d3.selectAll('.' + Classes.POI_CLASS)
      .attr('transform', d => 'translate(' + d.x + ',' + d.y + ')scale(' + properties.sizeOfTextAndObjects + ')');

    d3.selectAll('.' + LineMeasure.classes().selfDataContainerClass).attr('transform', d => 'translate(' + (d.x2 + d.x1 - 10) * (1-properties.sizeOfTextAndObjects) / 2 + ',' + (d.y2 + d.y1 - 10) * (1-properties.sizeOfTextAndObjects) / 2 + ')scale(' + properties.sizeOfTextAndObjects + ')');

    //d3.selectAll('.' + LineMeasure.classes().selfRectSvgClass).attr('transform', d => 'translate(' + (d.x2 + d.x1 - 10) * (1-properties.sizeOfTextAndObjects) / 2 + ',' + (d.y2 + d.y1 - 10) * (1-properties.sizeOfTextAndObjects) / 2 + ')scale(' + properties.sizeOfTextAndObjects + ')');
    //d3.selectAll('.' + LineMeasure.classes().selfTextSvgClass).attr('transform', d => 'translate(' + (d.x2 + d.x1 - 10) * (1-properties.sizeOfTextAndObjects) / 2 + ',' + (d.y2 + d.y1 - 10) * (1-properties.sizeOfTextAndObjects) / 2 + ')scale(' + properties.sizeOfTextAndObjects + ')');
    //d3.selectAll('.' + LineMeasure.classes().selfSaveClass).attr('transform', d => 'translate(' + (d.x2 + d.x1 - 10) * (1-properties.sizeOfTextAndObjects) / 2 + ',' + (d.y2 + d.y1 +50) * (1-properties.sizeOfTextAndObjects) / 2 + ')scale(' + properties.sizeOfTextAndObjects + ')');
  }

  fitViewportToData() {
    var scale = 1.0;
    if(this.displayData.xMin == Number.POSITIVE_INFINITY ||
      this.displayData.xMax == Number.NEGATIVE_INFINITY ||
      this.displayData.yMin == Number.POSITIVE_INFINITY ||
      this.displayData.yMax == Number.NEGATIVE_INFINITY ) {
      console.log("Not enough data to calculate fitness");
      return;
    }

    var view = this.viewstore.getView();
    // Add 100px offset from borders
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

    var x = -(this.displayData.xMin)*scale;
    var y = -(this.displayData.yMin)*scale;

    window.setTimeout(function() {
        ViewActions.updateViewport(
          x,
          y,
          d3.select('svg').node().parentNode.offsetWidth,
          d3.select('svg').node().parentNode.offsetHeight,
          scale,
        true);
      },
      10);
  }

  updateViewport(x, y, scale, animate) {
      this.view.x = x;
      this.view.y = y;
      this.view.scale = scale;

      this.viewportTransition(animate);
  }

  displayShadow(data) {
    //console.log('displayShadow');
    //console.log(JSON.stringify(data));
    if(d3.select('#SHADOW').empty()) {
      d3.select('svg')
        .attr('pointer-events', 'all')
        .on('dragover', function(){D3FreeSpace.updateShadowPosition()});

      window.addEventListener('dragend', this._onEndDragFromInbox);

      d3.select('.' + Classes.OBJECTS_CONTAINER_CLASS)
        .append('g')
        .attr('id', 'SHADOW')
        .datum(data)
        .append('svg:image')
        .attr("x", 0)
        .attr("y", 0)
        .attr("height", d => d.displayHeight)
        .attr("width", d => d.displayWidth)
        //.attr("xlink:href", d => d.thumbnail)
        .style('opacity', 0.3);

      //var img = new Image();
      //img.onload = function () {
      //  d3.select('#SHADOW').select('image')
      //    .attr("height", this.height)
      //    .attr("width", this.width);
      //};
      //img.src = data.url;

      var appendShadowCallback = function (image) {
        d3.select('#SHADOW').select('image')
          .attr("xlink:href", image.src);
      };

      window.setTimeout(
        ViewActions.loadImage(data.thumbnail, appendShadowCallback.bind(this)),10);
    }
  }

  hideShadow() {
    d3.select('#SHADOW').remove();
    window.removeEventListener('dragend', this._onEndDragFromInbox);
    d3.select('svg')
      .on('dragover', null)
      .on('dragend', null);
  }

  fixShadow() {
    var shadow = d3.select('#SHADOW');
    var data = shadow.datum();
    var image = shadow.select('image');
    var x = parseInt(image.attr('x'))+50;
    var y = parseInt(image.attr('y'))+100;
    //console.log('setting shadow to location (' + x + ',' + y + ')');
    ViewActions.placeEntity(this.benchstore.getActiveViewId(),
      data.uid,
      x,
      y
    );
    this.hideShadow();
  }

//
// Internal methods
//

  static updateShadowPosition() {
    var container = d3.select('.' + Classes.OBJECTS_CONTAINER_CLASS);
    var coords = d3.mouse(container.node());
    //console.log('new shadow coords=' + JSON.stringify(coords));
    d3.select('#SHADOW').select('image')
      .attr('x', coords[0]-50)
      .attr('y', coords[1]-100);
  }

  static sendToMinimap(id) {
    var image = d3.select('#IMAGE-' + id);
    if(!image.empty()) {
      var url = image.attr("xlink:href");
      var width = image.datum().displayWidth;
      var height = image.datum().displayHeight;
      var x = image.datum().x;
      var y = image.datum().y;
      if(url && width != null && height !=null  && x != null && y != null) {
        MinimapActions.initMinimap(url, width, height, x, y);
        return;
      }
    }
    window.setTimeout((function(id) {
      return function() {
        D3FreeSpace.sendToMinimap(id);
      }
    })(id), 500);
  }

  viewportTransition(animate) {
    // if the new zoom level is above a certain value, replace thumbnails with full-size images if available
    if(this.view.scale > 0.1 && this.imageSourceLevel != 1) {
      //console.log("Switch to full scale images");
      this.switchImageSources(1);
    }
    else if(this.view.scale < 0.1 && this.imageSourceLevel != 2) {
      //console.log("Switch to thumbnail images");
      this.switchImageSources(2);
    }

    this.zoom.translate([this.view.x, this.view.y]);
    this.zoom.scale(this.view.scale);

    if(animate) {
      d3.select('.' + Classes.ROOT_CLASS)
        .transition()
        .duration(1000)
        .ease('linear')
        .attr('transform', 'translate(' + this.view.x + "," + this.view.y + ")scale(" + this.view.scale + ')');

      d3.selectAll('.' + Classes.RESIZE_CLASS)
        .transition()
        .duration(1000)
        .ease('linear')
        .attr('width', d => 5 / this.view.scale * d.height / d.displayHeight)
        .attr('height', d => 5 / this.view.scale * d.height / d.displayHeight)
        .style('stroke-width', d => 1 / this.view.scale * d.height / d.displayHeight);

      d3.selectAll('.' + Classes.MOVE_CLASS)
        .transition()
        .duration(1000)
        .ease('linear')
        .attr('y', d => -5 / this.view.scale * d.height / d.displayHeight)
        .attr('width', d => 5 / this.view.scale * d.height / d.displayHeight)
        .attr('height', d => 5 / this.view.scale * d.height / d.displayHeight)
        .style('stroke-width', d => 1 / this.view.scale * d.height / d.displayHeight);
    }
    else {
      d3.select('.' + Classes.ROOT_CLASS)
        .attr('transform', 'translate(' + this.view.x + "," + this.view.y + ")scale(" + this.view.scale + ')');

      d3.selectAll('.' + Classes.RESIZE_CLASS)
        .attr('width', d => 5 / this.view.scale * d.height / d.displayHeight)
        .attr('height', d => 5 / this.view.scale * d.height / d.displayHeight)
        .style('stroke-width', d => 1 / this.view.scale * d.height / d.displayHeight);

      d3.selectAll('.' + Classes.MOVE_CLASS)
        .attr('y', d => -5 / this.view.scale * d.height / d.displayHeight)
        .attr('width', d => 5 / this.view.scale * d.height / d.displayHeight)
        .attr('height', d => 5 / this.view.scale * d.height / d.displayHeight)
        .style('stroke-width', d => 1 / this.view.scale * d.height / d.displayHeight);
    }
  }

  switchImageSources(level) {
    var paramName = null;
    switch(level) {
      case 1:
        paramName = 'url';
        break;
      case 2:
        paramName = 'thumbnail';
        break;
      default:
        console.warn('Unknown image source level ' + level);
        paramName = 'url';
        break;
    }

    this.imageSourceLevel = level;
    d3.selectAll('.' + Classes.CHILD_GROUP_CLASS).select('.' + Classes.IMAGE_CLASS)
      .attr('xlink:href', d => d[paramName] ? d[paramName] : d.url);
  }

  drawChildEntities() {
    //console.log('drawChildEntities');

    var self = this;
    let group = d3.select('.' + Classes.OBJECTS_CONTAINER_CLASS);
    var viewData = this.buildDisplayDataElement();
    if(!viewData) {
      return;
    }
    //console.log(JSON.stringify(viewData));

    this.loadData = {};
    this.loadData.imagesToLoad = viewData.displays.length;
    this.loadData.imagesLoaded = 0;

    D3ViewUtils.drawBenchData(viewData.displays, this);

    for(var i = 0; i < viewData.displays.length; ++i) {
      var element = viewData.displays[i];
      //console.log('------');
      //console.log('url=' + element.url);
      //console.log('thumbnail=' + element.thumbnail);
      window.setTimeout(this.loadImage.bind(self, element), 10);
    }

    if(this.loadData.imagesLoaded >= this.loadData.imagesToLoad) {
      D3FreeSpace.endLoad();
    }

    if(this.viewId != this.benchstore.getActiveViewId()) {
      this.viewId = this.benchstore.getActiveViewId();
      this.fitViewportToData();
    }
  }

  buildDisplayDataElement() {
    var viewData = JSON.parse(JSON.stringify(this.benchstore.getActiveViewData()));
    //console.log(JSON.stringify(viewData));
    if(viewData) {
      for(var j = 0; j < viewData.displays.length; ++j) {
        var posEntity = viewData.displays[j];
        //console.log('posEntity =' +JSON.stringify(posEntity));
        if (posEntity.x != null && posEntity.y != null) {
          this.displayData.xMin = Math.min(this.displayData.xMin, posEntity.x - 60);
          this.displayData.yMin = Math.min(this.displayData.yMin, posEntity.y - 60);

          this.displayData.xMax = Math.max(posEntity.displayWidth + posEntity.x + 20, this.displayData.xMax);
          this.displayData.yMax = Math.max(posEntity.displayHeight + posEntity.y + 20, this.displayData.yMax);
        }
        var entityMetadata = this.benchstore.getData(posEntity.entity);
        //console.log('entityMetadata =' +JSON.stringify(entityMetadata));
        if(entityMetadata) {
          Object.keys(entityMetadata).forEach(function (key) {
            viewData.displays[j][key] = entityMetadata[key];
          });

          for(var i = 0; i < posEntity.tois.length; ++i) {
              posEntity.tois[i] = this.benchstore.getData(posEntity.tois[i]);
          }

          for(i = 0; i < posEntity.pois.length; ++i) {
              posEntity.pois[i] = this.benchstore.getData(posEntity.pois[i]);

          }

          for(i = 0; i < posEntity.rois.length; ++i) {
            posEntity.rois[i] = this.benchstore.getData(posEntity.rois[i]);
          }
        }
      }
      //console.log(JSON.stringify(viewData));
      return viewData;
    }

    return null;
  }

  static endLoad() {
    //window.setTimeout(function() {
    //  ViewActions.changeLoaderState('Chargement terminé')},10);

    window.setTimeout(function() {
      ViewActions.changeLoaderState(null)},20);
  }

  loadImage(elt) {
    //console.log('loadImage');
    //console.log('url=' + elt.url);
    //console.log('thumb=' + elt.thumbnail);
    //console.log('------');
    var self = this;
    var displayLoadedImageCallback = function (image) {
      //console.log('loaded ' + image.src);
      var group = d3.selectAll("." + Classes.CHILD_GROUP_CLASS);

      group.select("#IMAGE-" + elt.link)
        .attr("xlink:href", image.src);

      this.loadData.imagesLoaded += 1;
      window.setTimeout(function() {
        ViewActions.changeLoaderState('Chargement des images en cours... ' + self.loadData.imagesLoaded + '/' + self.loadData.imagesToLoad )},10);

      if(this.loadData.imagesLoaded >= this.loadData.imagesToLoad) {
        D3FreeSpace.endLoad();
      }
    };

    window.setTimeout(
      (function(url) {
        return ViewActions.loadImage(url, displayLoadedImageCallback.bind(self));
      })(elt.thumbnail),
      10);
  }

  findObjectsAtCoords(coordinatesFromD3Origin) {
    var objects = {
      images: [],
      pois: [],
      rois: [],
      tois: []
    };
    if(!this.benchstore) {
      // Component not even mounted yet
      console.error("Visualisation component not mounted");
      return objects;
    }
    var benchstore = this.benchstore;
    var coordinatesFromWindow = [
      coordinatesFromD3Origin[0]+this.viewstore.getView().leftFromWindow,
      coordinatesFromD3Origin[1]+this.viewstore.getView().topFromWindow
    ];

    // Find images, use images to narrow search
    var groups = d3.selectAll('.' + Classes.CHILD_GROUP_CLASS);
    groups.each(
      function(d, i) {
        var box = d3.select(this).node().getBoundingClientRect();

        if(Globals.isCoordsInBoundingBox(coordinatesFromWindow, box)) {
          objects.images.push(d.link);
          // Process objects in sheet
          var metadata = benchstore.getData(d.entity);
          if(metadata) {
            // Find polygons
            if (metadata.rois) {
              for (var m = 0; m < metadata.rois.length; ++m) {
                var polygon = metadata.rois[m];
                var polygonBox = d3.select('#ROI-' + polygon).node().getBoundingClientRect();
                if (Globals.isCoordsInBoundingBox(coordinatesFromWindow, polygonBox)) {
                  if (objects.rois.indexOf(polygon) < 0) {
                    objects.rois.push(polygon);
                  }
                }
              }
            }

            // Find paths
            if (metadata.tois) {
              for (var j = 0; j < metadata.tois.length; ++j) {
                var path = metadata.tois[j];
                var pathBox = d3.select('#PATH-' + path).node().getBoundingClientRect();
                if (Globals.isCoordsInBoundingBox(coordinatesFromWindow, pathBox)) {
                  if (objects.tois.indexOf(path) < 0) {
                    objects.tois.push(path);
                  }
                }
              }
            }

            // Find points
            if (metadata.pois) {
              for (var n = 0; n < metadata.pois.length; ++n) {
                var poi = metadata.pois[n];
                var poiBox = d3.select('#POI-' + poi).node().getBoundingClientRect();
                if (Globals.isCoordsInBoundingBox(coordinatesFromWindow, poiBox)) {
                  if (objects.pois.indexOf(poi) < 0) {
                    objects.pois.push(poi);
                  }
                }
              }
            }
          }
        }
      }
    );
    return objects;
  }

  leftClick(self) {
    var coords = d3.mouse(this);
    var objectsAtEvent = self.findObjectsAtCoords.call(self, coords);
    //console.log(JSON.stringify(objectsAtEvent));
    var inspectorObjects = [];
    Array.prototype.push.apply(inspectorObjects, objectsAtEvent.images);
    Array.prototype.push.apply(inspectorObjects, objectsAtEvent.pois);
    Array.prototype.push.apply(inspectorObjects, objectsAtEvent.rois);
    Array.prototype.push.apply(inspectorObjects, objectsAtEvent.tois);
    window.setTimeout(InspectorActions.setInspectorData.bind(null, inspectorObjects), 10);
    if(objectsAtEvent.images.length > 0) {
      window.setTimeout(ViewActions.changeSelection.bind(null, objectsAtEvent.images[objectsAtEvent.images.length - 1], {type: TypeConstants.image}), 10);
    }
    d3.event.preventDefault();
  }

  contextMenu(self) {
    d3.event.preventDefault();
    var coords = d3.mouse(this);
    var objectsAtEvent = self.findObjectsAtCoords(coords);
    //console.log(JSON.stringify(objectsAtEvent));
    MenuActions.displayContextMenu(d3.event.clientX, d3.event.clientY, objectsAtEvent);
  }

}

export default D3FreeSpace;