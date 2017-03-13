/**
 * Implementation of AbstractTool to measure lines. Works exactly as a ToI (down to database type) but does not allow to create 'broken' lines.
 */
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

import Globals from '../../utils/Globals';

import icon from '../../images/measure.svg';

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
      scale: null,
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
      selfEndVertexClass: "LINE_MEASURE_RECT_END_CLASS"
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

    let useScaleId = null;
    for(let i = 0; i < scaleIds.length; ++i) {
      //console.log(JSON.stringify(this.props.benchstore.getData(scaleIds[i])));
      let scale = this.props.metastore.getMetadataAbout(scaleIds[i]);
      if(scale) {
        scales[scaleIds[i]] = {
          name: scale.name,
          uid: scale.uid,
          mmPerPixel: scale.mmPerPixel
        };
        useScaleId = scale.uid;
      }
    }

    let lineData = {
      x1: x,
      y1: y,
      x2: x,
      y2: y,
      id: uuid,
      image: data.entity,
      link: data.link,
      scales: scales,
      scale: useScaleId? useScaleId : exifMmPerPx?'exif':null,
      unit: useScaleId || exifMmPerPx ? 'mm' : 'px',
      date: new Date(),
      mmPerPixel: useScaleId? scales[useScaleId].mmPerPixel: exifMmPerPx ? exifMmPerPx : null
    };

    // if(this.state.scale) {
    //   if(scales[this.state.scale]) {
    //     lineData.mmPerPixel = scales[this.state.scale].mmPerPixel;
    //     lineData.unit = 'mm';
    //   } else {
    //     this.setState({scale: useScaleId});
    //   }
    // }else {
    //   this.setState({scale: useScaleId});
    // }

    let view = this.props.viewstore.getView();

    let newMeasure = activeToolGroup.append('g')
      .datum(lineData)
      .attr('id', d => 'MEASURE-' + d.id)
      .attr('class', LineMeasure.classes().selfGroupSvgClass);

    newMeasure
      .append('line')
      .datum(lineData)
      .attr('class', LineMeasure.classes().selfSvgClass)
      .attr('stroke-width', 2/view.scale)
      .attr('stroke', 'white')
      .style('pointer-events', 'none');

    newMeasure
      .append('line')
      .datum(lineData)
      .attr('class', LineMeasure.classes().selfDashSvgClass)
      .attr('stroke-width', 2/view.scale)
      .attr('stroke-dasharray', 5/view.scale + ',' + 5/view.scale)
      .attr('stroke', 'black')
      .style('pointer-events', 'none');

    let group = newMeasure.append('g')
      .datum(lineData)
      .attr('class', LineMeasure.classes().selfDataContainerClass);

    group
      .append('text')
      .datum(lineData)
      .attr('class', LineMeasure.classes().selfTextSvgClass)
      .attr('text-anchor', 'middle')
      .attr('stroke-width', 1/(4*view.scale) + 'px')
      .attr('font-size', 20/view.scale + 'px')
      .attr('stroke', 'black')
      .attr('fill', 'white')
      .style('filter', 'url(#drop-shadow)')
      .style('pointer-events', 'none');

    LineMeasure.updateLineDisplay(lineData.id);

    let self = this;
    d3.select('#GROUP-' + data.link)
      .on("mousemove", function(d, i) {
        self.setLineEndPosition.call(this, self)
      });

    window.setTimeout(ToolActions.updateToolData.bind(null, null), 10);
  }

  makeActiveMeasurePassive(x, y, data) {
    let view = this.props.viewstore.getView();
    // Grab active measure
    let activeToolGroup = d3.select('#MEASURE-' + this.state.uuid);
    let self = this;
    let lineData = activeToolGroup.datum();
    // Remove mousemove listener
    d3.select('#GROUP' + this.state.imageLinkUri)
      .on("mousemove", null);
    // Create point (circle) at both ends with drag listeners
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

    LineMeasure.updateLineDisplay(this.state.uuid);

    // window.setTimeout(ToolActions.updateToolData.bind(null, null), 10);
  }

  removeSVG() {
    d3.selectAll('.' + LineMeasure.classes().selfGroupSvgClass).remove();
  }

  begin() {
    let popup = <Popup
      userstore={this.props.userstore}
      toolstore={this.props.toolstore}
      metastore={this.props.metastore}
      viewstore={this.props.viewstore}
      setScaleCallback={this.setScale.bind(this)}/>;
    window.setTimeout(ToolActions.activeToolPopupUpdate.bind(null, popup), 10);

    window.setTimeout(ToolActions.updateTooltipData.bind(null, this.props.userstore.getText('lineMeasureTooltip')), 10);
    window.setTimeout(ViewActions.updateDisplayFilters.bind(null, {trails: true}), 10);

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

    this.setState({active: true});
  }

  reset() {
    this.removeMouseMoveListener();
    this.removeSVG();
    window.setTimeout(ToolActions.updateTooltipData.bind(null, this.props.userstore.getText('lineMeasureTooltip')), 10);
    this.setState({start: null, end: null,
      imageUri: null, imageLinkUri: null, uuid: null});

    window.setTimeout(ToolActions.updateToolData.bind(null, null), 10);
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
    window.setTimeout(ToolActions.updateToolData.bind(null, null), 10);
    this.setState(this.initialState());
  }

  click(self, x, y) {
    // This is no longer necessary
  }

  setMode() {
    ToolActions.setTool(ToolConf.lineMeasure.id);
  }

  startLine(x, y, data) {
    let uuid = UUID.v4();
    window.setTimeout(ToolActions.updateTooltipData.bind(null, this.props.userstore.getText('lineMeasureTooltip1')), 10);
    this.createActiveMeasure(x, y, uuid, data);
    this.setState({
      //  start: {x: x, y: y},
      uuid: uuid,
      imageLinkUri: data.link,
      imageUri: data.entity
    });
    window.setTimeout(ToolActions.updateToolData.bind(null, null), 10);
  }

  endLine(x, y, data) {
    this.removeMouseMoveListener();
    this.makeActiveMeasurePassive(x, y, data);

    // window.setTimeout(ToolActions.updateToolData.bind(null, null), 10);

    window.setTimeout(ToolActions.updateTooltipData.bind(null, this.props.userstore.getText('lineMeasureTooltip')), 10);
    this.setState({start: null, end: null,
      imageUri: null, imageLinkUri: null, uuid: null});
  }

  leftClick(self, d) {
    if(!self.state.imageLinkUri) {
      let coords = d3.mouse(this);
      self.startLine.call(self, coords[0], coords[1], d);
    }
    else if(self.state.imageLinkUri == d.link) {
      let coords = d3.mouse(this);
      self.endLine.call(self, coords[0], coords[1], d);
    }
    else {
      ToolActions.updateTooltipData(self.props.userstore.getText('lineMeasureTooltip2'));
    }
  }

  rightClick(self, d) {
    self.reset.call(self);
  }

  canSave() {
    return false;
  }

  save(d) {
    // The save action is called from/by the popup in the current ergonomy.
  }

  static updateLineDisplay(id) {
    //console.log("updating " + id);
    let measure = d3.select('#MEASURE-' + id);

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

    // var text = measure.select('.' + LineMeasure.classes().selfTextSvgClass)
    //   .attr('x', d => (d.x2 + d.x1) / 2)
    //   .attr('y', d => (d.y2 + d.y1) / 2)
    //   .text(d => LineMeasure.calculateMeasuredLength(d).toFixed(2) + '' + d.unit);

    // var width = text.node().getBBox().width;
    // var height = text.node().getBBox().height;

    measure.select('.' + LineMeasure.classes().selfStartVertexClass)
      .attr('cx', d => d.x1)
      .attr('cy', d => d.y1);

    measure.select('.' + LineMeasure.classes().selfEndVertexClass)
      .attr('cx', d => d.x2)
      .attr('cy', d => d.y2);

    window.setTimeout(ToolActions.updateToolData.bind(null, null), 10);
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
    let coords = d3.mouse(this);

    let measure = d3.select('#MEASURE-' + self.state.uuid);
    let lineData = measure.datum();
    lineData.x2 = coords[0];
    lineData.y2 = coords[1];
    measure.datum(lineData);
    measure.selectAll('*').datum(lineData);

    LineMeasure.updateLineDisplay(lineData.id);

    window.setTimeout(ToolActions.updateToolData.bind(null, null), 10);
  }

  removeMouseMoveListener() {
    d3.select('#GROUP-' + this.state.imageLinkUri).on("mousemove", null);
  }

  static calculateMeasuredLength(d) {
    let yMax = Math.max(d.y1, d.y2);
    let yMin = Math.min(d.y1, d.y2);
    let xMax = Math.max(d.x1, d.x2);
    let xMin = Math.min(d.x1, d.x2);
    if(d.mmPerPixel) {
      return Math.sqrt(Math.pow(yMax - yMin, 2) + Math.pow(xMax - xMin, 2)) * d.mmPerPixel;
    }
    else {
      return Math.sqrt(Math.pow(yMax - yMin, 2) + Math.pow(xMax - xMin, 2));
    }
  }

  setScale(scaleId) {
    d3.selectAll('.' + LineMeasure.classes().selfGroupSvgClass).each(function(d) {
      LineMeasure.updateLineDisplay(d.id);
    });
    this.setState({scale: scaleId});
  }

  componentDidMount() {
    super.componentDidMount();
    this.props.viewstore.addViewportListener(this._onZoom);
    window.setTimeout(ToolActions.registerTool.bind(null, ToolConf.lineMeasure.id, this.click, this), 10);
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
    this.props.viewstore.removeViewportListener(this._onZoom);
    window.setTimeout(ToolActions.activeToolPopupUpdate, 10);
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
