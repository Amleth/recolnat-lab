/**
 * Created by dmitri on 16/02/16.
 */
'use strict';

import React from 'react';
import request from 'superagent';

import AbstractMetadataDisplay from './AbstractManagerMetadataDisplay';

class WorkbenchMetadataDisplay extends AbstractMetadataDisplay {
  constructor(props) {
    super(props);
  }

  initialState() {
    return {
      name: null,
      date: null
    };
  }

  processCoLabMetadata(metadata) {
    if(metadata.type != 'Workbench') {
      return;
    }
    this.setState({
      name: metadata.name,
      date: metadata.creationDate
    });
  }

  createMetadataTable() {
    // Name, Creation Date (for Workbench)
    if(!this.state.name) {
      return null;
    }
    return (
      <table className='ui selectable striped very compact table'>
        <thead>
        <tr>
          <th colSpan={2} className='center aligned'>{this.state.name}</th>
        </tr>
        </thead>
        <tbody>
        <tr>
          <td className='ui right aligned' >Date de création</td>
          <td className='ui left aligned' style={this.textStyle}>{new Date(this.state.date).toLocaleDateString()}</td>
        </tr>
        </tbody>
      </table>
    );
  }
}

export default WorkbenchMetadataDisplay;