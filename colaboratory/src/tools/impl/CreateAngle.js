/**
 * Created by dmitri on 08/07/16.
 */
'use strict';

import React from 'react';
import d3 from 'd3';

import AbstractTool from '../AbstractTool';

import ToolActions from '../../actions/ToolActions';

import Classes from "../../constants/CommonSVGClasses";

import Popup from '../popups/CreateAnglePopup';

import ToolConf from '../../conf/Tools-conf';

import ServiceMethods from '../../utils/ServiceMethods';
import Globals from '../../utils/Globals';

import icon from '../../images/protractor.svg';

class CreateAngle extends AbstractTool {
  constructor(props) {
    super(props);

    this.state = CreateAngle.initialState();
    var self = this;

    this.dragCenter = d3.behavior.drag()
      .origin(d => d)
      .on('dragstart', this.vertexDragStart)
      .on("drag", this.vertexDragged)
      .on("dragend", function(d, i) {
        //d3.select(this).classed('dragging', false);
        self.setPosition.call(self, 'center', d, d3.mouse(d3.select('#IMAGE-' + d.link).node()));
      });
    this.dragVertex1 = d3.behavior.drag()
      .origin(d => d)
      .on('dragstart', this.vertexDragStart)
      .on("drag", this.vertexDragged)
      .on("dragend", function(d, i) {
        //d3.select(this).classed('dragging', false);
        self.setPosition.call(self, 'vertex1', d, d3.mouse(d3.select('#IMAGE-' + d.link).node()));
      });
    this.dragVertex2 = d3.behavior.drag()
      .origin(d => d)
      .on('dragstart', this.vertexDragStart)
      .on("drag", this.vertexDragged)
      .on("dragend", function(d, i) {
        //d3.select(this).classed('dragging', false);
        self.setPosition.call(self, 'vertex2', d, d3.mouse(d3.select('#IMAGE-' + d.link).node()));
      });

    this._onViewChange = () => {
      const adaptZoom = () => this.adaptElementSizeToZoom(this.props.viewstore.getView());
      return adaptZoom.apply(this);
    };
  }

  static svgClasses() {
    return {
      container: 'angleMeasureContainer',
      vertex: 'angleMeasureVertex',
      whiteDashedLine: 'angleMeasureWhiteDashedLine',
      blackLine: 'angleMeasureBlackLine'
      //center: 'angleMeasureCenterVertex',
      //vertex1: 'angleMeasureFirstVertex',
      //vertex2: 'angleMeasureSecondVertex',
      //baseLine: 'angleMeasureBaseLine',
      //rotationLine: 'angleMeasureRotationLine'
    };
  }

  static initialState() {
    return {
      active: false,
      interactionState: 0,
      name: '',
      center: null,
      vertex1: null,
      vertex2: null,
      imageLinkId: null,
      imageId: null
    };
  }

  canSave() {
    return this.state.interactionState === 3;
  }

  save() {
    if(this.state.interactionState !== 3) {
      alert(this.props.userstore.getText('angleNotFinished'));
      return null;
    }
    if(this.state.name.length < 1) {
      alert(this.props.userstore.getText('nameMandatory'));
      return null;
    }

    let vertices = [
      [this.state.vertex1.x, this.state.vertex1.y],
      [this.state.center.x, this.state.center.y],
      [this.state.vertex2.x, this.state.vertex2.y]
    ];
    let measure = this.getAngleInDegrees();
    let name = this.state.name;

    ServiceMethods.createAngleOfInterest(this.state.imageId, measure, vertices, name, Globals.setSavedEntityInInspector);

    this.reset();
  }

  begin() {
    var self = this;
    window.setTimeout(ToolActions.activeToolPopupUpdate.bind(null, null), 10);
    window.setTimeout(ToolActions.updateTooltipData.bind(null, <p>{this.props.userstore.getInterpolatedText('stageX', [1, 4])}<br />{this.props.userstore.getText('newAngleTooltip')}</p>), 10);

    d3.select('.' + Classes.ROOT_CLASS)
      .on('mouseenter', this.activateEnter)
      .on('mouseleave', this.deactivateEnter);

    var popup = <Popup setDataCallback={this.setData.bind(this)}
                       userstore={this.props.userstore}
                       toolstore={this.props.toolstore} key='CREATE-ANGLE-POPUP'/>;
    window.setTimeout(ToolActions.activeToolPopupUpdate.bind(null, popup), 10);

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

    this.props.viewstore.addViewportListener(this._onViewChange);

    this.setState({
      active: true,
      name: '',
      center: null,
      vertex1: null,
      vertex2: null,
      interactionState: 0,
      imageLinkId: null,
      imageId: null
    });
  }

