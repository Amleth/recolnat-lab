/**
 * Created by dmitri on 08/04/16.
 */
'use strict';

import {EventEmitter} from 'events';
import React from 'react';

import AppDispatcher from '../dispatcher/AppDispatcher';

import MetadataConstants from '../constants/MetadataConstants';
import ViewConstants from '../constants/ViewConstants';
import ServerConstants from '../constants/ServerConstants';

import MetadataEvents from './events/MetadataEvents';
import ViewEvents from './events/ViewEvents';

import MetadataActions from '../actions/MetadataActions';
import ViewActions from '../actions/ViewActions';

import conf from '../conf/ApplicationConfiguration';

class LabBenchStore extends EventEmitter {
  constructor(socket) {
    super();
    this.activeView = null;
    this.labBench = {};
    this.ids = {};
    this.socket = socket;

    // Register a reaction to an action.
    AppDispatcher.register((action) => {
      switch (action.actionType) {
        case MetadataConstants.ActionTypes.SET_LAB_BENCH:
          console.log('setting bench ' + action.id);
          this.removeListeners();
          delete this.labBench;
          delete this.ids;

          this.labBench = {};
          this.labBench.id = action.id;
          this.labBench.subSets = {};
          // this one is only to avoid the cost of merging .images and .specimens for certain operations
          this.labBench.items = {};
          this.labBench.images = {};
          this.labBench.specimens = {};
          this.labBench.views = {};
          this.labBench.aois = {};
          this.labBench.rois = {};
          this.labBench.pois = {};
          this.labBench.tois = {};
          this.labBench.measureStandards = {};
          this.labBench.measurements = {};

          this.ids = {};
          this.ids.subSets = [];
          this.ids.items = [];
          this.ids.views = [];
          this.ids.aois = [];
          this.ids.rois = [];
          this.ids.pois = [];
          this.ids.tois = [];
          this.ids.measureStandards = [];
          this.ids.measurements = [];

          this.activeView = null;
          this.emit(MetadataEvents.LAB_BENCH_READY);
          break;
        case MetadataConstants.ActionTypes.LOAD_LAB_BENCH:
          this.loadNewBench(this.labBench.id);
          break;
        case ViewConstants.ActionTypes.Local.SET_ACTIVE_VIEW:
          if(this.activeView != action.id) {
            this.activeView = action.id;
            this.emit(ViewEvents.ACTIVE_VIEW_CHANGE);
          }
          break;
        default:
          break;
      }
    });
  }

  getData(id) {
    if(this.labBench.id == id) {
      return JSON.parse(JSON.stringify(this.labBench.metadata));
    }
    if(this.labBench.subSets[id]) {
      return JSON.parse(JSON.stringify(this.labBench.subSets[id]));
    }
    if(this.labBench.images[id]) {
      return JSON.parse(JSON.stringify(this.labBench.images[id]));
    }
    if(this.labBench.specimens[id]) {
      return JSON.parse(JSON.stringify(this.labBench.specimens[id]));
    }
    if(this.labBench.views[id]) {
      return JSON.parse(JSON.stringify(this.labBench.views[id]));
    }
    if(this.labBench.rois[id]) {
      return JSON.parse(JSON.stringify(this.labBench.rois[id]));
    }
    if(this.labBench.aois[id]) {
      return JSON.parse(JSON.stringify(this.labBench.aois[id]));
    }
    if(this.labBench.pois[id]) {
      return JSON.parse(JSON.stringify(this.labBench.pois[id]));
    }
    if(this.labBench.tois[id]) {
      return JSON.parse(JSON.stringify(this.labBench.tois[id]));
    }
    if(this.labBench.measureStandards[id]) {
      return JSON.parse(JSON.stringify(this.labBench.measureStandards[id]));
    }
    if(this.labBench.measurements[id]) {
      return JSON.parse(JSON.stringify(this.labBench.measurements[id]));
    }
    return null;
  }

  getDisplayData(id) {
    if(this.labBench) {
      if (this.labBench.views && this.activeView) {
        var displayedStuff = this.labBench.views[this.activeView].displays;
        for (var i = 0; i < displayedStuff.length; ++i) {
          if (displayedStuff[i].link == id || displayedStuff[i].entity == id) {
            return JSON.parse(JSON.stringify(displayedStuff[i]));
          }
        }
      }
    }

    return null;
  }

  getLabBench() {
    return JSON.parse(JSON.stringify(this.labBench));
  }

  getViews() {
    return JSON.parse(JSON.stringify(this.labBench.views));
  }

