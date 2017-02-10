/**
 * Created by dmitri on 28/10/15.
 */
'use strict';

import d3 from 'd3';
import React from 'react';

import AbstractTool from '../AbstractTool';

import Classes from '../../constants/CommonSVGClasses.js';
import TypeConstants from '../../constants/TypeConstants';
import ModeConstants from '../../constants/ModeConstants';

import ViewActions from '../../actions/ViewActions.js';
import ToolActions from '../../actions/ToolActions.js';
import ModeActions from '../../actions/ModeActions.js';

import OrbOptions from '../../components/context-menu/options/OrbOptions';

import ToolConf from '../../conf/Tools-conf.js';

import D3EventHandlers from '../../utils/D3EventHandlers';
import D3ViewUtils from '../../utils/D3ViewUtils';
import Globals from '../../utils/Globals';

class MoveObject extends AbstractTool {
  constructor(props) {
    super(props);

    this.buttonName = "Déplacer";

    this.className = "ObjectMover";
  }

  begin() {
    let self = this;
    d3.selectAll('.' + Classes.CHILD_GROUP_CLASS)
      .each(function(d, i) {
        d3.select(this).append('rect')
          .datum(d)
          .attr("height", d => d.height)
          .attr("width", d => d.width)
          .attr("x", d => 0)
          .attr("y", d => 0)
          // .attr("xlink:href", d => d.url)
          .attr('class', self.className)
          .style('cursor', '-webkit-grab')
          .style('cursor', 'grab')
          .style('opacity', 0.0);
      });

    d3.selectAll('.' + this.className)
      .on('mouseup', this.select)
      .on('dblclick', this.switchToSheetInObservationMode.bind(this))
      .call(D3EventHandlers.dragMove());
//     d3.select('svg').style('cursor', 'grab');
    this.setState({active: true});
  }

  reset() {
    // Reset what?
    this.finish();
    this.begin();
  }

  finish() {
    d3.selectAll('.' + this.className)
      .on(".drag", null).remove();
    d3.select('svg').style('cursor', 'default');
    window.setTimeout(ToolActions.activeToolPopupUpdate, 10);
    window.setTimeout(ToolActions.updateTooltipData.bind(null, ''), 10);

    this.setState({active: false});
  }

  click(self, x, y, data) {


  }

  setMode() {
    ToolActions.setTool(ToolConf.moveObject.id);
  }

  select(d, i) {
    window.setTimeout((function(id) {
      return function() {
        ViewActions.changeSelection(id, null);
      }
    })(d.entity), 10);
  }

  switchToSheetInObservationMode(d) {
    D3ViewUtils.zoomToObjectBySelector("#GROUP-" + d.link, this.props.viewstore.getView());
    window.setTimeout(ModeActions.changeMode.bind(null, ModeConstants.Modes.OBSERVATION), 10);
  }

  componentDidMount() {
    super.componentDidMount();
    window.setTimeout(ToolActions.registerTool.bind(null, ToolConf.moveObject.id, this.click, this), 10);
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
    super.componentWillUnmount();
    window.setTimeout(ToolActions.activeToolPopupUpdate, 10);
  }

  render() {
    return (
      <button style={this.buttonStyle}
              ref='button'
              className='ui button compact'
              onClick={this.setMode}
              data-content='Déplacer des images dans le bureau actif'>
        <i className='ui large pointing up icon'></i></button>
    );
  }
}

export default MoveObject;
