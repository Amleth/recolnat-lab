/**
 * Created by dmitri on 25/01/16.
 */
'use strict';

import React from 'react';

import SocketActions from '../../actions/SocketActions';

import conf from '../../conf/ApplicationConfiguration';

class WorkbenchManagerMetadataDisplay extends React.Component {
  constructor(props) {
    super(props);

    this._onWorkbenchSelectionChange = () => {
      const updateMetadataDisplay = () => this.downloadMetadata(this.props.managerstore.getSelected().id);
      updateMetadataDisplay.apply(this);
    };

    this.textStyle = {
      wordBreak: 'break-all'
    };

    this.containerStyle = {
      overflowY: 'auto'
    };

    this._onModeChange = () => {
      const setModeVisibility = () => this.setState({
        isVisibleInCurrentMode: this.props.modestore.isInSetMode()
      });
      return setModeVisibility.apply(this);
    };

    this.state = this.initialState();
  }

  initialState() {
    return {
      id: null,
      isVisibleInCurrentMode: true,
      type: null,
      source: null,
      name: null,
      species: null,
      harvester: null,
      harvestLocation: null,
      collection: null,
      linkToExplore: null
    };
  }

  downloadMetadata(id) {
    if(this.state.id) {
      this.props.metastore.removeMetadataUpdateListener(this.state.id, this.receiveMetadata.bind(this));
    }
    this.props.metastore.addMetadataUpdateListener(id, this.receiveMetadata.bind(this));
    this.setState({id: id});
    window.setTimeout(this.receiveMetadata.bind(this, id), 50);
  }

  receiveMetadata() {
    var data = this.props.metastore.getMetadataAbout(this.state.id);
    if(data) {
      this.processCoLabMetadata(data);
    }
  }

  processCoLabMetadata(metadata) {
    console.error('Method processCoLabMetadata not implemented in child class');
  }

  createMetadataTable() {
    console.error('Method createMetadataTable not implemented in child class');
    return null;
  }

  componentDidMount() {
    this.props.managerstore.addSelectionChangeListener(this._onWorkbenchSelectionChange);
    this.props.modestore.addModeChangeListener(this._onModeChange);
  }

  componentWillUpdate(nextProps, nextState) {
    if(nextState.isVisibleInCurrentMode) {
      this.containerStyle.display = '';
    }
    else {
      this.containerStyle.display = 'none';
    }
  }

  componentWillUnmount() {
    this.props.managerstore.removeSelectionChangeListener(this._onWorkbenchSelectionChange);
    this.props.modestore.removeModeChangeListener(this._onModeChange);
    if(this.state.id) {
      this.props.metastore.removeMetadataUpdateListener(this.state.id, this.receiveMetadata.bind(this));
    }
  }

  render() {
    return(<div style={this.containerStyle} className='ui container'>
      {this.createMetadataTable()}
    </div>)
  }
}

export default WorkbenchManagerMetadataDisplay;