  getActiveViewId() {
    return this.activeView;
  }

  getActiveViewData() {
    if(this.activeView) {
      return JSON.parse(JSON.stringify(this.labBench.views[this.activeView]));
    }
    return null;
  }

  getActiveSetId() {
    return this.labBench.id;
  }

  getMeasureStandardForMeasure(measureId) {
    // Get RoI or ToI or AoI corresponding to measure.
    if(this.labBench.measurements[measureId]) {
      var thingOfInterestId = this.labBench.measurements[measureId].parents[0];

      var imageId = null;
      if(this.labBench.aois[thingOfInterestId]) {
        imageId = this.labBench.aois[thingOfInterestId].parents[0];
      }
      if(this.labBench.rois[thingOfInterestId]) {
        imageId = this.labBench.rois[thingOfInterestId].parents[0];
      }
      else if(this.labBench.tois[thingOfInterestId]) {
        imageId = this.labBench.tois[thingOfInterestId].parents[0];
      }
      else {
        console.warn('No thing of interest corresponding to id ' + thingOfInterestId);
        return null;
      }
      var mmPerPixel = Globals.getEXIFScalingData(this.labBench.images[imageId]);
      return mmPerPixel;
    }
    return null;
  }

  loadNewBench(setId) {
    //this.allElementIds.push(setId);

    this.loading = true;

    this.socket.addResourceListener(setId, this.receiveBench.bind(this), 10);
  }

  receiveBench(resource) {
    if(resource) {
      this.labBench.metadata = resource;

      this.loadSubSets(resource.subsets);
      this.loadItems(resource.items.map(function (item) {return item.uid}));
      this.loadView(resource.view);
    }
    else {
      console.error('Could not load set ' + this.labBench.id + ': ' + JSON.stringify(resource));
      alert('Impossible de charger la paillasse, veuillez réessayer plus tard');

      this.socket.removeResourceListener(this.labBench.id, this.receiveBench.bind(this), 10);
      this.labBench = {};
    }

    this.onLoadingDone();
  }

  loadSubSets(linksAndIds) {
    for(var i = 0; i < linksAndIds.length; ++i) {
      if(!_.contains(this.ids.subSets, linksAndIds[i].uid)) {
        this.socket.addResourceListener(linksAndIds[i].uid, this.subSetLoaded.bind(this), 10);
        this.ids.subSets.push(linksAndIds[i].uid);
      }
    }
  }

  subSetLoaded(resource) {
    if(resource) {
      if(resource.forbidden) {
        delete this.labBench.subSets[resource.uid];
        this.ids.subSets.splice(this.ids.subSets.indexOf(resource.uid), 1);
      }
      else {
        this.labBench.subSets[resource.uid] = resource;
      }
    }
    else {
      console.error('Could not load sub-set ' + JSON.stringify(resource));
    }
    this.onLoadingDone();
  }

  loadView(id) {
    if(!_.contains(this.ids.views, id)) {
      this.socket.addResourceListener(id, this.viewLoaded.bind(this), 10);
      this.ids.views.push(id);
    }
  }

  viewLoaded(view) {
    if(view) {
      if(view.forbidden) {
        delete this.labBench.views[view.uid];
        this.ids.views.splice(this.ids.views.indexOf(view.uid), 1);
      }
      else {
        this.labBench.views[view.uid] = view;
        this.activeView = view.uid;
        this.emit(ViewEvents.ACTIVE_VIEW_CHANGE);
      }
    }
    else {
      console.error('Could not load view ' + JSON.stringify(view));
    }
    this.onLoadingDone();
  }

  loadItems(ids) {
    console.log(JSON.stringify(ids));
    console.log(JSON.stringify(this.labBench));
    console.log(JSON.stringify(this.ids));
    for(var i = 0; i < ids.length; ++i) {
      if(!_.contains(this.ids.items, ids[i])) {
        this.socket.addResourceListener(ids[i], this.itemLoaded.bind(this), 10);
        this.ids.items.push(ids[i]);
      }
    }
  }

