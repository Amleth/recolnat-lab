/**
 * Created by dmitri on 02/05/16.
 */
'use strict';

import React from 'react';

import MetadataActions from '../../actions/MetadataActions';
import ModalActions from '../../actions/ModalActions';

import ModalConstants from '../../constants/ModalConstants';

import Globals from '../../utils/Globals';

class ElementInspector extends React.Component {
  constructor(props) {
    super(props);

    //this.containerStyle = {
    //  height: this.props.height,
    //  padding: '5px 5px 5px 5px',
    //  margin: '1%',
    //  overflow: 'hidden'
    //};

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

    this.fixedHeightStyle = {
      height: '100%'
    };

    this.menuStyle = {
      margin: 0
    };

    this.metadataStyle = {
      //overflowY: 'auto',
      //height: '80%',
      margin: 0,
      padding: 0
    };

    this.annotationTitleStyle = {
      margin: 0,
      width: '80%',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    };

    this.tagsStyle = {
      display: 'none',
      overflowY: 'auto',
      height: 0
    };

    this._onSelectionChange = () => {
      const setElementsUnderCursor = () => this.setInspectorContent();
      return setElementsUnderCursor.apply(this);
    };

    this._onModeChange = () => {
      const setModeVisibility = () => this.setState({
        isVisibleInCurrentMode: this.props.modestore.isInOrganisationMode() || this.props.modestore.isInObservationMode() || this.props.modestore.isInSetMode()
      });
      return setModeVisibility.apply(this);
    };

    this._onEntityMetadataChange = () => {
      const processEntityMetadata = () => this.processEntityMetadata();
      return processEntityMetadata.apply(this);
    };

    this._onAnnotationMetadataChange = () => {
      const processAnnotationMetadata = () => this.processAnnotationMetadata();
      return processAnnotationMetadata.apply(this);
    };

    this._onCreatorMetadataChange = () => {
      const processCreatorMetadata = () => this.processCreatorMetadata();
      return processCreatorMetadata.apply(this);
    };

    this.state = {
      isVisibleInCurrentMode: true,
      entitiesIds: [],
      annotationsIds: [],
      tagsIds: [],
      creatorsIds: [],
      entities: {},
      annotations: {},
      tags: {},
      creators: {}
    };
  }

  setInspectorContent() {
    this.clearMetadataListeners(this.state.entitiesIds, this._onEntityMetadataChange);
    this.clearMetadataListeners(this.state.annotationsIds, this._onAnnotationMetadataChange);
    this.clearMetadataListeners(this.state.creatorsIds, this._onCreatorMetadataChange);
    var elements = this.props.inspecstore.getInspectorContent();
    this.setState({
      entitiesIds: elements,
      annotationsIds: [],
      tagsIds: [],
      creatorsIds: [],
      entities: {},
      annotations: {},
      tags: {}
    });

    this.addMetadataListeners(elements, this._onEntityMetadataChange);
    window.setTimeout(this._onEntityMetadataChange, 50);
  }

  addMetadataListeners(ids, callback) {
    for(var i = 0; i < ids.length; ++i) {
      this.props.metastore.addMetadataUpdateListener(ids[i], callback);
    }
  }

  clearMetadataListeners(ids, callback) {
    for(var k = 0; k < ids.length; ++k) {
      this.props.metastore.removeMetadataUpdateListener(ids[k], callback);
    }
  }

  processEntityMetadata() {
    var metadatas = {};
    var annotationsIds = [];

    for(var i = 0; i < this.state.entitiesIds.length; ++i) {
      var metadata = this.props.metastore.getMetadataAbout(this.state.entitiesIds[i]);
      if(metadata) {
        metadatas[this.state.entitiesIds[i]] = metadata;
        if(metadata.annotations) {
          Array.prototype.push.apply(annotationsIds, metadata.annotations);
        }
        if(metadata.measurements) {
          Array.prototype.push.apply(annotationsIds, metadata.measurements);
        }
      }
      else {
        metadatas[this.state.entitiesIds[i]] = null;
      }
    }

    annotationsIds = _.uniq(annotationsIds);
    var newAnnotationIds = _.difference(annotationsIds, this.state.annotationsIds);
    //var removedAnnotationIds = _.difference(this.state.annotationsIds, annotationsIds);
    //console.log('New annotations ids: ' + JSON.stringify(newAnnotationIds));

    //this.clearMetadataListeners(removedAnnotationIds);
    this.addMetadataListeners(newAnnotationIds, this._onAnnotationMetadataChange);

    this.setState({
      entities: metadatas,
      annotationsIds: annotationsIds
    });

    window.setTimeout(this._onAnnotationMetadataChange, 50);
  }

