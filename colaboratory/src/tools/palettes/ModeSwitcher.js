/**
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
    this.props.modestore.addModeChangeListener(this._onModeChange);
    $('.blue.item', $(this.refs.component.getDOMNode())).popup({
      position: 'bottom right'
    });
  }

  componentWillUnmount() {
    this.props.modestore.removeModeChangeListener(this._onModeChange);
  }

  render() {
    return <div className='ui icon menu' ref='component'>
      <a className={'blue item ' + this.isActive(ModeConstants.Modes.SET)}
         data-content='Sets'
         onClick={Globals.setMode.bind(null, ModeConstants.Modes.SET)}>
        <i className='sitemap icon' />
      </a>
      <a className={'blue item ' + this.isActive(ModeConstants.Modes.OBSERVATION)}
         data-content='Observation'
         onClick={Globals.setMode.bind(null, ModeConstants.Modes.OBSERVATION)}>
        <i className='eye icon' />
      </a>
      <a className={'blue item ' + this.isActive(ModeConstants.Modes.ORGANISATION)}
         data-content='Agencement'
         onClick={Globals.setMode.bind(null, ModeConstants.Modes.ORGANISATION)}>
        <i className='cubes icon' />
      </a>
      <a className={'blue item disabled ' + this.isActive(ModeConstants.Modes.TABULAR)}
         data-content='Tabulaire (indisponible dans la version actuelle)'>
        <i className='grid layout icon' />
      </a>
    </div>
  }
}

export default ModeSwitcher;