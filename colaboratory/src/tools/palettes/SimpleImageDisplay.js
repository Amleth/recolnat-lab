/**
 * Created by dmitri on 24/05/16.
 */
'use strict';

import React from 'react';

import MetadataActions from '../../actions/MetadataActions';

import Globals from '../../utils/Globals';

class SimpleImageDisplay extends React.Component {
  constructor(props) {
    super(props);

    this.componentStyle = {
      height: this.props.height,
      maxHeight: this.props.height,
      overflowY: 'auto'
      //display: "flex",
      //flexDirection: 'column',
      //padding: '5px 5px 5px 5px'
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
      //minWidth: '50%',
      //width: '50%',
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

  getImagesOfSelection(selection) {
    this.setState({imagesOfSelection: [], imageUrl: null, listening: [selection.id]});
    switch(selection.type) {
      case 'Image':
      case 'Specimen':
      case 'Set':
        this.props.metastore.addMetadataUpdateListener(selection.id, this._onMetadataReceived);
        window.setTimeout(MetadataActions.updateMetadata.bind(null, [selection.id]), 10);
        break;
      default:
        this.setState({selectionTitle: "Pré-visionneuse d'images"});
        return;
    }
    this.setState({selectionTitle: selection.name});
  }

  processReceivedMetadata(id) {
    this.props.metastore.removeMetadataUpdateListener(id, this._onMetadataReceived);
    if(!_.contains(this.state.listening, id)) {
      return;
    }
    var metadata = this.props.metastore.getMetadataAbout(id);
    if(metadata) {
      switch(metadata.type) {
        case 'Image':
          var keyedImages = _.indexBy(this.state.imagesOfSelection, function(image){return image.uid});
          keyedImages[metadata.uid] = metadata;
          this.setState({
            imagesOfSelection: _.sortBy(_.values(keyedImages), Globals.getName)});
          break;
        case 'Specimen':
          var listening = this.state.listening;
          for(var i = 0; i < metadata.images.length; ++i) {
            this.props.metastore.addMetadataUpdateListener(metadata.images[i], this._onMetadataReceived);
            listening.push(metadata.images[i]);
          }
          window.setTimeout(MetadataActions.updateMetadata.bind(null, metadata.images), 10);
          this.setState({listening: listening});
          break;
        case 'Set':
          var listening = this.state.listening;
          var metaToUpdate = [];
          for(var i = 0; i < metadata.items.length; ++i) {
            this.props.metastore.addMetadataUpdateListener(metadata.items[i].uid, this._onMetadataReceived);
            listening.push(metadata.items[i].uid);
            metaToUpdate.push(metadata.items[i].uid);
          }
          window.setTimeout(MetadataActions.updateMetadata.bind(null, metaToUpdate), 10);
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

  componentDidMount() {
    this.props.modestore.addModeChangeListener(this._onModeChange);
    this.props.managerstore.addSelectionChangeListener(this._onSelectionChange);
  }

  componentWillUpdate(nextProps, nextState) {
    if (nextState.isVisibleInCurrentMode) {
      this.componentStyle.display = '';
    }
    else {
      this.componentStyle.display = 'none';
    }
  }

  componentDidUpdate(prevProps, prevState) {
    $(this.refs.warning.getDOMNode()).popup({
      position: 'bottom center'
    });
  }

  componentWillUnmount() {
    this.props.modestore.removeModeChangeListener(this._onModeChange);
    this.props.managerstore.removeSelectionChangeListener(this._onSelectionChange);
  }

  render() {
    var self = this;

    return <div className='ui container' style={this.componentStyle}>
      <div className='ui small header centered segment'
           style={this.compactBorderlessSegmentStyle}>
        <div className='ui item'>
        {this.state.selectionTitle}
        <i className='small yellow warning sign icon'
           ref='warning'
           data-content="Les images affichées ici peuvent être déformées pour rentrer dans l'espace limité prévu à cet effet" />
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
                      onClick={self.showImage.bind(self, image.thumbnail)}>
            {image.name}
          </div>
        })}
      </div>
      <img className='ui centered bordered image'
           style={this.imageStyle}
           src={this.state.imageUrl}
           alt="Aucune image sélectionnée">
      </img>
        </div>
    </div>
  }
}

export default SimpleImageDisplay;