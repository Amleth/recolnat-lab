'use strict';

import React from 'react';

import LineMeasure from "../impl/LineMeasure";
import CreatePointOfInterest from "../impl/CreatePoI";
import MoveObject from "../impl/MoveObject.js";
import SelectObject from '../impl/SelectObject.js';
import MoveView from '../impl/MoveView';
import CreatePath from '../impl/CreatePath';
import CreateRoI from '../impl/CreateRoI';
import CreateAngle from '../impl/CreateAngle';
import CreateMeasureStandard from '../impl/CreateMeasureStandard';
import NoTool from '../impl/NoTool';

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

    this._forceUpdate = () => {
      const update = () => this.setState({});
      return update.apply(this);
    };
  }

  componentDidMount() {
    this.props.modestore.addModeChangeListener(this._forceUpdate);
  }

  componentWillUpdate(nextProps, nextState) {
  }

  componentWillUnmount() {
    this.props.modestore.removeModeChangeListener(this._forceUpdate);
  }

  render() {
    return (
      <div style={this.componentStyle} className='ui container segment'>
        <div className='ui blue tiny basic label'
             style={this.labelStyle}>
          {this.props.userstore.getText('tools')}
        </div>
        <div style={this.hiddenButtons}>
          <NoTool
            userstore={this.props.userstore}/>
          <MoveObject viewstore={this.props.viewstore}
                      userstore={this.props.userstore}/>
        </div>
        <div className='ui three buttons' style={this.buttonRowsStyle}>
          <LineMeasure
            toolstore={this.props.toolstore}
            userstore={this.props.userstore}
            benchstore={this.props.benchstore}
            metastore={this.props.metastore}
            viewstore={this.props.viewstore} />
          <CreateAngle
            viewstore={this.props.viewstore}
            userstore={this.props.userstore}
            metastore={this.props.metastore}
            toolstore={this.props.toolstore} />
          <CreateMeasureStandard
            viewstore={this.props.viewstore}
            userstore={this.props.userstore}
            metastore={this.props.metastore}
            toolstore={this.props.toolstore} />
        </div>
        <div className='ui three buttons' style={this.buttonRowsStyle}>
          <CreatePointOfInterest
            toolstore={this.props.toolstore}
            userstore={this.props.userstore}
            metastore={this.props.metastore}
            viewstore={this.props.viewstore} />
          <CreatePath
            viewstore={this.props.viewstore}
            benchstore={this.props.benchstore}
            userstore={this.props.userstore}
            metastore={this.props.metastore}
            toolstore={this.props.toolstore} />
          <CreateRoI
            viewstore={this.props.viewstore}
            userstore={this.props.userstore}
            metastore={this.props.metastore}
            toolstore={this.props.toolstore} />
        </div>
      </div>
    );
  }
}

export default Toolbox;
