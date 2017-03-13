/**
 * Implementation of AbstractTool to create measure standards. A measure standard is a normal ToI which is associated to a MeasureStandard when saved. This tool does both in one action. No tool exists to turn an existing trail into a measure standard.
 *
 * Created by dmitri on 05/01/17.
 */
'use strict';

import React from 'react';
import d3 from 'd3';

import AbstractTool from '../AbstractTool';
import Popup from '../popups/CreateMeasureStandardPopup';

import Classes from '../../constants/CommonSVGClasses';

import ToolActions from '../../actions/ToolActions';

import Globals from '../../utils/Globals';
import ServiceMethods from '../../utils/ServiceMethods';

import ToolConf from '../../conf/Tools-conf';

import icon from '../../images/measure-standard.svg';

class CreateMeasureStandard extends AbstractTool {
  constructor(props) {
    super(props);

    let self = this;

    this.dragStart = d3.behavior.drag()
      .origin(d => d)
      .on('dragstart', this.vertexDragStart)
      .on('drag', this.vertexDragged)
      .on('dragend', function(d, i) {
        let coords = d3.mouse(d3.select('#IMAGE-' + d.link).node());
        self.setState({start: {x: coords[0], y: coords[1]}});
      });
    this.dragEnd = d3.behavior.drag()
      .origin(d => d)
      .on('dragstart', this.vertexDragStart)
      .on('drag', this.vertexDragged)
      .on('dragend', function(d, i) {
        let coords = d3.mouse(d3.select('#IMAGE-' + d.link).node());
        self.setState({end: {x: coords[0], y: coords[1]}});
      });

    this.state = this.initialState();
  }

  initialState() {
    return {
      active: false,
      imageUri: null,
      imageLinkUri: null,
      start: null,
      end: null,
      inputValueInMm: null,
      name: null
    };
  }

  canSave() {
    return true;
  }

  save() {
    let length = Math.sqrt(Math.pow(this.state.end.x - this.state.start.x, 2) + Math.pow(this.state.end.y - this.state.start.y, 2));
    // console.log('saving trail with length ' + length);
    ServiceMethods.createTrailOfInterest(this.state.imageUri, length, [[this.state.start.x,this.state.start.y], [this.state.end.x, this.state.end.y]], this.state.name, this.pathCreated.bind(this));
  }

  pathCreated(msg) {
    if(msg.clientProcessError) {
      alert(this.props.userstore.getText('newStandardFailed') + ' ' + this.props.userstore.getText('newStandardError1'));
    }
    else {
      ServiceMethods.addMeasureStandard(msg.data.measurementId, this.state.inputValueInMm, 'mm', this.state.name, this.measureStandardCreated.bind(this));
    }
  }

  measureStandardCreated(msg) {
    if(msg.clientProcessError) {
      alert(this.props.userstore.getText('newStandardFailed') + ' ' + this.props.userstore.getText('newStandardError2'));
    }
    else {

    }
    window.setTimeout(ToolActions.reset, 10);
  }

  setData(name, value) {
    this.setState({name: name, inputValueInMm: value});
  }

  begin() {
    window.setTimeout(ToolActions.activeToolPopupUpdate.bind(null, null), 10);

    let popup = <Popup userstore={this.props.userstore}
                       setDataCallback={this.setData.bind(this)}
                       toolstore={this.props.toolstore}/>;
    window.setTimeout(ToolActions.activeToolPopupUpdate.bind(null, popup), 10);
    window.setTimeout(ToolActions.updateTooltipData.bind(null, this.props.userstore.getText('newStandardTooltip1')), 10);
    let self = this;
    d3.selectAll('.' + Classes.IMAGE_CLASS)
      .style('cursor', 'crosshair')
      .on('click', function(d, i) {
        if(d3.event.defaultPrevented) return;
        d3.event.preventDefault();
        d3.event.stopPropagation();
        if(d3.event.button == 0) {
          self.leftClick.call(this, self, d);
        }
      })
      .on('contextmenu', function(d, i) {
        if(d3.event.defaultPrevented) return;
        d3.event.preventDefault();
        d3.event.stopPropagation();
        self.rightClick.call(this, self, d);
      });

    this.props.viewstore.addViewportListener(this._forceUpdate);

    this.setState({active: true});
  }

