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

    this.containerStyle = {
      padding: '5px 5px 5px 5px',
      //margin: 0,
      //padding: 0,
      height: '100%',
      width: '100%'
      //maxWidth: '150px',
      //minWidth: '150px'
    };

    this.labelStyle = {
      position: 'relative',
      top: '-15px',
      left: '10px'
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

    this.textStyle = {
      WebkitUserSelect: 'none',
      MozUserSelect: 'none',
      MsUserSelect: 'none',
      userSelect: 'none'
    };

    this._onModeChange = () => {
      const setModeVisibility = () => this.setState({
        isVisibleInCurrentMode: this.props.modestore.isInSetMode()
      });
      return setModeVisibility.apply(this);
    };

    this.state = {
      isVisibleInCurrentMode: true
    };
  }

  loadRootSet() {
    window.setTimeout(this.props.managerstore.requestGraphAround.bind(this.props.managerstore, null, 'Set', 0, true)
      , 10);
  }

  componentDidMount() {
    this.props.modestore.addModeChangeListener(this._onModeChange);
  }

  componentWillUpdate(nextProps, nextState) {
    if(nextState.isVisibleInCurrentMode) {
      this.containerStyle.display = '';
    }
    else {
      this.containerStyle.display = 'none';
    }
  }

  componentWillUnmount() {
    this.props.modestore.removeModeChangeListener(this._onModeChange);
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
              <i className='ui icon lab' style={this.textStyle} />Mes sets
            </div>
          </a>
        </div>
      </div>
    </div>
  }
}

//<div className='ui blue tiny basic label'
//     style={this.labelStyle}>
//  Mes sets
//</div>

export default SetSelectorDisplay;