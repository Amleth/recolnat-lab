/**
 * Created by dmitri on 28/10/15.
 */
'use strict';

import React from 'react';
import d3 from 'd3';

import AbstractTool from '../AbstractTool.js';

import Classes from '../../constants/CommonSVGClasses.js';

import ViewActions from '../../actions/ViewActions.js';
import ToolActions from '../../actions/ToolActions.js';

import ToolConf from '../../conf/Tools-conf.js';

class SelectObject extends AbstractTool {
  constructor(props) {
    super(props);

    this.state = {active: false};
  }

  begin() {
    d3.selectAll('.' + Classes.IMAGE_CLASS).on('click', this.changeSelection.bind(this)).style('cursor', 'alias');
    this.setState({active: true});
  }

  reset() {

  }

  finish() {
    d3.selectAll('.' + Classes.IMAGE_CLASS).on('click', null).style('cursor', null);
    this.setState({active: false});
  }

  click(self, x, y, data) {

  }

  changeSelection(d) {
    //d3.event.stopPropagation();
    // Update store
    window.setTimeout((function(id) {
      return function() {
        ViewActions.changeSelection(id, d);
      }
    })(d.id), 10);
  }

  setMode() {
    ToolActions.setTool(ToolConf.selectObject.id);
  }

  componentDidMount() {
    $(this.refs.button.getDOMNode()).popup();
    ToolActions.registerTool(ToolConf.selectObject.id, this.click, this);
  }

  componentWillUpdate(nextProps, nextState) {
    if(nextState.active) {
      this.buttonStyle.backgroundColor = 'rgba(200,200,200,1.0)';
    }
    else {
      this.buttonStyle.backgroundColor = null;
    }
  }

  componentWillUnmount() {
    ToolActions.activeToolPopupUpdate(null);
  }

  render() {
    return(
      <button ref='button'
              style={this.buttonStyle}
              className='ui button compact'
              onClick={this.setMode}
              data-content="Sélectionner une image pour travailler dessus">
        <i className='ui large location arrow icon'></i>
      </button>
    );
  }
}

export default SelectObject;