  reset() {
    this.clearSVG();
    window.setTimeout(ToolActions.updateToolData.bind(null, null), 10);
    window.setTimeout(ToolActions.updateTooltipData.bind(null, this.props.userstore.getText('newStandardTooltip1')), 10);

    this.setState({
      imageUri: null,
      imageLinkUri: null,
      start: null,
      end: null,
      inputValueInMm: null,
      name: null
    });
  }

  finish() {
    this.clearSVG();
    d3.selectAll('.' + Classes.IMAGE_CLASS)
      .style('cursor', 'default')
      .on('click', null)
      .on('contextmenu', null);

    this.setState(this.initialState());
    this.props.viewstore.removeViewportListener(this._forceUpdate);

    window.setTimeout(ToolActions.updateTooltipData.bind(null, ''), 10);
    window.setTimeout(ToolActions.activeToolPopupUpdate.bind(null, null), 10);
    window.setTimeout(ToolActions.updateToolData.bind(null, null), 10);
  }

  click() {

  }

  setMode() {
    window.setTimeout(ToolActions.setTool.bind(null, ToolConf.newMeasureStandard.id), 10);
  }

  static classes() {
    return {
      main: 'NEW_MEASURE_STANDARD_CLASS',
      vertex: 'NEW MEASURE_STANDARD_VERTEX_CLASS',
      line: 'NEW_MEASURE_STANDARD_LINE_CLASS',
      lineBack: 'NEW_MEASURE_STANDARD_LINE_BACK_CLASS'
    };
  }

  leftClick(self, d) {
    let state = JSON.parse(JSON.stringify((self.state)));

    if(state.imageLinkUri != d.link) {
      state.imageLinkUri = d.link;
      state.imageUri = d.entity;
      state.start = null;
      state.end = null;
    }

    if(!self.state.start) {
      let coords = d3.mouse(this);
      state.start = {x: coords[0], y: coords[1]};
      window.setTimeout(ToolActions.updateTooltipData.bind(null, self.props.userstore.getText('newStandardTooltip2')), 10);
      self.setState(state);
    }
    else if(!self.state.end) {
      let coords = d3.mouse(this);
      window.setTimeout(ToolActions.updateTooltipData.bind(null, self.props.userstore.getText('newStandardTooltip3')), 10);
      self.setState({end: {x: coords[0], y: coords[1]}});
    }
  }

  rightClick(self, d) {

  }

