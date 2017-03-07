/**
 * Created by dmitri on 12/10/16.
 */
'use strict';

import React from 'react';
import Clipboard from 'clipboard';
import downloadCSV from 'download-csv';

import Globals from '../../utils/Globals';
import D3ViewUtils from '../../utils/D3ViewUtils';
import ServiceMethods from '../../utils/ServiceMethods';

import TagInput from '../../components/common/TagInput';
import Tag from '../../components/common/Tag';

import Styles from '../../constants/Styles';

import measureIcon from '../../images/measure.svg';
import polylineIcon from '../../images/polyline.png';
import angleIcon from '../../images/angle.svg';
import perimeterIcon from '../../images/perimeter.svg';
import areaIcon from '../../images/area.svg';
import pointIcon from '../../images/poi.svg';

class AnnotationList extends React.Component {
  constructor(props) {
    super(props);

    console.log('Received height ' + this.props.height);
    this.containerStyle = {
      padding: '5px 5px 5px 5px',
      borderColor: '#2185d0!important',
      height: this.props.height-10
      //overflow: 'hidden'
    };

    this.labelContainerStyle = {
      position: 'relative',
      width: 0,
      height: '10px'
    };

    this.labelStyle = {
      position: 'relative',
      top: '-15px',
      left: '10px',
      whiteSpace: 'nowrap'
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
      height: '20px',
      width: '20px',
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
          case 'TagAssociation':
            this.receiveTag(id);
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
      display: 'tags',
      subject: 'set',
      buttons: {
        measures: '',
        tags: 'active',
        image: 'disabled',
        set: 'disabled'
      },
      data: {},
      extData: {},
      annotations: [],
      updateAnnotations: [],
      selection: {},
      tags: {},
      tagInputEntity: null,
      offset: 0,
      limit: this.props.height/12,
    };

    this.position = {
      top: null,
      left: null
    };
  }

