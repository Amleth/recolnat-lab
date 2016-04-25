/**
 * Created by dmitri on 13/01/16.
 */
'use strict';

import React from 'react';
import request from 'superagent';

import SetDisplay from './SetDisplay';
import StudyDisplay from './StudyDisplay';

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

    this._onSetUpdate = () => {
      const updateDisplay = () => this.setState({
        displayedSets: this.props.managerstore.getSets(),
        studyContainer: this.props.managerstore.getStudies()});
      return updateDisplay.apply(this);
    };

    this.state = {
      userLoggedIn: false,
      studyContainer: null,
      displayedSets: []
    };
  }

  componentDidMount() {
    this.props.userstore.addUserLogInListener(this._onUserLogIn);
    this.props.userstore.addUserLogOutListener(this._onUserLogOut);
    this.props.managerstore.addManagerUpdateListener(this._onSetUpdate);
  }

  componentDidUpdate(prevProps, prevState) {
    if(this.state.userLoggedIn && !prevState.userLoggedIn) {
      ManagerActions.loadStudiesAndSets();
    }
    if(this.state.displayedSets.length != prevState.displayedSets.length) {
      var node = this.refs.displayedSets.getDOMNode();
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
  }

  render() {
    var self = this;
    return <div style={this.containerStyle} >
      <div style={this.optionBarStyle}></div>
      <div style={this.workbenchExplorerStyle} ref='sets'>
        <StudyDisplay managerstore={this.props.managerstore} />
        {this.state.displayedSets.map(function(s, idx) {
            return <SetDisplay key={'SET-NODE-' + s.uid + '-' + idx}
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