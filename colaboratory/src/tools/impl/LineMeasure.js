'use strict';

import React from 'react';
import d3 from "d3";

import Classes from "../../constants/CommonSVGClasses";
import Popup from "../popups/LineMeasurePopup";

import AbstractTool from "../AbstractTool";

import ToolActions from "../../actions/ToolActions";

import ToolConf from "../../conf/Tools-conf";

import icon from '../../images/measure.svg';

/**
 * A tool registers itself with the ToolStore, providing its name and a callback function.
 */
class LineMeasure extends AbstractTool {
  constructor(props) {
    super(props);

    this.selfSvgClass = "LINE_MEASURE_TOOL_CLASS";
    this.selfRectSvgClass = "LINE_MEASURE_RECT_TOOL_CLASS";
    this.selfTextSvgClass = "LINE_MEASURE_TEXT_TOOL_CLASS";
    
    this.iconStyle = {
      margin: '8px 10px 0px 0px'
    };

    this.state = this.getInitialState();
  }
  
  getInitialState() {
    return {
      active: false,
      clicks: 0,
      tooltip: null,
      start: null,
      end: null,
      mmPerPixel: null
    };
  }

  toSVG() {
    var activeToolGroup = d3.select('.' + Classes.ACTIVE_TOOL_DISPLAY_CLASS);
    
    
    activeToolGroup
      .append('line')
      .attr('class', this.selfSvgClass)
      .attr('x1', this.state.start.x)
      .attr('y1', this.state.start.y)
      .attr('x2', this.state.start.x)
      .attr('y2', this.state.start.y)
      .attr('stroke-width', 2)
      .attr('stroke', '#AAAAAA');
    
    activeToolGroup
      .append('line')
      .attr('class', this.selfSvgClass)
      .attr('x1', this.state.start.x)
      .attr('y1', this.state.start.y)
      .attr('x2', this.state.start.x)
      .attr('y2', this.state.start.y)
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5')
      .attr('stroke', 'black');
      
      
      
    activeToolGroup
      .append('rect')
      .attr('class', this.selfRectSvgClass)
      .attr('x', this.state.start.x)
      .attr('y', this.state.start.y)
      .attr('width', 30)
      .attr('height', 15)
      .attr('stroke-width', 2)
      .attr('stroke', '#AAAAAA')
      .attr('fill', '#000000');
      
   activeToolGroup
    .append('text')
    .attr('class', this.selfTextSvgClass)
    .attr('x', this.state.start.x)
    .attr('y', this.state.start.y)
    .attr('dy', '.35em')
          .attr('text-anchor', 'middle')
          .attr('font-size', '14px')
	  .attr('fill', '#FFFFFF')
	  .text('0');

    
  }

  removeSVG() {
    d3.select('.' + Classes.ACTIVE_TOOL_DISPLAY_CLASS).selectAll('*').remove();
  }

  begin() {
    var popup = <Popup toolstore={this.props.toolstore} entitystore={this.props.entitystore} setScaleCallback={this.setScale.bind(this)}/>;
    window.setTimeout(function() {
      ToolActions.activeToolPopupUpdate(popup);
      ToolActions.updateTooltipData(ToolConf.lineMeasure.tooltip);
    }, 50);
    d3.select('svg').style('cursor', 'crosshair');
    this.setState({active: true});
  }

  reset() {
    this.removeMouseMoveListener();
    this.removeSVG();
    window.setTimeout(function() {
      ToolActions.updateTooltipData(ToolConf.lineMeasure.tooltip);
    }, 10);
    this.setState({clicks: 0, start: null, end: null});
  }

  finish() {
  d3.select('svg').style('cursor', 'default');
  
  this.removeMouseMoveListener();
    window.setTimeout(function() {
      ToolActions.activeToolPopupUpdate(null);
      ToolActions.updateTooltipData("");
    }, 10);
    this.setState(this.getInitialState());
  }

