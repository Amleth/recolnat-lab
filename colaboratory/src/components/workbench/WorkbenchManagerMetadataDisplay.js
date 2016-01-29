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

    this.state = {
      metadata: null
    };
  }

  downloadMetadata(id) {
    var self = this;
    request.post(conf.actions.imageEditorServiceActions.getImageData)
      .send({id: id})
      .withCredentials()
      .end((err, res) => {
          if(err) {
            console.error("Could not get data about object " + err);
            self.setState({metadata: null});
          }
          else {
            var metadata = JSON.parse(res.text);
            //console.log(JSON.stringify(metadata));
            self.setState({metadata: metadata});
          }
        }
      );
  }

  createMetadataTable() {
    console.log("metadata=" + JSON.stringify(this.state.metadata));
    if(!this.state.metadata) {
      return null;
    }
    var self = this;
    var keys = Object.keys(this.state.metadata);
    return (<table className='ui selectable striped very compact table'>
        {keys.map(function(key) {
          return <tr key={'METADATA-MANAGER-' + key}><td className='ui right aligned' >{key}</td><td className='ui left aligned' style={self.textStyle}>{self.state.metadata[key]}</td></tr>;
        })}
      </table>

    );
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