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

    // Register a reaction to an action.
    AppDispatcher.register((action) => {
      switch (action.actionType) {
        case MetadataConstants.ActionTypes.LOAD_LAB_BENCH:
          if(action.id) {
            console.log('loading bench ' + action.id);
              this.labBench = {};
              this.loadBench(action.id);
          }
          else {
            console.log('unloading bench');
            this.labBench = {};
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
          this.reloadBenchFrom(action.id);
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
    var displayedStuff = this.labBench.views[this.activeView].displays;
    for(var i = 0; i < displayedStuff.length; ++i) {
      if(displayedStuff[i].link == id || displayedStuff[i].entity == id) {
        return JSON.parse(JSON.stringify(displayedStuff[i]));
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

  reloadBenchFrom(id) {
    if(this.labBench.id == id) {
      this.toLoad = 1;
      this.loaded = 0;
      this.loadBench(this.labBench.id);
    }
    else if(this.labBench.subSets[id]) {
      this.toLoad = 1;
      this.loaded = 0;
      this.loadSubSet(id);
    }
    else if(this.labBench.images[id]) {
      this.toLoad = 1;
      this.loaded = 0;
      this.loadItem(id);
    }
    else if(this.labBench.specimens[id]) {
      this.toLoad = 1;
      this.loaded = 0;
      this.loadItem(id);
    }
    else if(this.labBench.views[id]) {
      this.toLoad = 1;
      this.loaded = 0;
      this.loadView(id);
    }
    else if(this.labBench.rois[id]) {
      this.toLoad = 1;
      this.loaded = 0;
      this.loadRoI(id);
    }
    else if(this.labBench.pois[id]) {
      this.toLoad = 1;
      this.loaded = 0;
      this.loadPoI(id);
    }
    else if(this.labBench.tois[id]) {
      this.toLoad = 1;
      this.loaded = 0;
      this.loadToI(id);
    }
    else if(this.labBench.measureStandards[id]) {
      this.toLoad = 1;
      this.loaded = 0;
      this.loadMeasureStandard(id);
    }
    else if(this.labBench.measurements[id]) {
      this.toLoad = 1;
      this.loaded = 0;
      this.loadMeasurement(id);
    }
    else {
      this.toLoad = 1;
      this.loaded = 0;
      this.loadBench(this.labBench.id);
    }
  }

  loadBench(setId) {
    this.labBench.id = setId;
    window.setTimeout(
      MetadataActions.updateMetadata.bind(null, setId), 10);
    console.log('load bench');
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
          this.toLoad = studySet.items.length + 1;

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

          studySet.subsets.forEach(function(subsetId) {
            self.loadSubSet(subsetId);
          });
          studySet.items.forEach(function(itemId) {
            self.loadItem(itemId);
          });
          this.loadView(studySet.view);
        }
      });
  }

  loadSubSet(id) {
    window.setTimeout(MetadataActions.updateMetadata.bind(null, id), 10);

    request.get(conf.actions.databaseActions.getData)
      .query({id: id})
      .withCredentials()
      .end((err, res) => {
        if(err) {
          console.error('Could not load set ' + setId + ': ' + err);
          alert('Impossible de charger la paillasse, veuillez réessayer plus tard');
        }
        else {
          this.labBench.subSets[id] = JSON.parse(res.text);
        }
        this.loaded++;
        this.onLoadingDone();
      });
  }

  loadView(id) {
    window.setTimeout(MetadataActions.updateMetadata.bind(null, id), 10);
    request.get(conf.actions.databaseActions.getData)
      .query({id: id})
      .withCredentials()
      .end((err, res) => {
        if(err) {
          console.error('Could not load set ' + setId + ': ' + err);
          alert('Impossible de charger la paillasse, veuillez réessayer plus tard');
        }
        else {
          console.log(res.text);
          this.labBench.views[id] = JSON.parse(res.text);
          this.activeView = id;
          this.emit(ViewEvents.ACTIVE_VIEW_CHANGE);
        }
        this.loaded++;
        this.onLoadingDone();
      });
  }

  loadItem(id) {
    window.setTimeout(MetadataActions.updateMetadata.bind(null, id), 10);
    var self = this;
    request.get(conf.actions.databaseActions.getData)
      .query({id: id})
      .withCredentials()
      .end((err, res) => {
        if(err) {
          console.error('Could not load item ' + id + ': ' + err);
          alert('Impossible de charger la paillasse, veuillez réessayer plus tard');
        }
        else {
          var item = JSON.parse(res.text);

          switch(item.type) {
            case 'Image':
              this.labBench.images[id] = item;

              this.toLoad += item.rois.length + item.pois.length + item.tois.length + item.scales.length;

              item.rois.forEach(function(roiId) {
                self.loadRoI(roiId);
              });
              item.pois.forEach(function(poiId) {
                self.loadPoI(poiId);
              });
              item.tois.forEach(function(toiId) {
                self.loadToI(toiId);
              });
              item.scales.forEach(function(scaleId) {
                self.loadMeasureStandard(scaleId);
              });
              break;
            case 'Specimen':
              this.labBench.specimens[id] = item;
              this.toLoad += item.images.length;
              item.images.forEach(function(imageId) {
                self.loadItem(imageId);
              });
              break;
            default:
              break;
          }
        }
        this.loaded++;
        this.onLoadingDone();
      });
  }

  loadRoI(id) {
    window.setTimeout(MetadataActions.updateMetadata.bind(id), 10);
    var self = this;
    request.get(conf.actions.databaseActions.getData)
      .query({id: id})
      .withCredentials()
      .end((err, res) => {
        if(err) {
          console.error('Could not load RoI ' + id + ': ' + err);
          alert('Impossible de charger la paillasse, veuillez réessayer plus tard');
        }
        else {
          var roi = JSON.parse(res.text);
          console.log(res.text);
          this.toLoad += roi.measurements.length;
          this.labBench.rois[id] = roi;
          roi.measurements.forEach(function(measureId) {
            self.loadMeasurement(measureId);
          });
        }
        this.loaded++;
        this.onLoadingDone();
      });
  }

  loadPoI(id) {
    window.setTimeout(MetadataActions.updateMetadata.bind(id), 10);

    request.get(conf.actions.databaseActions.getData)
      .query({id: id})
      .withCredentials()
      .end((err, res) => {
        if(err) {
          console.error('Could not load PoI ' + id + ': ' + err);
          alert('Impossible de charger la paillasse, veuillez réessayer plus tard');
        }
        else {
          this.labBench.pois[id] = JSON.parse(res.text);
        }
        this.loaded++;
        this.onLoadingDone();
      });
  }

  loadToI(id) {
    window.setTimeout(MetadataActions.updateMetadata.bind(null, id), 10);
    var self = this;
    request.get(conf.actions.databaseActions.getData)
      .query({id: id})
      .withCredentials()
      .end((err, res) => {
        if(err) {
          console.error('Could not load RoI ' + id + ': ' + err);
          alert('Impossible de charger la paillasse, veuillez réessayer plus tard');
        }
        else {
          var toi = JSON.parse(res.text);
          this.toLoad += toi.measurements.length;
          this.labBench.tois[id] = toi;
          toi.measurements.forEach(function(measureId) {
            self.loadMeasurement(measureId);
          });
        }
        this.loaded++;
        this.onLoadingDone();
      });
  }

  loadMeasureStandard(id) {
    window.setTimeout(MetadataActions.updateMetadata.bind(null, id), 10);
    request.get(conf.actions.databaseActions.getData)
      .query({id: id})
      .withCredentials()
      .end((err, res) => {
        if(err) {
          console.error('Could not load RoI ' + id + ': ' + err);
          alert('Impossible de charger la paillasse, veuillez réessayer plus tard');
        }
        else {
          this.labBench.measureStandards[id] = JSON.parse(res.text);
        }
        this.loaded++;
        this.onLoadingDone();
      });
  }

  loadMeasurement(id) {
    window.setTimeout(MetadataActions.updateMetadata.bind(null, id), 10);
    request.get(conf.actions.databaseActions.getData)
      .query({id: id})
      .withCredentials()
      .end((err, res) => {
        if(err) {
          console.error('Could not load RoI ' + id + ': ' + err);
          alert('Impossible de charger la paillasse, veuillez réessayer plus tard');
        }
        else {
          this.labBench.measurements[id] = JSON.parse(res.text);
        }
        this.loaded++;
        this.onLoadingDone();
      });


  }

  onLoadingDone() {
    console.log('loaded ' + this.loaded + '/' + this.toLoad);
    if(this.isLoaded()) {
      this.emit(MetadataEvents.LAB_BENCH_READY);
    }
  }

  isLoaded() {
    return this.toLoad == this.loaded;
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