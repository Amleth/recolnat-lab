'use strict';

import React from 'react';

import AbstractTool from "../AbstractTool";
import LineMeasure from "../impl/LineMeasure";
import CreatePointOfInterest from "../impl/CreatePoI";
import MoveObject from "../impl/MoveObject.js";
import SelectObject from '../impl/SelectObject.js';
import MoveView from '../impl/MoveView';

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
    }
  }

  render() {
    return (
      <div style={this.componentStyle} className='ui container'>
        <div className='ui buttons' style={this.buttonRowsStyle}>
          <MoveView />
          <MoveObject />
          <SelectObject />
          <LineMeasure entitystore={this.props.entitystore} toolstore={this.props.toolstore} viewstore={this.props.viewstore}/>
          <CreatePointOfInterest entitystore={this.props.entitystore} viewstore={this.props.viewstore} />
        </div>
        <div>
          <Popup toolstore={this.props.toolstore}/>
        </div>
      </div>
    );
  }
}

export default Toolbox;
