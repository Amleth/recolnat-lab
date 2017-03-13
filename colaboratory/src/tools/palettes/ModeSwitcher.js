/**
 * This component is used to switch the application between its supported modes (Sets, Observation, Organisation, Tabular).
 *
 * Created by dmitri on 20/04/16.
 */
'use strict';

import React from 'react';

import ModeActions from '../../actions/ModeActions';

import ModeConstants from '../../constants/ModeConstants';

import Globals from '../../utils/Globals';

class ModeSwitcher extends React.Component {
  constructor(props) {
    super(props);

    this._onModeChange = () => {
      const updateDisplay = () => this.hilightActiveMode();
      return updateDisplay.apply(this);
    };

    this.state = {
      activeMode: ModeConstants.Modes.SET
    };
  }

  hilightActiveMode() {
    this.setState({activeMode: this.props.modestore.getMode()});
  }

  isActive(label) {
    if(label == this.state.activeMode) {
      return 'active';
    }
    return '';
  }

  componentDidMount() {
    this.props.userstore.addLanguageChangeListener(this.setState.bind(this, {}));
    this.props.modestore.addModeChangeListener(this._onModeChange);
    $('.blue.item', $(this.refs.component.getDOMNode())).popup({
      position: 'bottom right'
    });
  }

  componentWillUnmount() {
    this.props.userstore.removeLanguageChangeListener(this.setState.bind(this, {}));
    this.props.modestore.removeModeChangeListener(this._onModeChange);
  }

  render() {
    return <div className='ui tiny icons menu' ref='component'>
      <a className={'blue item ' + this.isActive(ModeConstants.Modes.SET)}
         data-content={this.props.userstore.getText('setManager')}
         onClick={ModeActions.changeMode.bind(null, ModeConstants.Modes.SET)}>
        <i className='sitemap icon' />
      </a>
      <a className={'blue item ' + this.isActive(ModeConstants.Modes.OBSERVATION)}
         data-content={this.props.userstore.getText('observation')}
         onClick={ModeActions.changeMode.bind(null, ModeConstants.Modes.OBSERVATION)}>
        <i className='eye icon' />
      </a>
      <a className={'blue item ' + this.isActive(ModeConstants.Modes.ORGANISATION)}
         data-content={this.props.userstore.getText('organisation')}
         onClick={ModeActions.changeMode.bind(null, ModeConstants.Modes.ORGANISATION)}>
        <i className='cubes icon' />
      </a>
      <a className={'blue item disabled ' + this.isActive(ModeConstants.Modes.TABULAR)}
         data-content={this.props.userstore.getText('tabular') + this.props.userstore.getText('unavailableInCurrentVersion')}>
        <i className='grid layout icon' />
      </a>
    </div>
  }
}

export default ModeSwitcher;