  drawSVG() {
    let msGroup = d3.select('#OVER-' + this.state.imageLinkUri).append('g')
      .attr('class', CreateMeasureStandard.classes().main);

    let view = this.props.viewstore.getView();

    if(this.state.start && this.state.end) {
      msGroup.append('line')
        .attr('class', CreateMeasureStandard.classes().lineBack)
        .attr('x1', this.state.start.x)
        .attr('y1', this.state.start.y)
        .attr('x2', this.state.end.x)
        .attr('y2', this.state.end.y)
        .attr('stroke-width', 2/view.scale)
        .attr('stroke', 'black')
        .style('pointer-events', 'none');

      msGroup.append('line')
        .attr('class', CreateMeasureStandard.classes().line)
        .attr('x1', this.state.start.x)
        .attr('y1', this.state.start.y)
        .attr('x2', this.state.end.x)
        .attr('y2', this.state.end.y)
        .attr('stroke-width', 2/view.scale)
        .attr('stroke-dasharray', 5/view.scale + ',' + 5/view.scale)
        .attr('stroke', 'white')
        .style('pointer-events', 'none');
    }
    else if(this.state.start) {
      let line = msGroup.append('line')
        .attr('class', CreateMeasureStandard.classes().lineBack)
        .attr('x1', this.state.start.x)
        .attr('y1', this.state.start.y)
        .attr('x2', this.state.start.x)
        .attr('y2', this.state.start.y)
        .attr('stroke-width', 2/view.scale)
        .attr('stroke', 'black')
        .style('pointer-events', 'none');

      let lineBack = msGroup.append('line')
        .attr('class', CreateMeasureStandard.classes().line)
        .attr('x1', this.state.start.x)
        .attr('y1', this.state.start.y)
        .attr('x2', this.state.start.x)
        .attr('y2', this.state.start.y)
        .attr('stroke-width', 2/view.scale)
        .attr('stroke-dasharray', 5/view.scale + ',' + 5/view.scale)
        .attr('stroke', 'white')
        .style('pointer-events', 'none');

      d3.select('#IMAGE-' + this.state.imageLinkUri)
        .on('mousemove', function (d, i) {
          let coords = d3.mouse(this);
          line.attr('x2', coords[0]);
          line.attr('y2', coords[1]);
          lineBack.attr('x2', coords[0]);
          lineBack.attr('y2', coords[1]);
        });
    }

    if(this.state.start) {
      msGroup.append('circle')
        .datum({x: this.state.start.x, y: this.state.start.y, link: this.state.imageLinkUri})
        .attr('class', CreateMeasureStandard.classes().vertex)
        .attr('cx', this.state.start.x)
        .attr('cy', this.state.start.y)
        .attr('r', 6 / view.scale)
        .attr('stroke-width', 3 / view.scale)
        .attr('stroke', 'white')
        .attr('fill', 'black')
        .attr("x", function (d) {
          return d.x;
        })
        .attr("y", function (d) {
          return d.y;
        })
        .style('cursor', '-webkit-grab')
        .style('cursor', 'grab')
        .call(this.dragStart);
    }

    if(this.state.end) {
      msGroup.append('circle')
        .datum({x: this.state.end.x, y: this.state.end.y, link: this.state.imageLinkUri})
        .attr('class', CreateMeasureStandard.classes().vertex)
        .attr('cx', this.state.end.x)
        .attr('cy', this.state.end.y)
        .attr('r', 6 / view.scale)
        .attr('stroke-width', 3 / view.scale)
        .attr('stroke', 'white')
        .attr('fill', 'black')
        .attr("x", function (d) {
          return d.x;
        })
        .attr("y", function (d) {
          return d.y;
        })
        .style('cursor', '-webkit-grab')
        .style('cursor', 'grab')
        .call(this.dragEnd);
    }


  }

  clearSVG() {
    d3.select('.' + CreateMeasureStandard.classes().main).remove();
  }

  vertexDragStart() {
    if(d3.event.sourceEvent.which == 1) {
      d3.event.sourceEvent.preventDefault();
      d3.event.sourceEvent.stopPropagation();
    }
  }

  vertexDragged(d) {
    let image = d3.select('#IMAGE-' + d.link);
    let coords = d3.mouse(image.node());
    let imageData = image.datum();
    let x = Globals.getBoundedPosition(coords[0], imageData.width, 0);
    let y = Globals.getBoundedPosition(coords[1], imageData.height, 0);

    let vertex = d3.select(this);
    vertex.attr('cx', x)
      .attr('cy', y);
    d.x = x;
    d.y = y;
  }

  componentDidMount() {
    super.componentDidMount();
    window.setTimeout(ToolActions.registerTool.bind(null, ToolConf.newMeasureStandard.id, this.click, this), 10);
  }

  componentWillUpdate(nextProps, nextState) {
    super.componentWillUpdate(nextProps, nextState);
  }

  componentDidUpdate(prevProps, prevState) {
    super.componentDidUpdate(prevProps, prevState);
    if(this.state.active) {
      if (this.state.start && this.state.end) {
        let length = Math.sqrt(Math.pow(this.state.end.x - this.state.start.x, 2) + Math.pow(this.state.end.y - this.state.start.y, 2));
        window.setTimeout(ToolActions.updateToolData.bind(null, length), 10);
      }

      this.clearSVG();
      this.drawSVG();
    }
  }

  render() {
    return (
      <button className='ui button compact'
              ref='button'
              onClick={this.setMode}
              style={this.buttonStyle}
              data-content={this.props.userstore.getText('newMeasureStandard')}>
        <img src={icon} style={this.iconStyle} height='20px' width='40px' />
      </button>
    );
  }
}

export default CreateMeasureStandard;