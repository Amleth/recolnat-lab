/**
 * Implementation of AbstractTool which is used to deselect all tools.
 */
'use strict';

import React from 'react';

import AbstractTool from '../AbstractTool';

import ToolActions from '../../actions/ToolActions';

import ToolConf from '../../conf/Tools-conf';

import icon from '../../images/pointer.png';

class NoTool extends AbstractTool {
  constructor(props) {
    super(props);

    this.state = this.initialState();
  }

  initialState() {
    return {
      active: false
    }
  }

  setMode() {
    ToolActions.setTool(ToolConf.nothing.uid);
  }

  render() {
    return (
      <button ref='button'
        style={this.buttonStyle}
        className='ui button compact'
        onClick={this.setMode}
        data-content="Aucun outil actif.">
        <img src={icon} style={this.iconStyle} height='20px' width='20px' />
      </button>
    );
  }
}

export default NoTool;
