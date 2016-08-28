/**
 * Created by dmitri on 25/01/16.
 */
'use strict';

import React from 'react';
import request from 'superagent';
import request_no_cache from 'superagent-no-cache';

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
    request.post(conf.actions.databaseActions.getData)
      .use(request_no_cache)
      .send([id])
      .withCredentials()
      .end((err, res) => {
          if(err) {
            console.error("Could not get data about object " + err);
            this.setState(this.initialState());
          }
          else {
            var metadata = JSON.parse(res.text);
            //console.log(res.text);
            if(metadata[0]) {
              this.processCoLabMetadata(metadata[0]);
            }
          }
        }
      );
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
  }

  render() {
    return(<div style={this.containerStyle} className='ui container'>
      {this.createMetadataTable()}
    </div>)
  }
}

export default WorkbenchManagerMetadataDisplay;
