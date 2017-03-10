/**
 * Right pane of the application.
 *
 * Created by dmitri on 30/11/15.
 */
'use strict';

import React from 'react';

import MetadataViewer from '../../tools/palettes/MetadataViewer';
import ElementInspector from './../../tools/palettes/ElementInspector';
import SimpleImageDisplay from './../../tools/palettes/SimpleImageDisplay';
import AnnotationList from './../../tools/palettes/AnnotationList';

import SpecimenMetadataDisplay from '../../tools/palettes/SpecimenMetadataDisplay';

import ModeConstants from '../../constants/ModeConstants'

class RightPane extends React.Component {

  constructor(props) {
    super(props);

    this.setModeHeights = [3/16, 0, 5/16, 5/16, 3/16];
    this.orgModeHeights = [0, 6/16, 0, 6/16, 4/16];

    this.containerStyle = {
      backgroundColor: '#F2F2F2',
      height: '100%',
      width: '100%',
      marginTop: '10px'
      //overflow: 'auto'
    };

    this.state = {
      componentHeights: [200,200,200,200,200]
    };
  }

  /**
   * Always keep 1/16th of the height unallocated for spacing/margins/etc
   * @param totalHeight
   */
  recalculateComponentHeight(totalHeight = undefined) {
    if(!totalHeight) {
      totalHeight = this.props.visibleHeight;
    }
    if(!totalHeight) {
      return;
    }
    if(this.props.modestore.isInSetMode()) {
      this.setState({componentHeights: [totalHeight*this.setModeHeights[0], totalHeight*this.setModeHeights[1], totalHeight*this.setModeHeights[2], totalHeight*this.setModeHeights[3], totalHeight*this.setModeHeights[4]]});
    }
    else if(this.props.modestore.isInObservationMode() || this.props.modestore.isInOrganisationMode()) {
      this.setState({componentHeights: [totalHeight*this.orgModeHeights[0], totalHeight*this.orgModeHeights[1], totalHeight*this.orgModeHeights[2], totalHeight*this.orgModeHeights[3], totalHeight*this.orgModeHeights[4]]});
    }
    else {
      console.warn('Mode not handled: ' + this.props.modestore.getMode());
    }
  }

  componentDidMount() {
    this.props.modestore.addModeChangeListener(this.recalculateComponentHeight.bind(this));
    this.recalculateComponentHeight(this.props.visibleHeight);
  }

  componentWillReceiveProps(props) {
    if(props.visibleHeight != this.props.visibleHeight) {
      this.recalculateComponentHeight(props.visibleHeight)
    }
  }

  componentWillUnmount() {
    this.props.modestore.removeModeChangeListener(this.recalculateComponentHeight.bind(this));
  }

  render() {
    if(this.props.modestore.isInSetMode()) {
      return(
        <div style={this.containerStyle}>
          <SimpleImageDisplay
            key='SimpleImageDisplay'
            height={this.state.componentHeights[0]}
            metastore={this.props.metastore}
            modestore={this.props.modestore}
            userstore={this.props.userstore}
            managerstore={this.props.managerstore}
          />
          <SpecimenMetadataDisplay
            key='SpecimenMetadataDisplay'
            height={this.state.componentHeights[2]}
            metastore={this.props.metastore}
            toolstore={this.props.toolstore}
            modestore={this.props.modestore}
            userstore={this.props.userstore}
            managerstore={this.props.managerstore}/>
          <AnnotationList
            key='AnnotationList'
            height={this.state.componentHeights[3]}
            modestore={this.props.modestore}
            inspecstore={this.props.inspecstore}
            metastore={this.props.metastore}
            viewstore={this.props.viewstore}
            userstore={this.props.userstore}
            benchstore={this.props.benchstore}
          />
          <ElementInspector
            key='ElementInspector'
            height={this.state.componentHeights[4]}
            toolstore={this.props.toolstore}
            userstore={this.props.userstore}
            modestore={this.props.modestore}
            viewstore={this.props.viewstore}
            metastore={this.props.metastore}
            inspecstore={this.props.inspecstore}
            benchstore={this.props.benchstore}
          />
        </div>
      );
    }
    else if(this.props.modestore.isInOrganisationMode() || this.props.modestore.isInObservationMode()) {
      return(
        <div style={this.containerStyle}>
          <MetadataViewer
            key='MetadataViewer'
            height={this.state.componentHeights[1]}
            toolstore={this.props.toolstore}
            metastore={this.props.metastore}
            viewstore={this.props.viewstore}
            modestore={this.props.modestore}
            userstore={this.props.userstore}
            benchstore={this.props.benchstore}
          />
          <AnnotationList
            key='AnnotationList'
            height={this.state.componentHeights[3]}
            modestore={this.props.modestore}
            inspecstore={this.props.inspecstore}
            metastore={this.props.metastore}
            viewstore={this.props.viewstore}
            userstore={this.props.userstore}
            benchstore={this.props.benchstore}
          />
          <ElementInspector
            key='ElementInspector'
            height={this.state.componentHeights[4]}
            toolstore={this.props.toolstore}
            userstore={this.props.userstore}
            modestore={this.props.modestore}
            viewstore={this.props.viewstore}
            metastore={this.props.metastore}
            inspecstore={this.props.inspecstore}
            benchstore={this.props.benchstore}
          />
        </div>
      );
    }
    else {
      console.error('No render handler in mode ' + this.props.modestore.getMode());
    }

  }
}

export default RightPane;