  itemLoaded(item) {
    this.labBench.items[item.uid] = item;
    if(item) {
      if(item.forbidden) {
        if(this.labBench.images[item.uid]) {
          delete this.labBench.images[item.uid];
          delete this.labBench.items[item.uid];
          this.ids.items.splice(this.ids.items.indexOf(item.uid), 1);
        }
        if(this.labBench.specimens[item.uid]) {
          delete this.labBench.specimens[item.uid];
          delete this.labBench.items[item.uid];
          this.ids.items.splice(this.ids.items.indexOf(item.uid), 1);
        }
      }
      else {
        switch (item.type) {
          case 'Image':
            this.labBench.images[item.uid] = item;
            if (item.aois.length > 0) {
              this.loadAoIs(item.aois);
            }
            if (item.rois.length > 0) {
              this.loadRoIs(item.rois);
            }
            if (item.pois.length > 0) {
              this.loadPoIs(item.pois);
            }
            if (item.tois.length > 0) {
              this.loadToIs(item.tois);
            }
            if (item.scales.length > 0) {
              this.loadMeasureStandards(item.scales);
            }
            window.setTimeout(ViewActions.loadImage.bind(null, item.thumbnail), 10);
            break;
          case 'Specimen':
            this.labBench.specimens[item.uid] = item;
            if (item.images.length > 0) {
              this.loadItems(item.images);
            }
            break;
          default:
            break;
        }
      }
    }
    else {
      console.error('Could not load item ' + JSON.stringify(item));
    }
    this.onLoadingDone();
  }

  loadAoIs(ids) {
    for(var i = 0; i < ids.length; ++i) {
      if(!_.contains(this.ids.aois, ids[i])) {
        this.socket.addResourceListener(ids[i], this.aoiLoaded.bind(this), 10);
        this.ids.aois.push(ids[i]);
      }
    }
  }

  aoiLoaded(aoi) {
    if(aoi) {
      if(aoi.forbidden) {
        delete this.labBench.aois[aoi.uid];
        this.ids.aois.splice(this.ids.aois.indexOf(aoi.uid), 1);
      }
      else {
        this.labBench.aois[aoi.uid] = aoi;
        if (aoi.measurements.length > 0) {
          this.loadMeasurements(aoi.measurements);
        }
      }
    }
    else {
      console.error('Could not load AoI ' + JSON.stringify(aoi));
    }
    this.onLoadingDone();
  }

  loadRoIs(ids) {
    for(var i = 0; i < ids.length; ++i) {
      if(!_.contains(this.ids.rois, ids[i])) {
        this.socket.addResourceListener(ids[i], this.roiLoaded.bind(this), 10);
        this.ids.rois.push(ids[i]);
      }
    }
  }

  roiLoaded(roi) {
    if(roi) {
      if(roi.forbidden) {
        delete this.labBench.rois[roi.uid];
        this.ids.rois.splice(this.ids.rois.indexOf(roi.uid), 1);
      }
      else {
        this.labBench.rois[roi.uid] = roi;
        if (roi.measurements.length > 0) {
          this.loadMeasurements(roi.measurements);
        }
      }
    }
    else {
      console.error('Could not load RoI ' + JSON.stringify(roi));
    }
    this.onLoadingDone();
  }

  loadPoIs(ids) {
    for(var i = 0; i < ids.length; ++i) {
      if(!_.contains(this.ids.pois, ids[i])) {
        this.socket.addResourceListener(ids[i], this.poiLoaded.bind(this), 10);
        this.ids.pois.push(ids[i]);
      }
    }
  }

  poiLoaded(poi) {
    if(poi) {
      if(poi.forbidden) {
        delete this.labBench.pois[poi.uid];
        this.ids.pois.splice(this.ids.pois.indexOf(poi.uid), 1);
      }
      else {
        this.labBench.pois[poi.uid] = poi;
      }
    }
    else {
      console.error('Could not load PoI ' + JSON.stringify(poi));
    }
    this.onLoadingDone();
  }

  loadToIs(ids) {
    for(var i = 0; i < ids.length; ++i) {
      if(!_.contains(this.ids.tois, ids[i])) {
        this.socket.addResourceListener(ids[i], this.toiLoaded.bind(this), 10);
        this.ids.tois.push(ids[i]);
      }
    }
  }

  toiLoaded(toi) {
    if(toi) {
      if(toi.forbidden) {
        delete this.labBench.tois[toi.uid];
        this.ids.tois.splice(this.ids.tois.indexOf(toi.uid), 1);
      }
      else {
        this.labBench.tois[toi.uid] = toi;
        if (toi.measurements.length > 0) {
          this.loadMeasurements(toi.measurements);
        }
      }
    }
    else {
      console.error('Could not load ToI ' + JSON.stringify(toi));
    }
    this.onLoadingDone();
  }

  loadMeasureStandards(ids) {
    for(var i = 0; i < ids.length; ++i) {
      if(!_.contains(this.ids.measureStandards, ids[i])) {
        this.socket.addResourceListener(ids[i], this.standardLoaded.bind(this), 10);
        this.ids.measureStandards.push(ids[i]);
      }
    }
  }

