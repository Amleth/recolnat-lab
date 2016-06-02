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
import ViewConstants from '../constants/ViewConstants';

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
    this.imageSourceLevel = ViewConstants.imageQuality.Low;
    this.loadData = {
      imagesToLoad: 0,
      imagesLoaded: 0
    };
    this.visibleImages = [];

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

// Check visible images every second and reload if necessary
      window.setInterval(this.updateVisibleImages.bind(this), 1500);
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
    this.imageSourceLevel = ViewConstants.imageQuality.Low;
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

  updateVisibleImages() {
    // Calculate visible images and load if necessary
    // console.log('before=' + JSON.stringify(this.visibleImages));
    var visibleImagesAfter = [];
    var quality = this.imageSourceLevel;
    // var urlParamName = this.getImageUrlParamName();
    var self = this;
    d3.selectAll('.' + Classes.CHILD_GROUP_CLASS).each(function(d) {
      var box = this.getBoundingClientRect();
      if(Globals.isElementInViewport(box)) {
        var url = D3ViewUtils.getImageUrlFromQuality(d, quality);
        visibleImagesAfter.push(url);
        if(!_.contains(self.visibleImages, url)) {
          console.log('loading image ' + url);
          self.loadImage(d);
        }
      }
    });
    // console.log('after=' + JSON.stringify(visibleImagesAfter));
    // console.log("visible images " + visibleImagesAfterMove.length);
    this.visibleImages = visibleImagesAfter;
  }

  viewportTransition(animate) {
    // If image quality is not at a certain level for the given scale, change image quality.
    if(this.view.scale < 0.05 && this.imageSourceLevel != ViewConstants.imageQuality.Low) {
      //console.log("Switch to thumbnail images");
      this.switchImageSources(ViewConstants.imageQuality.Low);
    }
    else if(this.view.scale > 0.05 && this.view.scale < 0.2 && this.imageSourceLevel != ViewConstants.imageQuality.High) {
      //console.log("Switch to high quality images");
      this.switchImageSources(ViewConstants.imageQuality.High);
    }
    else if(this.view.scale > 0.2 && this.imageSourceLevel != ViewConstants.imageQuality.Original) {
//console.log("Switch to full scale images");
      this.switchImageSources(ViewConstants.imageQuality.Original);
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
    this.imageSourceLevel = level;
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

    // if(this.loadData.imagesLoaded >= this.loadData.imagesToLoad) {
    //   D3FreeSpace.endLoad();
    // }

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

  // getImageUrlParamName() {
  //   switch(this.imageSourceLevel) {
  //     case 1:
  //       return 'url';
  //     case 2:
  //       return 'thumbnail';
  //     default:
  //       return 'url';
  //   }
  // }

  loadImage(elt) {
    //console.log('loadImage');
    //console.log('url=' + elt.url);
    //console.log('thumb=' + elt.thumbnail);
    //console.log('------');
    // var self = this;

    var source = D3ViewUtils.getImageUrlFromQuality(elt, this.imageSourceLevel);
    // switch(this.imageSourceLevel) {
    //   case 1:
    //   source = elt.url;
    //   break;
    //   case 2:
    //   source = elt.thumbnail;
    //   break;
    //   default:
    //   source = elt.thumbnail;
    // }

    window.setTimeout(
        ViewActions.loadImage.bind(null, source, D3ViewUtils.displayLoadedImage.bind(null, elt))
      ,
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
        var group = d3.select(this);
        var box = group.node().getBoundingClientRect();

        if(Globals.isCoordsInBoundingBox(coordinatesFromWindow, box)) {
          objects.images.push(d);
          // Process objects in sheet
          group.selectAll('.' + Classes.ROI_CLASS).each(function(d) {
            var roi = d3.select(this).node().getBoundingClientRect();
            if (Globals.isCoordsInBoundingBox(coordinatesFromWindow, roi)) {
                objects.rois.push(d);
            }
          });

          group.selectAll('.' + Classes.PATH_CLASS).each(function(d) {
            var path = d3.select(this).node().getBoundingClientRect();
            if (Globals.isCoordsInBoundingBox(coordinatesFromWindow, path)) {
                objects.tois.push(d);
            }
          });

          group.selectAll('.' + Classes.POI_CLASS).each(function(d) {
            var poi = d3.select(this).node().getBoundingClientRect();
            if (Globals.isCoordsInBoundingBox(coordinatesFromWindow, poi)) {
                objects.pois.push(d);
            }
          });
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
    var getIds = function(data) {return data.uid};
    Array.prototype.push.apply(
      inspectorObjects, objectsAtEvent.images.map(getIds));
    Array.prototype.push.apply(inspectorObjects, objectsAtEvent.pois.map(getIds));
    Array.prototype.push.apply(inspectorObjects, objectsAtEvent.rois.map(getIds));
    Array.prototype.push.apply(inspectorObjects, objectsAtEvent.tois.map(getIds));
    console.log('inspectorObjects=' + JSON.stringify(inspectorObjects));

    window.setTimeout(InspectorActions.setInspectorData.bind(null, inspectorObjects), 10);

    if(objectsAtEvent.images.length > 0) {
      window.setTimeout(ViewActions.changeSelection.bind(null, objectsAtEvent.images[objectsAtEvent.images.length - 1].link, {type: TypeConstants.image}), 10);
    }
    d3.event.preventDefault();
  }

  contextMenu(self) {
    d3.event.preventDefault();
    var coords = d3.mouse(this);
    var objectsAtEvent = self.findObjectsAtCoords(coords);
    var contextMenuObjects = {
      images: [],
      rois: [],
      tois: [],
      pois: []
    };
    var buildContextMenuElement = function (elt) {
      return {
        parent: self.viewId,
        link: elt.link,
        data: {
          uid: elt.uid
        }
      };
    }
    Array.prototype.push.apply(contextMenuObjects.images, objectsAtEvent.images.map(buildContextMenuElement));
    Array.prototype.push.apply(contextMenuObjects.pois, objectsAtEvent.pois.map(buildContextMenuElement));
    Array.prototype.push.apply(contextMenuObjects.rois, objectsAtEvent.rois.map(buildContextMenuElement));
    Array.prototype.push.apply(contextMenuObjects.tois, objectsAtEvent.tois.map(buildContextMenuElement));
    //console.log(JSON.stringify(objectsAtEvent));
    MenuActions.displayContextMenu(d3.event.clientX, d3.event.clientY, contextMenuObjects);
  }

}

export default D3FreeSpace;
