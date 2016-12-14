/**
 * Created by dmitri on 03/11/15.
 */
'use strict';

import React from 'react';

import AbstractTool from "../AbstractTool";
import MoveObject from "../impl/MoveObject";

import Popup from "../../components/PopupToolComponent";

class Organisation extends React.Component {
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
  }

  render() {
    return (
      <div style={this.componentStyle} className='ui container'>
        <div className='ui buttons' style={this.buttonRowsStyle}>
          <AbstractTool userstore={this.props.userstore}/>
          <MoveObject />
        </div>
        <div>
          <Popup toolstore={this.props.toolstore}/>
        </div>
      </div>
    );
  }
}

export default Organisation;