  updateSelection(selection) {
    this.setState({
      selectedSetId: selection.setId,
      selectedImageId: selection.imageId,
      selection: {},
      tags: {},
      tagInputEntity: null,
      offset: 0,
      limit: this.props.height/12
    });

    switch(this.state.subject) {
      case 'image':
        this.removeListeners();
        this.props.metastore.addMetadataUpdateListener(selection.imageId, this._onMetadataUpdate);
        break;
      case 'set':
        this.removeListeners();
        this.props.metastore.addMetadataUpdateListener(selection.setId, this._onMetadataUpdate);
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
    if(meta.deleted) {
      let data = JSON.parse(JSON.stringify(this.state.data));
      data[id].deleted = true;
      this.setState({data: data});
      return;
    }
    let data = JSON.parse(JSON.stringify(this.state.data));
    data[id] = meta;

    if(this.state.subject === 'set') {
      let ids = _.keys(data);

      if(this.state.display === 'measures') {
        let itemIds = meta.items.map(i => i.uid);
        let newIds = _.without(itemIds, ids);
        for (let i = 0; i < newIds.length; ++i) {
          if (!data[newIds[i]]) {
            this.props.metastore.addMetadataUpdateListener(newIds[i], this._onMetadataUpdate);
            data[newIds[i]] = null;
          }
        }
      }

      if(this.state.display === 'tags') {
        let newTags = _.without(meta.tags, ids);
        for(let i = 0; i < newTags.length; ++i) {
          if(!data[newTags[i]]) {
            this.props.metastore.addMetadataUpdateListener(newTags[i], this._onMetadataUpdate);
            data[newTags[i]] = null;
          }
        }

        let newItems = _.without(meta.items.map(i => i.uid), ids);
        for(let i = 0; i < newItems.length; ++i) {
          this.props.metastore.addMetadataUpdateListener(newItems[i], this._onMetadataUpdate);
          data[newItems[i]] = null;
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
    if(meta.deleted) {
      let data = JSON.parse(JSON.stringify(this.state.data));
      data[id].deleted = true;
      this.setState({data: data});
      return;
    }
    let data = JSON.parse(JSON.stringify(this.state.data));
    data[id] = meta;

    let updateAnnotations = [];

    if(this.state.display === 'measures') {
      if (this.state.subject === 'set'
        || this.state.subject === 'image' && this.state.selectedImageId === id) {
        let ids = _.keys(data);
        let newIds = _.without(meta.images, ids);
        for (let i = 0; i < newIds.length; ++i) {
          if (!data[newIds[i]]) {
            this.props.metastore.addMetadataUpdateListener(newIds[i], this._onMetadataUpdate);
            data[newIds[i]] = null;
          }
        }
      }
      if (this.state.subject === 'image') {
        let newSetIds = _.without(meta.inSets, ids);
        for (let i = 0; i < newSetIds.length; ++i) {
          if (!data[newSetIds[i]]) {
            this.props.metastore.addMetadataUpdateListener(newSetIds[i], this._onMetadataUpdate);
            data[newSetIds[i]] = null;
          }
        }
      }

      // Get barcode for inSpecimen data
      this.props.metastore.addExternalMetadataUpdateListener(id, this._onExternalMetadataUpdate);

      // Update all measures of all images of this specimen (if available)
      updateAnnotations = JSON.parse(JSON.stringify(this.state.updateAnnotations));
      for (let i = 0; i < meta.images.length; ++i) {
        let imageMeta = this.props.metastore.getMetadataAbout(meta.images[i]);
        if (imageMeta) {
          let imageAnchors = _.flatten(imageMeta.aois, imageMeta.pois, imageMeta.rois, imageMeta.tois);
          for (let j = 0; j < imageAnchors.length; ++j) {
            let anchorMeta = this.props.metastore.getMetadataAbout(imageAnchors[j]);
            if (anchorMeta) {
              updateAnnotations.push(...anchorMeta.annotations);
            }
          }
        }
      }
    }
    else if (this.state.display === 'tags') {
      let ids = _.keys(data);
      let newTags = _.without(meta.tags, ids);
      for(let i = 0; i < newTags.length; ++i) {
        this.props.metastore.addMetadataUpdateListener(newTags[i], this._onMetadataUpdate);
        data[newTags[i]] = null;
      }

      // Get tags of images
      let newImages = _.without(meta.images, ids);
      for(let i = 0; i < newImages.length; ++i) {
        this.props.metastore.addMetadataUpdateListener(newImages[i], this._onMetadataUpdate);
        data[newImages[i]] = null;
      }
    }
    this.setState({data: data, updateAnnotations: updateAnnotations});
  }

  receiveImage(id) {
    let meta = this.props.metastore.getMetadataAbout(id);
    if(!meta) {
      return;
    }
    if(meta.deleted) {
      let data = JSON.parse(JSON.stringify(this.state.data));
      data[id].deleted = true;
      this.setState({data: data});
      return;
    }
    let data = JSON.parse(JSON.stringify(this.state.data));
    data[id] = meta;
    let updateAnnotations = JSON.parse(JSON.stringify(this.state.updateAnnotations));

    let ids = _.keys(data);

    if(this.state.display === 'measures') {
      let itemIds = _.union(meta.pois, meta.rois, meta.aois, meta.tois);
      let newIds = _.without(itemIds, ids);
      for (let i = 0; i < newIds.length; ++i) {
        if (!data[newIds[i]]) {
          this.props.metastore.addMetadataUpdateListener(newIds[i], this._onMetadataUpdate);
          data[newIds[i]] = null;
        }
      }

      if (this.state.subject === 'image' && this.state.selectedImageId === id) {
        let newSpecimenIds = _.without(meta.specimens, ids);
        for (let i = 0; i < newSpecimenIds.length; ++i) {
          if (!data[newSpecimenIds[i]]) {
            this.props.metastore.addMetadataUpdateListener(newSpecimenIds[i], this._onMetadataUpdate);
            data[newSpecimenIds[i]] = null;
          }
        }
      }

      // let updateAnnotations = JSON.parse(JSON.stringify(this.state.updateAnnotations));
      let imageAnchors = _.flatten(meta.aois, meta.pois, meta.rois, meta.tois);
      for (let i = 0; i < imageAnchors.length; ++i) {
        let anchorMeta = this.props.metastore.getMetadataAbout(imageAnchors[i]);
        if (anchorMeta) {
          updateAnnotations.push(...anchorMeta.annotations);
        }
      }
    }
    else if(this.state.display === 'tags') {
      let tagIds = _.without(meta.tags, ids);
      for (let i = 0; i < tagIds.length; ++i) {
        this.props.metastore.addMetadataUpdateListener(tagIds[i], this._onMetadataUpdate);
        data[tagIds[i]] = null;
      }

      let anchorIds = _.union(meta.pois, meta.rois, meta.aois, meta.tois);
      let newAnchorIds = _.without(anchorIds, ids);
      for(let i = 0; i < newAnchorIds.length; ++i) {
        this.props.metastore.addMetadataUpdateListener(newAnchorIds[i], this._onMetadataUpdate);
        data[newAnchorIds[i]] = null;
      }
    }

    this.setState({data: data, updateAnnotations: updateAnnotations});
  }

  receiveAnchor(id) {
    let meta = this.props.metastore.getMetadataAbout(id);
    if(!meta) {
      return;
    }
    if(meta.deleted) {
      let data = JSON.parse(JSON.stringify(this.state.data));
      data[id].deleted = true;
      this.setState({data: data});
      return;
    }
    let data = JSON.parse(JSON.stringify(this.state.data));
    data[id] = meta;

    let updateAnnotations = JSON.parse(JSON.stringify(this.state.updateAnnotations));
    let ids = _.keys(data);

    if(this.state.display === 'measures') {
      let newIds = _.without(meta.measurements, ids);
      for (let i = 0; i < newIds.length; ++i) {
        if (!data[newIds[i]]) {
          this.props.metastore.addMetadataUpdateListener(newIds[i], this._onMetadataUpdate);
          data[newIds[i]] = null;
          //window.setTimeout(this.receiveAnchor.bind(this, newIds[i]), 100);
        }
      }

      updateAnnotations.push(...meta.annotations);
    }
    else if(this.state.display === 'tags') {
      let tagIds = _.without(meta.tags, ids);
      for(let i = 0 ; i < tagIds.length; ++i) {
        this.props.metastore.addMetadataUpdateListener(tagIds[i], this._onMetadataUpdate);
        data[tagIds[i]] = null;
      }
    }
    this.setState({data: data, updateAnnotations: updateAnnotations});
  }

  receiveAnnotation(id) {
    let meta = this.props.metastore.getMetadataAbout(id);
    if(!meta) {
      return;
    }
    if(meta.deleted) {
      let data = JSON.parse(JSON.stringify(this.state.data));
      data[id].deleted = true;
      this.setState({data: data});
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
    if(meta.deleted) {
      let data = JSON.parse(JSON.stringify(this.state.data));
      data[id].deleted = true;
      this.setState({data: data});
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

  receiveTag(id) {
    let meta = this.props.metastore.getMetadataAbout(id);
    if(!meta) {
      return;
    }
    let tags = JSON.parse(JSON.stringify(this.state.tags));
    let data = JSON.parse(JSON.stringify(this.state.data));

    if(meta.deleted) {
      delete data[id];
      tags[meta.definition].entities = _.without(tags[meta.definition].entities, id);
      if(tags[meta.definition].entities.length === 0) {
        delete tags[meta.definition];
      }
      this.setState({data: data, tags: tags});
      return;
    }

    if(tags[meta.definition]) {
      if(!_.contains(tags[meta.definition].entities, id)) {
        tags[meta.definition].entities.push(id);
      }
    } else {
      tags[meta.definition] = meta;
      tags[meta.definition].entities = [id];
    }
    data[id] = meta;

    this.setState({tags: tags, data: data});
  }

  activateTagInput() {
    switch(this.state.subject) {
      case 'set':
        this.setState({tagInputEntity: this.state.selectedSetId});
        break;
      case 'image':
        this.setState({tagInputEntity: this.state.selectedImageId});
        break;
    }
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
      // return;
      annotation.barcode = this.props.userstore.getText('notRecolnat');
      annotation.inSet = state.data[annotation.inImage].inSets[0];
    }
    else {
      if(!state.data[annotation.inSpecimen]) {
        return;
      }
      annotation.inSet = state.data[annotation.inSpecimen].inSets[0];
    }

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
        break;
      case 'set':
        this.props.metastore.addMetadataUpdateListener(this.state.selectedSetId, this._onMetadataUpdate);
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

  displayMeasures() {
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

    return (
      <div key='MEASURES'>
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
    );
  }

  displayTags() {
    let self = this;
    return(
      <div key='TAGS' className='ui mini labels'>
        {_.chain(this.state.tags).values(this.state.tags).sortBy(t => t.key.toLowerCase()).value().map(function(tag, index) {
          return <Tag key={tag.definition} tag={tag} showDelete={false}/>;
        })}
      </div>
    );
  }

  componentDidMount() {
    this.props.userstore.addLanguageChangeListener(this._forceUpdate);
    this.props.modestore.addModeChangeListener(this._forceUpdate);
    this.props.inspecstore.addAnnotationSelectionListener(this._onEntitySelected);
    // this._onEntitySelected();
    let pos = React.findDOMNode(this).getBoundingClientRect();
    this.position.top = pos.top;
    this.position.left = pos.left;
  }

  componentWillReceiveProps(props) {
    if(props.height != this.props.height) {
      this.containerStyle.height = props.height-10;
      this.scrollerStyle.height = props.height-35;
    }
  }

  componentWillUpdate(nextProps, nextState) {
    nextState.buttons.image = nextState.selectedImageId? '' : 'disabled';
    nextState.buttons.set = nextState.selectedSetId? '' : 'disabled';

    nextState.buttons.image += nextState.subject == 'image'? ' active': '';
    nextState.buttons.set += nextState.subject == 'set'? ' active': '';

    if(nextState.updateAnnotations.length > 0) {
      let newAnnotations = this.createAnnotations(nextState);
      nextState.annotations.push(...newAnnotations);
      nextState.annotations = _.sortBy(nextState.annotations, Globals.getCreationDate).reverse();
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
    let pos = React.findDOMNode(this).getBoundingClientRect();
    this.position.top = pos.top;
    this.position.left = pos.left;

    if(this.state.annotations.length > 0) {
      // $(this.refs.table.getDOMNode()).tablesort();
      $('.tooltip.title', $(React.findDOMNode(this.refs.table))).popup();
    }

    $('.button', $(React.findDOMNode(this.refs.menu))).popup();

    if(this.state.display === 'tags') {
      $(React.findDOMNode(this.refs.activateTag)).popup();
    }

    if(this.state.display != prevState.display) {
      this.updateSelection({setId: this.state.selectedSetId, imageId: this.state.selectedImageId});
    }

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
    return <div className='ui segment container' ref='component' style={this.containerStyle}>
      <div style={this.labelContainerStyle}>
        <div className='ui blue tiny basic label'
             style={this.labelStyle}>
          {this.props.userstore.getText('tagsAndMeasures')}
        </div>
      </div>
      <div style={this.scrollerStyle} onScroll={this.tableScrolled.bind(this)} ref="scroller">
        <div style={this.menuStyle} ref='menu'>
          <div style={this.upperButtonsStyle} className='ui mini buttons'>
            <div style={this.buttonStyle}
                 onClick={this.setState.bind(this, {display: 'measures'}, null)}
                 data-content={this.props.userstore.getText('measures')}
                 className={'ui compact button ' + this.state.buttons.measures}>
              <img src={measureIcon} style={this.iconButtonStyle} height='15px' width='15px' />
            </div>
            <div style={this.buttonStyle}
                 onClick={this.setState.bind(this, {display: 'tags'}, null)}
                 data-content={this.props.userstore.getText('tags')}
                 className={'ui compact mini icon button ' + this.state.buttons.tags}>
              <i className="tags icon"/>
            </div>
          </div>
          <div style={this.upperButtonsStyle} className='ui mini buttons'>
            <div style={this.buttonStyle}
                 className={'ui compact button ' + this.state.buttons.image}
                 data-content={this.props.userstore.getText('imageSheet')}
                 onClick={this.setSubject.bind(this, 'image')}>
              <i className='file icon'  style={this.iconButtonStyle} />
            </div>
            <div style={this.buttonStyle}
                 className={'ui compact button ' + this.state.buttons.set}
                 data-content={this.props.userstore.getText('set')}
                 onClick={this.setSubject.bind(this, 'set')}>
              <i className='folder icon'  style={this.iconButtonStyle} />
            </div>
          </div>
          <div style={this.upperButtonsStyle}>
            <div style={this.buttonStyle}
                 data-content={this.props.userstore.getText('copyToClipboard')}
                 ref='copyButton'
                 className='ui mini compact button'>
              <i className='copy icon'  style={this.iconButtonStyle} />
            </div>
            <div style={this.buttonStyle}
                 data-content={this.props.userstore.getText('exportAsCsv')}
                 onClick={this.exportAsCSV.bind(this)}
                 className='ui mini compact button'>
              <i className='download icon' style={this.iconButtonStyle} />
            </div>
            <div style={this.buttonStyle}
                 data-content={this.props.userstore.getText('displayOptions')}
                 className='ui mini compact button disabled'>
              <i style={this.iconButtonStyle} className='setting icon' />
            </div>
          </div>
        </div>
        {this.state.display === 'measures'?this.displayMeasures():this.displayTags()}
      </div>
    </div>
  }
}

export default AnnotationList;