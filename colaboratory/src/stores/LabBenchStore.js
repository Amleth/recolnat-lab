/**
 * Created by dmitri on 08/04/16.
 */
'use strict';

import {EventEmitter} from 'events';
import request from 'superagent';

import AppDispatcher from '../dispatcher/AppDispatcher';

import MetadataConstants from '../constants/MetadataConstants';
import ViewConstants from '../constants/ViewConstants';

import MetadataEvents from './events/MetadataEvents';
import ViewEvents from './events/ViewEvents';

import MetadataActions from '../actions/MetadataActions';
import ViewActions from '../actions/ViewActions';

import conf from '../conf/ApplicationConfiguration';

class LabBenchStore extends EventEmitter {
  constructor() {
    super();
    this.activeView = null;
    this.labBench = {};
    this.toLoad = 0;
    this.loaded = 0;
    this.allElementIds = [];

    // Register a reaction to an action.
    AppDispatcher.register((action) => {
      switch (action.actionType) {
        case MetadataConstants.ActionTypes.LOAD_LAB_BENCH:
          if(action.id) {
            console.log('loading bench ' + action.id);
              this.labBench = {};
              this.allElementIds = [];
              this.loadBench(action.id);
          }
          else {
            console.log('unloading bench');
            this.labBench = {};
            this.allElementIds = [];
            this.emit(MetadataEvents.LAB_BENCH_READY);
          }
          break;
        case ViewConstants.ActionTypes.Server.VIEW_SET_DISPLAYED_SET:
          if(action.id != this.labBench.id) {
            window.setTimeout(function() {
              ViewActions.changeLoaderState("Chargement en cours.")}, 1);
            this.labBench.id = action.id;
            this.emit(ViewEvents.ACTIVE_SET_CHANGE);
          }

          break;
        case ViewConstants.ActionTypes.Local.SET_ACTIVE_VIEW:
          if(this.activeView != action.id) {
            this.activeView = action.id;
            this.emit(ViewEvents.ACTIVE_VIEW_CHANGE);
          }
          break;
        case MetadataConstants.ActionTypes.UPDATE_LAB_BENCH:
        if(this.labBench.id) {
          this.allElementIds = [];
          if(action.id) {
          this.reloadBenchFrom(action.id);
        }
        else {
          this.reloadBenchFrom(this.labBench.id);
        }
        }
          break;
        default:
          //console.log('selected=' + JSON.stringify(this.selection));
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
    // Get RoI or ToI corresponding to measure.
    if(this.labBench.measurements[measureId]) {
      var thingOfInterestId = this.labBench.measurements[measureId].parents[0];

var imageId = null;
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

  reloadBenchFrom(id) {
    if(this.labBench.id == id) {
      this.toLoad = 1;
      this.loaded = 0;
      this.loadBench(this.labBench.id);
    }
    else if(this.labBench.subSets[id]) {
      this.toLoad = 1;
      this.loaded = 0;
      this.loadSubSets([id]);
    }
    else if(this.labBench.images[id]) {
      this.toLoad = 1;
      this.loaded = 0;
      this.loadItems([id]);
    }
    else if(this.labBench.specimens[id]) {
      this.toLoad = 1;
      this.loaded = 0;
      this.loadItems([id]);
    }
    else if(this.labBench.views[id]) {
      this.toLoad = 1;
      this.loaded = 0;
      this.loadView(id);
    }
    else if(this.labBench.rois[id]) {
      this.toLoad = 1;
      this.loaded = 0;
      this.loadRoIs([id]);
    }
    else if(this.labBench.pois[id]) {
      this.toLoad = 1;
      this.loaded = 0;
      this.loadPoIs([id]);
    }
    else if(this.labBench.tois[id]) {
      this.toLoad = 1;
      this.loaded = 0;
      this.loadToIs([id]);
    }
    else if(this.labBench.measureStandards[id]) {
      this.toLoad = 1;
      this.loaded = 0;
      this.loadMeasureStandards([id]);
    }
    else if(this.labBench.measurements[id]) {
      this.toLoad = 1;
      this.loaded = 0;
      this.loadMeasurements([id]);
    }
    else {
      this.toLoad = 1;
      this.loaded = 0;
      this.loadBench(this.labBench.id);
    }
  }

  loadBench(setId) {
    this.allElementIds.push(setId);
    this.labBench.id = setId;
    //window.setTimeout(
    //  MetadataActions.updateMetadata.bind(null, setId), 10);
    this.loaded = 0;
    this.toLoad = 0;
    var self = this;
    request.get(conf.actions.setServiceActions.getSet)
      .query({id: setId})
      .withCredentials()
      .end((err, res) => {
        if(err) {
          console.error('Could not load set ' + setId + ': ' + err);
          alert('Impossible de charger la paillasse, veuillez réessayer plus tard');
        }
        else {
          var studySet = JSON.parse(res.text);
          //this.toLoad = studySet.items.length + 1;

          this.labBench.subSets = {};
          this.labBench.images = {};
          this.labBench.specimens = {};
          this.labBench.views = {};
          this.labBench.rois = {};
          this.labBench.pois = {};
          this.labBench.tois = {};
          this.labBench.measureStandards = {};
          this.labBench.measurements = {};
          this.labBench.metadata = studySet;

          this.toLoad = 3;
          this.loadSubSets(studySet.subsets);
          this.loadItems(studySet.items.map(function (item) {return item.uid}));
          //studySet.subsets.forEach(function(subsetId) {
          //  self.loadSubSet(subsetId);
          //});
          //studySet.items.forEach(function(itemId) {
          //  self.loadItem(itemId);
          //});
          this.loadView(studySet.view);
        }
      });
  }

  loadSubSets(linksAndIds) {
    //window.setTimeout(MetadataActions.updateMetadata.bind(null, id), 10);


    var ids = [];
    for(var i = 0; i < linksAndIds.length; ++i) {
      ids.push(linksAndIds[i].uid);
    }
    Array.prototype.push.apply(this.allElementIds, ids);

    request.post(conf.actions.databaseActions.getData)
      .send(ids)
      .withCredentials()
      .end((err, res) => {
        if(err) {
          console.error('Could not load set ' + ids + ': ' + err);
          alert('Impossible de charger la paillasse, veuillez réessayer plus tard');
        }
        else {
          var metadatas = JSON.parse(res.text);
          for(var i =0; i < metadatas.length; ++i) {
            var metadata = metadatas[i];
            this.labBench.subSets[metadata.uid] = metadata;
          }

        }
        this.loaded++;
        this.onLoadingDone();
      });
  }

  loadView(id) {
    //window.setTimeout(MetadataActions.updateMetadata.bind(null, id), 10);
    Array.prototype.push.apply(this.allElementIds, [id]);

    request.post(conf.actions.databaseActions.getData)
      .send([id])
      .withCredentials()
      .end((err, res) => {
        if(err) {
          console.error('Could not load set ' + id + ': ' + err);
          alert('Impossible de charger la paillasse, veuillez réessayer plus tard');
        }
        else {
          //console.log(res.text);
          this.labBench.views[id] = JSON.parse(res.text)[0];
          this.activeView = id;
          this.emit(ViewEvents.ACTIVE_VIEW_CHANGE);
        }
        this.loaded++;
        this.onLoadingDone();
      });
  }

  loadItems(ids) {
    //window.setTimeout(MetadataActions.updateMetadata.bind(null, id), 10);
    Array.prototype.push.apply(this.allElementIds, ids);
    var self = this;
    request.post(conf.actions.databaseActions.getData)
      .send(ids)
      .withCredentials()
      .end((err, res) => {
        if(err) {
          console.error('Could not load items ' + ids + ': ' + err);
          alert('Impossible de charger la paillasse, veuillez réessayer plus tard');
        }
        else {
          var items = JSON.parse(res.text);
          for(var i = 0;  i < items.length; ++i) {
            var item = items[i];
            switch(item.type) {
              case 'Image':
                this.labBench.images[item.uid] = item;

                if(item.rois.length > 0) {
                  this.loadRoIs(item.rois);
                  this.toLoad++;
                }
                if(item.pois.length > 0) {
                  this.loadPoIs(item.pois);
                  this.toLoad++;
                }
                if(item.tois.length > 0) {
                  this.loadToIs(item.tois);
                  this.toLoad++;
                }
                if(item.scales.length > 0) {
                  this.loadMeasureStandards(item.scales);
                  this.toLoad++;
                }
                window.setTimeout(ViewActions.loadImage.bind(null, item.thumbnail), 10);
                break;
              case 'Specimen':
                this.labBench.specimens[item.uid] = item;
                if(item.images.length > 0) {
                  this.toLoad++;
                  this.loadItems(item.images);
                }
                break;
              default:
                break;
            }
          }
        }
        this.loaded++;
        this.onLoadingDone();
      });
  }

  loadRoIs(ids) {
    //window.setTimeout(MetadataActions.updateMetadata.bind(id), 10);
    Array.prototype.push.apply(this.allElementIds, ids);
    var self = this;
    request.post(conf.actions.databaseActions.getData)
      .send(ids)
      .withCredentials()
      .end((err, res) => {
        if(err) {
          console.error('Could not load RoI ' + ids + ': ' + err);
          alert('Impossible de charger la paillasse, veuillez réessayer plus tard');
        }
        else {
          var rois = JSON.parse(res.text);
          console.log(res.text);
          for(var i = 0; i < rois.length; ++i) {
            var roi = rois[i];
            this.labBench.rois[roi.uid] = roi;
            if(roi.measurements.length > 0) {
              this.toLoad++;
              this.loadMeasurements(roi.measurements);
            }
          }

        }
        this.loaded++;
        this.onLoadingDone();
      });
  }

  loadPoIs(ids) {
    //window.setTimeout(MetadataActions.updateMetadata.bind(id), 10);
    Array.prototype.push.apply(this.allElementIds, ids);

    request.post(conf.actions.databaseActions.getData)
      .send(ids)
      .withCredentials()
      .end((err, res) => {
        if(err) {
          console.error('Could not load PoIs ' + ids + ': ' + err);
          alert('Impossible de charger la paillasse, veuillez réessayer plus tard');
        }
        else {
          var pois = JSON.parse(res.text);
          for(var i = 0; i < pois.length; ++i) {
            var poi = pois[i];
            this.labBench.pois[poi.uid] = poi;
          }
        }
        this.loaded++;
        this.onLoadingDone();
      });
  }

  loadToIs(ids) {
    //window.setTimeout(MetadataActions.updateMetadata.bind(null, id), 10);
    Array.prototype.push.apply(this.allElementIds, ids);

    var self = this;
    request.post(conf.actions.databaseActions.getData)
      .send(ids)
      .withCredentials()
      .end((err, res) => {
        if(err) {
          console.error('Could not load ToIs ' + ids + ': ' + err);
          alert('Impossible de charger la paillasse, veuillez réessayer plus tard');
        }
        else {
          var tois = JSON.parse(res.text);
          for(var i = 0; i < tois.length; ++i) {
            var toi = tois[i];
            this.labBench.tois[toi.uid] = toi;
            if(toi.measurements.length> 0) {
              this.toLoad++;
              this.loadMeasurements(toi.measurements);
            }
          }
        }
        this.loaded++;
        this.onLoadingDone();
      });
  }

  loadMeasureStandards(ids) {
    //window.setTimeout(MetadataActions.updateMetadata.bind(null, id), 10);
    Array.prototype.push.apply(this.allElementIds, ids);

    request.post(conf.actions.databaseActions.getData)
      .send(ids)
      .withCredentials()
      .end((err, res) => {
        if(err) {
          console.error('Could not load standards ' + ids + ': ' + err);
          alert('Impossible de charger la paillasse, veuillez réessayer plus tard');
        }
        else {
          var standards = JSON.parse(res.text);
          for(var i = 0; i < standards.length; ++i) {
            var standard = standards[i];
            this.labBench.measureStandards[standard.uid] = standard;
          }
        }
        this.loaded++;
        this.onLoadingDone();
      });
  }

  loadMeasurements(ids) {
    //window.setTimeout(MetadataActions.updateMetadata.bind(null, id), 10);
    Array.prototype.push.apply(this.allElementIds, ids);

    request.post(conf.actions.databaseActions.getData)
      .send(ids)
      .withCredentials()
      .end((err, res) => {
        if(err) {
          console.error('Could not load measurements  ' + ids + ': ' + err);
          alert('Impossible de charger la paillasse, veuillez réessayer plus tard');
        }
        else {
          var measurements = JSON.parse(res.text);
          for(var i = 0; i < measurements.length; ++i) {
            var measurement = measurements[i];
            this.labBench.measurements[measurement.uid] = measurement;
          }
        }
        this.loaded++;
        this.onLoadingDone();
      });
  }

  onLoadingDone() {
    window.setTimeout(ViewActions.changeLoaderState.bind(null, this.loaded  + '/' + this.toLoad + ' éléments chargés'), 10);
    console.log('loaded ' + this.loaded + '/' + this.toLoad);
    if(this.isLoaded()) {
      window.setTimeout(MetadataActions.updateMetadata.bind(null, this.allElementIds), 500);
      window.setTimeout(ViewActions.changeLoaderState.bind(null, null), 50);
      this.emit(MetadataEvents.LAB_BENCH_READY);
    }
  }

  isLoaded() {
    return this.toLoad <= this.loaded;
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