  processAnnotationMetadata() {
    var annotations = {};
    var creatorIds = [];
    for(var i = 0; i < this.state.annotationsIds.length; ++i) {
      var metadata = this.props.metastore.getMetadataAbout(this.state.annotationsIds[i]);
      if(metadata) {
        annotations[metadata.uid] = metadata;
        if(metadata.creator) {
          creatorIds.push(metadata.creator);
        }
      }
      else {
        annotations[this.state.annotationsIds[i]] = null;
      }
    }

    creatorIds = _.uniq(creatorIds);
    var newCreatorIds = _.difference(creatorIds, this.state.creatorsIds);
    //var removedCreatorIds = _.difference(this.state.creatorsIds, creatorIds);

    //this.clearMetadataListeners(removedCreatorIds);
    this.addMetadataListeners(newCreatorIds, this._onCreatorMetadataChange);

    this.setState({
      annotations: annotations,
      creatorsIds: creatorIds
    });

    window.setTimeout(this._onCreatorMetadataChange, 50);
  }

  processCreatorMetadata() {
    var creators = {};
    for(var i = 0; i < this.state.creatorsIds.length; ++i) {
      var metadata = this.props.metastore.getMetadataAbout(this.state.creatorsIds[i]);
      if(metadata) {
        creators[metadata.uid] = metadata;
      }
      else {
        creators[this.state.creatorsIds[i]] = null;
      }
    }

    this.setState({
      creators: creators
    });
  }

  annotationToMetaDisplay(metadata) {
    var item = {
      date: new Date(),
      value: metadata.content
    };
    item.date.setTime(metadata.creationDate);
    item.date = item.date.toLocaleDateString();

    if(!metadata.creator) {
      item.author = 'Système ReColNat';
    }
    else {
      var authorMetadata = this.state.creators[metadata.creator];
      if(authorMetadata) {
        item.author = authorMetadata.name;
      }
    }

    return item;
  }

  measurementToMetaDisplay(metadata) {
    var item = {
      date: new Date()
    };
    item.date.setTime(metadata.creationDate);
    item.date = item.date.toLocaleDateString();
    // Ideally all of this metadata has been downloaded beforehand, otherwise the inspector could not have been reached.
    var entityId = metadata.parents[0];
    if(!entityId) {
      return null;
    }
    var imageId = this.state.entities[entityId].parents[0];
    if(!imageId) {
      return null;
    }
    var imageMetadata = this.props.metastore.getMetadataAbout(imageId);
    var mmPerPixel = Globals.getEXIFScalingData(imageMetadata);
    if(mmPerPixel) {
      switch(metadata.measureType) {
        case 101: // Perimeter
          item.value = 'Périmètre : ' + (mmPerPixel * metadata.valueInPx).toFixed(2) + ' mm';
          break;
        case 100: // Area
          item.value = 'Aire : ' + ((mmPerPixel * mmPerPixel) * metadata.valueInPx).toFixed(2) + ' mm²';
          break;
        case 102:
          // Length
          item.value = 'Longueur : ' + (mmPerPixel * metadata.valueInPx).toFixed(2) + ' mm';
          break;
        case 103:
          item.value = 'Angle : ' + this.convertToDMS(metadata.valueInPx);
          break;
        default:
          console.warn('Unknown measure type ' + metadata.measureType);
      }
    }
    else {
      item.value = metadata.valueInPx.toFixed(2) + ' px';
      item.warning = 'Aucun étalon disponible pour la conversion';
    }
    if(!metadata.creator) {
      item.author = 'Système ReColNat';
    }
    else {
      var authorMetadata = this.state.creators[metadata.creator];
      if(authorMetadata) {
        item.author = authorMetadata.name;
      }
    }

    return item;
  }

  convertToDMS(angle) {
    return [0|angle, '° ', 0|(angle<0?angle=-angle:angle)%1*60, "' ", 0|angle*60%1*60, '"'].join('');
  }

