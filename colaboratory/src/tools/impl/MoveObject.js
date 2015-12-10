/**
 * Created by dmitri on 28/10/15.
 */
'use strict';

import d3 from 'd3';
import React from 'react';

import AbstractTool from '../AbstractTool';

import Classes from '../../constants/CommonSVGClasses.js';

import ViewActions from '../../actions/ViewActions.js';
import ToolActions from '../../actions/ToolActions.js';

import ToolConf from '../../conf/Tools-conf.js';

class MoveObject extends AbstractTool {
  constructor(props) {
    super(props);

    this.buttonName = "Déplacer";

    this.className = "ObjectMover";

    this.drag = d3.behavior.drag()
      .origin(d => d)
      .on('dragstart', this.dragstarted)
      .on('drag', this.dragged)
      .on('dragend', this.dragended);

    this.state = {active: false};
  }

  begin() {
    var self = this;
    d3.selectAll('.' + Classes.CHILD_GROUP_CLASS)
      .each(function(d, i) {
        d3.select(this).append('svg:image')
          .datum(d)
          .attr("height", d => d.height)
          .attr("width", d => d.width)
          .attr("x", d => 0)
          .attr("y", d => 0)
          .attr("xlink:href", d => d.url)
          .attr('class', self.className)
          .style('cursor', '-webkit-grab')
          .style('cursor', 'grab')
          .style('opacity', 0.0);

      });

    d3.selectAll('.' + this.className)
      .call(this.drag);
//     d3.select('svg').style('cursor', 'grab');
    window.setTimeout(function() {
      ToolActions.activeToolPopupUpdate(ToolConf.moveObject.tooltip);
    }, 10);
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
    window.setTimeout(function() {
      ToolActions.activeToolPopupUpdate(null);
      ToolActions.updateTooltipData('')},1);

    this.setState({active: false});
  }

  click(self, x, y, data) {
    // Doesn't do anything by itself. This is not a clickable tool.
  }

  setMode() {
    ToolActions.setTool(ToolConf.moveObject.id);
  }

  dragstarted(d) {
    if(d3.event.sourceEvent.which == 1) {
      d3.event.sourceEvent.preventDefault();
      d3.event.sourceEvent.stopPropagation();
      var group = d3.select(this);

      group
        .classed('dragging', true)
        .style('cursor', '-webkit-grabbing')
        .style('cursor', 'grabbing')
        .style('opacity', 0.3);
      d.tx = 0;
      d.ty = 0;
    }
  }

  dragged(d) {
    if(d3.select(this).classed('dragging') == true) {
      var group = d3.select(this);
      d.x = d3.event.x;
      d.y = d3.event.y;
      d.tx = d.tx + d3.event.dx;
      d.ty = d.ty + d3.event.dy;

      group.attr('transform', 'translate(' + d.tx + ',' + d.ty + ')');
    }
  }

  dragended(d) {
    if(d3.event.sourceEvent.which == 1 && d3.select(this).classed('dragging')) {
      ViewActions.moveEntity(d.workbench, d.id, d.x, d.y);
      d3.select(this)
        .classed('dragging', false)
        .style('cursor', null);

      d.tx = 0;
      d.ty = 0;
    }
  }

  componentDidMount() {
    ToolActions.registerTool(ToolConf.moveObject.id, this.click, this);
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
    return (
      <button style={this.buttonStyle}
              className='ui button compact'
              onClick={this.setMode}
              data-content='Déplacer des images dans le bureau actif'>
        <i className='ui large pointing up icon'></i></button>
    );
  }
}

export default MoveObject;