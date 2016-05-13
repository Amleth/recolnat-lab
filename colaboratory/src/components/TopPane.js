/**
 * Created by dmitri on 11/01/16.
 */
'use strict';

import React from 'react';

import Basket from './manager/Basket';
import SetActions from './manager/SetActions';
import StudyManager from './manager/StudyManager';
import SpecimenMetadataDisplay from './manager/SpecimenMetadataDisplay';
import SetMetadataDisplay from './manager/SetMetadataDisplay';
import MetadataDisplay from './manager/AbstractManagerMetadataDisplay';

class TopPane extends React.Component {
  constructor(props) {
    super(props);

    this.containerStyle = {
      position: 'relative',
      backgroundColor: 'rgba(255,255,255,1)',
      display: 'flex',
      flexDirection: 'row',
      height: (this.props.windowHeight-this.props.menuHeight - this.props.closeButtonHeight) + 'px'
    };

    this.menuContainerStyle = {
      height: '100%',
      width: '0%',
      overflow: 'hidden'
    };

    this.centerColumnStyle = {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      width: '75%'
    };

    this.metadataColumnStyle = {
      height: '100%',
      width: '25%'
    };

    this.managerContainerStyle = {
      display: 'flex',
      flexDirection: 'column',
      minHeight: '50%',
      maxHeight: '50%',
      height: '50%',
      width: '100%'
      //overflow: 'hidden'
    };

    this.basketContainerStyle = {
      minHeight: '50%',
      maxHeight: '50%',
      width: '100%',
      overflowY: 'auto',
      overflowX: 'hidden'
    };
  }

  componentWillUpdate(nextProps, nextState) {
    if(nextProps.windowHeight != this.props.windowHeight) {
      this.containerStyle.height = (nextProps.windowHeight-nextProps.menuHeight - nextProps.closeButtonHeight) + 'px';
    }
  }

  render() {
    return <div style={this.containerStyle}>
      <div style={this.menuContainerStyle}>
        <SetActions
          managerstore={this.props.managerstore}
                          metastore={this.props.metastore}
        />
      </div>
      <div style={this.centerColumnStyle}>
        <div style={this.managerContainerStyle}>
          <StudyManager
          userstore={this.props.userstore}
          metastore={this.props.metastore}
          managerstore={this.props.managerstore} />
        </div>



      </div>
      <div style={this.metadataColumnStyle}>
        <div className='ui segment'>
          <SetMetadataDisplay
            metastore={this.props.metastore}
            managerstore={this.props.managerstore}/>
        </div>
        <div className='ui segment'>
          <SpecimenMetadataDisplay
            metastore={this.props.metastore}
            managerstore={this.props.managerstore}/>
        </div>
      </div>
    </div>;
  }
}

export default TopPane;