/**
 * Created by dmitri on 13/01/16.
 */
'use strict';

import React from 'react';
import request from 'superagent';

import SetDisplay from './SetDisplay';
import StudyDisplay from './../../tools/palettes/StudyDisplay';

import ManagerActions from '../../actions/ManagerActions';

import conf from '../../conf/ApplicationConfiguration';

class StudyManager extends React.Component {
  constructor(props) {
    super(props);

    this.containerStyle = {
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100%',
      maxHeight: '100%',
      height: '100%',
      backgroundColor: 'white'
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
      overflowX: 'auto',
      overflowY: 'hidden'
    };

    this._onUserLogIn = () => {
      const userLogIn = () => this.setState({userLoggedIn: true});
      return userLogIn.apply(this);
    };

    this._onUserLogOut = () => {
      const userLogOut = () => this.setState({userLoggedIn: false});
      return userLogOut.apply(this);
    };

    this._onSetUpdate = () => {
      const updateDisplay = () => this.setState({
        displayedSets: this.props.managerstore.getSets(),
        studyContainer: this.props.managerstore.getStudies()});
      return updateDisplay.apply(this);
    };

    this._onModeChange = () => {
      const setModeVisibility = () => this.setState({
        isVisibleInCurrentMode: this.props.modestore.isInSetMode()
      });
      return setModeVisibility.apply(this);
    };

    this.state = {
      isVisibleInCurrentMode: true,
      userLoggedIn: false,
      studyContainer: null,
      displayedSets: []
    };
  }

  componentDidMount() {
    this.props.userstore.addUserLogInListener(this._onUserLogIn);
    this.props.userstore.addUserLogOutListener(this._onUserLogOut);
    this.props.managerstore.addManagerUpdateListener(this._onSetUpdate);
    this.props.modestore.addModeChangeListener(this._onModeChange);
  }

  componentWillUpdate(nextProps, nextState) {
    if(nextState.isVisibleInCurrentMode) {
      this.containerStyle.display = 'flex';
    }
    else {
      this.containerStyle.display = 'none';
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if(this.state.userLoggedIn && !prevState.userLoggedIn) {
      ManagerActions.loadStudiesAndSets();
    }
    if(this.state.displayedSets.length != prevState.displayedSets.length) {
      var node = this.refs.sets.getDOMNode();
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
    this.props.managerstore.removeManagerUpdateListener(this._onSetUpdate);
    this.props.modestore.removeModeChangeListener(this._onModeChange);
  }

  render() {
    var self = this;
    return <div style={this.containerStyle} >
      <div style={this.optionBarStyle}></div>
      <div style={this.workbenchExplorerStyle} ref='sets'>
        {this.state.displayedSets.map(function(s, idx) {
            return <SetDisplay key={'SET-NODE-' + idx + '-' + s.uid}
                               set={s}
                               index={idx}
                               managerstore={self.props.managerstore}
                               metastore={self.props.metastore}
            />;
        })}
      </div>
    </div>
  }
}

export default StudyManager;