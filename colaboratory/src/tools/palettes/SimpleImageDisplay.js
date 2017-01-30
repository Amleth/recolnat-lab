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

    this._isMounted = false;

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

    this._onSelectionChange = () => {
      const getImages = () => {this.getImagesOfSelection(this.props.managerstore.getSelected())};
      return getImages.apply(this);
    };

    this._onMetadataReceived = (id) => {
      const processMetadata = (id) => this.processReceivedMetadata(id);
      return processMetadata.apply(this, [id]);
    };

    this._forceUpdate = () => {
      const update = () => this.setState({});
      return update.apply(this);
    };

    this.state = {
      selectionTitle: null,
      imagesOfSelection: [],
      imageUrl: null,
      listening: [],
      offset: 0,
      limit: this.props.height/5
    };
  }

  removeListeners() {
    for(let i = 0; i < this.state.listening.length; ++i) {
      this.props.metastore.removeMetadataUpdateListener(this.state.listening[i], this._onMetadataReceived);
    }
  }

  getImagesOfSelection(selection) {
    if(!this._isMounted) return;
    this.removeListeners();
    this.setState({imagesOfSelection: [], imageUrl: null, listening: [selection.id], limit: this.props.height/5});
    switch(selection.type) {
      case 'Image':
      case 'Specimen':
      case 'Set':
        this.props.metastore.addMetadataUpdateListener(selection.id, this._onMetadataReceived);
        break;
      default:
        this.setState({selectionTitle: null});
        return;
    }
    this.setState({selectionTitle: selection.name});
  }

  processReceivedMetadata(id, skipListenerCheck = false) {
    if(!this._isMounted) return;
    if(!_.contains(this.state.listening, id) && !skipListenerCheck) {
      return;
    }
    let metadata = this.props.metastore.getMetadataAbout(id);
    if(metadata) {
      switch(metadata.type) {
        case 'Image':
          let keyedImages = _.indexBy(this.state.imagesOfSelection, function(image){return image.uid});
          keyedImages[metadata.uid] = metadata;
          this.setState({
            imagesOfSelection: _.sortBy(_.values(keyedImages), Globals.getName)});
          break;
        case 'Specimen':
          let listening = JSON.parse(JSON.stringify(this.state.listening));
          for(let i = 0; i < metadata.images.length; ++i) {
            this.props.metastore.addMetadataUpdateListener(metadata.images[i], this._onMetadataReceived);
            listening.push(metadata.images[i]);
          }
          this.setState({listening: listening});
          break;
        case 'Set':
          listening = JSON.parse(JSON.stringify(this.state.listening));
          let metaToUpdate = [];
          for(let i = 0; i < metadata.items.length; ++i) {
            this.props.metastore.addMetadataUpdateListener(metadata.items[i].uid, this._onMetadataReceived);
            listening.push(metadata.items[i].uid);
            metaToUpdate.push(metadata.items[i].uid);
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
    let sets = this.props.managerstore.getSets();
    let id = sets[sets.length-1].uid;
    if(id) {
      window.setTimeout(ViewActions.setActiveSet.bind(null, id), 10);
      // window.setTimeout(ManagerActions.toggleSetManagerVisibility.bind(null,false),20);
      window.setTimeout(ModeActions.changeMode.bind(null,ModeConstants.Modes.OBSERVATION),20);
    }
    else {
      console.warn('Last displayed set not obtained');
    }

  }

  scrolled(e) {
    let node = React.findDOMNode(this.refs.scroller);
    if(node.offsetHeight + node.scrollTop >= node.scrollHeight-10) {
      this.setState({limit: Math.min(this.state.imagesOfSelection.length, this.state.limit+5)});
    }
  }

  componentDidMount() {
    this._isMounted = true;
    this.props.userstore.addLanguageChangeListener(this._forceUpdate);
    this.props.modestore.addModeChangeListener(this._forceUpdate);
    this.props.managerstore.addSelectionChangeListener(this._onSelectionChange);
    this._onSelectionChange();
  }

  componentWillReceiveProps(props) {
    if(props.height != this.props.height) {
      this.componentStyle.height = props.height;
      this.scrollerStyle.height = props.height-35;
    }
  }

  componentWillUpdate(nextProps, nextState) {
      this.componentStyle.display = '';
      if(nextState.imageUrl == null && nextState.imagesOfSelection.length > 0) {
        nextState.imageUrl = nextState.imagesOfSelection[0].thumbnail;
      }
  }

  componentWillUnmount() {
    this.props.userstore.removeLanguageChangeListener(this._forceUpdate);
    this.props.modestore.removeModeChangeListener(this._forceUpdate);
    this.props.managerstore.removeSelectionChangeListener(this._onSelectionChange);
    this.removeListeners();
    this._isMounted = false;
  }

  render() {
    let self = this;

    return <div className='ui segment container' style={this.componentStyle}>
      <div className='ui blue tiny basic label'
           style={this.labelStyle}>
        {this.props.userstore.getText('preview')}
      </div>
      <div style={this.scrollerStyle}>
      <div className='ui small header centered segment'
           style={this.compactBorderlessSegmentStyle}>
        <div className='ui item'>
          {this.state.selectionTitle? this.state.selectionTitle : this.props.userstore.getText('imagePreviewer')}
          <i>{' ' + this.state.imagesOfSelection.length + ' images'}</i>
          ({this.props.userstore.getText('preview')})
        </div>
      </div>
      <div className='ui container' style={this.twoColumnContainerStyle}>
        <div className='ui compact segments'
             style={this.segmentsContainerStyle}
             ref='scroller'
             onScroll={this.scrolled.bind(this)}>
          {this.state.imagesOfSelection.map(function(image, index) {
            if(index < self.state.offset || index > self.state.limit) {
              return null;
            }
            let color = 'ui';
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
             alt={this.props.userstore.getText('noDataForSelection')}>
        </img>
      </div>
        </div>
    </div>
  }
}

export default SimpleImageDisplay;
