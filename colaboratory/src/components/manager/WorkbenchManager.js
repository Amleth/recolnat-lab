/**
 * Created by dmitri on 13/01/16.
 */
'use strict';

import React from 'react';
import request from 'superagent';

import WorkbenchNodeDisplay from './WorkbenchNodeDisplay';
import WorkbenchBase from './WorkbenchBase';

import ManagerActions from '../../actions/ManagerActions';

import conf from '../../conf/ApplicationConfiguration';

class WorkbenchManager extends React.Component {
  constructor(props) {
    super(props);

    this.containerStyle = {
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100%',
      maxHeight: '100%',
      height: '100%'
    };

    this.optionBarStyle = {
      display: 'flex',
      flexDirection: 'row'
    };

    this.workbenchExplorerStyle = {
      display: 'flex',
      flexDirection: 'row',
      minHeight: '100%',
      maxHeight: '100%',
      height: '100%',
      overflowX: 'auto'
      //overflowY: 'auto'
    };

    this._onUserLogIn = () => {
      const userLogIn = () => this.setState({userLoggedIn: true});
      return userLogIn.apply(this);
    };

    this._onUserLogOut = () => {
      const userLogOut = () => this.setState({userLoggedIn: false});
      return userLogOut.apply(this);
    };

    this._onWorkbenchUpdate = () => {
      const updateDisplay = () => this.setState({workbenches: JSON.parse(JSON.stringify(this.props.managerstore.getWorkbenches())), base: this.props.managerstore.getBaseData()});
      return updateDisplay.apply(this);
    };

    this.state = {
      userLoggedIn: false,
      base: {children: []},
      workbenches: []
    };
  }

  componentWillMount() {
    this.props.managerstore.loadRootWorkbench();
  }

  componentDidMount() {
    this.props.userstore.addUserLogInListener(this._onUserLogIn);
    this.props.userstore.addUserLogOutListener(this._onUserLogOut);
    this.props.managerstore.addManagerUpdateListener(this._onWorkbenchUpdate);
  }

  componentDidUpdate(prevProps, prevState) {
    if(this.state.userLoggedIn && !prevState.userLoggedIn) {
      this.props.managerstore.loadRootWorkbench();
    }
    //console.log(this.state.workbenches.length + ' ' + prevState.workbenches.length);
    if(this.state.workbenches.length != prevState.workbenches.length) {
      var node = this.refs.workbenches.getDOMNode();
      var scrollAnimate = window.setInterval(function () {
        //console.log('left=' + node.scrollLeft + ' scollwidth=' + node.scrollWidth + ' clientwidth=' + node.clientWidth);
        if (node.scrollLeft < node.scrollWidth - node.clientWidth - 2) {
          node.scrollLeft = node.scrollLeft + 2;
        }
        else {
          window.clearTimeout(scrollAnimate);
        }
      }, 1);
    }
  }

  componentWillUnmount() {
    this.props.userstore.removeUserLogInListener(this._onUserLogIn);
    this.props.userstore.removeUserLogOutListener(this._onUserLogOut);
    this.props.managerstore.removeManagerUpdateListener(this._onWorkbenchUpdate);
  }

  render() {
    var self = this;
    return <div style={this.containerStyle} >
      <div style={this.optionBarStyle}></div>
      <div style={this.workbenchExplorerStyle} ref='workbenches'>
        <WorkbenchNodeDisplay workbench={this.state.base}
                              index={-1}
                              managerstore={this.props.managerstore}
        />
        {this.state.workbenches.map(function(wb, idx) {
          if(wb) {
            return <WorkbenchNodeDisplay key={'WB-NODE-' + wb.id + '-' + idx}
                                         workbench={wb}
                                         index={idx}
                                         managerstore={self.props.managerstore}
            />;
          }
          else {
            return <WorkbenchNodeDisplay key={'WB-NODE-loading-' + idx}
                                         workbench={wb}
                                         index={idx}
                                         managerstore={self.props.managerstore}
            />;
          }
        })}
      </div>
    </div>
  }
}

export default WorkbenchManager;