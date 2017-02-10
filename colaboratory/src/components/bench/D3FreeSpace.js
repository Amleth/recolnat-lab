'use strict';

import {EventEmitter} from 'events';
import d3 from 'd3';

import ViewActions from '../../actions/ViewActions.js';
import MinimapActions from "../../actions/MinimapActions.js";
import ToolActions from "../../actions/ToolActions.js";
import MenuActions from '../../actions/MenuActions';
import InspectorActions from '../../actions/InspectorActions';

import Classes from '../../constants/CommonSVGClasses';
import TypeConstants from '../../constants/TypeConstants';
import ViewConstants from '../../constants/ViewConstants';

import D3ViewUtils from '../../utils/D3ViewUtils';
import Globals from '../../utils/Globals';

class D3FreeSpace {
  constructor() {
    this.zoom = d3.behavior.zoom()
      //.scaleExtent([0.1, 100])
      .on('zoom', () => {
        if(d3.event.defaultPrevented) return;
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
    this.view.scale = 0.01;
    this.metadatastore = null;
    this.benchstore = null;
    this.viewstore = null;
    this.modestore = null;
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
      yMax: Number.NEGATIVE_INFINITY
    };

// Check visible images every second and reload if necessary
//     window.setInterval(this.updateVisibleImages.bind(this), 1500);
  }

  create(el, props) {
    this.el = el;

    let self = this;
    let svg = d3.select(el).append('svg')
      .attr('width', props.width)
      .attr('height', props.height)
      .on('contextmenu', function(d,i) {
        self.contextMenu.call(this, self);
      })
      .on('click', function(d,i) {
        if (d3.event.button == 0 && !d3.event.defaultPrevented) {
          d3.event.preventDefault();
          self.leftClick.call(this, self);
        }
      })
      .on('dragover', function(d, i) {
        d3.event.preventDefault();
      })
      .call(this.zoom)
      .style('cursor', 'default');

    let defs = svg.append('defs');
    let dropShadowFilter = defs.append('filter')
      .attr('id', 'drop-shadow')
      .attr('height', '130%');
    dropShadowFilter.append("feGaussianBlur")
      .attr("in", "SourceAlpha")
      .attr("stdDeviation", 5)
      .attr("result", "blur");
    dropShadowFilter.append("feOffset")
      .attr("in", "blur")
      .attr("dx", 5)
      .attr("dy", 5)
      .attr("result", "offsetBlur");
    let feMerge = dropShadowFilter.append("feMerge");
    feMerge.append("feMergeNode")
      .attr("in", "offsetBlur");
    feMerge.append("feMergeNode")
      .attr("in", "SourceGraphic");


    let root = svg.append('g').attr('class', Classes.ROOT_CLASS);
    root.attr('transform', 'translate(' + this.view.x + "," + this.view.y + ")scale(" + this.view.scale + ')');
    root.append('g').attr('class', Classes.OBJECTS_CONTAINER_CLASS);
    root.append('g').attr('class', Classes.ACTIVE_TOOL_DISPLAY_CLASS);

  }

  // External methods
  unload() {
    this.clearDisplay();
    this.visibleImages = [];
  }

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

  setModeStore(store) {
    this.modestore = store;
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

  fitViewportToData() {
    let view = this.viewstore.getView();

    D3ViewUtils.zoomToObject('.' + Classes.ROOT_CLASS, view);
  }

  updateViewport(x, y, scale, animate) {
    if(x && Number.isFinite(x)) {
      this.view.x = x;
    }
    if(y && Number.isFinite(y)) {
      this.view.y = y;
    }
    if(scale && Number.isFinite(scale)) {
      this.view.scale = scale;
    }

    this.viewportTransition(animate);
  }

  displayShadow(data) {
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

      let appendShadowCallback = function (image) {
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
    let shadow = d3.select('#SHADOW');
    let data = shadow.datum();
    let image = shadow.select('image');
    let x = parseInt(image.attr('x'))+50;
    let y = parseInt(image.attr('y'))+100;
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
    let container = d3.select('.' + Classes.OBJECTS_CONTAINER_CLASS);
    let coords = d3.mouse(container.node());
    //console.log('new shadow coords=' + JSON.stringify(coords));
    d3.select('#SHADOW').select('image')
      .attr('x', coords[0]-50)
      .attr('y', coords[1]-100);
  }

  static sendToMinimap(id) {
    let image = d3.select('#IMAGE-' + id);
    if(!image.empty()) {
      let url = image.attr("xlink:href");
      let width = image.datum().displayWidth;
      let height = image.datum().displayHeight;
      let x = image.datum().x;
      let y = image.datum().y;
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
    // console.log("updateVisibleImages");
    let storeview = this.viewstore.getView();
    let view = {
      xMin: -storeview.left/storeview.scale,
      xMax: (-storeview.left + window.innerWidth)/storeview.scale,
      yMin: -storeview.top/storeview.scale,
      yMax: (-storeview.top + window.innerHeight)/storeview.scale
    };

    let viewData = this.buildDisplayDataElement(view);
    if(!viewData) {
      return;
    } else {
      D3ViewUtils.drawBenchData(viewData.displays, this);
    }
    // Calculate visible images and load if necessary
    // console.log('before=' + JSON.stringify(this.visibleImages));
    let visibleImagesAfter = [];
    let self = this;


    d3.selectAll('.' + Classes.CHILD_GROUP_CLASS).each(function(d) {
      // let box = this.getBoundingClientRect();
      // if(Globals.isElementInViewport(box)) {
      if(D3ViewUtils.isElementInView(d, view)) {
        // let url = D3ViewUtils.getImageUrlFromQuality(d, quality);
        let url = D3ViewUtils.getImageUrlFromVisibleProportion(d, view);
        visibleImagesAfter.push(url);
        if(!_.contains(self.visibleImages, url)) {
          //console.log('loading image ' + url);
          window.setTimeout(
            ViewActions.loadImage.bind(null, url, D3ViewUtils.displayLoadedImage.bind(null, d)),
            10);
          // self.loadImage(d);
        }
      }
    });


    // console.log('after=' + JSON.stringify(visibleImagesAfter));
    // console.log("visible images " + visibleImagesAfterMove.length);
    this.visibleImages = visibleImagesAfter;
  }

  viewportTransition(animate) {
    this.updateVisibleImages();

    this.zoom.translate([this.view.x, this.view.y]);
    this.zoom.scale(this.view.scale);

    if(animate) {
      d3.select('.' + Classes.ROOT_CLASS)
        .transition()
        .duration(1000)
        .ease('linear')
        .attr('transform', 'translate(' + this.view.x + "," + this.view.y + ")scale(" + this.view.scale + ')');
    }
    else {
      d3.select('.' + Classes.ROOT_CLASS)
        .attr('transform', 'translate(' + this.view.x + "," + this.view.y + ")scale(" + this.view.scale + ')');
    }
  }

  drawChildEntities() {
    let viewData = this.redrawChildEntities();

    // let self = this;
    // for(let i = 0; i < viewData.displays.length; ++i) {
    //   let element = viewData.displays[i];
    //   window.setTimeout(this.loadImage.bind(self, element), 10);
    // }

    if(this.viewId != this.benchstore.getActiveViewId()) {
      this.viewId = this.benchstore.getActiveViewId();
      this.fitViewportToData();
    }
  }

  redrawChildEntities() {
    let viewData = this.buildDisplayDataElement();
    if(!viewData) {
      return null;
    }
    D3ViewUtils.drawBenchData(viewData.displays, this);

    return viewData;
  }

  buildDisplayDataElement(iView) {
    let viewData = this.benchstore.getActiveViewData();

    let view = iView;
    if(!iView) {
      let storeview = this.viewstore.getView();
      view = {
        xMin: -storeview.left / storeview.scale,
        xMax: (-storeview.left + storeview.width) / storeview.scale,
        yMin: -storeview.top / storeview.scale,
        yMax: (-storeview.top + storeview.height) / storeview.scale
      };
    }
    //console.log(JSON.stringify(viewData));
    if(viewData) {
      for(let j = viewData.displays.length-1; j >= 0; --j) {
        let posEntity = viewData.displays[j];
        //console.log('posEntity =' +JSON.stringify(posEntity));
        if (posEntity.x != null && posEntity.y != null) {
          this.displayData.xMin = Math.min(this.displayData.xMin, posEntity.x - 60);
          this.displayData.yMin = Math.min(this.displayData.yMin, posEntity.y - 60);

          this.displayData.xMax = Math.max(posEntity.displayWidth + posEntity.x + 20, this.displayData.xMax);
          this.displayData.yMax = Math.max(posEntity.displayHeight + posEntity.y + 20, this.displayData.yMax);
        }
        let entityMetadata = this.benchstore.getData(posEntity.entity);
        //console.log('entityMetadata =' +JSON.stringify(entityMetadata));
        if(entityMetadata) {
          Object.keys(entityMetadata).forEach(function (key) {
            // viewData.displays[j][key] = entityMetadata[key];
            posEntity[key] = entityMetadata[key];
          });

          if(D3ViewUtils.isElementInView(posEntity, view) && (posEntity.displayHeight) / (view.yMax - view.yMin) > 0.4) {
            // console.log("Entity is visible: " + posEntity.uid);
            for (let i = posEntity.tois.length; i > -1; --i) {
              if (this.benchstore.getData(posEntity.tois[i])) {
                posEntity.tois[i] = this.benchstore.getData(posEntity.tois[i]);
              }
              else {
                posEntity.tois.splice(i, 1);
              }
            }

            for (let i = posEntity.pois.length; i > -1; --i) {
              if (this.benchstore.getData(posEntity.pois[i])) {
                posEntity.pois[i] = this.benchstore.getData(posEntity.pois[i]);
              }
              else {
                posEntity.pois.splice(i, 1);
              }

            }

            for (let i = posEntity.rois.length; i > -1; --i) {
              if (this.benchstore.getData(posEntity.rois[i])) {
                posEntity.rois[i] = this.benchstore.getData(posEntity.rois[i]);
              }
              else {
                posEntity.rois.splice(i, 1);
              }
            }
            for (let i = posEntity.aois.length; i > -1; --i) {
              if (this.benchstore.getData(posEntity.aois[i])) {
                posEntity.aois[i] = this.benchstore.getData(posEntity.aois[i]);
              }
              else {
                posEntity.aois.splice(i, 1);
              }
            }
          }
          else {
            // console.log("Entity is not visible: " + posEntity.uid);
            posEntity.tois = [];
            posEntity.rois = [];
            posEntity.aois = [];
            posEntity.pois = [];
          }
        }
        else {
          // No image data available for this, might mean the image was deleted from set but not from view
          viewData.displays.splice(j, 1);
        }
      }
      //console.log(JSON.stringify(viewData));
      return viewData;
    }

    return null;
  }

  static endLoad() {
    window.setTimeout(function() {
      ViewActions.changeLoaderState(null)},20);
  }

  loadImage(elt) {
    let storeview = this.viewstore.getView();
    let view = {
      xMin: -storeview.left / storeview.scale,
      xMax: (-storeview.left + storeview.width) / storeview.scale,
      yMin: -storeview.top / storeview.scale,
      yMax: (-storeview.top + storeview.height) / storeview.scale
    };
    // let source = D3ViewUtils.getImageUrlFromQuality(elt, ViewConstants.imageQuality.Low);
    let source = D3ViewUtils.getImageUrlFromVisibleProportion(elt, view);

    window.setTimeout(
      ViewActions.loadImage.bind(null, source, D3ViewUtils.displayLoadedImage.bind(null, elt))
      ,
      10);
  }

  findObjectsAtCoords(coordinatesFromD3Origin) {
    let objects = {
      images: [],
      aois: [],
      pois: [],
      rois: [],
      tois: []
    };
    if(!this.benchstore) {
      // Component not even mounted yet
      console.error("Visualisation component not mounted");
      return objects;
    }
    let benchstore = this.benchstore;
    let coordinatesFromWindow = [
      coordinatesFromD3Origin[0]+this.viewstore.getView().leftFromWindow,
      coordinatesFromD3Origin[1]+this.viewstore.getView().topFromWindow
    ];

    // Find images, use images to narrow search
    let groups = d3.selectAll('.' + Classes.CHILD_GROUP_CLASS);
    groups.each(
      function(d, i) {
        let group = d3.select(this);
        let box = group.node().getBoundingClientRect();

        if(Globals.isCoordsInBoundingBox(coordinatesFromWindow, box)) {
          objects.images.push(d);
          // Process objects in sheet
          group.selectAll('.' + Classes.ROI_CLASS).each(function(d) {
            let roi = d3.select(this).node().getBoundingClientRect();
            if (Globals.isCoordsInBoundingBox(coordinatesFromWindow, roi)) {
              objects.rois.push(d);
            }
          });

          group.selectAll('.' + Classes.PATH_CLASS).each(function(d) {
            let path = d3.select(this).node().getBoundingClientRect();
            if (Globals.isCoordsInBoundingBox(coordinatesFromWindow, path)) {
              objects.tois.push(d);
            }
          });

          group.selectAll('.' + Classes.POI_CLASS).each(function(d) {
            let poi = d3.select(this).node().getBoundingClientRect();
            if (Globals.isCoordsInBoundingBox(coordinatesFromWindow, poi)) {
              objects.pois.push(d);
            }
          });

          group.selectAll('.' + Classes.AOI_CLASS).each(function(d) {
            let aoi = d3.select(this).node().getBoundingClientRect();
            if (Globals.isCoordsInBoundingBox(coordinatesFromWindow, aoi)) {
              objects.aois.push(d);
            }
          });
        }
      }
    );
    return objects;
  }

  leftClick(self) {
    let coords = d3.mouse(this);
    let objectsAtEvent = self.findObjectsAtCoords.call(self, coords);
    //console.log(JSON.stringify(objectsAtEvent));
    let inspectorObjects = [];
    let getIds = function(data) {return data.uid};
    Array.prototype.push.apply(inspectorObjects, objectsAtEvent.pois.map(getIds));
    Array.prototype.push.apply(inspectorObjects, objectsAtEvent.aois.map(getIds));
    Array.prototype.push.apply(inspectorObjects, objectsAtEvent.tois.map(getIds));
    Array.prototype.push.apply(inspectorObjects, objectsAtEvent.rois.map(getIds));
    if(inspectorObjects.length == 0) {
      Array.prototype.push.apply(
        inspectorObjects, objectsAtEvent.images.map(getIds));
    }
    if(inspectorObjects.length == 0 && this.benchstore) {
      inspectorObjects.push(this.benchstore.getActiveSetId());
    }

    //console.log('inspectorObjects=' + JSON.stringify(inspectorObjects));

    window.setTimeout(InspectorActions.setInspectorData.bind(null, inspectorObjects), 10);

    if(objectsAtEvent.images.length > 0) {
      window.setTimeout(ViewActions.changeSelection.bind(null, objectsAtEvent.images[objectsAtEvent.images.length - 1].link, {type: TypeConstants.image}), 10);
    }


    window.setTimeout(InspectorActions.setSetInAnnotationList.bind(null, self.benchstore.getActiveSetId()), 10);
    if(objectsAtEvent.images.length > 0) {
      window.setTimeout(InspectorActions.setImageInAnnotationList.bind(null, objectsAtEvent.images[0].uid), 10);
    }

    d3.event.preventDefault();
  }

  contextMenu(self) {
    if(d3.event.defaultPrevented) {
      return;
    }
    d3.event.preventDefault();
    let coords = d3.mouse(this);
    let objectsAtEvent = self.findObjectsAtCoords(coords);
    let contextMenuObjects = {
      images: [],
      aois: [],
      rois: [],
      tois: [],
      pois: []
    };
    let buildContextMenuElement = function (elt) {
      return {
        parent: self.viewId,
        link: elt.link,
        data: {
          uid: elt.uid
        }
      };
    };
    Array.prototype.push.apply(contextMenuObjects.images, objectsAtEvent.images.map(buildContextMenuElement));
    Array.prototype.push.apply(contextMenuObjects.pois, objectsAtEvent.pois.map(buildContextMenuElement));
    Array.prototype.push.apply(contextMenuObjects.rois, objectsAtEvent.rois.map(buildContextMenuElement));
    Array.prototype.push.apply(contextMenuObjects.aois, objectsAtEvent.aois.map(buildContextMenuElement));
    Array.prototype.push.apply(contextMenuObjects.tois, objectsAtEvent.tois.map(buildContextMenuElement));
    //console.log(JSON.stringify(objectsAtEvent));
    window.setTimeout(MenuActions.displayContextMenu.bind(null, d3.event.clientX, d3.event.clientY, contextMenuObjects), 10);
  }

}

export default D3FreeSpace;
