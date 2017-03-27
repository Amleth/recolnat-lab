/**
 * This component provides complete information on the selected entities (Properties panel).
 *
 * Created by dmitri on 02/05/16.
 */
'use strict';

import React from 'react';
import d3 from 'd3';

import TagInput from '../../components/common/TagInput';
import Tag from '../../components/common/Tag';

import Globals from '../../utils/Globals';
import D3ViewUtils from '../../utils/D3ViewUtils';
import ServiceMethods from '../../utils/ServiceMethods';

class ElementInspector extends React.Component {
  constructor(props) {
    super(props);

    this.containerStyle = {
      padding: '5px 5px 5px 5px',
      borderColor: '#2185d0!important',
      height: this.props.height-10
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

    this.annotationInputStyle = {
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'lavender',
      overflow: 'hidden',
      maxHeight: 0
    };

    this.annotationInputTitleStyle = {
      textAlign: 'center'
    };

    this.annotationInputTextStyle = {
      lineHeight: 1
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
      fontWeight: 'bold',
      margin: 0
    };

    this.entityMetaStyle = {
      margin: 0
    };

    this.addAnnotationStyle = {
      cursor: 'pointer'
    };

    this.annotationStyle = {
      //marginBottom: '-10px'
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

    this._onEntityMetadataChange = () => {
      const processEntityMetadata = () => this.processEntityMetadata();
      return processEntityMetadata.apply(this);
    };

    this._onAnnotationMetadataChange = () => {
      const processAnnotationMetadata = () => this.processAnnotationMetadata();
      return processAnnotationMetadata.apply(this);
    };

    this._onStandardMetadataChange = () => {
      const processStandardMetadata = () => this.processStandardMetadata();
      return processStandardMetadata.apply(this);
    };

    this._onCreatorMetadataChange = () => {
      const processCreatorMetadata = () => this.processCreatorMetadata();
      return processCreatorMetadata.apply(this);
    };

    this._onTagChange = () => {
      const update = () => this.processTag();
      return update.apply(this);
    };

    this._forceUpdate = () => {
      const update = () => this.setState({});
      return update.apply(this);
    };

    this.state = {
      entitiesIds: [],
      annotationsIds: [],
      tagsIds: [],
      creatorsIds: [],
      standardsIds: [],
      entities: {},
      annotations: {},
      standards: {},
      tags: {},
      creators: {},
      annotationTextInput: '',
      newAnnotationActiveField: null,
      position: {}
    };
  }

  setInspectorContent() {
    this.clearMetadataListeners(this.state.entitiesIds, this._onEntityMetadataChange);
    this.clearMetadataListeners(this.state.annotationsIds, this._onAnnotationMetadataChange);
    this.clearMetadataListeners(this.state.creatorsIds, this._onCreatorMetadataChange);
    this.clearMetadataListeners(this.state.standardsIds, this._onStandardMetadataChange);

    let elements = this.props.inspecstore.getInspectorContent();

    this.setState({
      entitiesIds: elements,
      annotationsIds: [],
      tagsIds: [],
      creatorsIds: [],
      standardsIds: [],
      entities: {},
      annotations: {},
      standards: {},
      tags: {},
      annotationTextInput: '',
      newAnnotationActiveField: null
    });

    this.addMetadataListeners(elements, this._onEntityMetadataChange);
    //window.setTimeout(this._onEntityMetadataChange, 50);
  }

  addMetadataListeners(ids, callback) {
    for(let i = 0; i < ids.length; ++i) {
      this.props.metastore.addMetadataUpdateListener(ids[i], callback);
    }
  }

  clearMetadataListeners(ids, callback) {
    for(let k = 0; k < ids.length; ++k) {
      this.props.metastore.removeMetadataUpdateListener(ids[k], callback);
    }
  }

  processEntityMetadata() {
    let metadatas = {};
    let annotationsIds = [];
    let tagsIds = [];

    for(let i = 0; i < this.state.entitiesIds.length; ++i) {
      let metadata = this.props.metastore.getMetadataAbout(this.state.entitiesIds[i]);
      if(metadata) {
        metadatas[this.state.entitiesIds[i]] = metadata;
        if(metadata.annotations) {
          Array.prototype.push.apply(annotationsIds, metadata.annotations);
        }
        if(metadata.measurements) {
          Array.prototype.push.apply(annotationsIds, metadata.measurements);
        }
        if(metadata.tags) {
          Array.prototype.push.apply(tagsIds, metadata.tags);
        }
      }
      else {
        metadatas[this.state.entitiesIds[i]] = null;
      }
    }

    annotationsIds = _.uniq(annotationsIds);
    let newAnnotationIds = _.difference(annotationsIds, this.state.annotationsIds);
    //var removedAnnotationIds = _.difference(this.state.annotationsIds, annotationsIds);
    //console.log('New annotations ids: ' + JSON.stringify(newAnnotationIds));
    //this.clearMetadataListeners(removedAnnotationIds);
    this.addMetadataListeners(newAnnotationIds, this._onAnnotationMetadataChange);

    tagsIds = _.uniq(tagsIds);
    let newTagsIds = _.difference(tagsIds, this.state.tagsIds);
    this.addMetadataListeners(newTagsIds, this._onTagChange);

    this.setState({
      entities: metadatas,
      annotationsIds: annotationsIds,
      tagsIds: tagsIds
    });

    //window.setTimeout(this._onAnnotationMetadataChange, 50);
  }

  processAnnotationMetadata() {
    let annotations = {};
    let creatorIds = [];
    let standardIds = [];
    for(let i = 0; i < this.state.annotationsIds.length; ++i) {
      let metadata = this.props.metastore.getMetadataAbout(this.state.annotationsIds[i]);
      if(metadata) {
        annotations[metadata.uid] = metadata;
        if(metadata.creator) {
          creatorIds.push(metadata.creator);
        }
        if(metadata.standards) {
          standardIds.push(...metadata.standards);
        }
      }
      else {
        annotations[this.state.annotationsIds[i]] = null;
      }
    }

    creatorIds = _.uniq(creatorIds);
    let newCreatorIds = _.difference(creatorIds, this.state.creatorsIds);
    //var removedCreatorIds = _.difference(this.state.creatorsIds, creatorIds);
    standardIds = _.uniq(standardIds);
    let newStandardIds = _.difference(standardIds, this.state.standardsIds);

    //this.clearMetadataListeners(removedCreatorIds);
    this.addMetadataListeners(newCreatorIds, this._onCreatorMetadataChange);
    this.addMetadataListeners(newStandardIds, this._onStandardMetadataChange);

    this.setState({
      annotations: annotations,
      creatorsIds: creatorIds,
      standardsIds: standardIds
    });

    //window.setTimeout(this._onCreatorMetadataChange, 50);
  }

  processCreatorMetadata() {
    let creators = {};
    for(let i = 0; i < this.state.creatorsIds.length; ++i) {
      let metadata = this.props.metastore.getMetadataAbout(this.state.creatorsIds[i]);
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

  processStandardMetadata() {
    let standards = {};
    for (let i = 0; i < this.state.standardsIds.length; ++i) {
      let metadata = this.props.metastore.getMetadataAbout(this.state.standardsIds[i]);
      if(metadata) {
        standards[metadata.uid] = metadata;
      }
      else {
        standards[this.state.standardsIds[i]] = null;
      }
    }

    this.setState({
      standards: standards
    });
  }

  processTag() {
    let tags = {};
    for(let i = 0; i < this.state.tagsIds.length; ++i) {
      let tag = this.props.metastore.getMetadataAbout(this.state.tagsIds[i]);
      if(tag && !tag.deleted) {
        tags[tag.uid] = tag;
      }
      else {
        delete tags[this.state.tagsIds[i]];
      }
    }

    this.setState({
      tags: tags
    });
  }

  annotationToMetaDisplay(metadata) {
    let item = {
      date: new Date(),
      value: metadata.content
    };
    item.date.setTime(metadata.creationDate);
    item.date = item.date.toLocaleDateString(this.props.userstore.getLanguage());

    if(!metadata.creator) {
      item.author = this.props.userstore.getText('recolnatSystem');
    }
    else {
      let authorMetadata = this.state.creators[metadata.creator];
      if(authorMetadata) {
        item.author = authorMetadata.name;
      }
    }

    return item;
  }

  measurementToMetaDisplay(metadata) {
    let item = {
      date: new Date()
    };
    item.date.setTime(metadata.creationDate);
    item.date = item.date.toLocaleDateString(this.props.userstore.getLanguage());
    // Ideally all of this metadata has been downloaded beforehand, otherwise the inspector could not have been reached.
    let entityId = metadata.parents[0];
    if(!entityId) {
      return null;
    }
    let imageId = this.state.entities[entityId].parents[0];
    if(!imageId) {
      return null;
    }
    let imageMetadata = this.props.metastore.getMetadataAbout(imageId);
    let mmPerPixel = null;
    if(imageMetadata.scales.length > 0) {
      let scaleId = imageMetadata.scales[imageMetadata.scales.length - 1];
      let scale = this.props.metastore.getMetadataAbout(scaleId);
      if(scale) {
        mmPerPixel = scale.mmPerPixel;
      }
    }
    if(!mmPerPixel) {
      mmPerPixel = Globals.getEXIFScalingData(imageMetadata);
    }
    if(mmPerPixel) {
      switch(metadata.measureType) {
        case 101: // Perimeter
          item.value = this.props.userstore.getText('perimeter') + ' = ' + (mmPerPixel * metadata.valueInPx).toFixed(2) + ' mm';
          break;
        case 100: // Area
          item.value = this.props.userstore.getText('area') + ' = ' + ((mmPerPixel * mmPerPixel) * metadata.valueInPx).toFixed(2) + ' mm²';
          break;
        case 102:
          // Length
          item.value = this.props.userstore.getText('length') + ' = ' + (mmPerPixel * metadata.valueInPx).toFixed(2) + ' mm';
          break;
        case 103:
          item.value = this.props.userstore.getText('angle') + ' = ' + this.convertToDMS(metadata.valueInPx);
          break;
        default:
          console.warn('Unknown measure type ' + metadata.measureType);
      }
    }
    else {
      item.value = metadata.valueInPx.toFixed(2) + ' px';
      item.warning = this.props.userstore.getText('noStandardAvailable');
    }
    if(!metadata.creator) {
      item.author = this.props.userstore.getText('recolnatSystem');
    }
    else {
      let authorMetadata = this.state.creators[metadata.creator];
      if(authorMetadata) {
        item.author = authorMetadata.name;
      }
    }

    if(metadata.standards) {
      item.standards = [];
      for(let i = 0; i < metadata.standards.length; ++i) {
        let standard = this.state.standards[metadata.standards[i]];
        if(standard) {
          item.standards.push(standard.length + standard.unit);
        }
      }
    }

    return item;
  }

  convertToDMS(angle) {
    return [0|angle, '° ', 0|(angle<0?angle=-angle:angle)%1*60, "' ", 0|angle*60%1*60, '"'].join('');
  }

  addAnnotation(id) {
    if(!id) {
      alert('Internal Error: no entity selected');
      return;
    }

    this.setState({newAnnotationActiveField: id});
  }

  addTag(id) {
    this.setState({newTagActiveField: id});
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
      alert(this.props.userstore.getText('operationFailedNetwork'));
    }
    else {
      this.cancelNewAnnotation();
    }
  }

  onAnnotationTextChange(e) {
    this.setState({annotationTextInput: e.target.value});
  }

  centerViewOn(meta) {
    if(!meta) {
      alert('Internal error: action unavailable for this entity');
      return;
    }
    D3ViewUtils.zoomToObject(meta, this.props.benchstore, this.props.viewstore.getView());
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
    let displayName = null;
    let d3id = null;
    let displayType = '(?)';
    let entityMetadata = this.state.entities[entityId];
    if (entityMetadata) {
      displayName = entityMetadata.name;
    }
    else {
      return null;
    }

    let eyeIconStyle = JSON.parse(JSON.stringify(this.addAnnotationStyle));
    let toggleIconStyle = JSON.parse(JSON.stringify(this.addAnnotationStyle));

    switch(entityMetadata.type) {
      case 'PointOfInterest':
        displayType = this.props.userstore.getText('vertex') + ' : ';
        d3id = 'POI-' + entityId;
        break;
      case 'TrailOfInterest':
        displayType = this.props.userstore.getText('trail') + ' : ';
        d3id = 'PATH-' + entityId;
        break;
      case 'RegionOfInterest':
        displayType = this.props.userstore.getText('region') + ' : ';
        d3id = 'ROI-' + entityId;
        break;
      case 'AngleOfInterest':
        displayType = this.props.userstore.getText('angle') + ' : ';
        d3id = 'AOI-' + entityId;
        break;
      case 'Image':
        displayType = this.props.userstore.getText('image') + ' : ';
        eyeIconStyle.visibility = 'hidden';
        toggleIconStyle.visibility = 'hidden';
        break;
      case 'Specimen':
        displayType = this.props.userstore.getText('specimen') + ' : ';
        eyeIconStyle.visibility = 'hidden';
        toggleIconStyle.visibility = 'hidden';
        break;
      case 'Set':
        displayType = this.props.userstore.getText('set') + ' : ';
        eyeIconStyle.visibility = 'hidden';
        toggleIconStyle.visibility = 'hidden';
        break;
      default:
        console.warn('Unknown entity type ' + entityMetadata.type);
    }
    let measurements = entityMetadata.measurements;
    if(!measurements) {
      measurements = [];
    }
    let annotations = entityMetadata.annotations;
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
    let annotationInputLocalStyle = JSON.parse(JSON.stringify(this.annotationInputStyle));
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

    let tagInput = null;
    if(this.state.newTagActiveField) {
      tagInput = <TagInput
        top={this.state.position.top}
        right={this.state.position.left}
        onClose={this.setState.bind(this, {newTagActiveField: null}, null)}
        entity={this.state.newTagActiveField} />;
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
               data-content={this.props.userstore.getText('zoomOnEntity')}
               onClick={this.centerViewOn.bind(this, entityMetadata)} />
            <i className='grey small tag icon'
               style={this.addAnnotationStyle}
               data-content={this.props.userstore.getText('addATag')}
               onClick={this.addTag.bind(this, entityId)} />
            <i className='grey small write icon'
               style={this.addAnnotationStyle}
               data-content={this.props.userstore.getText('addAnAnnotation')}
               onClick={this.addAnnotation.bind(this, entityId)} />
          </div>
        </div>

        <div className='text' style={this.entityMetaStyle}>
          {this.props.userstore.getText('creationDate') + ' : ' + (new Date(entityMetadata.creationDate)).toLocaleString(this.props.userstore.getLanguage(), {weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric', hour:'numeric', minute: 'numeric'})}
        </div>
        {measurements.map(this.buildMeasurementDisplay.bind(this))}
        <div className='ui field' style={annotationInputLocalStyle}>
          <label style={this.annotationInputTitleStyle}>{this.props.userstore.getText('newAnnotation')}</label>
          <textarea rows='2'
                    autoFocus='true'
                    style={this.annotationInputTextStyle}
                    value={this.state.annotationTextInput}
                    onChange={this.onAnnotationTextChange.bind(this)}/>
          <div style={this.annotationInputButtonRowStyle} className='ui tiny compact buttons'>
            <button className='ui red button' onClick={this.cancelNewAnnotation.bind(this)}>{this.props.userstore.getText('cancel')}</button>
            <button className='ui green button' onClick={this.saveNewAnnotation.bind(this, entityId)}>{this.props.userstore.getText('save')}</button>
          </div>
        </div>
        {entityMetadata.tags.map(this.buildTagDisplay.bind(this))}
        {tagInput}
        {annotations.map(this.buildAnnotationDisplay.bind(this))}
        <div className='ui horizontal divider' ></div>
      </div>
    );
  }

  buildTagDisplay(tagId) {
    let tag = this.state.tags[tagId];
    if(!tag) {
      return null;
    }
    return (
      <Tag key={tag.definition}
           tag={tag}
           modestore={this.props.modestore}
           metastore={this.props.metastore}
           viewstore={this.props.viewstore}
           showDelete={true} />
    );
  }

  buildMeasurementDisplay(measurementId) {
    let measurementMetadata = this.state.annotations[measurementId];
    if(!measurementMetadata) {
      return null;
    }
    let meta = this.measurementToMetaDisplay(measurementMetadata);
    if(!meta) {
      return null;
    }
    let icon = '';
    if(meta.warning) {
      icon = 'yellow warning icon';
    }
    let authorStyle = JSON.parse(JSON.stringify(this.annotationAuthorStyle));
    if(this.props.userstore.getUser().login === meta.author) {
      authorStyle.visibility = 'hidden';
    }

    let standardIcon = null;
    if(meta.standards) {
      standardIcon = <i className='blue small info circle icon' data-content={this.props.userstore.getInterpolatedText('measureIsStandard', [JSON.stringify(meta.standards)])} />;
    }


    return (
      <div style={this.annotationStyle} key={'MEASURE-' + measurementId}>
        <div style={this.annotationTextStyle} >
          <span>{meta.value}</span>
          <i className={icon} data-content={meta.warning}/>
          {standardIcon}
        </div>
      </div>
    );
  }

  buildAnnotationDisplay(annotationMetadata) {
    //var annotationMetadata = this.state.annotations[annotationId];
    if(!annotationMetadata) {
      return null;
    }
    let meta = this.annotationToMetaDisplay(annotationMetadata);
    if(!meta) {
      return null;
    }

    let date = new Date();
    date.setTime(annotationMetadata.creationDate);

    let author = '';
    if(!annotationMetadata.creator) {
      author = this.props.userstore.getText('recolnatSystem');
    }
    else {
      let authorMetadata = this.state.creators[annotationMetadata.creator];
      if(authorMetadata) {
        author = authorMetadata.name;
      }
    }
    let authorStyle = JSON.parse(JSON.stringify(this.annotationAuthorStyle));
    if(this.props.userstore.getUser().login === author) {
      authorStyle.visibility = 'hidden';
    }

    return (
      <div style={this.annotationStyle} key={'ANNOTATION-' + annotationMetadata.uid}>
        <div style={this.annotationMetadataStyle}>
          <a style={authorStyle} className="author">{author}</a>
          <span style={this.annotationDateStyle} className="date">{date.toLocaleDateString(this.props.userstore.getLanguage())}</span>
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
    this.props.modestore.addModeChangeListener(this._forceUpdate);
    this.props.inspecstore.addContentChangeListener(this._onSelectionChange);
    this.props.userstore.addLanguageChangeListener(this._forceUpdate);
    let pos = React.findDOMNode(this).getBoundingClientRect();
    this.setState({position: {top: pos.top, left: pos.left}});
  }

  componentWillReceiveProps(props) {
    if(props.height != this.props.height) {
      this.containerStyle.height = props.height-10;
      this.scrollerStyle.height = props.height-35;
    }
  }

  componentWillUpdate(nextProps, nextState) {
    let pos = React.findDOMNode(this).getBoundingClientRect();
    nextState.position.top = pos.top;
    nextState.position.left = pos.left;
  }

  componentDidUpdate(prevProps, prevState) {
    $('.yellow.warning.icon', $(this.refs.component.getDOMNode())).popup();
    $('.small.icon', $(this.refs.component.getDOMNode())).popup();
  }

  componentWillUnmount() {
    this.props.userstore.removeLanguageChangeListener(this._forceUpdate);
    this.clearMetadataListeners(this.state.entitiesIds, this._onEntityMetadataChange);
    this.clearMetadataListeners(this.state.annotationsIds, this._onAnnotationMetadataChange);
    this.clearMetadataListeners(this.state.creatorsIds, this._onCreatorMetadataChange);
    this.props.modestore.removeModeChangeListener(this._forceUpdate);
    this.props.inspecstore.removeContentChangeListener(this._onSelectionChange);
  }

  render() {
    return <div className='ui segment container' ref='component' style={this.containerStyle}>
      <div style={this.labelContainerStyle}>
        <div className='ui blue tiny basic label'
             style={this.labelStyle}>
          {this.props.userstore.getText('properties')}
        </div>
      </div>
      <div style={this.scrollerStyle}>
        {this.state.entitiesIds.map(this.buildEntityDisplay.bind(this))}
      </div>
    </div>
  }
}

export default ElementInspector;
