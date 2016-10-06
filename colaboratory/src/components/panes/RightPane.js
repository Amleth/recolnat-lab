/**
 * Created by dmitri on 30/11/15.
 */
'use strict';

import React from 'react';

import MetadataViewer from './../MetadataViewer';
import ElementInspector from './../../tools/palettes/ElementInspector';
import TagCloud from './../../tools/palettes/TagCloud';
import SimpleImageDisplay from './../../tools/palettes/SimpleImageDisplay';

import SpecimenMetadataDisplay from './../manager/SpecimenMetadataDisplay';
import SetMetadataDisplay from './../manager/SetMetadataDisplay';

import ModeConstants from '../../constants/ModeConstants'

class RightPane extends React.Component {

  constructor(props) {
    super(props);

    this.containerStyle = {
      backgroundColor: '#F2F2F2',
      height: '100%',
      width: '100%',
      marginTop: '10px'
      //overflow: 'auto'
    };

    this.textStyle = {
      wordBreak: 'break-all'
    };

    this.tabTitleStyle = {
      height: '5%'
      //padding: '5px 5px 5px 5px',
      //margin: '0'
    };

    this.tabContentStyle = {
      height: '95%',
      padding: '2px 2px 2px 2px'
      //overflow: 'auto'
    };
  }

  render() {
    return(
      <div style={this.containerStyle}>
        <SimpleImageDisplay
          height={200}
          metastore={this.props.metastore}
          modestore={this.props.modestore}
          managerstore={this.props.managerstore}
        />
        <SetMetadataDisplay
          metastore={this.props.metastore}
          toolstore={this.props.toolstore}
          modestore={this.props.modestore}
          managerstore={this.props.managerstore}/>
        <MetadataViewer
          height={200}
          toolstore={this.props.toolstore}
          metastore={this.props.metastore}
          viewstore={this.props.viewstore}
          modestore={this.props.modestore}
          benchstore={this.props.benchstore}
        />
        <SpecimenMetadataDisplay
          height={200}
          metastore={this.props.metastore}
          toolstore={this.props.toolstore}
          modestore={this.props.modestore}
          managerstore={this.props.managerstore}/>
        <ElementInspector
          toolstore={this.props.toolstore}
          userstore={this.props.userstore}
          modestore={this.props.modestore}
          viewstore={this.props.viewstore}
          metastore={this.props.metastore}
          inspecstore={this.props.inspecstore}
          benchstore={this.props.benchstore}
          height={200}
        />
      </div>
    );
  }
}

export default RightPane;