  addAnnotation(id) {
    if(!id) {
      alert('Aucune entité sélectionnée');
      return;
    }
    window.setTimeout(
      ModalActions.showModal.bind(
        null,
        ModalConstants.Modals.addAnnotationToEntity,
        {entity: id}),
      10);
  }

  buildEntityDisplay(entityId) {
    var displayName = null;
    var entityMetadata = this.state.entities[entityId];
    if (entityMetadata) {
      displayName = entityMetadata.name;
    }
    else {
      return null;
    }
    var measurements = entityMetadata.measurements;
    if(!measurements) {
      measurements = [];
    }
    var annotations = entityMetadata.annotations;
    if(!annotations) {
      annotations = [];
    }
    return (
      <div className='ui comments' style={this.metadataStyle} key={'ENTITY-' + entityId}>
        <h3>
          {displayName}
          <i className='green small add square icon'
             ref='addIcon'
             data-content='Ajouter une annotation'
             onClick={this.addAnnotation.bind(this, entityId)}/>
        </h3>
        {measurements.map(this.buildMeasurementDisplay.bind(this))}
        {annotations.map(this.buildAnnotationDisplay.bind(this))}
      </div>
    );
  }

  buildMeasurementDisplay(measurementId) {
    var measurementMetadata = this.state.annotations[measurementId];
    if(!measurementMetadata) {
      return null;
    }
    var meta = this.measurementToMetaDisplay(measurementMetadata);
    if(!meta) {
      return null;
    }
    var icon = '';
    if(meta.warning) {
      icon = 'yellow warning icon';
    }
    return (
      <div className='comment' key={'MEASURE-' + measurementId}>
        <div className="content">
          <a className="author">{meta.author}</a>
          <div className="metadata">
            <span className="date">{meta.date}</span>
          </div>
          <div className="text">
            <i>{meta.value}</i><i className={icon} data-content={meta.warning}/>
          </div>
        </div>
      </div>
    );
  }

  buildAnnotationDisplay(annotationId) {
    var annotationMetadata = this.state.annotations[annotationId];
    if(!annotationMetadata) {
      return null;
    }
    var meta = this.annotationToMetaDisplay(annotationMetadata);
    if(!meta) {
      return null;
    }

    var date = new Date();
    date.setTime(annotationMetadata.creationDate);

    var author = '';
    if(!annotationMetadata.creator) {
      author = 'Système ReColNat';
    }
    else {
      var authorMetadata = this.state.creators[annotationMetadata.creator];
      if(authorMetadata) {
        author = authorMetadata.name;
      }
    }

    return (
      <div className='comment' key={'MEASURE-' + annotationId}>
        <div className="content">
          <a className="author">{author}</a>
          <div className="metadata">
            <span className="date">{date.toLocaleDateString()}</span>
          </div>
          <div className="text">
            <i>{annotationMetadata.content}</i>
          </div>
        </div>
      </div>
    );
  }

  componentDidMount() {
    this.props.modestore.addModeChangeListener(this._onModeChange);
    this.props.inspecstore.addContentChangeListener(this._onSelectionChange);
  }

  componentWillUpdate(nextProps, nextState) {
    if(nextState.isVisibleInCurrentMode) {
      this.containerStyle.display = '';
    }
    else {
      this.containerStyle.display = 'none';
    }
  }

  componentDidUpdate(prevProps, prevState) {
    $('.yellow.warning.icon', $(this.refs.component.getDOMNode())).popup();
    $('.green.small.add.square.icon', $(this.refs.component.getDOMNode())).popup();
  }

  componentWillUnmount() {
    this.clearMetadataListeners(this.state.entitiesIds, this._onEntityMetadataChange);
    this.clearMetadataListeners(this.state.annotationsIds, this._onAnnotationMetadataChange);
    this.clearMetadataListeners(this.state.creatorsIds, this._onCreatorMetadataChange);
    this.props.modestore.removeModeChangeListener(this._onModeChange);
    this.props.inspecstore.removeContentChangeListener(this._onSelectionChange);
  }

  render() {
    var self = this;
    return <div className='ui segment container' ref='component' style={this.containerStyle}>
      <div className='ui blue tiny basic label'
           style={this.labelStyle}>
        Inspecteur
      </div>
      <div style={this.scrollerStyle}>
      {this.state.entitiesIds.map(this.buildEntityDisplay.bind(this))}
        </div>
    </div>
  }
}

export default ElementInspector;
