/**
 * Created by dmitri on 12/10/16.
 */
'use strict';

import React from 'react';
//import select from 'select';
import Clipboard from 'clipboard';
import downloadCSV from 'download-csv';

import Globals from '../../utils/Globals';
import D3ViewUtils from '../../utils/D3ViewUtils';

import measureIcon from '../../images/measure.svg';
import polylineIcon from '../../images/polyline.png';
import angleIcon from '../../images/angle.svg';
import perimeterIcon from '../../images/perimeter.svg';
import areaIcon from '../../images/area.svg';
import pointIcon from '../../images/poi.svg';

class AnnotationList extends React.Component {
  constructor(props) {
    super(props);

    this.containerStyle = {
      padding: '5px 5px 5px 5px',
      borderColor: '#2185d0!important',
      height: this.props.height
      //overflow: 'hidden'
    };

    this.labelStyle = {
      position: 'relative',
      top: '-15px',
      left: '10px'
    };

    this.scrollerStyle = {
      height: this.props.height-35,
      overflowY: 'auto'
    };

    this.menuStyle = {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between'
    };

    this.typeMenuStyle = {
      display: 'flex',
      flexDirection: 'row'
    };

    this.menuOptionStyle = {
      margin: '2px 2px 2px 2px',
      padding: 0
    };

    this.upperButtonsStyle = {
      display: 'flex',
      flexDirection: 'row'
    };

    this.buttonStyle = {
      height: '30px',
      width: '30px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    };

    this.tableStyle = {

    };

    this.nothingStyle = {
      display: 'none'
    };

    this.iconButtonStyle = {
      margin: 0
    };

    this.cellStyle = {
      padding: 0,
      lineHeight: 1.2,
      //paddingLeft: 0,
      //paddingRight: 0,
      textAlign: 'center'
    };

    this.cellLfAlignStyle = {
      padding: 0,
      lineHeight: 1.2,
      //paddingLeft: 0,
      //paddingRight: 0,
      textAlign: 'left'
    };

    this._onMetadataUpdate = (id) => {
      const processMetadata = (id) => {
        let meta = this.props.metastore.getMetadataAbout(id);
        if(!meta) {
          return;
        }
        if(this.state.data[id]) {
          if (JSON.stringify(meta) === JSON.stringify(this.state.data[id])) {
            return;
          }
        }
        switch(meta.type) {
          case 'Set':
            this.receiveSet(id);
            break;
          case 'Specimen':
            this.receiveSpecimen(id);
            break;
          case 'Image':
            this.receiveImage(id);
            break;
          case 'PointOfInterest':
          case 'TrailOfInterest':
          case 'AngleOfInterest':
          case 'RegionOfInterest':
            this.receiveAnchor(id);
            break;
          case 'Annotation':
            if(meta.content === 'MeasureStandard') {
              this.receiveStandard(id);
            }
            else {
              this.receiveAnnotation(id);
            }
            break;
          default:
            console.warn('No handler for ' + meta.type);
        }
      };
      return processMetadata.apply(this, [id]);
    };

    this._onExternalMetadataUpdate = (id) => {
      const receiveExtMetadata = (id) => this.receiveSourceMetadata(id);
      return receiveExtMetadata.apply(this, [id]);
    };

    this._onEntitySelected = () => {
      const updateSelection = () => this.updateSelection(this.props.inspecstore.getAnnotationListSelection());
      return updateSelection.apply(this);
    };

    this._forceUpdate = () => {
      const update = () => this.setState({});
      return update.apply(this);
    };

    this.state = {
      selectedImageId: null,
      selectedSetId: null,
      display: 'measures',
      subject: 'set',
      buttons: {
        measures: 'active',
        tags: 'disabled',
        image: 'disabled',
        set: 'disabled'
      },
      data: {},
      extData: {},
      annotations: [],
      updateAnnotations: [],
      selection: {},
      tags: {},
      offset: 0,
      limit: this.props.height/12,
    };
  }

  updateSelection(selection) {
    this.setState({
      selectedSetId: selection.setId,
      selectedImageId: selection.imageId,
      selection: {},
      offset: 0,
      limit: this.props.height/12
    });

    switch(this.state.subject) {
      case 'image':
        this.removeListeners();
        this.props.metastore.addMetadataUpdateListener(selection.imageId, this._onMetadataUpdate);
        //window.setTimeout(this._onMetadataUpdate.bind(this, selection.imageId), 100);
        break;
      case 'set':
        this.removeListeners();
        this.props.metastore.addMetadataUpdateListener(selection.setId, this._onMetadataUpdate);
        //window.setTimeout(this.receiveSet.bind(this, selection.setId), 100);
        break;
      default:
        console.warning('Unknown subject ' + this.state.subject);
        return;
    }
  }

  receiveSet(id) {
    let meta = this.props.metastore.getMetadataAbout(id);
    if(!meta) {
      return;
    }
    let data = JSON.parse(JSON.stringify(this.state.data));
    data[id] = meta;

    if(this.state.subject === 'set') {
      let ids = _.keys(data);
      let itemIds = meta.items.map(i => i.uid);
      let newIds = _.without(itemIds, ids);
      for (let i = 0; i < newIds.length; ++i) {
        if (!data[newIds[i]]) {
          this.props.metastore.addMetadataUpdateListener(newIds[i], this._onMetadataUpdate);
          data[newIds[i]] = null;
          //window.setTimeout(this.receiveItem.bind(this, newIds[i]), 100);
        }
      }
    }

    this.setState({data: data});
  }

  receiveItem(id) {
    let meta = this.props.metastore.getMetadataAbout(id);
    if(!meta) {
      return;
    }
    switch(meta.type) {
      case 'Image':
        this.receiveImage(id);
        break;
      case 'Specimen':
        this.receiveSpecimen(id);
        break;
      default:
        console.warn('No handler for type ' + meta.type);
    }
  }

  receiveSpecimen(id) {
    let meta = this.props.metastore.getMetadataAbout(id);
    if(!meta) {
      return;
    }
    let data = JSON.parse(JSON.stringify(this.state.data));
    data[id] = meta;

    if(this.state.subject === 'set' || this.state.subject === 'image' && this.state.selectedImageId === id) {
      let ids = _.keys(data);
      let newIds = _.without(meta.images, ids);
      for (let i = 0; i < newIds.length; ++i) {
        if (!data[newIds[i]]) {
          this.props.metastore.addMetadataUpdateListener(newIds[i], this._onMetadataUpdate);
          data[newIds[i]] = null;
          //window.setTimeout(this.receiveImage.bind(this, newIds[i]), 100);
        }
      }
    }
    if(this.state.subject === 'image') {
      let newSetIds = _.without(meta.inSets, ids);
      for (let i = 0; i < newSetIds.length; ++i) {
        if (!data[newSetIds[i]]) {
          this.props.metastore.addMetadataUpdateListener(newSetIds[i], this._onMetadataUpdate);
          data[newSetIds[i]] = null;
          //window.setTimeout(this.receiveSet.bind(this, newSetIds[i]), 100);
        }
      }
    }

    // Get barcode for inSpecimen data
    this.props.metastore.addExternalMetadataUpdateListener(id, this._onExternalMetadataUpdate);

    // Update all measures of all images of this specimen (if available)
    let updateAnnotations = JSON.parse(JSON.stringify(this.state.updateAnnotations));
    for(let i = 0; i < meta.images.length; ++i) {
      let imageMeta = this.props.metastore.getMetadataAbout(meta.images[i]);
      if(imageMeta) {
        let imageAnchors = _.flatten(imageMeta.aois, imageMeta.pois, imageMeta.rois, imageMeta.tois);
        for(let j = 0; j < imageAnchors.length; ++j) {
          let anchorMeta = this.props.metastore.getMetadataAbout(imageAnchors[j]);
          if(anchorMeta) {
            updateAnnotations.push(...anchorMeta.annotations);
          }
        }
      }
    }
    this.setState({data: data, updateAnnotations: updateAnnotations});
  }

  receiveImage(id) {
    let meta = this.props.metastore.getMetadataAbout(id);
    if(!meta) {
      return;
    }
    let data = JSON.parse(JSON.stringify(this.state.data));
    data[id] = meta;


    let ids = _.keys(data);

    let itemIds = _.union(meta.pois, meta.rois, meta.aois, meta.tois);
    let newIds = _.without(itemIds, ids);
    for (let i = 0; i < newIds.length; ++i) {
      if(!data[newIds[i]]) {
        this.props.metastore.addMetadataUpdateListener(newIds[i], this._onMetadataUpdate);
        data[newIds[i]] = null;
        //window.setTimeout(this.receiveAnchor.bind(this, newIds[i]), 100);
      }
    }

    if(this.state.subject === 'image' && this.state.selectedImageId === id) {
      let newSpecimenIds = _.without(meta.specimens, ids);
      for (let i = 0; i < newSpecimenIds.length; ++i) {
        if(!data[newSpecimenIds[i]]) {
          this.props.metastore.addMetadataUpdateListener(newSpecimenIds[i], this._onMetadataUpdate);
          data[newSpecimenIds[i]] = null;
          //window.setTimeout(this.receiveSpecimen.bind(this, newSpecimenIds[i]), 100);
        }
      }
    }

    let updateAnnotations = JSON.parse(JSON.stringify(this.state.updateAnnotations));
    let imageAnchors = _.flatten(meta.aois, meta.pois, meta.rois, meta.tois);
    for(let i = 0; i < imageAnchors.length; ++i) {
      let anchorMeta = this.props.metastore.getMetadataAbout(imageAnchors[i]);
      if(anchorMeta) {
        updateAnnotations.push(...anchorMeta.annotations);
      }
    }

    this.setState({data: data, updateAnnotations: updateAnnotations});
  }

  receiveAnchor(id) {
    let meta = this.props.metastore.getMetadataAbout(id);
    if(!meta) {
      return;
    }
    let data = JSON.parse(JSON.stringify(this.state.data));
    data[id] = meta;

    let ids = _.keys(data);

    let newIds = _.without(meta.measurements, ids);
    for (let i = 0; i < newIds.length; ++i) {
      if(!data[newIds[i]]) {
        this.props.metastore.addMetadataUpdateListener(newIds[i], this._onMetadataUpdate);
        data[newIds[i]] = null;
        //window.setTimeout(this.receiveAnchor.bind(this, newIds[i]), 100);
      }
    }

    let updateAnnotations = JSON.parse(JSON.stringify(this.state.updateAnnotations));
    updateAnnotations.push(...meta.annotations);

    this.setState({data: data, updateAnnotations: updateAnnotations});
  }

  receiveAnnotation(id) {
    let meta = this.props.metastore.getMetadataAbout(id);
    if(!meta) {
      return;
    }
    let data = JSON.parse(JSON.stringify(this.state.data));
    data[id] = meta;

    if(meta.standards) {
      for(let i = 0; i < meta.standards.length; ++i) {
        let standardId = meta.standards[i];
        this.props.metastore.addMetadataUpdateListener(standardId, this._onMetadataUpdate);
        data[standardId] = null;
      }
    }

    let updateAnnotations = JSON.parse(JSON.stringify(this.state.updateAnnotations));
    updateAnnotations.push(id);
    this.setState({data: data, updateAnnotations: updateAnnotations});
  }

  receiveStandard(id) {
    let meta = this.props.metastore.getMetadataAbout(id);
    if(!meta) {
      return;
    }
    let data = JSON.parse(JSON.stringify(this.state.data));
    data[id] = meta;

    let updateAnnotations = JSON.parse(JSON.stringify(this.state.updateAnnotations));
    updateAnnotations.push(...meta.parents);

    this.setState({data: data, updateAnnotations: updateAnnotations});
  }

  receiveSourceMetadata(id) {
    let meta = this.props.metastore.getExternalMetadata(id);
    if(this.state.extData[id]) {
      if (JSON.stringify(meta) === JSON.stringify(this.state.extData[id])) {
        return;
      }
    }
    let extData = JSON.parse(JSON.stringify(this.state.extData));
    extData[id] = meta;
    this.setState({extData: extData, updateAnnotations: this.state.annotations.map(d => d.uid)});
  }

  removeListeners() {
    this.props.metastore.removeMetadataUpdateListener(this.state.selectedImageId, this._onMetadataUpdate);
    this.props.metastore.removeMetadataUpdateListener(this.state.selectedSetId, this._onMetadataUpdate);

    let ids = _.keys(this.state.data);
    for(let i = 0; i < ids.length; ++i) {
      this.props.metastore.removeMetadataUpdateListener(ids[i], this._onMetadataUpdate);
    }

    for(let i = 0; i < this.state.annotations.length; ++i) {
      this.props.metastore.removeExternalMetadataUpdateListener(this.state.annotations[i].inSpecimen, this._onExternalMetadataUpdate);
    }

    this.setState({annotations: [], data: {}, extData: {}});
  }

  createAnnotations(state) {
    return _.chain(state.updateAnnotations)
      .map(d => {let meta = this.props.metastore.getMetadataAbout(d); return meta?meta:null})
      .pick(d => d)
      .pick(d => (d.type === 'Annotation' && d.valueInPx !== 0) || d.type === 'PointOfInterest')
      .map(a => JSON.parse(JSON.stringify(a)))
      .each((a, idx, list) => this.enrichAnnotation(a, state), [this])
      // .sortBy(Globals.getCreationDate)
      .value();
      // .reverse();
  }

  enrichAnnotation(annotation, state) {
    if(!state.data || !annotation) {
      return;
    }

    if(annotation.type === 'PointOfInterest') {
      return this.enrichPoIAnnotation(annotation, state);
    }

    annotation.inEntity = annotation.parents[0];
    if(!annotation.inEntity) {
      return;
    }

    if(!state.data[annotation.inEntity]) {
      return;
    }
    annotation.inImage = state.data[annotation.inEntity].parents[0];
    if(!annotation.inImage) {
      return;
    }

    if(!state.data[annotation.inImage]) {
      return;
    }
    annotation.inSpecimen = state.data[annotation.inImage].specimens[0];
    if(!annotation.inSpecimen) {
      return;
    }

    if(!state.data[annotation.inSpecimen]) {
      return;
    }
    annotation.inSet = state.data[annotation.inSpecimen].inSets[0];
    if(!annotation.inSet) {
      return;
    }

    if(annotation.inSpecimen) {
      let data = this.props.metastore.getExternalMetadata(annotation.inSpecimen);
      if(data === 'loading') {
        annotation.barcode = this.props.userstore.getText('loading');
      }
      else if(data) {
        annotation.barcode = data.institutioncode + ' ' + data.catalognumber;
      }
      else {
        annotation.barcode = this.props.userstore.getText('unavailable');
      }
    }


    let anchorData = state.data[annotation.inEntity];
    if(anchorData) {
      annotation.name = anchorData.name;
    }

    annotation.selected = state.selection[annotation.uid];

    annotation.displayDate = new Date(annotation.creationDate);


    if(annotation.measureType) {
      let mmPerPixel = this.getScale(annotation.inImage);
      switch(annotation.measureType) {
        case 100: // Area
          if(mmPerPixel) {
            annotation.displayValue = (annotation.valueInPx * mmPerPixel * mmPerPixel).toFixed(2) + ' mm²';
          }
          else {
            annotation.displayValue = (annotation.valueInPx).toFixed(2) + ' px²';
          }
          annotation.displayType = <img src={areaIcon} height='15px' width='15px' />;
          annotation.display = true;
          break;
        case 101: // Perimeter
          if(mmPerPixel) {
            annotation.displayValue = (annotation.valueInPx * mmPerPixel).toFixed(2) + ' mm';
          }
          else {
            annotation.displayValue = (annotation.valueInPx).toFixed(2) + ' px';
          }
          annotation.displayType = <img src={perimeterIcon} height='15px' width='15px' />;
          annotation.display = true;
          break;
        case 102: // Length
          if(mmPerPixel) {
            annotation.displayValue = (annotation.valueInPx * mmPerPixel).toFixed(2) + ' mm';
          }
          else {
            annotation.displayValue = (annotation.valueInPx).toFixed(2) + ' px';
          }
          annotation.displayType = <img src={polylineIcon} height='15px' width='15px' />;
          annotation.display = true;
          break;
        case 103: // Angle
          annotation.displayValue = annotation.valueInPx.toFixed(2) + ' °';
          annotation.displayType = <img src={angleIcon} height='15px' width='15px' />;
          annotation.display = true;
          break;
        default:
          console.warn('Unknown measure type ' + annotation.measureType);
          annotation.display = false;
          break;
      }
    }
  }

  getScale(imageId) {
    let imageData = this.state.data[imageId];
    if(imageData) {
      if(imageData.scales.length > 0) {
        let scaleId = imageData.scales[imageData.scales.length -1];
        let scale = state.data[scaleId];
        if(scale) {
          return scale.mmPerPixel;
        }
      }
    }
      return Globals.getEXIFScalingData(this.state.data[imageId]);
  }

  enrichPoIAnnotation(annotation, state) {
    annotation.inEntity = annotation.uid;
    if(!annotation.inEntity) {
      return;
    }

    if(!state.data[annotation.inEntity]) {
      return;
    }
    annotation.inImage = annotation.parents[0];
    if(!annotation.inImage) {
      return;
    }

    if(!state.data[annotation.inImage]) {
      return;
    }
    annotation.inSpecimen = state.data[annotation.inImage].specimens[0];
    if(!annotation.inSpecimen) {
      return;
    }

    if(!state.data[annotation.inSpecimen]) {
      return;
    }
    annotation.inSet = state.data[annotation.inSpecimen].inSets[0];
    if(!annotation.inSet) {
      return;
    }

    if(annotation.inSpecimen) {
      var data = this.props.metastore.getExternalMetadata(annotation.inSpecimen);
      if(data === 'loading') {
        annotation.barcode = this.props.userstore.getText('loading');
      }
      else if(data) {
        annotation.barcode = data.institutioncode + ' ' + data.catalognumber;
      }
      else {
        annotation.barcode = this.props.userstore.getText('unavailable');
      }
    }

    annotation.selected = state.selection[annotation.uid];
    annotation.displayValue = '';
    annotation.display = true;
    annotation.displayType = <img src={pointIcon} height='15px' width='15px' />;
    annotation.displayDate = new Date(annotation.creationDate);
  }

  setSubject(subject) {
    if(subject === this.state.subject) {
      return;
    }
    this.removeListeners();

    switch(subject) {
      case 'image':
        this.props.metastore.addMetadataUpdateListener(this.state.selectedImageId, this._onMetadataUpdate);
        //window.setTimeout(this._onMetadataUpdate.bind(this, this.state.selectedImageId), 100);
        break;
      case 'set':
        this.props.metastore.addMetadataUpdateListener(this.state.selectedSetId, this._onMetadataUpdate);
        //window.setTimeout(this._onMetadataUpdate.bind(this, this.state.selectedSetId), 100);
        break;
      default:
        console.warning('Unknown subject ' + subject);
        return;
    }
    this.setState({subject: subject});
  }

  select(id) {
    let selection = JSON.parse(JSON.stringify(this.state.selection));
    selection[id] = true;

    this.setState({selection: selection});
  }

  unselect(id) {
    let selection = JSON.parse(JSON.stringify(this.state.selection));
    selection[id] = false;

    this.setState({selection: selection});
  }

  toggleSelectAll(isSelected) {
    let annotations = this.state.annotations;
    let selection = {};
    for(let i = 0; i < annotations.length; ++i) {
      selection[annotations[i].uid] = isSelected;
    }

    this.setState({selection: selection});
  }

  /**
   * If nothing is selected, copy everything
   * @returns {string}
   */
  formatSelectionForClipboardCopy() {
    let annotationsToCopy = [];
    for(let i = 0; i < this.state.annotations.length; ++i) {
      if(this.state.annotations[i].selected) {
        let annotation = JSON.parse(JSON.stringify(this.state.annotations[i]));
        annotationsToCopy.push(annotation);
      }
    }
    if(annotationsToCopy.length === 0) {
      annotationsToCopy = JSON.parse(JSON.stringify(this.state.annotations));
    }


    let text = this.props.userstore.getText('type') + '\t' + this.props.userstore.getText('name') + '\t' + this.props.userstore.getText('value') + '\t' + this.props.userstore.getText('sheet') + '\n';
    for(let i = 0; i < annotationsToCopy.length; ++i) {
      let annotation = annotationsToCopy[i];
      switch(annotation.type) {
        case 'Text':
          continue;
        case 'Unknown':
          console.warning('Unknown annotation type for ' + JSON.stringify(annotation));
          continue;
        case 'Area':
          text += this.props.userstore.getText('area') + '\t';
          break;
        case 'Perimeter':
          text += this.props.userstore.getText('perimeter') + '\t';
          break;
        case 'Length':
          text += this.props.userstore.getText('length') + '\t';
          break;
        case 'Angle':
          text += this.props.userstore.getText('angle') + '\t';
          break;
        default:
          break;
      }
      text += annotation.name + '\t' + annotation.displayValue + '\t' + annotation.barcode + '\n';
    }

    return text;
  }

  exportAsCSV() {
    let columnTitles = {
      type: this.props.userstore.getText('type'),
      name: this.props.userstore.getText('name'),
      value: this.props.userstore.getText('value'),
      unit: this.props.userstore.getText('unit'),
      barcode: this.props.userstore.getText('catalogNumber'),
      created: this.props.userstore.getText('creationDate'),
      setName: this.props.userstore.getText('set'),
      imageName: this.props.userstore.getText('imageName'),
      specimenDisplayName: this.props.userstore.getText('displayedSpecimenName'),
      coordinates: this.props.userstore.getText('coordinatesWithOrigin'),
      linkToExplore: this.props.userstore.getText('specimenExplorePage')
    };
    let columns = [];

    let annotationsToExport = [];
    for(let i = 0; i < this.state.annotations.length; ++i) {
      if(this.state.annotations[i].selected) {
        let annotation = JSON.parse(JSON.stringify(this.state.annotations[i]));
        annotationsToExport.push(annotation);
      }
    }
    if(annotationsToExport.length === 0) {
      annotationsToExport = JSON.parse(JSON.stringify(this.state.annotations));
    }

    let setName;
    let encoder = new TextEncoder();
    let decoder = new TextDecoder("utf-8");

    for(let i = 0; i < annotationsToExport.length; ++i) {
      let annotation = annotationsToExport[i];
      let entityData = this.props.metastore.getMetadataAbout(annotation.inEntity);
      let imageData = this.props.metastore.getMetadataAbout(annotation.inImage);
      let setData = this.props.metastore.getMetadataAbout(annotation.inSet);
      let specimenData = this.props.metastore.getMetadataAbout(annotation.inSpecimen);
      let vertices = [];
      if(entityData.polygonVertices) {
        //console.log(entityData.polygonVertices);
        let polygonVertices = JSON.parse(entityData.polygonVertices);
        for(let j = 0; j < polygonVertices.length; ++j) {
          let vertex = polygonVertices[j];
          vertices.push([imageData.width - vertex[0], imageData.height - vertex[1]]);
        }
      }
      let value = null;
      let unit = null;
      let mmPerPixel = this.getScale(annotation.inImage);
      switch(annotation.measureType) {
        case 100:
          value = mmPerPixel?(annotation.valueInPx * mmPerPixel * mmPerPixel).toFixed(2):annotation.valueInPx.toFixed(2);
          unit = mmPerPixel?'mm²':'px²';
          break;
        case 101:
        case 102:
          value = mmPerPixel?(annotation.valueInPx * mmPerPixel).toFixed(2):annotation.valueInPx.toFixed(2);
          unit = mmPerPixel?'mm':'px';
          break;
        case 103:
          value = annotation.valueInPx;
          unit = '°';
          break;
        default:
          value = annotation.displayValue;
          unit = '-';

      }
      //console.log(JSON.stringify(vertices));
      let data = {
        type: '"' + decoder.decode(encoder.encode(annotation.type)) + '"',
        name: '"' + decoder.decode(encoder.encode(annotation.name)) + '"',
        value: '"' + decoder.decode(encoder.encode(value)) + '"',
        unit: "" + decoder.decode(encoder.encode(unit)) + "",
        barcode: '"' + decoder.decode(encoder.encode(annotation.barcode)) + '"',
        created: '"' + decoder.decode(encoder.encode(annotation.displayDate)) + '"',
        setName: '"' + decoder.decode(encoder.encode(setData.name)) + '"',
        imageName: '"' + decoder.decode(encoder.encode(imageData.name)) + '"',
        specimenDisplayName: '"' + decoder.decode(encoder.encode(specimenData.name)) + '"',
        coordinates: '"' + decoder.decode(encoder.encode(JSON.stringify(vertices))) + '"'
      };
      setName = setData.name;

      columns.push(data);
    }

    let date = new Date();
    downloadCSV(columns, columnTitles, setName + "-export-" + date.getFullYear() + "" + (date.getMonth() + 1) + "" + date.getDay() + "" + date.getHours() + "" + date.getMinutes() + "" + date.getSeconds() + ".csv");
  }

  zoomOnElement(entityId) {
    let meta = this.props.metastore.getMetadataAbout(entityId);
    if(!meta) {
      return;
    }
    switch(meta.type) {
      case 'RegionOfInterest':
      case 'TrailOfInterest':
      case 'PointOfInterest':
      case 'AngleOfInterest':
        D3ViewUtils.zoomToObject(meta, this.props.benchstore, this.props.viewstore.getView());
        break;
      default:
        console.warn('Annotation type not handled: ' + meta.type);
    }
  }

  tableScrolled(e) {
    let node = React.findDOMNode(this.refs.scroller);
    if(node.offsetHeight + node.scrollTop >= node.scrollHeight-10) {
      this.setState({limit: Math.min(this.state.annotations.length+this.props.height/10, this.state.limit + 10)});
    }
  }

  sortAnnotationsBy(property) {
    this.setState({annotations: _.sortBy(this.state.annotations, property)});
  }

  buildAnnotationRow(annotation, index) {
    if(index < this.state.offset || index > this.state.limit) {
      return null;
    }
    if (!annotation.display) {
      return null;
    }
    let titleCell = null;
    let barcodeCell = null;
    let selectionIcon = null;
    if (annotation.name) {
      if (annotation.name.length > 15) {
        titleCell = <td style={this.cellLfAlignStyle} className='tooltip title' data-content={annotation.name}
                        data-sort-value={annotation.name}>{annotation.name.substring(0, 15) + '...'}</td>;
      }
      else {
        titleCell = <td style={this.cellLfAlignStyle} data-sort-value={annotation.name}>{annotation.name}</td>;
      }
    }
    else {
      titleCell = <td style={this.cellLfAlignStyle} data-sort-value={this.props.userstore.getText('nameUnavailable')}>{this.props.userstore.getText('nameUnavailable')}</td>;
    }

    if(annotation.selected) {
      selectionIcon = <i className='ui checkmark box icon' onClick={this.unselect.bind(this, annotation.uid)}/>;
    }
    else {
      selectionIcon = <i className='ui square outline icon' onClick={this.select.bind(this, annotation.uid)}/>;
    }

    if(annotation.barcode) {
      if (annotation.barcode.length > 10) {
        barcodeCell = <td style={this.cellStyle}
                          className='tooltip title'
                          data-content={annotation.barcode}
                          data-sort-value={annotation.barcode}>
          {'...' + annotation.barcode.substring(annotation.barcode.length - 10)}
        </td>
      }
      else {
        barcodeCell = <td style={this.cellStyle} data-sort-value={annotation.barcode}>{annotation.barcode}</td>;
      }
    }
    else {
      barcodeCell = <td style={this.cellStyle} data-sort-value={this.props.userstore.getText('unavailable')}>{this.props.userstore.getText('unavailable')}</td>;
    }

    let eyeIconStyle = JSON.parse(JSON.stringify(this.cellStyle));
    if(!this.props.modestore.isInObservationMode() && !this.props.modestore.isInOrganisationMode()) {
      eyeIconStyle.visibility = 'hidden';
    }

    return(
      <tr key={'ANNOT-' + annotation.uid}>
        <td style={this.cellStyle}>
          {selectionIcon}
        </td>
        <td style={this.cellStyle}
            data-sort-value={annotation.type}>{annotation.displayType}</td>
        {titleCell}
        <td style={this.cellStyle}
            data-sort-value={annotation.valueInPx}>{annotation.displayValue}</td>
        {barcodeCell}
        <td style={eyeIconStyle}><i className='ui eye icon' onClick={this.zoomOnElement.bind(this, annotation.inEntity)}/></td>
      </tr>
    )
  }

  componentDidMount() {
    this.props.userstore.addLanguageChangeListener(this._forceUpdate);
    this.props.modestore.addModeChangeListener(this._forceUpdate);
    this.props.inspecstore.addAnnotationSelectionListener(this._onEntitySelected);
    // this._onEntitySelected();
  }

  componentWillReceiveProps(props) {
    if(props.height != this.props.height) {
      this.containerStyle.height = props.height;
      this.scrollerStyle.height = props.height-35;
    }
  }

  componentWillUpdate(nextProps, nextState) {
    nextState.buttons.image = nextState.selectedImageId? '' : 'disabled';
    nextState.buttons.set = nextState.selectedSetId? '' : 'disabled';

    nextState.buttons.image += nextState.subject == 'image'? ' active': '';
    nextState.buttons.set += nextState.subject == 'set'? ' active': '';

    //console.log('updatding state');

    if(nextState.updateAnnotations.length > 0) {
      let newAnnotations = this.createAnnotations(nextState);
      nextState.annotations.push(...newAnnotations);
      nextState.annotations = _.sortBy(nextState.annotations, Globals.getCreationDate).reverse();
      // nextState.annotations = _.chain(nextState.annotations)
      //   .sortBy(Globals.getCreationDate)
      //   .reverse();
      nextState.updateAnnotations = [];
    }

    if(nextState.annotations.length == 0) {
      this.tableStyle.display = 'none';
      this.nothingStyle.display = '';
    }
    else {
      this.tableStyle.display = '';
      this.nothingStyle.display = 'none';
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if(this.state.annotations.length > 0) {
      // $(this.refs.table.getDOMNode()).tablesort();
      $('.tooltip.title', $(React.findDOMNode(this.refs.table)).popup());
    }
    $('.button', $(React.findDOMNode(this.refs.menu)).popup());

    //var copyText = this.copySelected();
    new Clipboard(this.refs.copyButton.getDOMNode(), {
      text: this.formatSelectionForClipboardCopy.bind(this)
    });
  }

  componentWillUnmount() {
    this.removeListeners();
    this.props.modestore.removeModeChangeListener(this._forceUpdate);
    this.props.inspecstore.removeAnnotationSelectionListener(this._onEntitySelected);
    this.props.userstore.removeLanguageChangeListener(this._forceUpdate);
  }

  render() {
    // note to self: sort/date, sort/type
    let selectAllIcon = null;
    if(this.state.annotations.length === 0) {
      selectAllIcon = <i className='ui square icon' />;
    }
    else if (this.state.annotations[0].selected) {
      selectAllIcon = <i className='ui checkmark box icon' onClick={this.toggleSelectAll.bind(this, false)}/>;
    }
    else {
      selectAllIcon = <i className='ui square outline icon' onClick={this.toggleSelectAll.bind(this, true)}/>;
    }
    let self = this;
    return <div className='ui segment container' ref='component' style={this.containerStyle}>
      <div className='ui blue tiny basic label'
           style={this.labelStyle}>
        {this.props.userstore.getText('tagsAndMeasures')}
      </div>
      <div style={this.scrollerStyle} onScroll={this.tableScrolled.bind(this)} ref="scroller">
        <div style={this.menuStyle} ref='menu'>
          <div style={this.upperButtonsStyle} className='ui buttons'>
            <div style={this.buttonStyle}
                 data-content={this.props.userstore.getText('measures')}
                 className={'ui tiny compact button ' + this.state.buttons.measures}>
              <img src={measureIcon} style={this.iconButtonStyle} height='20px' width='20px' />
            </div>
            <div style={this.buttonStyle}
                 data-content={this.props.userstore.getText('tags')}
                 className={'ui tiny compact icon button ' + this.state.buttons.tags}>
              <i className="tags icon"/>
            </div>
          </div>
          <div style={this.upperButtonsStyle} className='ui buttons'>
            <div style={this.buttonStyle}
                 className={'ui tiny compact button ' + this.state.buttons.image}
                 data-content={this.props.userstore.getText('imageSheet')}
                 onClick={this.setSubject.bind(this, 'image')}>
              <i className='file icon'  style={this.iconButtonStyle} />
            </div>
            <div style={this.buttonStyle}
                 className={'ui tiny compact button ' + this.state.buttons.set}
                 data-content={this.props.userstore.getText('set')}
                 onClick={this.setSubject.bind(this, 'set')}>
              <i className='folder icon'  style={this.iconButtonStyle} />
            </div>
          </div>
          <div style={this.upperButtonsStyle}>
            <div style={this.buttonStyle}
                 data-content={this.props.userstore.getText('copyToClipboard')}
                 ref='copyButton'
                 className='ui tiny compact button'>
              <i className='copy icon'  style={this.iconButtonStyle} />
            </div>
            <div style={this.buttonStyle}
                 data-content={this.props.userstore.getText('exportAsCsv')}
                 onClick={this.exportAsCSV.bind(this)}
                 className='ui tiny compact button'>
              <i className='download icon' style={this.iconButtonStyle} />
            </div>
            <div style={this.buttonStyle}
                 data-content={this.props.userstore.getText('displayOptions')}
                 className='ui tiny compact button disabled'>
              <i style={this.iconButtonStyle} className='setting icon' />
            </div>
          </div>
        </div>

        <div>
          <table style={this.tableStyle}
                 ref='table'
                 className='ui selectable sortable unstackable striped celled collapsing compact small fixed table'>
            <thead>
            <tr>
              <th className='one wide disabled' style={this.cellStyle}>{selectAllIcon}</th>
              <th className='one wide' style={this.cellStyle} onClick={this.sortAnnotationsBy.bind(this, 'type')}></th>
              <th className='five wide' style={this.cellLfAlignStyle} onClick={this.sortAnnotationsBy.bind(this, 'name')}>{this.props.userstore.getText('name')}</th>
              <th className='four wide' style={this.cellStyle} onClick={this.sortAnnotationsBy.bind(this, 'valueInPx')}>{this.props.userstore.getText('value')}</th>
              <th className='four wide' style={this.cellStyle} onClick={this.sortAnnotationsBy.bind(this, 'barcode')}>{this.props.userstore.getText('sheet')}</th>
              <th className='one wide disabled' style={this.cellStyle}></th>
            </tr>
            </thead>
            <tbody>
            {this.state.annotations.slice(this.state.offset, this.state.limit).map(this.buildAnnotationRow.bind(this))}
            </tbody>
          </table>
          <div style={this.nothingStyle}>{this.props.userstore.getText('noDataForSelection')}</div>
        </div>
      </div>
    </div>
  }
}

export default AnnotationList;