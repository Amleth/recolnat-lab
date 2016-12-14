'use strict';

import React from 'react';
import d3 from "d3";
import UUID from 'node-uuid';

import Classes from "../../constants/CommonSVGClasses";
import Popup from "../popups/LineMeasurePopup";

import AbstractTool from "../AbstractTool";

import ToolActions from "../../actions/ToolActions";
import ViewActions from '../../actions/ViewActions';
import MetadataActions from '../../actions/MetadataActions';

import ToolConf from "../../conf/Tools-conf";
import conf from '../../conf/ApplicationConfiguration';

import Globals from '../../utils/Globals';
import ServiceMethods from '../../utils/ServiceMethods';

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

    this._onZoom = () => {
      const adaptDisplay = () => this.adaptMeasureDisplaysToZoom(this.props.viewstore.getView());
      return adaptDisplay.apply(this);
    };

    this.popup = null;

    this.state = this.initialState();
  }

  initialState() {
    return {
      active: false,
      imageUri: null,
      imageLinkUri: null,
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
      selfDashSvgClass: "LINE_MEASURE_LINE_DASH_CLASS",
      selfGroupSvgClass: "LINE_MEASURE_GROUP_CLASS",
      selfDataContainerClass: "LINE_MEASURE_GROUP_DATA_CONTAINER_CLASS",
      selfRectSvgClass: "LINE_MEASURE_RECT_TOOL_CLASS",
      selfTextSvgClass: "LINE_MEASURE_TEXT_TOOL_CLASS",
      selfStartVertexClass: "LINE_MEASURE_RECT_START_CLASS",
      selfEndVertexClass: "LINE_MEASURE_RECT_END_CLASS",
      selfSaveClass: 'LINE_MEASURE_SAVE_CLASS'
    };
  }

  adaptMeasureDisplaysToZoom(view) {
    d3.selectAll('.' + LineMeasure.classes().selfSvgClass)
      .attr('stroke-width', 2/view.scale);

    d3.selectAll('.' + LineMeasure.classes().selfDashSvgClass)
      .attr('stroke-width', 2/view.scale)
      .attr('stroke-dasharray', 5/view.scale + ',' + 5/view.scale);

    d3.selectAll('.' + LineMeasure.classes().selfTextSvgClass)
      .attr('stroke-width', 1/(4*view.scale) + 'px')
      //.attr('dy', 0.35/view.scale + 'em')
      .attr('font-size', 20/view.scale + 'px');

    d3.selectAll('.' + LineMeasure.classes().selfStartVertexClass)
      .attr('stroke-width', 3/view.scale)
      .attr('r', 6/view.scale);

    d3.selectAll('.' + LineMeasure.classes().selfEndVertexClass)
      .attr('stroke-width', 3/view.scale)
      .attr('r', 6/view.scale);

    d3.selectAll('.' + LineMeasure.classes().selfSaveClass)
      .attr('height', 30/view.scale)
      .attr('width', 30/view.scale)
      .attr('x', d => (d.x2 + d.x1) / 2 - 20/view.scale)
      .attr('y', d => (d.y2 + d.y1) / 2 + 10/view.scale);
  }

  createActiveMeasure(x, y, uuid, data) {
    let activeToolGroup = d3.select('#OVER-' + data.link);

    let scales = {};
    let imageMetadata = this.props.benchstore.getData(data.entity);
    let scaleIds = JSON.parse(JSON.stringify(imageMetadata.scales));
    let exifMmPerPx = Globals.getEXIFScalingData(imageMetadata);
    if(exifMmPerPx) {
      scales.exif = {
        name: this.props.userstore.getText('exifData'),
        uid: 'exif',
        mmPerPixel: exifMmPerPx
      };
    }
    for(var i = 0; i < scaleIds.length; ++i) {
      //console.log(JSON.stringify(this.props.benchstore.getData(scaleIds[i])));
      scales[scaleIds[i]] = this.props.benchstore.getData(scaleIds[i]);
    }

    var lineData = {
      x1: x,
      y1: y,
      x2: x,
      y2: y,
      id: uuid,
      image: data.entity,
      link: data.link,
      scales: scales,
      unit: exifMmPerPx ? 'mm' : 'px',
      mmPerPixel: exifMmPerPx
    };

    if(this.state.scale) {
      if(scales[this.state.scale]) {
        lineData.mmPerPixel = scales[this.state.scale].mmPerPixel;
        lineData.unit = 'mm';
      }
    }

    var view = this.props.viewstore.getView();

    var newMeasure = activeToolGroup.append('g')
      .datum(lineData)
      .attr('id', d => 'MEASURE-' + d.id)
      .attr('class', LineMeasure.classes().selfGroupSvgClass);

    newMeasure
      .append('line')
      .datum(lineData)
      .attr('class', LineMeasure.classes().selfSvgClass)
      .attr('stroke-width', 2/view.scale)
      .attr('stroke', '#AAAAAA')
      .style('pointer-events', 'none');

    newMeasure
      .append('line')
      .datum(lineData)
      .attr('class', LineMeasure.classes().selfDashSvgClass)
      .attr('stroke-width', 2/view.scale)
      .attr('stroke-dasharray', 5/view.scale + ',' + 5/view.scale)
      .attr('stroke', 'black')
      .style('pointer-events', 'none');

    var group = newMeasure.append('g')
      .datum(lineData)
      .attr('class', LineMeasure.classes().selfDataContainerClass);

    group
      .append('text')
      .datum(lineData)
      .attr('class', LineMeasure.classes().selfTextSvgClass)
      //.attr('dy', 0.35/view.scale + 'em')
      //.attr('dy', '0.35em')
      .attr('text-anchor', 'middle')
      .attr('stroke-width', 1/(4*view.scale) + 'px')
      .attr('font-size', 20/view.scale + 'px')
      .attr('stroke', 'black')
      .attr('fill', 'white')
      .style('filter', 'url(#drop-shadow)')
      .style('pointer-events', 'none');

    LineMeasure.updateLineDisplay(lineData.id);

    var self = this;
    d3.select('#GROUP-' + data.link)
      .on("mousemove", function(d, i) {
        self.setLineEndPosition.call(this, self)
      });
  }

  makeActiveMeasurePassive(x, y, data) {
    var view = this.props.viewstore.getView();
    // Grab active measure
    var activeToolGroup = d3.select('#MEASURE-' + this.state.uuid);
    var self = this;
    var lineData = activeToolGroup.datum();
    // Remove mousemove listener
    d3.select('#GROUP' + this.state.imageLinkUri)
      .on("mousemove", null);
    // Create point (rect) at both ends with drag listeners
    activeToolGroup.append('circle')
      .datum(lineData)
      .attr('class', LineMeasure.classes().selfStartVertexClass)
      .attr('r', 6/view.scale)
      .attr('stroke-width', 3/view.scale)
      .attr('fill', 'black')
      .attr('stroke', 'white')
      .style('cursor', '-webkit-grab')
      .style('cursor', 'grab')
      .on('click', LineMeasure.stopEvent)
      .on('mousedown', LineMeasure.stopEvent)
      .call(this.dragStartVertex);

    activeToolGroup.append('circle')
      .datum(lineData)
      .attr('class', LineMeasure.classes().selfEndVertexClass)
      .attr('r', 6/view.scale)
      .attr('stroke-width', 3/view.scale)
      .attr('fill', 'black')
      .attr('stroke', 'white')
      .style('cursor', '-webkit-grab')
      .style('cursor', 'grab')
      .on('click', LineMeasure.stopEvent)
      .on('mousedown', LineMeasure.stopEvent)
      .call(this.dragEndVertex);

    activeToolGroup.select('.' + LineMeasure.classes().selfDataContainerClass).append('svg:image')
      .datum(lineData)
      .attr('class', LineMeasure.classes().selfSaveClass)
      .attr('xlink:href', saveIcon)
      .attr('height', 30/view.scale)
      .attr('width', 30/view.scale)
      .attr('x', d => (d.x2 + d.x1) / 2 - 20/view.scale)
      .attr('y', d => (d.y2 + d.y1) / 2 + 10/view.scale)
      .style('cursor', 'default')
      .on('click', function(d) { return self.save.call(self, d); });

    LineMeasure.updateLineDisplay(this.state.uuid);
    // Add icon to 'save measure to server'
  }

  removeSVG() {
    d3.selectAll('.' + LineMeasure.classes().selfGroupSvgClass).remove();
  }

  begin() {
    var popup = <Popup
      userstore={this.props.userstore}
      toolstore={this.props.toolstore}
      setScaleCallback={this.setScale.bind(this)}/>;
    window.setTimeout(ToolActions.activeToolPopupUpdate.bind(null, popup), 10);

    window.setTimeout(ToolActions.updateTooltipData.bind(null, this.props.userstore.getText('lineMeasureTooltip')), 10);

    var self = this;
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

    this.setState({active: true});
  }

  reset() {
    this.removeMouseMoveListener();
    // this.removeSVG();
    window.setTimeout(ToolActions.updateTooltipData.bind(null, this.props.userstore.getText('lineMeasureTooltip')), 10);
    this.setState({start: null, end: null,
      imageUri: null, imageLinkUri: null, uuid: null});
  }

  finish() {
    d3.selectAll('.' + Classes.IMAGE_CLASS)
      .style('cursor', 'default')
      .on('click', null)
      .on('contextmenu', null);
    // TODO remove all measures
    this.removeSVG();

    this.removeMouseMoveListener();
    window.setTimeout(ToolActions.updateTooltipData.bind(null, ''), 10);
    window.setTimeout(ToolActions.activeToolPopupUpdate.bind(null, null), 10);
    this.setState(this.initialState());
  }

  click(self, x, y) {
    // This is no longer necessary
  }

  setMode() {
    ToolActions.setTool(ToolConf.lineMeasure.id);
  }

  startLine(x, y, data) {
    var uuid = UUID.v4();
    window.setTimeout(ToolActions.updateTooltipData.bind(null, this.props.userstore.getText('lineMeasureTooltip1')), 10);
    this.createActiveMeasure(x, y, uuid, data);
    this.setState({
      //  start: {x: x, y: y},
      uuid: uuid,
      imageLinkUri: data.link,
      imageUri: data.entity
    });
  }

  endLine(x, y, data) {
    this.removeMouseMoveListener();
    this.makeActiveMeasurePassive(x, y, data);
    //if(this.popup) {
    //  this.popup.updateScales();
    //}
    this.reset();
  }

  leftClick(self, d) {
    if(!self.state.imageLinkUri) {
      var coords = d3.mouse(this);
      self.startLine.call(self, coords[0], coords[1], d);
    }
    else if(self.state.imageLinkUri == d.link) {
      var coords = d3.mouse(this);
      self.endLine.call(self, coords[0], coords[1], d);
    }
    else {
      ToolActions.updateTooltipData(this.props.userstore.getText('lineMeasureTooltip2'));
    }
  }

  rightClick(self, d) {
    self.reset.call(self);
  }

  save(d) {
    if(d3.event.defaultPrevented) return;
    d3.event.preventDefault();
    d3.event.stopPropagation();
    var name = prompt(this.props.userstore.getText('lineMeasureTooltip3'), '');
    if(name.length < 1) {
      alert(this.props.userstore.getText('nameMandatory'));
      return;
    }

    var path = [];
    path.push([d.x1, d.y1]);
    path.push([d.x2, d.y2]);

    var length = Math.sqrt(Math.pow(Math.abs(d.y2) - Math.abs(d.y1), 2) + Math.pow(Math.abs(d.x2) - Math.abs(d.x1), 2));

    ServiceMethods.createTrailOfInterest(d.image, length, path, name, Globals.setSavedEntityInInspector);
  }

  static updateLineDisplay(id) {
    //console.log("updating " + id);
    var measure = d3.select('#MEASURE-' + id);

    measure.selectAll('.' + LineMeasure.classes().selfSvgClass)
      .attr('x1', d => d.x1)
      .attr('y1', d => d.y1)
      .attr('x2', d => d.x2)
      .attr('y2', d => d.y2);

    measure.selectAll('.' + LineMeasure.classes().selfDashSvgClass)
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

    measure.select('.' + LineMeasure.classes().selfStartVertexClass)
      .attr('cx', d => d.x1)
      .attr('cy', d => d.y1);

    measure.select('.' + LineMeasure.classes().selfEndVertexClass)
      .attr('cx', d => d.x2)
      .attr('cy', d => d.y2);

    //measure.select('.' + LineMeasure.classes().selfSaveClass)
    //  .attr('x', d => (d.x2 + d.x1) / 2)
    //  .attr('y', d => (d.y2 + d.y1) / 2 - 10);
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
    d3.select('#MEASURE-' + d.id).datum(d).selectAll('*').datum(d);
    LineMeasure.updateLineDisplay(d.id);
    return false;
  }

  static dragEndVertexDrag(d) {
    d3.event.sourceEvent.preventDefault();
    d3.event.sourceEvent.stopPropagation();
    d.x2 = d3.event.dx + d.x2;
    d.y2 = d3.event.dy + d.y2;
    d3.select('#MEASURE-' + d.id).datum(d).selectAll('*').datum(d);
    LineMeasure.updateLineDisplay(d.id);
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

    LineMeasure.updateLineDisplay(lineData.id);

    var popup = <Popup
      toolstore={self.props.toolstore}
      setScaleCallback={self.setScale.bind(self)}/>;
    //window.setTimeout(function() {
    //  ToolActions.activeToolPopupUpdate(popup);
    //  ToolActions.updateTooltipData(ToolConf.lineMeasure.tooltip);
    //}, 50);
  }

  removeMouseMoveListener() {
    d3.select('#GROUP-' + this.state.imageLinkUri).on("mousemove", null);
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

  setScale(scaleId) {
    if(scaleId) {
      d3.selectAll('.' + LineMeasure.classes().selfGroupSvgClass).selectAll('*').each(function (d) {
        //console.log('setting scale for ' + JSON.stringify(d));
        if(d.scales[scaleId]) {
          d.mmPerPixel = d.scales[scaleId].mmPerPixel;
          d.unit = 'mm';
        }
        else {
          d.mmPerPixel = null;
          d.unit = 'px';
        }
      });
    }
    else {
      d3.selectAll('.' + LineMeasure.classes().selfGroupSvgClass).selectAll('*').each(function (d) {
        //console.log('setting scale for ' + JSON.stringify(d));
        d.mmPerPixel = null;
        d.unit = 'px';
      });
    }
    d3.selectAll('.' + LineMeasure.classes().selfGroupSvgClass).each(function(d) {
      LineMeasure.updateLineDisplay(d.id);
    });
    this.setState({scale: scaleId});
  }

  componentDidMount() {
    this.props.userstore.addLanguageChangeListener(this.setState.bind(this, {}));
    this.props.viewstore.addViewportListener(this._onZoom);
    $(this.refs.button.getDOMNode()).popup();
    ToolActions.registerTool(ToolConf.lineMeasure.id, this.click, this);
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
    this.props.userstore.removeLanguageChangeListener(this.setState.bind(this, {}));
    this.props.viewstore.removeViewportListener(this._onZoom);
    ToolActions.activeToolPopupUpdate(null);
  }

  render() {
    return (
      <button ref='button'
              style={this.buttonStyle}
              className='ui button compact'
              onClick={this.setMode}
              data-content={this.props.userstore.getText('newLineMeasure')}>
        <img src={icon} style={this.iconStyle} height='20px' width='20px' />
      </button>
    );
  }
}

// <i className='ui large wizard icon'></i>

export default LineMeasure;
