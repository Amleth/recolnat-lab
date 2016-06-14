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

import OrbOptions from '../../components/context-menu/options/OrbOptions';

import ToolConf from '../../conf/Tools-conf.js';

import D3EventHandlers from '../../utils/D3EventHandlers';
import Globals from '../../utils/Globals';

class MoveObject extends AbstractTool {
  constructor(props) {
    super(props);

    this.buttonName = "Déplacer";

    this.className = "ObjectMover";

    // this.drag = d3.behavior.drag()
    //   .origin(d => d)
    //   .on('dragstart', this.dragstarted)
    //   .on('drag', this.dragged)
    //   .on('dragend', this.dragended);

    this.state = {active: false};
  }

  begin() {
    var self = this;
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
    // window.setTimeout(function() {
    //   ToolActions.activeToolPopupUpdate(ToolConf.moveObject.tooltip);
    // }, 10);
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
    // Find images under cursor in data.objects
    //console.log(JSON.stringify(data));
    //for(var i = 0; i < data.objects.length; ++i) {
    //  if(data.objects[i].type == TypeConstants.sheet) {
    //    window.setTimeout((function(id) {
    //      return function() {
    //        ViewActions.changeSelection(id, null);
    //      }
    //    })(data.objects[i].uid), 100);
    //    return;
    //  }
    //}
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

  // dragstarted(d) {
  //   if(d3.event.sourceEvent.which == 1) {
  //     d3.event.sourceEvent.preventDefault();
  //     d3.event.sourceEvent.stopPropagation();
  //     var group = d3.select(this);
  //
  //     group
  //       .classed('dragging', true)
  //       .style('cursor', '-webkit-grabbing')
  //       .style('cursor', 'grabbing')
  //       .style('opacity', 0.3);
  //     d.tx = 0;
  //     d.ty = 0;
  //   }
  // }
  //
  // dragged(d) {
  //   if(d3.select(this).classed('dragging') == true) {
  //     var group = d3.select(this);
  //     d.x = d3.event.x;
  //     d.y = d3.event.y;
  //     d.tx = d.tx + d3.event.dx;
  //     d.ty = d.ty + d3.event.dy;
  //
  //     group.attr('transform', 'translate(' + d.tx + ',' + d.ty + ')');
  //   }
  // }
  //
  // dragended(d) {
  //   if(d3.event.sourceEvent.which == 1 && d3.select(this).classed('dragging')) {
  //     ViewActions.moveEntity(d.view, d.entity, d.link, d.x, d.y);
  //     d3.select(this)
  //       .classed('dragging', false)
  //       .style('cursor', null);
  //
  //     d.tx = 0;
  //     d.ty = 0;
  //   }
  // }

  switchToSheetInObservationMode(d) {
    OrbOptions.zoomToObject("#GROUP-" + d.link, this.props.viewstore.getView());

    window.setTimeout(Globals.setMode.bind(null, ModeConstants.Modes.OBSERVATION), 1010);
  }

  componentDidMount() {
    ToolActions.registerTool(ToolConf.moveObject.id, this.click, this);
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

  componentWillUnmount() {
    ToolActions.activeToolPopupUpdate(null);
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
