'use strict';

import React from 'react';
import d3 from "d3";
import UUID from 'node-uuid';

import Classes from "../../constants/CommonSVGClasses";
import Popup from "../popups/LineMeasurePopup";

import AbstractTool from "../AbstractTool";

import ToolActions from "../../actions/ToolActions";
import ViewActions from '../../actions/ViewActions';

import ToolConf from "../../conf/Tools-conf";
import conf from '../../conf/ApplicationConfiguration';

import icon from '../../images/measure.svg';
import saveIcon from '../../images/save.png';

/**
 * A tool registers itself with the ToolStore, providing its name and a callback function.
 */
class LineMeasure extends AbstractTool {
  constructor(props) {
    super(props);

    this.dragStartVertex = d3.behavior.drag()
      .origin(d => d)
      .on('drag', LineMeasure.dragStartVertexDrag);

    this.dragEndVertex = d3.behavior.drag()
      .origin(d => d)
      .on('drag', LineMeasure.dragEndVertexDrag);

    this.iconStyle = {
      margin: '8px 10px 0px 0px'
    };

    this.state = this.initialState();
  }

  initialState() {
    return {
      active: false,
      clicks: 0,
      tooltip: null,
      start: null,
      end: null,
      uuid: null,
      mmPerPixel: null
    };
  }

  static classes() {
    return {
      selfSvgClass: "LINE_MEASURE_TOOL_CLASS",
      selfGroupSvgClass: "LINE_MEASURE_GROUP_CLASS",
      selfDataContainerClass: "LINE_MEASURE_GROUP_DATA_CONTAINER_CLASS",
      selfRectSvgClass: "LINE_MEASURE_RECT_TOOL_CLASS",
      selfTextSvgClass: "LINE_MEASURE_TEXT_TOOL_CLASS",
      selfStartVertexClass: "LINE_MEASURE_RECT_START_CLASS",
      selfEndVertexClass: "LINE_MEASURE_RECT_END_CLASS",
      selfSaveClass: 'LINE_MEASURE_SAVE_CLASS'
    };
  }

  createActiveMeasure() {
    var activeToolGroup = d3.select('.' + Classes.ACTIVE_TOOL_DISPLAY_CLASS);

    var lineData = {
      x1: this.state.start.x,
      y1: this.state.start.y,
      x2: this.state.start.x,
      y2: this.state.start.y,
      id: this.state.uuid,
      unit: 'px',
      mmPerPixel: null
    };

    if(this.state.mmPerPixel) {
      lineData.mmPerPixel = this.state.mmPerPixel;
      lineData.unit = 'mm';
    }

    var newMeasure = activeToolGroup.append('g')
      .datum(lineData)
      .attr('id', d => 'MEASURE-' + d.uid)
      .attr('class', LineMeasure.classes().selfGroupSvgClass);

    newMeasure
      .append('line')
      .datum(lineData)
      .attr('class', LineMeasure.classes().selfSvgClass)
      .attr('stroke-width', 2)
      .attr('stroke', '#AAAAAA');

    newMeasure
      .append('line')
      .datum(lineData)
      .attr('class', LineMeasure.classes().selfSvgClass)
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5')
      .attr('stroke', 'black');

    var group = newMeasure.append('g')
      .datum(lineData)
      .attr('class', LineMeasure.classes().selfDataContainerClass);

    group
      .append('rect')
      .datum(lineData)
      .attr('class', LineMeasure.classes().selfRectSvgClass)
      .attr('width', 30)
      .attr('height', 15)
      .attr('stroke-width', 2)
      .attr('stroke', '#AAAAAA')
      .attr('fill', '#000000');

    group
      .append('text')
      .datum(lineData)
      .attr('class', LineMeasure.classes().selfTextSvgClass)
      .attr('dy', '.35em')
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .attr('fill', '#FFFFFF');

    LineMeasure.updateLineDisplay(lineData.uid);

    var self = this;
    d3.select('.' + Classes.ROOT_CLASS)
      .on("mousemove", function(d, i) {
        self.setLineEndPosition.call(this, self)
      });
  }

