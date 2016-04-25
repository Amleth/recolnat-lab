/**
 * Created by dmitri on 03/02/16.
 */
'use strict';

import React from 'react';

import MetadataActions from '../actions/MetadataActions';

class Inbox extends React.Component {
  constructor(props) {
    super(props);

    this.componentStyle = {
      position: 'absolute',
      left: '50px',
      bottom: '50px',
      maxHeight: '300px',
      maxWidth: '160px'
    };

    this._onLabBenchLoaded = () => {
      const downloadMetadata = () => this.listenForContentChange(this.props.benchstore.getActiveViewId());
      return downloadMetadata.apply(this);
    };

    this._onViewMetadataReceived = () => {
      const calculateUnplacedEntities = () => this.calculateUnplacedEntities();
      return calculateUnplacedEntities.apply(this);
    };

    this._onUnplacedEntityMetadataUpdate = (id) => {
      const addEntityMetadata = (id) => this.addEntityMetadata(id);
      return addEntityMetadata.apply(this, [id]);
    };

    this.state = {
      viewId: null,
      open: false,
      active: false,
      selected: 0,
      content: []
    };
  }

  listenForContentChange(viewId) {
    //console.log('listenForContentChange()');
    if(this.state.viewId) {
      this.props.metastore.removeMetadataUpdateListener(this.state.viewId, this._onViewMetadataReceived);
    }
    if(viewId) {
      this.props.metastore.addMetadataUpdateListener(viewId, this._onViewMetadataReceived);
      window.setTimeout(MetadataActions.updateMetadata.bind(null, viewId), 10);
    }
    this.setState({viewId: viewId, active: false, open: false, content: []});
  }

  calculateUnplacedEntities() {
    //console.log('calculateUnplacedEntities()');
    var labBench = this.props.benchstore.getLabBench();
    var viewId = this.props.benchstore.getActiveViewId();
    var imageIds = Object.keys(labBench.images);
    var viewData = this.props.metastore.getMetadataAbout(viewId);
    var displayedImageIds = viewData.displays.map(function(display) {
      return display.entity;
    }) ;

    var undisplayedImageIds = _.difference(imageIds, displayedImageIds);

    // Download metadata for unplaced entities
    for(var i = 0; i < undisplayedImageIds.length; ++i) {
      this.props.metastore.addMetadataUpdateListener(undisplayedImageIds[i], this._onUnplacedEntityMetadataUpdate);
      window.setTimeout(MetadataActions.updateMetadata.bind(null, undisplayedImageIds[i]), 10);
    }
  }

  addEntityMetadata(id) {
    //console.log('addEntityMetadata');
    this.props.metastore.removeMetadataUpdateListener(id, this._onUnplacedEntityMetadataUpdate);
    var metadata = this.props.metastore.getMetadataAbout(id);
    var content = this.state.content;
    content.push(metadata);
    this.setState({content: content});
  }

  open() {
    this.setState({open: true});
  }

  next() {
    if(this.state.selected < this.state.content.length-1) {
      this.setState({selected: this.state.selected + 1});
    }
    else {
      this.setState({selected: 0});
    }
  }

  previous() {
    if(this.state.selected > 0) {
      this.setState({selected: this.state.selected-1});
    }
    else {
      this.setState({selected: this.state.content.length-1})
    }
  }

  startDragImage(event) {
    this.props.drag.setAction('inboxMove', this.state.content[this.state.selected]);
  }

  componentDidMount() {
    this.props.benchstore.addLabBenchLoadListener(this._onLabBenchLoaded);
  }

  componentWillUpdate(nextProps, nextState) {
    if(nextState.content.length == 0) {
      nextState.active = false;
      nextState.open = false;
    }
    if(nextState.content.length > 0) {
      nextState.active = true;
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if(this.state.active && this.state.open) {
      $(this.refs.image.getDOMNode()).popup();
    }
  }

  componentWillUnmount() {
    this.props.benchstore.removeLabBenchLoadListener(this._onLabBenchLoaded);
    if(this.state.viewId) {
      this.props.metastore.removeMetadataUpdateListener(this.state.viewId, this._onViewMetadataReceived);
    }
  }

  render() {
    if(!this.state.active) {
      return null;
    }
    if(!this.state.open) {
      return <div style={this.componentStyle}>
        <div className='ui button teal' onClick={this.open.bind(this)}>Vous avez {this.state.content.length} images à placer</div>
        </div>
    }
    return <div className='ui segment' style={this.componentStyle}>
      <img className='ui image'
           ref='image'
           data-content="Faites glisser l'image vers le bureau pour la placer"
           src={this.state.content[this.state.selected].thumbnail}
           alt='Chargement en cours'
           draggable='true'
          onDragStart={this.startDragImage.bind(this)}/>
      <div className='ui tiny compact buttons'>
      <div className='ui button' onClick={this.previous.bind(this)}><i className='ui left chevron icon' /></div>
      <div className='ui button disabled'>{this.state.selected+1}/{this.state.content.length}</div>
      <div className='ui button' onClick={this.next.bind(this)}><i className='ui right chevron icon' /></div>
        </div>
    </div>
  }
}

export default Inbox;