/**
 * Created by dmitri on 13/01/16.
 */
'use strict';

import React from 'react';

import SetDisplay from './manager/SetDisplay';

import ManagerActions from '../actions/ManagerActions';

import conf from '../conf/ApplicationConfiguration';

class SetManager extends React.Component {
  constructor(props) {
    super(props);

    this.mounted = false;

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

    this.helpIconStyle = {
      position: 'absolute',
      top: '5px',
      right: '5px',
      zIndex: 101
    };

    this.helpTextStyle = {
      display: 'none',
      position: 'absolute',
      top: '10px',
      right: '0px',
      zIndex: 100,
      width: '250px'
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
        coreSet: this.props.managerstore.getCoreSet()});
      return updateDisplay.apply(this);
    };

    this._forceUpdate = () => {
      const update = () => {if(this.mounted) this.setState({})};
      return update.apply(this);
    };

    this.state = {
      userLoggedIn: false,
      coreSet: this.props.managerstore.getCoreSet(),
      displayedSets: this.props.managerstore.getSets()
    };

    this.listeneningToMetadataForIds = {};
  }

  showHelp() {
    this.helpTextStyle.display = '';
    this.setState({});
  }

  hideHelp() {
    this.helpTextStyle.display = 'none';
    this.setState({});
  }

  componentDidMount() {
    this.mounted = true;
    this.props.userstore.addUserLogInListener(this._onUserLogIn);
    this.props.userstore.addUserLogOutListener(this._onUserLogOut);
    this.props.managerstore.addManagerUpdateListener(this._onSetUpdate);
    this.props.userstore.addLanguageChangeListener(this._forceUpdate);
  }

  componentWillUpdate(nextProps, nextState) {

  }

  componentDidUpdate(prevProps, prevState) {
    if(this.state.displayedSets.length != prevState.displayedSets.length) {
      // Smooth scrolling towards the right
      let node = this.refs.sets.getDOMNode();
      let scrollAnimate = window.setInterval(function () {
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
    this.props.userstore.removeLanguageChangeListener(this._forceUpdate);
    this.mounted = false;
  }

  render() {
    let self = this;
    return <div style={this.containerStyle} >
    <i className='ui big blue help circle icon'
       ref='helpIcon'
       style={this.helpIconStyle}
       onMouseEnter={this.showHelp.bind(this)}
       onMouseLeave={this.hideHelp.bind(this)}/>
      <div className='ui text segment container' style={this.helpTextStyle}>
        <div>{this.props.userstore.getText('managerHelp0')}
        </div>
        <div>
          <i className='ui icon folder' /> {this.props.userstore.getText('managerHelp1')}
        </div>
        <div>
          <i className='ui icon folder' /> {this.props.userstore.getText('managerHelp2')}
        </div>
        <div>
          <i className='ui icon folder' /> {this.props.userstore.getText('managerHelp3')}
        </div>
        <div>
          <i className='ui blue icon folder' />{this.props.userstore.getText('managerHelp4')}
        </div>
      </div>
      <div style={this.optionBarStyle}></div>
      <div style={this.workbenchExplorerStyle} ref='sets'>
        {this.state.displayedSets.map(function(s, idx) {
          return <SetDisplay key={'SET-NODE-' + idx}
                             set={s}
                             index={idx}
                             managerstore={self.props.managerstore}
                             userstore={self.props.userstore}
                             dragstore={self.props.dragstore}
                             metastore={self.props.metastore}
          />;
        })}
      </div>
    </div>
  }
}

export default SetManager;