  makeActiveMeasurePassive() {
    // Grab active measure
    var activeToolGroup = d3.select('#MEASURE-' + this.state.uuid);
    var self = this;
    var lineData = activeToolGroup.datum();
    // Remove mousemove listener
    d3.select('.' + Classes.ROOT_CLASS)
      .on("mousemove", null);
    // Create point (rect) at both ends with drag listeners
    activeToolGroup.append('rect')
      .datum(lineData)
      .attr('class', LineMeasure.classes().selfStartVertexClass)
      .attr('height', 10)
      .attr('width', 10)
      .attr('fill', 'black')
      .style('cursor', '-webkit-grab')
      .style('cursor', 'grab')
      .on('click', LineMeasure.stopEvent)
      .on('mousedown', LineMeasure.stopEvent)
      .call(this.dragStartVertex);

    activeToolGroup.append('rect')
      .datum(lineData)
      .attr('class', LineMeasure.classes().selfEndVertexClass)
      .attr('height', 10)
      .attr('width', 10)
      .attr('fill', 'black')
      .style('cursor', '-webkit-grab')
      .style('cursor', 'drag')
      .on('click', LineMeasure.stopEvent)
      .on('mousedown', LineMeasure.stopEvent)
      .call(this.dragEndVertex);

    activeToolGroup.select('.' + LineMeasure.classes().selfDataContainerClass).append('svg:image')
      .datum(lineData)
      .attr('class', LineMeasure.classes().selfSaveClass)
      .attr('xlink:href', saveIcon)
      .attr('height', 30)
      .attr('width', 30)
      .style('cursor', 'default')
      .on('click', function(d) { return self.save.call(self, d); });

    LineMeasure.updateLineDisplay(this.state.uuid);
    // Add icon to 'save measure to server'
  }

  removeSVG() {
    d3.select('.' + Classes.ACTIVE_TOOL_DISPLAY_CLASS).selectAll('*').remove();
  }

  begin() {
    var popup = <Popup
      toolstore={this.props.toolstore}
      setScaleCallback={this.setScale.bind(this)}/>;
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
    this.setState({clicks: 0, start: null, end: null, uuid: null});
  }

  finish() {
    d3.select('svg').style('cursor', 'default');
    // TODO remove all measures
    this.removeSVG();

    this.removeMouseMoveListener();
    window.setTimeout(function() {
      ToolActions.activeToolPopupUpdate(null);
      ToolActions.updateTooltipData("");
    }, 10);
    this.setState(this.initialState());
  }

  /**
   * Callback function to respond to user clicks.
   * @param x click location x
   * @param y click location y
   * @returns {boolean} true if the tool has completed its task and the method toSVG() can be safely called, false when user input is still required
   */
  click(self, x, y) {
    if(self.state.clicks == 0) {
      // First click somewhere, set line beginning, create uuid
      var uuid = UUID.v4();
      var view = self.props.viewstore.getView();
      window.setTimeout(function () {
        ToolActions.updateTooltipData("Cliquez sur l'image pour terminer la mesure");
      }, 10);
      self.setState({start: {x: (x - view.left)/view.scale, y: (y - view.top)/view.scale}, clicks: 1, uuid: uuid});
    }
    else if(self.state.clicks == 1) {
      // Second click, set line end
      self.removeMouseMoveListener();
      self.setState({clicks: 2});
    }
    else {
      // Line already complete, begin new measure.
      window.setTimeout(function () {
        ToolActions.updateTooltipData("Cliquez sur l'image pour commencer une nouvelle mesure");
      }, 10);
      self.setState({start: null, end: null, uuid: null, clicks: 0});
    }
  }

  setMode() {
    ToolActions.setTool(ToolConf.lineMeasure.uid);
  }

  save(d) {
    var name = prompt('Veuillez indiquer un nom pour cette mesure', '');
    if(name.length < 1) {
      alert('Le nom est obligatoire');
      return;
    }

    console.error('not implemented');
    return;
    var imageId = this.props.getSelectedImageId();
    var x1 = d.x1- this.props.getSelectedImage().x;
    var y1 = d.y1 - this.props.getSelectedImage().y;
    var x2 = d.x2 - this.props.getSelectedImage().x;
    var y2 = d.y2 - this.props.getSelectedImage().y;

    var data = {};
    data.serviceUrl = conf.actions.imageEditorServiceActions.createPath;
    data.payload = {};
    data.payload.path = [];
    data.payload.name = name;

    data.payload.path.push([x1, y1]);
    data.payload.path.push([x2, y2]);

    data.payload.length = Math.sqrt(Math.pow(Math.abs(y2) - Math.abs(y1), 2) + Math.pow(Math.abs(x2) - Math.abs(x1), 2));



    this.props.toolstore.sendData(data, ViewActions.updateMetadata.bind(null, imageId));

    LineMeasure.stopEvent(d);
  }

