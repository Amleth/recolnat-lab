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
import CreateAngle from '../impl/CreateAngle';
import NoTool from '../impl/NoTool';

import ToolActions from "../../actions/ToolActions";

import conf from '../../conf/ApplicationConfiguration';

class Toolbox extends React.Component {
  constructor(props) {
    super(props);

    this.componentStyle = {
      //display: "flex",
      //flexDirection: 'column',
      padding: '5px 5px 5px 5px'
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
      //zIndex: -10000,
      maxWidth: '1px',
      maxHeight: '1px',
      overflow: 'hidden'
    };

    this.labelStyle = {
      position: 'relative',
      top: '-15px',
      left: '10px'
    };

    this._onModeChange = () => {
      const setModeVisibility = () => this.setState({
        isVisibleInCurrentMode:  this.props.modestore.isInObservationMode()
      });
      return setModeVisibility.apply(this);
    };

    this.state = {
      isVisibleInCurrentMode: false
    };
  }

  componentDidMount() {
    this.props.modestore.addModeChangeListener(this._onModeChange);
  }

  componentWillUpdate(nextProps, nextState) {
    if (nextState.isVisibleInCurrentMode) {
      this.componentStyle.display = '';
    }
    else {
      this.componentStyle.display = 'none';
    }
  }

  componentWillUnmount() {
    this.props.modestore.removeModeChangeListener(this._onModeChange);
  }

  render() {
    return (
      <div style={this.componentStyle} className='ui container segment'>
        <div className='ui blue tiny basic label'
             style={this.labelStyle}>
          Outils
        </div>
        <div style={this.hiddenButtons}>
          <NoTool />
          <MoveView />
          <MoveObject viewstore={this.props.viewstore}/>
          <SelectObject />
        </div>
        <div className='ui three buttons' style={this.buttonRowsStyle}>
          <LineMeasure
            toolstore={this.props.toolstore}
            benchstore={this.props.benchstore}
            viewstore={this.props.viewstore} />
          <CreateAngle
            viewstore={this.props.viewstore}
            toolstore={this.props.toolstore} />
        </div>
        <div className='ui three buttons' style={this.buttonRowsStyle}>
          <CreatePointOfInterest
            toolstore={this.props.toolstore}
            viewstore={this.props.viewstore} />
          <CreatePath
            viewstore={this.props.viewstore}
            benchstore={this.props.benchstore}
            toolstore={this.props.toolstore} />
          <CreateRoI
            viewstore={this.props.viewstore}
            toolstore={this.props.toolstore} />
        </div>
      </div>
    );
  }
}

export default Toolbox;
