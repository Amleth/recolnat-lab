/**
 * Created by dmitri on 17/11/15.
 */
'use strict';

import React from 'react';
import d3 from 'd3';

import ToolActions from '../../actions/ToolActions';

import Classes from '../../constants/CommonSVGClasses';

import AbstractTool from '../AbstractTool';

import ToolConf from '../../conf/Tools-conf';

class MoveView extends AbstractTool {
  constructor(props) {
    super(props);

    this.state = {active: false};
  }

  setMode() {
    ToolActions.setTool(ToolConf.moveView.id);
  }

  begin() {
    window.setTimeout(function() {
        ToolActions.activeToolPopupUpdate(null);
        ToolActions.updateTooltipData(ToolConf.moveView.tooltip);},
      50);

    d3.select('svg').style('cursor', 'move');
    this.setState({active: true});
  }

  reset() {
    this.finish();
    this.begin();
  }

  finish() {
    window.setTimeout(function() {
        ToolActions.activeToolPopupUpdate(null);
        ToolActions.updateTooltipData('');},
      50);

    d3.select('svg').style('cursor', 'default');
    this.setState({active: false});
  }

  componentDidMount() {
    ToolActions.registerTool(ToolConf.moveView.id, this.click, this);
    $(this.refs.button.getDOMNode()).popup();
  }

  componentWillUpdate(nextProps, nextState) {
    if(nextState.active) {
      this.buttonStyle.backgroundColor = 'rgba(200,200,200,1.0)';
    }
    else {
      this.buttonStyle.backgroundColor = null;
    }
  }

  render() {
    return (
      <button style={this.buttonStyle}
              ref='button'
              className='ui button compact'
              onClick={this.setMode}
              data-content="Déplacer la vue">
        <i className='ui large move icon'></i>
      </button>
    )
  }
}

export default MoveView;