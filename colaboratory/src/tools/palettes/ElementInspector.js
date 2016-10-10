/**
 * Created by dmitri on 02/05/16.
 */
'use strict';

import React from 'react';
import d3 from 'd3';

import MetadataActions from '../../actions/MetadataActions';
import ModalActions from '../../actions/ModalActions';

import ModalConstants from '../../constants/ModalConstants';

import Globals from '../../utils/Globals';
import D3ViewUtils from '../../utils/D3ViewUtils';
import ServiceMethods from '../../utils/ServiceMethods';

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

    this.annotationInputStyle = {
      display: 'flex',
      flexDirection: 'column',
      //height: 0,
      //width: 'auto',
      overflow: 'hidden',
      maxHeight: 0
      //display: 'fixed',
      //left: 0,
      //top: 0
    };

    this.annotationInputTitleStyle = {
      textAlign: 'center'
    };

    this.annotationInputButtonRowStyle = {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between'
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
      padding: 0,
      position: 'relative'
    };

    this.titleStyle = {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between'
    };

    this.entityNameStyle = {
      //fontSize: 'large',
      fontWeight: 'bold',
      margin: 0
    };

    this.entityMetaStyle = {
      margin: 0
    };

    this.addAnnotationStyle = {
      cursor: 'pointer'
      //position: 'relative',
      //right: 0,
      //bottom: '10px'
    };

    this.annotationStyle = {
      marginBottom: '-10px'
    };

    this.annotationMetadataStyle = {
      display: 'flex',
      flexDirection: 'row-reverse',
      fontSize: 'x-small',
      position: 'relative',
      bottom: '-10px'
    };

    this.annotationAuthorStyle = {
      order: 2,
      marginLeft: 5,
      marginRight: 5
    };

    this.annotationDateStyle = {
      order: 1,
      marginLeft: 5,
      marginRight: 5
    };

    this.annotationTextStyle = {

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
      creators: {},
      annotationTextInput: '',
      newAnnotationActiveField: null
    };
  }

  setInspectorContent() {
    this.clearMetadataListeners(this.state.entitiesIds, this._onEntityMetadataChange);
    this.clearMetadataListeners(this.state.annotationsIds, this._onAnnotationMetadataChange);
    this.clearMetadataListeners(this.state.creatorsIds, this._onCreatorMetadataChange);
    //for(var i = 0; i < this.state.entitiesIds.length; ++i) {
    //  // Stop current animation
    //  D3ViewUtils.stopOutlineAnimation('AOI-' + this.state.entitiesIds[i]);
    //  D3ViewUtils.stopOutlineAnimation('PATH-' + this.state.entitiesIds[i]);
    //  D3ViewUtils.stopOutlineAnimation('POI-' + this.state.entitiesIds[i]);
    //  D3ViewUtils.stopOutlineAnimation('ROI-' + this.state.entitiesIds[i]);
    //}
    var elements = this.props.inspecstore.getInspectorContent();
    //for(var i = 0; i < elements.length; ++i) {
    //  // Start new element animation
    //  D3ViewUtils.animateOutline('AOI-' + elements[i]);
    //  D3ViewUtils.animateOutline('PATH-' + elements[i]);
    //  D3ViewUtils.animateOutline('POI-' + elements[i]);
    //  D3ViewUtils.animateOutline('ROI-' + elements[i]);
    //}
    this.setState({
      entitiesIds: elements,
      annotationsIds: [],
      tagsIds: [],
      creatorsIds: [],
      entities: {},
      annotations: {},
      tags: {},
      annotationTextInput: '',
      newAnnotationActiveField: null
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
          item.value = 'Périmètre = ' + (mmPerPixel * metadata.valueInPx).toFixed(2) + ' mm';
          break;
        case 100: // Area
          item.value = 'Aire = ' + ((mmPerPixel * mmPerPixel) * metadata.valueInPx).toFixed(2) + ' mm²';
          break;
        case 102:
          // Length
          item.value = 'Longueur = ' + (mmPerPixel * metadata.valueInPx).toFixed(2) + ' mm';
          break;
        case 103:
          item.value = 'Angle = ' + this.convertToDMS(metadata.valueInPx);
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

    //this.refs['NEW-ANNOTATION-' + id].style.height = '60px';
    this.setState({newAnnotationActiveField: id});
    //window.setTimeout(
    //  ModalActions.showModal.bind(
    //    null,
    //    ModalConstants.Modals.addAnnotationToEntity,
    //    {entity: id}),
    //  10);
  }

  cancelNewAnnotation() {
    this.setState({
      newAnnotationActiveField: null,
      annotationTextInput: ''
    });
  }

  saveNewAnnotation(id) {
    ServiceMethods.addAnnotation(id, this.state.annotationTextInput, this.onAnnotationSaveResponse.bind(this));

  }

  onAnnotationSaveResponse(msg) {
    if(msg.clientProcessError) {
      alert("Une erreur est survenue pendant l'enregistrement. Veuillez réessayer.");
    }
    else {
      this.cancelNewAnnotation();
    }
  }

  onAnnotationTextChange(e) {
    this.setState({annotationTextInput: e.target.value});
  }

  centerViewOn(d3id) {
    if(!d3id) {
      alert('Action indisponible pour cette entité');
      return;
    }
    D3ViewUtils.zoomToObject('#' + d3id, this.props.viewstore.getView());
  }

  toggleOutline(d3id) {
    if(d3.select('#' + d3id).classed('outline')) {
      D3ViewUtils.stopOutlineAnimation(d3id);
    }
    else {
      D3ViewUtils.animateOutline(d3id);
    }
  }

  showOutline(d3id) {
    if(d3id == null) {
      return;
    }
    if(!d3.select('#' + d3id).classed('outline')) {
      D3ViewUtils.animateOutline(d3id);
    }
  }

  hideOutline(d3id) {
    if(d3id == null) {
      return;
    }
    if(d3.select('#' + d3id).classed('outline')) {
      D3ViewUtils.stopOutlineAnimation(d3id);
    }
  }

  buildEntityDisplay(entityId) {
    var displayName = null;
    var d3id = null;
    var displayType = '(?)';
    var entityMetadata = this.state.entities[entityId];
    if (entityMetadata) {
      displayName = entityMetadata.name;
    }
    else {
      return null;
    }

    var eyeIconStyle = JSON.parse(JSON.stringify(this.addAnnotationStyle));
    var toggleIconStyle = JSON.parse(JSON.stringify(this.addAnnotationStyle));

    switch(entityMetadata.type) {
      case 'PointOfInterest':
        displayType = 'Point : ';
        d3id = 'POI-' + entityId;
        break;
      case 'TrailOfInterest':
        displayType = 'Chemin : ';
        d3id = 'PATH-' + entityId;
        break;
      case 'RegionOfInterest':
        displayType = 'Zone : ';
        d3id = 'ROI-' + entityId;
        break;
      case 'AngleOfInterest':
        displayType = 'Angle : ';
        d3id = 'AOI-' + entityId;
        break;
      case 'Image':
        displayType = 'Image : ';
        eyeIconStyle.visibility = 'hidden';
        toggleIconStyle.visibility = 'hidden';
        break;
      case 'Specimen':
        displayType = 'Specimen : ';
        eyeIconStyle.visibility = 'hidden';
        toggleIconStyle.visibility = 'hidden';
        break;
      case 'Set':
        displayType = 'Set : ';
        eyeIconStyle.visibility = 'hidden';
        toggleIconStyle.visibility = 'hidden';
        break;
      default:
        console.warn('Unknown entity type ' + entityMetadata.type);
    }
    var measurements = entityMetadata.measurements;
    if(!measurements) {
      measurements = [];
    }
    var annotations = entityMetadata.annotations;
    if(!annotations) {
      annotations = [];
    }
    else {
      annotations = _.map(entityMetadata.annotations, this.getAnnotationData.bind(this));
      annotations = _.sortBy(annotations, Globals.getCreationDate).reverse();
    }

    if(this.props.modestore.isInSetMode() || this.props.modestore.isInTabularMode()) {
      eyeIconStyle.visibility = 'hidden';
      toggleIconStyle.visibility = 'hidden';
    }
    var annotationInputLocalStyle = JSON.parse(JSON.stringify(this.annotationInputStyle));
    if(this.state.newAnnotationActiveField == entityId) {
      //annotationInputLocalStyle.height = 'auto';
      annotationInputLocalStyle.maxHeight = '500px';
      annotationInputLocalStyle.transition = 'max-height 0.25s ease-in';
      annotationInputLocalStyle.overflow = null;
    }
    else {
      annotationInputLocalStyle.maxHeight = 0;
      annotationInputLocalStyle.transition = 'max-height 0.15s ease-out';
      annotationInputLocalStyle.overflow = 'hidden';
    }

    return (
      <div style={this.metadataStyle}
           key={'ENTITY-' + entityId}
           onMouseEnter={this.showOutline.bind(this, d3id)}
           onMouseLeave={this.hideOutline.bind(this, d3id)}>
        <div style={this.titleStyle}>
          <div className='text' style={this.entityNameStyle}>
            {displayName}
          </div>
          <div>
          <i className='grey small eye icon'
             style={eyeIconStyle}
             data-content="Centrer la paillasse sur l'élement"
             onClick={this.centerViewOn.bind(this, d3id)}
             />
          <i className='grey small write icon'
             style={this.addAnnotationStyle}
             data-content='Ajouter une annotation'
             onClick={this.addAnnotation.bind(this, entityId)}/>
        </div>
          </div>

        <div className='text' style={this.entityMetaStyle}>
          {'Création : ' + (new Date(entityMetadata.creationDate)).toLocaleString('fr-FR', {weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric', hour:'numeric', minute: 'numeric'})}
        </div>
        <div className='ui field' style={annotationInputLocalStyle}>
          <label style={this.annotationInputTitleStyle}>Nouvelle annotation</label>
            <textarea rows='3'
                      autofocus='true'
                      value={this.state.annotationTextInput}
                      onChange={this.onAnnotationTextChange.bind(this)}/>
          <div style={this.annotationInputButtonRowStyle} className='ui tiny compact buttons'>
            <button className='ui red button' onClick={this.cancelNewAnnotation.bind(this)}>Annuler</button>
            <button className='ui green button' onClick={this.saveNewAnnotation.bind(this, entityId)}>Enregistrer</button>
          </div>
        </div>
        {measurements.map(this.buildMeasurementDisplay.bind(this))}
        {annotations.map(this.buildAnnotationDisplay.bind(this))}
        <div className='ui horizontal divider' ></div>
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
    var authorStyle = JSON.parse(JSON.stringify(this.annotationAuthorStyle));
    if(this.props.userstore.getUser().login === meta.author) {
      authorStyle.visibility = 'hidden';
    }
    return (
      <div style={this.annotationStyle} key={'MEASURE-' + measurementId}>
        <div style={this.annotationMetadataStyle}>
          <a style={authorStyle} className="author">{meta.author}</a>
          <span style={this.annotationDateStyle} className="date">{meta.date}</span>
        </div>
        <div style={this.annotationTextStyle} className="text">
          <i>{meta.value}</i><i className={icon} data-content={meta.warning}/>
        </div>
      </div>
    );
  }

  buildAnnotationDisplay(annotationMetadata) {
    //var annotationMetadata = this.state.annotations[annotationId];
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
    var authorStyle = JSON.parse(JSON.stringify(this.annotationAuthorStyle));
    if(this.props.userstore.getUser().login === author) {
      authorStyle.visibility = 'hidden';
    }

    return (
      <div style={this.annotationStyle} key={'MEASURE-' + annotationMetadata.uid}>
        <div style={this.annotationMetadataStyle}>
          <a style={authorStyle} className="author">{author}</a>
          <span style={this.annotationDateStyle} className="date">{date.toLocaleDateString()}</span>
        </div>
        <div style={this.annotationTextStyle} className="text">
          <i>{annotationMetadata.content}</i>
        </div>
      </div>
    );
  }

  getAnnotationData(annotationId) {
    return this.state.annotations[annotationId];
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
    $('.small.icon', $(this.refs.component.getDOMNode())).popup();
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
        Propriétés
      </div>
      <div style={this.scrollerStyle}>
        {this.state.entitiesIds.map(this.buildEntityDisplay.bind(this))}
      </div>
    </div>
  }
}

export default ElementInspector;
