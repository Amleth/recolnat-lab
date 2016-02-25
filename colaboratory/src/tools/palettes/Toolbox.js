'use strict';

import React from 'react';

import AbstractTool from "../AbstractTool";
import LineMeasure from "../impl/LineMeasure";
import CreatePointOfInterest from "../impl/CreatePoI";
import MoveObject from "../impl/MoveObject.js";
import SelectObject from '../impl/SelectObject.js';
import MoveView from '../impl/MoveView';
import CreatePath from '../impl/CreatePath';
import CreateRoI from '../impl/CreateRoI';

import Popup from "../../components/PopupToolComponent";

import ToolActions from "../../actions/ToolActions";

import conf from '../../conf/ApplicationConfiguration';

class Toolbox extends React.Component {
  constructor(props) {
    super(props);

    this.componentStyle = {
      display: "flex",
      flexDirection: 'column'
    };

    this.buttonRowsStyle = {
      display: "flex",
      flexDirection: 'row',
      flexWrap: 'wrap'
    };

    this.hiddenButtons = {
      position: 'absolute',
      left: '-20px',
      top: '-20px',
      zIndex: -10000,
      maxWidth: '1px',
      maxHeight: '1px',
      overflow: 'hidden'
    };
  }

  render() {
    return (
      <div style={this.componentStyle} className='ui container'>
        <div style={this.hiddenButtons}>
          <MoveView />
          <MoveObject />
          <SelectObject />
        </div>
        <div className='ui four buttons' style={this.buttonRowsStyle}>
          <LineMeasure entitystore={this.props.entitystore} toolstore={this.props.toolstore} viewstore={this.props.viewstore}/>
          <CreatePointOfInterest entitystore={this.props.entitystore} viewstore={this.props.viewstore} />
          <CreatePath entitystore={this.props.entitystore} viewstore={this.props.viewstore} toolstore={this.props.toolstore} />
          <CreateRoI entitystore={this.props.entitystore} viewstore={this.props.viewstore} toolstore={this.props.toolstore} />
        </div>
        <div>
          <Popup toolstore={this.props.toolstore}/>
        </div>
      </div>
    );
  }
}

export default Toolbox;