  reset() {
    this.clearSVG();

    this.setState({
      center: null,
      vertex1: null,
      vertex2: null,
      name: '',
      interactionState: 0,
      imageLinkId: null,
      imageId: null
    });

    let popup = <Popup setDataCallback={this.setData.bind(this)}
                       userstore={this.props.userstore}
                       toolstore={this.props.toolstore} key='CREATE-ANGLE-POPUP'/>;
    window.setTimeout(ToolActions.activeToolPopupUpdate.bind(null, popup), 10);

    window.setTimeout(ToolActions.updateTooltipData.bind(null, <p>{this.props.userstore.getInterpolatedText('stageX', [1, 4])}<br />{this.props.userstore.getText('newAngleTooltip')}</p>), 10);
  }

  finish() {
    this.clearSVG();
    window.setTimeout(ToolActions.activeToolPopupUpdate.bind(null, null), 10);
    window.setTimeout(ToolActions.updateTooltipData.bind(null, ""), 10);

    d3.select('.' + Classes.ROOT_CLASS)
      .on('mouseenter', null)
      .on('mouseleave', null);

    d3.selectAll('.' + Classes.IMAGE_CLASS)
      .style('cursor', 'default')
      .on('contextmenu', null)
      .on('click', null);

    this.props.viewstore.removeViewportListener(this._onViewChange);

    this.setState(CreateAngle.initialState());
  }

  setMode(){
    ToolActions.setTool(ToolConf.newAngle.id);
  }

  setData(name) {
    this.setState({name: name});
  }

  adaptElementSizeToZoom(view) {
    var tool = d3.select('.' + CreateAngle.svgClasses().container);

    tool.selectAll('.' + CreateAngle.svgClasses().vertex)
      .attr('r', 6/view.scale)
      .attr('stroke-width', 3/view.scale);

    tool.selectAll('.' + CreateAngle.svgClasses().whiteDashedLine)
      .attr('stroke-width', 4/view.scale)
      .attr('stroke-dasharray', 8/view.scale + ',' + 8/view.scale);

    tool.selectAll('.' + CreateAngle.svgClasses().blackLine)
      .attr('stroke-width', 4/view.scale);
  }

  leftClick(self, d) {
    var coords = d3.mouse(this);
    switch(self.state.interactionState) {
      case 0:
        self.setState(
          {
            imageLinkId: d.link,
            imageId: d.uid,
            interactionState: 1,
            center: {
              x: coords[0],
              y: coords[1]
            },
            vertex1: {
              x: coords[0],
              y: coords[1]
            }
          });
        break;
      case 1:
        self.setState(
          {
            interactionState: 2,
            vertex1: {
              x: coords[0],
              y: coords[1]
            },
            vertex2: {
              x: self.state.center.x,
              y: self.state.center.y
            }
          });
        break;
      case 2:
        self.setState(
          {
            interactionState: 3,
            vertex2: {
              x: coords[0],
              y: coords[1]
            }
          });
        break;
    }
  }

  rightClick(self, d) {

  }

  activateEnter() {
    var self = this;
    d3.select("body").on('keyup', function(d, i) {
      if(d3.event.which == 13) {
        // 'Enter' key
        d3.event.stopPropagation();
        d3.event.preventDefault();
        //self.nextInteractionState.call(this, self);
      }
    });
  }

  deactivateEnter() {
    d3.select("body").on('keyup', null);
    //d3.select("." + Classes.ROOT_CLASS).on('contextmenu', null);
  }

  clearSVG() {
    d3.select('.' + CreateAngle.svgClasses().container).remove();
    d3.select('#IMAGE-' + this.state.imageLinkId)
      .on('mousemove', null);
  }

