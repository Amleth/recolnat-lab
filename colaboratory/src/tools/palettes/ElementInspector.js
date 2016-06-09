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

    this.containerStyle = {
      height: this.props.height,
      padding: '5px 5px 5px 5px',
      margin: '1%',
      overflow: 'hidden'
    };

    this.fixedHeightStyle = {
      height: '100%'
    };

    this.menuStyle = {
      margin: 0
    };

    this.metadataStyle = {
      overflowY: 'auto',
      height: '80%',
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
      imageUrl: 'https://upload.wikimedia.org/wikipedia/en/8/89/Construction_Icon_small.png',
      name: "Inspecteur d'élements",
      currentIndex: -1,
      entityIds: [],
      selectedEntityMetadata: null,
      annotationIds: [],
      annotationsMetadata: {},
      creatorIds: [],
      creatorsMetadata: {},
      metadata: [

      ],
      tags: [

      ]
    };
  }

  setInspectorContent() {
    if(this.state.currentIndex > -1) {
      this.clearListeners(this.state.entityIds[this.state.currentIndex], true, true);
    }
    else {
      this.clearListeners(null, true, true);
    }
    var elements = this.props.inspecstore.getInspectorContent();
    this.setState({
      entityIds: elements,
      selectedEntityMetadata: null,
      annotationIds: [],
      annotationsMetadata: {},
      creatorIds: [],
      creatorsMetadata: {}
    });

    if(elements.length > 0) {
      this.setState({currentIndex: 0});
      this.props.metastore.addMetadataUpdateListener(elements[0], this._onEntityMetadataChange);
      window.setTimeout(MetadataActions.updateMetadata.bind(null, elements), 10);
    }
    else {
      this.setState({currentIndex: -1});
    }
  }

  previousItem() {
    var index = this.state.currentIndex;
    if(index == 0) {
      this.setActiveElement(this.state.entityIds.length-1);
    }
    else {
      this.setActiveElement(index-1);
    }
  }

  nextItem() {
    var index = this.state.currentIndex;
    if(index == this.state.entityIds.length-1) {
      this.setActiveElement(0);
    }
    else {
      this.setActiveElement(index+1);
    }
  }

  clearListeners(entity, removeAnnotations, removeCreators) {
    if(entity) {
      this.props.metastore.removeMetadataUpdateListener(entity, this._onEntityMetadataChange);
    }

    if(removeAnnotations) {
      for(var i = 0; i < this.state.annotationIds.length; ++i) {
        this.props.metastore.removeMetadataUpdateListener(this.state.annotationIds[i], this._onAnnotationMetadataChange);
      }
    }

    if(removeCreators) {
      for(var j = 0; j < this.state.creatorIds.length; ++j) {
        this.props.metastore.removeMetadataUpdateListener(this.state.creatorIds[j], this._onCreatorMetadataChange);
      }
    }
  }

  setActiveElement(index) {
    if(this.state.currentIndex > -1) {
      this.clearListeners(this.state.entityIds[this.state.currentIndex], true, true);
    }

    this.setState({
      currentIndex: index,
      selectedEntityMetadata: null,
      annotationIds: [],
      annotationsMetadata: {},
      creatorIds: [],
      creatorsMetadata: {},
    });
    this.props.metastore.addMetadataUpdateListener([this.state.entityIds[index]], this._onEntityMetadataChange);
    window.setTimeout(MetadataActions.updateMetadata.bind(null, [this.state.entityIds[index]]), 10);
  }

  processEntityMetadata() {
    if(this.state.currentIndex < 0) {
      return;
    }

    var metadata = this.props.metastore.getMetadataAbout(this.state.entityIds[this.state.currentIndex]);

    if(!metadata) {
      console.error('No metadata for ' + this.state.entityIds[this.state.currentIndex]);
      return;
    }

    var metadataIds = [];
    if(metadata.annotations) {
      for(var i = 0; i < metadata.annotations.length; ++i) {
        this.props.metastore.addMetadataUpdateListener(metadata.annotations[i], this._onAnnotationMetadataChange);
        metadataIds.push(metadata.annotations[i]);
      }
    }

    if(metadata.measurements) {
      for(var j = 0; j < metadata.measurements.length; ++j) {
        this.props.metastore.addMetadataUpdateListener(metadata.measurements[j], this._onAnnotationMetadataChange);
        metadataIds.push(metadata.measurements[j]);
      }
    }


    this.setState({
      selectedEntityMetadata: metadata,
      annotationIds: metadataIds,
      annotationsMetadata: {},
      name: metadata.name
    });

    window.setTimeout(MetadataActions.updateMetadata.bind(null, metadataIds), 10);
  }

  processAnnotationMetadata() {
    var annotations = {};
    var creatorIds = [];
    for(var i = 0; i < this.state.annotationIds.length; ++i) {
      var metadata = this.props.metastore.getMetadataAbout(this.state.annotationIds[i]);
      if(metadata) {
        annotations[metadata.uid] = metadata;
        if(metadata.creator) {
          creatorIds.push(metadata.creator);
        }
      }
    }

    creatorIds = _.uniq(creatorIds);
    var newCreatorIds = _.difference(creatorIds, this.state.creatorIds);
    var removedCreatorIds = _.difference(this.state.creatorIds, creatorIds);

    for(var k = 0; k < newCreatorIds.length; ++k) {
      this.props.metastore.addMetadataUpdateListener(newCreatorIds[k], this._onCreatorMetadataChange);
    }
    for(k = 0; k < removedCreatorIds.length; ++k) {
      this.props.metastore.removeMetadataUpdateListener(newCreatorIds[k], this._onCreatorMetadataChange);
    }
    this.setState({
      annotationsMetadata: annotations,
      creatorIds: creatorIds
    });
    window.setTimeout(MetadataActions.updateMetadata.bind(null, newCreatorIds), 10);
  }

  processCreatorMetadata() {
    var creators = {};
    for(var i = 0; i < this.state.creatorIds.length; ++i) {
      var metadata = this.props.metastore.getMetadataAbout(this.state.creatorIds[i]);
      if(metadata) {
        creators[metadata.uid] = metadata;
      }
    }
    this.setState({
      creatorsMetadata: creators
    });
  }

  buildDisplay(state) {
    var metadatas = [];
    if(state.currentIndex >= 0) {
      var displayedEntityId = state.entityIds[state.currentIndex];
      if(state.selectedEntityMetadata) {
        if(state.selectedEntityMetadata.annotations) {
          for(var i = 0; i < state.selectedEntityMetadata.annotations.length; ++i) {
            var annotationMetadata = state.annotationsMetadata[state.selectedEntityMetadata.annotations[i]];
            if(annotationMetadata) {
              var item = {
                date: new Date(),
                value: annotationMetadata.content
              };
              item.date.setTime(annotationMetadata.creationDate);
              item.date = item.date.toLocaleDateString();
              if(!annotationMetadata.creator) {
                item.author = 'Système ReColNat';
              }
              else {
                var authorMetadata = state.creatorsMetadata[annotationMetadata.creator];
                if(authorMetadata) {
                  item.author = authorMetadata.name;
                }
              }

              metadatas.push(item);
            }
          }
        }

        if(state.selectedEntityMetadata.measurements) {
          for(i = 0; i < state.selectedEntityMetadata.measurements.length; ++i) {
            var measureMetadata = state.annotationsMetadata[state.selectedEntityMetadata.measurements[i]];
            if(measureMetadata) {
              var item = {
                date: new Date()
              };
              item.date.setTime(measureMetadata.creationDate);
              item.date = item.date.toLocaleDateString();
              // Ideally all of this metadata has been downloaded beforehand, otherwise the inspector could not have been reached.
              var imageId = state.selectedEntityMetadata.parents[0];
              var imageMetadata = this.props.metastore.getMetadataAbout(imageId);
              var mmPerPixel = Globals.getEXIFScalingData(imageMetadata);
              if(mmPerPixel) {
                switch(measureMetadata.measureType) {
                  case 101: // Length or perimeter
                    item.value = (mmPerPixel * measureMetadata.valueInPx) + ' mm';
                    break;
                  case 100: // Area
                    item.value = (mmPerPixel * mmPerPixel) * measureMetadata.valueInPx + ' mm²';
                    break;
                  default:
                    console.warn('Unknown measure type ' + measureMetadata.measureType);
                }
              }
              else {
                item.value = measureMetadata.valueInPx + ' px';
                item.warning = 'Aucun étalon disponible pour la conversion';
              }
              if(!measureMetadata.creator) {
                item.author = 'Système ReColNat';
              }
              else {
                var authorMetadata = state.creatorsMetadata[measureMetadata.creator];
                if(authorMetadata) {
                  item.author = authorMetadata.name;
                }
              }
              metadatas.push(item);
            }
          }
        }
      }
    }
    return metadatas;
  }

  addAnnotation() {
    if(!this.state.selectedEntityMetadata) {
      alert('Aucune entité sélectionnée');
      return;
    }
    var id = this.state.selectedEntityMetadata.uid;
    window.setTimeout(
      ModalActions.showModal.bind(
        null,
        ModalConstants.Modals.addAnnotationToEntity,
        {entity: id},
        function(data) {  window.setTimeout(MetadataActions.updateMetadata.bind(null, [id]), 10);}),
      10);
  }

  componentDidMount() {
    this.props.modestore.addModeChangeListener(this._onModeChange);
    this.props.inspecstore.addContentChangeListener(this._onSelectionChange);
  }

  componentWillUpdate(nextProps, nextState) {
    if(nextState.isVisibleInCurrentMode) {
      this.containerStyle.display = '';
      nextState.metadata = this.buildDisplay(nextState);
    }
    else {
      this.containerStyle.display = 'none';
    }
  }

  componentDidUpdate(prevProps, prevState) {
    $('.yellow.warning.icon', $(this.refs.annotations.getDOMNode())).popup();
    $(this.refs.addIcon.getDOMNode()).popup();
    $(this.refs.title.getDOMNode()).popup();
  }

  componentWillUnmount() {
    if(this.state.currentIndex > -1) {
      this.clearListeners(this.state.entityIds[this.state.currentIndex], true, true);
    }
    else {
      this.clearListeners(null, true, true);
    }
    this.props.modestore.removeModeChangeListener(this._onModeChange);
    this.props.inspecstore.removeContentChangeListener(this._onSelectionChange);
  }

  render() {
    return <div className='ui segment container' style={this.containerStyle}>
      <div className='ui fluid borderless menu' style={this.menuStyle}>
        <a className='fitted item'>
          <div className='ui mini image'>
            <img src={this.state.imageUrl}
                 height='50px'
                 width='50px'
                 alt='Image'/>
          </div>
        </a>
        <a className='fitted item' ref='title' data-content={this.state.name} style={this.annotationTitleStyle}>
          {this.state.name}
        </a>
        <div className='ui icon right menu'>
          <a className='fitted item'>
            <i className='left arrow icon' onClick={this.previousItem.bind(this)}/>
          </a>
          <a className='fitted item'>
            <i className='right arrow icon' onClick={this.nextItem.bind(this)}/>
          </a>
        </div>
      </div>

      <div ref='annotations' className='ui comments' style={this.metadataStyle}>
        <h3>
          Mesures & Annotations
          <i className='green small add square icon'
             ref='addIcon'
             data-content='Ajouter une annotation'
             onClick={this.addAnnotation.bind(this)}/>
        </h3>
        {
          this.state.metadata.map(function(meta, index) {
            var icon = '';
            if(meta.warning) {
              icon = 'yellow warning icon';
            }
            return <div className='comment' key={index}>
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
          })
        }

      </div>
      <div className='extra' style={this.tagsStyle}>
        <div className='ui tag labels'>
          {this.state.tags.map(function(tag, index) {
            return <a key={index}
                      className='ui label'>{tag.name}</a>
          })}
        </div>
      </div>
    </div>
  }
}

export default ElementInspector;
