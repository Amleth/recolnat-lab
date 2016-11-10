/**
 * Created by dmitri on 30/11/15.
 */
'use strict';

import React from 'react';

import MetadataViewer from './../MetadataViewer';
import ElementInspector from './../../tools/palettes/ElementInspector';
import TagCloud from './../../tools/palettes/TagCloud';
import SimpleImageDisplay from './../../tools/palettes/SimpleImageDisplay';
import AnnotationList from './../../tools/palettes/AnnotationList';

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
      this.setState({componentHeights: [3*totalHeight/16, 0, 5*totalHeight/16, 5*totalHeight/16, 2*totalHeight/16]});
    }
    else if(this.props.modestore.isInObservationMode() || this.props.modestore.isInOrganisationMode()) {
      this.setState({componentHeights: [0, 6*totalHeight/16, 0, 6*totalHeight/16, 3*totalHeight/16]});
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
    return(
      <div style={this.containerStyle}>
        <SimpleImageDisplay
          height={this.state.componentHeights[0]}
          metastore={this.props.metastore}
          modestore={this.props.modestore}
          managerstore={this.props.managerstore}
        />
        <MetadataViewer
          height={this.state.componentHeights[1]}
          toolstore={this.props.toolstore}
          metastore={this.props.metastore}
          viewstore={this.props.viewstore}
          modestore={this.props.modestore}
          benchstore={this.props.benchstore}
        />
        <SpecimenMetadataDisplay
          height={this.state.componentHeights[2]}
          metastore={this.props.metastore}
          toolstore={this.props.toolstore}
          modestore={this.props.modestore}
          managerstore={this.props.managerstore}/>
        <AnnotationList
          height={this.state.componentHeights[3]}
          modestore={this.props.modestore}
          inspecstore={this.props.inspecstore}
          metastore={this.props.metastore}
          viewstore={this.props.viewstore}
          />
        <ElementInspector
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
}

export default RightPane;