  // Must be called only on a cleared SVG display, otherwise duplicates will appear.
  drawSVG() {
    var view = this.props.viewstore.getView();
    var overSheetGroup = d3.select('#OVER-' + this.state.imageLinkId);
    var toolDisplayGroup = overSheetGroup
      .append('g')
      .attr('class', CreateAngle.svgClasses().container);
    if(this.state.interactionState > 0) {
      toolDisplayGroup.append('line')
        .attr('class', CreateAngle.svgClasses().blackLine)
        .attr('x1', this.state.center.x)
        .attr('y1', this.state.center.y)
        .attr('x2', this.state.vertex1.x)
        .attr('y2', this.state.vertex1.y)
        .attr('stroke-width', 4/view.scale)
        .attr('stroke', 'black')
        .style('pointer-events', 'none');

      toolDisplayGroup.append('line')
        .attr('class', CreateAngle.svgClasses().whiteDashedLine)
        .attr('x1', this.state.center.x)
        .attr('y1', this.state.center.y)
        .attr('x2', this.state.vertex1.x)
        .attr('y2', this.state.vertex1.y)
        .attr('stroke-width', 4/view.scale)
        .attr('stroke-dasharray', 8/view.scale + ',' + 8/view.scale)
        .attr('stroke', 'white')
        .style('pointer-events', 'none');

      toolDisplayGroup.append('circle')
        .datum({x: this.state.center.x, y: this.state.center.y, link: this.state.imageLinkId})
        .attr('class', CreateAngle.svgClasses().vertex)
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)
        .attr('r', 6/view.scale)
        .attr('stroke-width', 3/view.scale)
        .attr('stroke', 'white')
        .attr('fill', 'black')
        .attr("x", function(d) {return d.x;})
        .attr("y", function(d) {return d.y;})
        .style('cursor', '-webkit-grab')
        .style('cursor', 'grab')
        .call(this.dragCenter);
    }
    if(this.state.interactionState > 1) {
      toolDisplayGroup.append('line')
        .attr('class', CreateAngle.svgClasses().blackLine)
        .attr('x1', this.state.center.x)
        .attr('y1', this.state.center.y)
        .attr('x2', this.state.vertex2.x)
        .attr('y2', this.state.vertex2.y)
        .attr('stroke-width', 4/view.scale)
        .attr('stroke', 'black')
        .style('pointer-events', 'none');

      toolDisplayGroup.append('line')
        .attr('class', CreateAngle.svgClasses().whiteDashedLine)
        .attr('x1', this.state.center.x)
        .attr('y1', this.state.center.y)
        .attr('x2', this.state.vertex2.x)
        .attr('y2', this.state.vertex2.y)
        .attr('stroke-width', 4/view.scale)
        .attr('stroke-dasharray', 8/view.scale + ',' + 8/view.scale)
        .attr('stroke', 'white')
        .style('pointer-events', 'none');

      toolDisplayGroup.append('circle')
        .datum({x: this.state.vertex1.x, y: this.state.vertex1.y, link: this.state.imageLinkId})
        .attr('class', CreateAngle.svgClasses().vertex)
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)
        .attr('r', 6/view.scale)
        .attr('stroke-width', 3/view.scale)
        .attr('stroke', 'white')
        .attr('fill', 'black')
        .attr("x", function(d) {return d.x;})
        .attr("y", function(d) {return d.y;})
        .style('cursor', '-webkit-grab')
        .style('cursor', 'grab')
        .call(this.dragVertex1);
    }
    if(this.state.interactionState > 2) {
      var vertex2 = toolDisplayGroup.append('circle')
        .datum({x: this.state.vertex2.x, y: this.state.vertex2.y, link: this.state.imageLinkId})
        .attr('class', CreateAngle.svgClasses().vertex)
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)
        .attr('r', 6/view.scale)
        .attr('stroke-width', 3/view.scale)
        .attr('stroke', 'white')
        .attr('fill', 'black')
        .attr("x", function(d) {return d.x;})
        .attr("y", function(d) {return d.y;})
        .style('cursor', '-webkit-grab')
        .style('cursor', 'grab')
        .call(this.dragVertex2);
    }

    var self = this;
    // Append mouse move listeners for placing end positions
    switch(this.state.interactionState) {
      case 1:
        d3.select('#IMAGE-' + this.state.imageLinkId)
          .on('mousemove', function(d, i) {
            self.setPosition.call(self, 'vertex1', d, d3.mouse(this));
          });
        break;
      case 2:
        d3.select('#IMAGE-' + this.state.imageLinkId)
          .on('mousemove', function(d, i) {
            self.setPosition.call(self, 'vertex2', d, d3.mouse(this));
          });
        break;
      default:
        break;
    }
  }

  setPosition(varName, d, coords) {
    //console.log('setPosition(' + varName + ',' + JSON.stringify(d) + ',' + JSON.stringify(coords));
    var image = d3.select('#IMAGE-' + d.link);
    var imageData = image.datum();
    var x = this.getBoundedPosition(coords[0], imageData.width, 0);
    var y = this.getBoundedPosition(coords[1], imageData.height, 0);

    this.state[varName].x = x;
    this.state[varName].y = y;

    this.setState(this.state);
  }

  vertexDragStart() {
    if(d3.event.sourceEvent.which == 1) {
      d3.event.sourceEvent.preventDefault();
      d3.event.sourceEvent.stopPropagation();
    }
  }

  getBoundedPosition(pos, max, min) {
    return Math.min(Math.max(pos, min), max);
  }

  vertexDragged(d) {
    //if(d3.select(this).classed('dragging') == true) {
    var image = d3.select('#IMAGE-' + d.link);
    var coords = d3.mouse(image.node());
    var imageData = image.datum();
    var x = this.getBoundedPosition(coords[0], imageData.width, 0);
    var y = this.getBoundedPosition(coords[1], imageData.height, 0);
    var vertex = d3.select(this);

    vertex.attr('cx', x)
      .attr('cy', y);
    //}
  }

  getAngleInDegrees() {
    var angleInRadians = this.getAngleInRadians(this.state.vertex1, this.state.center, this.state.vertex2);
    //return (Math.atan2(this.state.vertex1.x - this.state.center.x, -this.state.vertex1.y + this.state.center.y) - Math.atan2(this.state.vertex2.x - this.state.center.x, -this.state.vertex2.y + this.state.center.y)) * 180 / Math.PI;
    return angleInRadians * 180/Math.PI;
  }

  getAngleInRadians(v1, center, v2) {
    var v1c = Math.sqrt(Math.pow(center.x - v1.x, 2) + Math.pow(center.y - v1.y, 2));
    var cv2 = Math.sqrt(Math.pow(center.x - v2.x, 2) + Math.pow(center.y - v2.y, 2));
    var v1v2 = Math.sqrt(Math.pow(v2.x - v1.x, 2) + Math.pow(v2.y - v1.y, 2));

    return Math.acos((cv2*cv2+v1c*v1c-v1v2*v1v2) / (2*cv2*v1c));
  }

  convertToDMS(angle) {
    return [0|angle, '° ', 0|(angle<0?angle=-angle:angle)%1*60, "' ", 0|angle*60%1*60, '"'].join('');
  }

  componentDidMount() {
    this.props.userstore.addLanguageChangeListener(this.setState.bind(this, {}));
    ToolActions.registerTool(ToolConf.newAngle.id, this.click, this);
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

  componentDidUpdate(prevProps, prevState) {
    if(this.state.active) {
      if (this.state.interactionState > 0) {
        this.clearSVG();
        this.drawSVG();
      }

      switch(this.state.interactionState) {
        case 0:
          window.setTimeout(ToolActions.updateTooltipData.bind(null, <p>{this.props.userstore.getInterpolatedText('stageX', [1, 4])}<br />{this.props.userstore.getText('newAngleTooltip')}</p>), 10);
          break;
        case 1:
          window.setTimeout(ToolActions.updateTooltipData.bind(null, <p>{this.props.userstore.getInterpolatedText('stageX', [2, 4])}<br />{this.props.userstore.getText('newAngleTooltip2')}</p>), 10);
          break;
        case 2:
          window.setTimeout(ToolActions.updateTooltipData.bind(null, <p>{this.props.userstore.getInterpolatedText('stageX', [3, 4])}<br />{this.props.userstore.getText('newAngleTooltip3')}<br />{this.props.userstore.getText('angle')} : {this.convertToDMS(this.getAngleInDegrees())}</p>), 10);
          break;
        case 3:
          window.setTimeout(ToolActions.updateTooltipData.bind(null, <p>{this.props.userstore.getInterpolatedText('stageX', [4, 4])}<br />{this.props.userstore.getText('newAngleTooltip4')}<br />{this.props.userstore.getText('angle')} : {this.convertToDMS(this.getAngleInDegrees())}</p>), 10);
          break;
        default:
          break;
      }
    }
  }

  render() {
    return (
      <button ref='button'
              style={this.buttonStyle}
              className='ui button compact'
              onClick={this.setMode}
              data-content={this.props.userstore.getText('createNewAngle')}>
        <img src={icon} style={this.iconStyle} height='20px' width='40px' />
      </button>
    );
  }
}

export default CreateAngle;
