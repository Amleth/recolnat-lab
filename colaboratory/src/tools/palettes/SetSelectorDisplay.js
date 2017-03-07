/**
 * Created by dmitri on 13/01/16.
 */
'use strict';

import React from 'react';
import _ from 'lodash';

import ViewActions from '../../actions/ViewActions';
import ManagerActions from '../../actions/ManagerActions';
import ModalActions from '../../actions/ModalActions';
import ModeActions from '../../actions/ModeActions';

import ModalConstants from '../../constants/ModalConstants';
import ModeConstants from '../../constants/ModeConstants';

import Globals from '../../utils/Globals';

class SetSelectorDisplay extends React.Component {
  constructor(props) {
    super(props);

    this.mounted = false;

    this.containerStyle = {
      padding: '5px 5px 5px 5px',
      height: '100%',
      width: '100%'
    };

    this.labelContainerStyle = {
      position: 'relative',
      width: 0,
      height: '10px'
    };

    this.labelStyle = {
      position: 'relative',
      top: '-15px',
      left: '10px',
      whiteSpace: 'nowrap'
    };

    this.titleStyle = {
      height: '25px',
      padding: '4px 0px'
    };

    this.listContainerStyle = {
      height: '250px',
      overflowY: 'auto',
      overflowX: 'hidden',
      margin: 0,
      padding: 0
    };

    this.noMarginPaddingStyle = {
      margin: 0,
      padding: 0
    };

    this._forceUpdate = () => {
      const update = () => {if(this.mounted) this.setState({})};
      return update.apply(this);
    };

    this.textStyle = {
      WebkitUserSelect: 'none',
      MozUserSelect: 'none',
      MsUserSelect: 'none',
      userSelect: 'none'
    };
  }

  loadRootSet() {
    let user = this.props.userstore.getUserData();
    if(user) {
      let coreSetId = user.coreSet;
      window.setTimeout(this.props.managerstore.requestGraphAround.bind(this.props.managerstore, coreSetId, 'Set', 0, true)
        , 10);
    }
  }

  componentDidMount() {
    this.mounted = true;
    this.props.modestore.addModeChangeListener(this._forceUpdate);
  }

  componentWillUpdate(nextProps, nextState) {

  }

  componentWillUnmount() {
    this.props.modestore.removeModeChangeListener(this._forceUpdate);
    this.mounted = false;
  }

  render() {
    return <div style={this.containerStyle} className='ui container segments'>
      <div className='ui segment'
           style={this.listContainerStyle}>
        <div className='ui selection list'
             style={this.noMarginPaddingStyle}>
          <a className={'item '}
             onClick={this.loadRootSet.bind(this)}
          >
            <div>
              <i className='ui icon lab' style={this.textStyle} />{this.props.userstore.getText('mySets')}
            </div>
          </a>
        </div>
      </div>
    </div>
  }
}

export default SetSelectorDisplay;