  /**
   * Callback function to respond to user clicks.
   * @param x click location x
   * @param y click location y
   * @returns {boolean} true if the tool has completed its task and the method toSVG() can be safely called, false when user input is still required
   */
  click(self, x, y) {
    console.log(x);
    console.log(y);
    if(self.state.clicks == 0) {
      // First click somewhere, set line beginning
      var view = self.props.viewstore.getView();
      self.setState({start: {x: (x - view.left)/view.scale, y: (y - view.top)/view.scale}, clicks: 1});
    }
    else if(self.state.clicks == 1) {
      // Second click, set line end
// 	self.setState({end: {x: x, y: y}});
      self.removeMouseMoveListener();
      self.setState({clicks: 2});
    }
    else {
      // Line already complete, begin new measure.
      window.setTimeout(function () {
        ToolActions.updateTooltipData("Cliquez sur l'image pour commencer la mesure");
      }, 10);
      self.setState({start: null, end: null, clicks: 0});
    }
  }

  setMode() {
    ToolActions.setTool(ToolConf.lineMeasure.id);
  }

  setLineEndPosition(self) {
    var coords = d3.mouse(this);
    self.setState({end: {x: coords[0], y: coords[1]}});
  }
  
  updateLengthDisplay() {
    if(this.state.end) {
      var len = this.calculateMeasuredLength(this.state.end.x, this.state.end.y);

      var unit = "px";
      if (this.state.mmPerPixel) {
        len = len * this.state.mmPerPixel;
        var unit = "mm";
      }

      d3.selectAll('.' + this.selfSvgClass)
        .attr('x2', this.state.end.x)
        .attr('y2', this.state.end.y);

      var text = d3.select('.' + this.selfTextSvgClass)
        .attr('x', (this.state.end.x + this.state.start.x) / 2)
        .attr('y', (this.state.end.y + this.state.start.y) / 2)
        .text(len.toFixed(2) + unit);

      var width = text.node().getBBox().width;
      var height = text.node().getBBox().height;

      var rect = d3.select('.' + this.selfRectSvgClass)
        .attr('x', (this.state.end.x + this.state.start.x - width - 10) / 2)
        .attr('y', (this.state.end.y + this.state.start.y - height - 10) / 2)
        .attr('width', text.node().getBBox().width + 10)
        .attr('height', text.node().getBBox().height + 10);

      ToolActions.updateTooltipData(len + unit);
    }
  }

  removeMouseMoveListener() {
    d3.select('.' + Classes.ROOT_CLASS).on("mousemove", null);
  }

  calculateMeasuredLength(x, y) {
    var yMax = Math.max(this.state.start.y, y);
    var yMin = Math.min(this.state.start.y, y);
    var xMax = Math.max(this.state.start.x, x);
    var xMin = Math.min(this.state.start.x, x);
    var len = Math.sqrt(Math.pow(yMax-yMin, 2) + Math.pow(xMax-xMin, 2));
    return len;
  }

  setScale(scale) {
    this.setState({mmPerPixel: scale});
  }

  componentDidMount() {
    ToolActions.registerTool(ToolConf.lineMeasure.id, this.click, this);
  }
  
  componentDidUpdate(prevProps, prevState) {
    if(this.state.start && !this.state.end) {
      this.toSVG();
      var self = this;
      d3.select('.' + Classes.ROOT_CLASS)
      .on("mousemove", function(d, i) {
        self.setLineEndPosition.call(this, self)});
    }
    else if(this.state.clicks == 1) {
      this.updateLengthDisplay();
    }
    else if(this.state.clicks == 0) {
      this.removeSVG();
    }
    if(prevState.mmPerPixel != this.state.mmPerPixel) {
      this.updateLengthDisplay();
    }
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
      <button 
	style={this.buttonStyle} 
	className='ui button compact' 
	onClick={this.setMode} 
	data-content="Mesurer une longueur sur l'image sélectionnée">
      <img src={icon} style={this.iconStyle} height='20px' width='20px' />
      </button>
    );
  }
}

// <i className='ui large wizard icon'></i>

export default LineMeasure;