  standardLoaded(standard) {
    if(standard) {
      if(standard.forbidden) {
        delete this.labBench.measureStandards[standard.uid];
        this.ids.measureStandards.splice(this.ids.measureStandards.indexOf(standard.uid), 1);
      }
      else {
        this.labBench.measureStandards[standard.uid] = standard;
      }
    }
    else {
      console.error('Could not load measure standard ' + JSON.stringify(standard));
    }
    this.onLoadingDone();
  }

  loadMeasurements(ids) {
    for(var i = 0; i < ids.length; ++i) {
      if(!_.contains(this.ids.measurements, ids[i])) {
        this.socket.addResourceListener(ids[i], this.measurementLoaded.bind(this), 10);
        this.ids.measurements.push(ids[i]);
      }
    }
  }

  measurementLoaded(measurement) {
    if(measurement) {
      if(measurement.forbidden) {
        delete this.labBench.measurements[measurement.uid];
        this.ids.measurements.splice(this.ids.measurements.indexOf(measurement.uid), 1);
      }
      else {
        this.labBench.measurements[measurement.uid] = measurement;
      }
    }
    else {
      console.error('Could not load measurement ' + JSON.stringify(item));
    }
    this.onLoadingDone();
  }

  removeListeners() {
    if(this.labBench.id) {
      this.socket.removeResourceListener(this.labBench.id, this.receiveBench.bind(this), 10);
    }
    if(this.ids) {
      if(this.ids.subSets) {
        for (var i = 0; i < this.ids.subSets.length; ++i) {
          this.socket.removeResourceListener(this.ids.subSets[i], this.subSetLoaded.bind(this), 10);
        }
      }
      if(this.ids.items) {
        for (i = 0; i < this.ids.items.length; ++i) {
          this.socket.removeResourceListener(this.ids.items[i], this.itemLoaded.bind(this), 10);
        }
      }
      if(this.ids.views) {
        for (i = 0; i < this.ids.views.length; ++i) {
          this.socket.removeResourceListener(this.ids.views[i], this.viewLoaded.bind(this), 10);
        }
      }
      if(this.ids.aois) {
        for (i = 0; i < this.ids.aois.length; ++i) {
          this.socket.removeResourceListener(this.ids.aois[i], this.aoiLoaded.bind(this), 10);
        }
      }
      if(this.ids.rois) {
        for (i = 0; i < this.ids.rois.length; ++i) {
          this.socket.removeResourceListener(this.ids.rois[i], this.roiLoaded.bind(this), 10);
        }
      }
      if(this.ids.pois) {
        for (i = 0; i < this.ids.pois.length; ++i) {
          this.socket.removeResourceListener(this.ids.pois[i], this.poiLoaded.bind(this), 10);
        }
      }
      if(this.ids.tois) {
        for (i = 0; i < this.ids.tois.length; ++i) {
          this.socket.removeResourceListener(this.ids.tois[i], this.toiLoaded.bind(this), 10);
        }
      }
      if(this.ids.measureStandards) {
        for (i = 0; i < this.ids.measureStandards.length; ++i) {
          this.socket.removeResourceListener(this.ids.measureStandards[i], this.standardLoaded.bind(this), 10);
        }
      }
      if(this.ids.measurements) {
        for (i = 0; i < this.ids.measurements.length; ++i) {
          this.socket.removeResourceListener(this.ids.measurements[i], this.measurementLoaded.bind(this), 10);
        }
      }
    }
  }

