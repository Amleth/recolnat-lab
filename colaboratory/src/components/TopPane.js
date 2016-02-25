/**
 * Created by dmitri on 11/01/16.
 */
'use strict';

import React from 'react';

import Basket from './manager/Basket';
import WorkbenchActions from './manager/WorkbenchActions';
import WorkbenchManager from './manager/WorkbenchManager';
import SheetMetadataDisplay from './manager/SheetMetadataDisplay';
import WorkbenchMetadataDisplay from './manager/WorkbenchMetadataDisplay';
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
      width: '15%'
    };

    this.centerColumnStyle = {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      width: '60%'
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
        <WorkbenchActions managerstore={this.props.managerstore}/>
      </div>
      <div style={this.centerColumnStyle}>
        <div style={this.managerContainerStyle}><WorkbenchManager
          userstore={this.props.userstore}
          managerstore={this.props.managerstore} /></div>
        <div style={this.basketContainerStyle}><Basket managerstore={this.props.managerstore}/></div>
      </div>
      <div style={this.metadataColumnStyle}>
        <div className='ui segment'>
          <WorkbenchMetadataDisplay managerstore={this.props.managerstore}/>
        </div>
        <div className='ui segment'>
          <SheetMetadataDisplay managerstore={this.props.managerstore}/>
        </div>
      </div>
    </div>;
  }
}

export default TopPane;