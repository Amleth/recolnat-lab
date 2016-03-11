/**
 * Created by dmitri on 25/01/16.
 */
'use strict';

import React from 'react';
import request from 'superagent';

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

    this.state = this.initialState();
  }

  initialState() {
    return {
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
    request.get(conf.actions.databaseActions.getData)
      .query({id: id})
      .withCredentials()
      .end((err, res) => {
          if(err) {
            console.error("Could not get data about object " + err);
            this.setState(this.initialState());
          }
          else {
            var metadata = JSON.parse(res.text);
            //console.log(res.text);
            this.processCoLabMetadata(metadata);
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
  }

  componentWillUnmount() {
    this.props.managerstore.removeSelectionChangeListener(this._onWorkbenchSelectionChange);
  }

  render() {
    return(<div style={this.containerStyle}>
      {this.createMetadataTable()}
    </div>)
  }
}

export default WorkbenchManagerMetadataDisplay;