  static updateLineDisplay(id) {
    //console.log("updating " + id);
    var measure = d3.select('#MEASURE-' + id);

    measure.selectAll('.' + LineMeasure.classes().selfSvgClass)
      .attr('x1', d => d.x1)
      .attr('y1', d => d.y1)
      .attr('x2', d => d.x2)
      .attr('y2', d => d.y2);

    var text = measure.select('.' + LineMeasure.classes().selfTextSvgClass)
      .attr('x', d => (d.x2 + d.x1) / 2)
      .attr('y', d => (d.y2 + d.y1) / 2)
      .text(d => LineMeasure.calculateMeasuredLength(d).toFixed(2) + '' + d.unit);

    var width = text.node().getBBox().width;
    var height = text.node().getBBox().height;

    measure.select('.' + LineMeasure.classes().selfRectSvgClass)
      .attr('x', d => (d.x2 + d.x1 - width - 10) / 2)
      .attr('y', d => (d.y2 + d.y1 - height - 10) / 2)
      .attr('width', width + 10)
      .attr('height', height + 10);

    measure.select('.' + LineMeasure.classes().selfStartVertexClass)
      .attr('x', d => d.x1-5)
      .attr('y', d => d.y1-5);

    measure.select('.' + LineMeasure.classes().selfEndVertexClass)
      .attr('x', d => d.x2-5)
      .attr('y', d => d.y2-5);

    measure.select('.' + LineMeasure.classes().selfSaveClass)
      .attr('x', d => (d.x2 + d.x1 - width + 10) / 2 + width)
      .attr('y', d => (d.y2 + d.y1 - height - 10) / 2);
  }

  static stopEvent(d) {
    if(d3.event.preventDefault) {
      d3.event.preventDefault();
    }
    else {
      d3.event.returnValue = false;
    }

    if(d3.event.stopPropagation) {
      d3.event.stopPropagation();
    }

    return false;
  }

  static dragStartVertexDrag(d) {
    d3.event.sourceEvent.preventDefault();
    d3.event.sourceEvent.stopPropagation();
    d.x1 = d3.event.dx + d.x1;
    d.y1 = d3.event.dy + d.y1;
    d3.select('#MEASURE-' + d.uid).datum(d).selectAll('*').datum(d);
    LineMeasure.updateLineDisplay(d.uid);
    return false;
  }

  static dragEndVertexDrag(d) {
    d3.event.sourceEvent.preventDefault();
    d3.event.sourceEvent.stopPropagation();
    d.x2 = d3.event.dx + d.x2;
    d.y2 = d3.event.dy + d.y2;
    d3.select('#MEASURE-' + d.uid).datum(d).selectAll('*').datum(d);
    LineMeasure.updateLineDisplay(d.uid);
    return false;
  }

  setLineEndPosition(self) {
    var coords = d3.mouse(this);

    var measure = d3.select('#MEASURE-' + self.state.uuid);
    var lineData = measure.datum();
    lineData.x2 = coords[0];
    lineData.y2 = coords[1];
    measure.datum(lineData);
    measure.selectAll('*').datum(lineData);

    LineMeasure.updateLineDisplay(lineData.uid);
  }

  removeMouseMoveListener() {
    d3.select('.' + Classes.ROOT_CLASS).on("mousemove", null);
  }

  static calculateMeasuredLength(d) {
    var yMax = Math.max(d.y1, d.y2);
    var yMin = Math.min(d.y1, d.y2);
    var xMax = Math.max(d.x1, d.x2);
    var xMin = Math.min(d.x1, d.x2);
    if(d.mmPerPixel) {
      return Math.sqrt(Math.pow(yMax - yMin, 2) + Math.pow(xMax - xMin, 2)) * d.mmPerPixel;
    }
    else {
      return Math.sqrt(Math.pow(yMax - yMin, 2) + Math.pow(xMax - xMin, 2));
    }
  }

  setScale(scale) {
    if(scale) {
      d3.selectAll('.' + LineMeasure.classes().selfGroupSvgClass).selectAll('*').each(function (d) {
        //console.log('setting scale for ' + JSON.stringify(d));
        d.mmPerPixel = scale;
        d.unit = 'mm';
        LineMeasure.updateLineDisplay(d.uid);
      });
    }
    else {
      d3.selectAll('.' + LineMeasure.classes().selfGroupSvgClass).selectAll('*').each(function (d) {
        //console.log('setting scale for ' + JSON.stringify(d));
        d.mmPerPixel = null;
        d.unit = 'px';
        LineMeasure.updateLineDisplay(d.uid);
      });
    }
    this.setState({mmPerPixel: scale});
  }

  componentDidMount() {
    ToolActions.registerTool(ToolConf.lineMeasure.uid, this.click, this);
    $(this.refs.button.getDOMNode()).popup();
  }

  componentDidUpdate(prevProps, prevState) {
    if(this.state.clicks != prevState.clicks) {
      switch(this.state.clicks) {
        case 0:
          break;
        case 1:
          this.createActiveMeasure();
          break;
        case 2:
          this.makeActiveMeasurePassive();
          this.setState({uuid: null, clicks: 0, start: null, end: null});
          break;
        default:
          console.error('Invalid click count');
      }
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
      <button ref='button'
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