  onLoadingDone() {
    var totalLoaded = 1 +
      _.size(this.labBench.subSets) +
      _.size(this.labBench.items) +
      _.size(this.labBench.views) +
      _.size(this.labBench.rois) +
      _.size(this.labBench.aois) +
      _.size(this.labBench.pois) +
      _.size(this.labBench.tois) +
      _.size(this.labBench.measureStandards) +
      _.size(this.labBench.measurements);

    var totalToLoad = 1 +
      this.ids.subSets.length +
      this.ids.items.length +
      this.ids.views.length +
      this.ids.rois.length +
      this.ids.aois.length +
      this.ids.pois.length +
      this.ids.tois.length +
      this.ids.measureStandards.length +
      this.ids.measurements.length;

    //var loadingText = <div><p>Chargement en cours...</p> +
    //  'Sous-sets ' + _.size(this.labBench.subSets) + '/' + this.ids.subSets.length + '\n' +
    //  'Spécimens&Images ' + _.size(this.labBench.items) + '/' + this.ids.items.length + '\n' +
    //  'Vues ' + _.size(this.labBench.views) + '/' + this.ids.views.length + '\n' +
    //  'Zones ' + _.size(this.labBench.rois) + '/' + this.ids.rois.length + '\n' +
    //  'Angles ' + _.size(this.labBench.aois) + '/' + this.ids.aois.length + '\n' +
    //  'Points ' + _.size(this.labBench.pois) + '/' + this.ids.pois.length + '\n' +
    //  'Chemins ' + _.size(this.labBench.tois) + '/' + this.ids.tois.length + '\n' +
    //  'Mesures ' + _.size(this.labBench.measurements) + '/' + this.ids.measurements.length + '\n' +
    //  'Étalons ' + _.size(this.labBench.measureStandards) + '/' + this.ids.measureStandards.length</div>

    var loadingText = <div>Chargement en cours...<br/>
      <p>Sous-sets {_.size(this.labBench.subSets)}/{this.ids.subSets.length}<br />
        Spécimens&Images {_.size(this.labBench.items)}/{this.ids.items.length}<br />
        Vues {_.size(this.labBench.views)}/{this.ids.views.length}<br />
        Zones {_.size(this.labBench.rois)}/{this.ids.rois.length}<br />
        Angles {_.size(this.labBench.aois)}/{this.ids.aois.length}<br />
        Points {_.size(this.labBench.pois)}/{this.ids.pois.length}<br />
        Chemins {_.size(this.labBench.tois)}/{this.ids.tois.length}<br />
        Mesures {_.size(this.labBench.measurements)}/{this.ids.measurements.length}<br />
        Étalons {_.size(this.labBench.measureStandards)}/{this.ids.measureStandards.length}</p>
    </div>;

    window.setTimeout(ViewActions.changeLoaderState.bind(null, loadingText), 10);
    //window.setTimeout(ViewActions.changeLoaderState.bind(null, 'Chargement en cours... ' + totalLoaded + ' / ' + totalToLoad), 10);
    if(this.isLoaded()) {
      window.setTimeout(ViewActions.changeLoaderState.bind(null, null), 50);
      this.emit(MetadataEvents.LAB_BENCH_READY);
    }
  }

  isLoaded() {
    if(this.labBench) {
      if (this.labBench.metadata) {
        // Lab bench is loaded, check its parts
        if(!this.isDataComplete(this.ids.subSets, this.labBench.subSets)) {
          return false;
        }

        if(!this.isDataComplete(this.ids.items, this.labBench.items)) {
          return false;
        }

        if(!this.isDataComplete([this.labBench.metadata.view], this.labBench.views)) {
          return false;
        }

        if(!this.isDataComplete(this.ids.aois, this.labBench.aois)) {
          return false;
        }

        if(!this.isDataComplete(this.ids.rois, this.labBench.rois)) {
          return false;
        }

        if(!this.isDataComplete(this.ids.pois, this.labBench.pois)) {
          return false;
        }

        if(!this.isDataComplete(this.ids.tois, this.labBench.tois)) {
          return false;
        }

        if(!this.isDataComplete(this.ids.measureStandards, this.labBench.measureStandards)) {
          return false;
        }

        if(!this.isDataComplete(this.ids.measurements, this.labBench.measurements)) {
          return false;
        }
        return true;
      }
      if (!this.labBench.id) {
        // Bench is empty
        return true;
      }
    }
    return false;
  }

  isDataComplete(ids, data) {
    for(var i = 0; i < ids.length; ++i) {
      if(!data[ids[i]]) {
        return false;
      }
    }
    return true;
  }

  addLabBenchLoadListener(callback) {
    this.on(MetadataEvents.LAB_BENCH_READY, callback);
  }

  removeLabBenchLoadListener(callback) {
    this.removeListener(MetadataEvents.LAB_BENCH_READY, callback);
  }

  addActiveViewChangeListener(callback) {
    this.on(ViewEvents.ACTIVE_VIEW_CHANGE, callback);
  }

  removeActiveViewChangeListener(callback) {
    this.removeListener(ViewEvents.ACTIVE_VIEW_CHANGE, callback);
  }

  addActiveSetChangeListener(callback) {
    this.on(ViewEvents.ACTIVE_SET_CHANGE, callback);
  }

  removeActiveSetChangeListener(callback) {
    this.removeListener(ViewEvents.ACTIVE_SET_CHANGE, callback);
  }
}

export default LabBenchStore;
