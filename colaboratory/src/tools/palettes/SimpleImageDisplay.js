/**
 * Created by dmitri on 24/05/16.
 */
'use strict';

import React from 'react';

import MetadataActions from '../../actions/MetadataActions';
import ViewActions from '../../actions/ViewActions';
import ModeActions from '../../actions/ModeActions';

import ModeConstants from '../../constants/ModeConstants';

import Globals from '../../utils/Globals';

class SimpleImageDisplay extends React.Component {
  constructor(props) {
    super(props);

    this.componentStyle = {
      height: this.props.height,
      padding: '5px 5px 5px 5px',
      borderColor: '#2185d0!important'
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

    this.compactBorderlessSegmentStyle = {
      padding: 0,
      margin: 0
    };

    this.twoColumnContainerStyle = {
      display: 'flex',
      flexDirection: 'row',
      height: '90%',
      width: '100%'
    };

    this.imageStyle = {
      maxWidth: '50%',
      maxHeight: '90%'
    };

    this.segmentsContainerStyle = {
      width: '50%',
      height: '90%',
      overflowY: 'auto'
    };

    this._onModeChange = () => {
      const setModeVisibility = () => this.setState({
        isVisibleInCurrentMode: this.props.modestore.isInSetMode()
      });
      return setModeVisibility.apply(this);
    };

    this._onSelectionChange = () => {
      const getImages = () => this.getImagesOfSelection(this.props.managerstore.getSelected());
      return getImages.apply(this);
    };

    this._onMetadataReceived = (id) => {
      const processMetadata = (id) => this.processReceivedMetadata(id);
      return processMetadata.apply(this, [id]);
    };

    this.state = {
      isVisibleInCurrentMode: true,
      selectionTitle: "Pré-visionneuse d'images",
      imagesOfSelection: [],
      imageUrl: null,
      listening: []
    };
  }

  removeListeners() {
    for(var i = 0; i < this.state.listening.length; ++i) {
      this.props.metastore.removeMetadataUpdateListener(this.state.listening[i], this._onMetadataReceived);
    }
  }

  getImagesOfSelection(selection) {
    this.removeListeners();
    this.setState({imagesOfSelection: [], imageUrl: null, listening: [selection.id]});
    switch(selection.type) {
      case 'Image':
      case 'Specimen':
      case 'Set':
        this.props.metastore.addMetadataUpdateListener(selection.id, this._onMetadataReceived);
        this.processReceivedMetadata(selection.id, true);
        break;
      default:
        this.setState({selectionTitle: "Pré-visionneuse d'images"});
        return;
    }
    this.setState({selectionTitle: selection.name});
  }

  processReceivedMetadata(id, skipListenerCheck = false) {
    //this.props.metastore.removeMetadataUpdateListener(id, this._onMetadataReceived);
    if(!_.contains(this.state.listening, id) && !skipListenerCheck) {
      console.log('Not listening for ' + id);
      return;
    }
    var metadata = this.props.metastore.getMetadataAbout(id);
    console.log('Metadata for ' + id + " : " + JSON.stringify(metadata));
    if(metadata) {
      switch(metadata.type) {
        case 'Image':
          var keyedImages = _.indexBy(this.state.imagesOfSelection, function(image){return image.uid});
          keyedImages[metadata.uid] = metadata;
          this.setState({
            imagesOfSelection: _.sortBy(_.values(keyedImages), Globals.getName)});
          break;
        case 'Specimen':
          var listening = JSON.parse(JSON.stringify(this.state.listening));
          for(var i = 0; i < metadata.images.length; ++i) {
            this.props.metastore.addMetadataUpdateListener(metadata.images[i], this._onMetadataReceived);
            listening.push(metadata.images[i]);
            this.processReceivedMetadata(metadata.images[i], true);
          }
          this.setState({listening: listening});
          break;
        case 'Set':
          var listening = JSON.parse(JSON.stringify(this.state.listening));
          var metaToUpdate = [];
          for(var i = 0; i < metadata.items.length; ++i) {
            this.props.metastore.addMetadataUpdateListener(metadata.items[i].uid, this._onMetadataReceived);
            listening.push(metadata.items[i].uid);
            metaToUpdate.push(metadata.items[i].uid);
            this.processReceivedMetadata(metadata.items[i].uid, true);
          }
          this.setState({listening: listening});
          break;
        default:
          console.warn('No metadata processor for type ' + metadata.type);
          break;
      }
    }
  }

  showImage(url) {
    this.setState({imageUrl: url});
  }

  loadParentSet() {
    var sets = this.props.managerstore.getSets();
    var id = sets[sets.length-1].uid;
    if(id) {
      window.setTimeout(ViewActions.setActiveSet.bind(null, id), 10);
      // window.setTimeout(ManagerActions.toggleSetManagerVisibility.bind(null,false),20);
      window.setTimeout(ModeActions.changeMode.bind(null,ModeConstants.Modes.OBSERVATION),20);
    }
    else {
      console.warn('Last displayed set not obtained');
    }

  }

  componentDidMount() {
    this.props.modestore.addModeChangeListener(this._onModeChange);
    this.props.managerstore.addSelectionChangeListener(this._onSelectionChange);
  }

  componentWillUpdate(nextProps, nextState) {
    if (nextState.isVisibleInCurrentMode) {
      this.componentStyle.display = '';
      if(nextState.imageUrl == null && nextState.imagesOfSelection.length > 0) {
        nextState.imageUrl = nextState.imagesOfSelection[0].thumbnail;
      }
    }
    else {
      this.componentStyle.display = 'none';
    }
  }

  componentWillUnmount() {
    this.props.modestore.removeModeChangeListener(this._onModeChange);
    this.props.managerstore.removeSelectionChangeListener(this._onSelectionChange);
    this.removeListeners();
  }

  render() {
    var self = this;

    return <div className='ui segment container' style={this.componentStyle}>
      <div className='ui blue tiny basic label'
           style={this.labelStyle}>
        Aperçu
      </div>
      <div style={this.scrollerStyle}>
      <div className='ui small header centered segment'
           style={this.compactBorderlessSegmentStyle}>
        <div className='ui item'>
          {this.state.selectionTitle}
          <i>{' ' + this.state.imagesOfSelection.length + ' images'}</i>
          (Aperçu)
        </div>
      </div>
      <div className='ui container' style={this.twoColumnContainerStyle}>
        <div className='ui compact segments' style={this.segmentsContainerStyle}>
          {this.state.imagesOfSelection.map(function(image, index) {
            var color = 'ui';
            if(image.thumbnail == self.state.imageUrl) {
              color = 'ui blue inverted';
            }
            return <div className={color + ' segment'}
                        key={'SIMPLE-IMAGE-' + image.uid}
                        style={self.compactBorderlessSegmentStyle}
                        onDoubleClick={self.loadParentSet.bind(self)}
                        onClick={self.showImage.bind(self, image.thumbnail)}>
              {image.name}
            </div>
          })}
        </div>
        <img className='ui centered bordered image'
             style={this.imageStyle}
             src={this.state.imageUrl}
             onDoubleClick={self.loadParentSet.bind(self)}
             alt="Aucune image sélectionnée">
        </img>
      </div>
        </div>
    </div>
  }
}

export default SimpleImageDisplay;
