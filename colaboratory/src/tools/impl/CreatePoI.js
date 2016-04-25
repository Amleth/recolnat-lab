/**
 * Created by hector on 31/07/15.
 */

'use strict';

import React from "react";
import d3 from "d3";

import AbstractTool from "../AbstractTool";

import EditorActions from "../../actions/ManagerActions";
import ToolActions from '../../actions/ToolActions';

import Classes from "../../constants/CommonSVGClasses";

import Popup from "../popups/CreatePoIPopup";

import conf from "../../conf/ApplicationConfiguration";
import ToolConf from "../../conf/Tools-conf";

class CreatePoI extends AbstractTool {
  constructor(props) {
    super(props);
    this.vertexClass = "CREATE_POI_VERTEX";

    this.base64Images = {};
    this.base64Images.flag = require("../../images/flag.png");

    this.drag = d3.behavior.drag()
      .origin(d => d)
      .on('dragstart', this.dragstarted)
      .on('drag', this.dragged)
      .on('dragend', this.dragended);

    this.state = this.initialState();

    this._onViewPropertiesUpdate = () => {
      const viewPropsUpdate = () => d3.select('.' + this.vertexClass).attr('transform', 'translate(' + this.state.x + ',' + this.state.y + ')scale(' + this.props.viewstore.getViewProperties().sizeOfTextAndObjects + ')');
      return viewPropsUpdate.apply(this);
    }
  }

  initialState() {
    return {
      active: false,
      x: null,
      y: null,
      displayX: null,
      displayY: null,
      color: {color: {
        red: 0,
        green: 0,
        blue: 0
      },
        key: '0'},
      text: "",
      letters: ""
    };
  }

  /**
   * INHERITED API
   */
  click(self, x, y, data) {
    // In state, x and y must reflect the position from the top left of the image, everything else must be calculated.
    console.error('not implemented');
    return;
    var deltaX = this.props.getSelectedImage().x;
    var deltaY = this.props.getSelectedImage().y;
    var view = this.props.viewstore.getView();
    var displayX = (x-view.left)/view.scale;
    var displayY = (y-view.top)/view.scale;
    var imgX = displayX-deltaX;
    var imgY = displayY-deltaY;

    if(imgX >= 0 && imgY >= 0 && imgX <= this.props.getSelectedImage().width && imgY <= this.props.getSelectedImage().height ) {
      this.setState({x: imgX, y: imgY, displayX: displayX, displayY: displayY});
    }
    else {
      window.setTimeout(function() {
          ToolActions.updateTooltipData("Le point doit se situer à l'intérieur de l'image active");},
        50);
    }
  }

  canSave() {
    return true;
  }

  setMode() {
    ToolActions.setTool(ToolConf.newPointOfInterest.uid);
  }

  save() {
    var data = {};
    data.serviceUrl = conf.actions.imageEditorServiceActions.createPointOfInterest;
    data.payload = {};
    data.payload.x = this.state.x;
    data.payload.y = this.state.y;
    data.payload.color = d3.select("." + this.vertexClass).attr("color");
    data.payload.text = this.state.text;
    data.payload.letters = this.state.letters;

    //console.log(JSON.stringify(data));
    return data;
  }

  begin() {
    console.error('not implemented');
    return;
    window.setTimeout(function() {
        ToolActions.activeToolPopupUpdate(null);
        ToolActions.updateTooltipData(ToolConf.newPointOfInterest.tooltip);},
      50);
    this.userPickShapeAndColor();
    d3.select('#GROUP-' + this.props.getSelectedImage().uid).style('cursor', 'crosshair');
    //d3.select('svg').style('cursor', 'crosshair');
    this.setState({active: true});
  }

  reset() {
    window.setTimeout(function() {
        //ToolActions.activeToolPopupUpdate(null);
        ToolActions.updateTooltipData(ToolConf.newPointOfInterest.tooltip);},
      10);
    this.clearSVG();
    this.setState({x: null, y: null, displayX: null, displayY: null});
  }

  finish() {
    window.setTimeout(function() {
        ToolActions.activeToolPopupUpdate(null);
        ToolActions.updateTooltipData("");},
      10);
    this.clearSVG();
    d3.select('svg').style('cursor', 'default');
    this.setState(this.initialState());
  }

  /**
   * INTERNAL METHODS
   */
  addPointToSVG() {
    console.error('not implemented');
    return;
    var active = this.props.getSelectedEntity();

    var vertex = d3.select("." + this.vertexClass);
    if(vertex.empty()) {

      var toolDisplayGroup = d3.select('#OVER-' + active.uid);

      vertex = toolDisplayGroup
        .append('g')
        .attr("class", this.vertexClass);

      vertex.append("svg:title");

      vertex.append('rect')
        .attr('rx', 5)
        .attr('ry', 5)
        .attr('width', 50)
        .attr('height', 30);

      vertex.append('svg:image')
        .attr("height", 60)
        .attr("width", 60)
        .attr('xlink:href', require('../../images/marker.svg'));

      vertex.append('text');
    }

    vertex.
      attr('transform', 'translate(' + this.state.x + ',' + this.state.y + ')scale(' + this.props.viewstore.getViewProperties().sizeOfTextAndObjects + ')');

    vertex
      .select('rect')
      .attr("x", -25)
      .attr("y", -55)
      .attr('fill', "rgb(" + this.state.color.color.red + "," + this.state.color.color.green + "," + this.state.color.color.blue + ")");

    vertex.select('image')
      .attr("x", -30)
      .attr("y", -60);

    vertex.select('text')
      .attr('x', -20)
      .attr('y', -30)
      .attr('font-size', '20px')
      .attr('font-family', 'sans-serif')
      .attr('fill', "rgb(" + (255-this.state.color.color.red) + "," + (255-this.state.color.color.green) + "," + (255-this.state.color.color.blue) + ")")
      .text(this.state.letters);
      
      vertex.select('title').text(this.state.text);

    vertex
      .attr("color", "[" + this.state.color.color.red + "," + this.state.color.color.green + "," + this.state.color.color.blue + "]");
  }

  setData(text, letters) {
    //console.log("set data " + text + " " + letters);
    this.setState({letters: letters, text: text});
  }

  setColor(color) {
    //console.log("set color " + JSON.stringify(color));
    this.setState({color: color});
  }

  userPickShapeAndColor() {
    // List of shapes and colors in a popup box
    // Create new box
    var popup = <Popup vertexClass={this.vertexClass}
                       setColorCallback={this.setColor.bind(this)}
                       setDataCallback={this.setData.bind(this)}
      />;

    window.setTimeout(function() {
        ToolActions.activeToolPopupUpdate(popup);},
      100);
  }

  clearSVG() {
    d3.select("." + this.vertexClass).remove();
  }

  dragstarted() {
    d3.event.sourceEvent.stopPropagation();
    if(d3.event.sourceEvent.which == 3) {
      d3.select(this.parentNode)
        .classed('dragging', true);
    }
  }

  dragged(d) {
    if(d3.select(this.parentNode).classed('dragging') == true) {
      var group = d3.select(this.parentNode);
      group.attr('x', d.x = d3.event.x)
        .attr('y', d.y = d3.event.y);
    }
  }

  dragended(d) {
    if(d3.event.sourceEvent.which == 3) {
      d3.select(this.parentNode).classed('dragging', false);
    }
  }

  /**
   * REACT API
   */
  componentDidMount() {
    this.props.viewstore.addViewPropertiesUpdateListener(this._onViewPropertiesUpdate);
    ToolActions.registerTool(ToolConf.newPointOfInterest.uid, this.click, this);
    $(this.refs.button.getDOMNode()).popup();
  }

  componentDidUpdate() {
    if(this.state.x) {
      this.addPointToSVG();
      if(this.state.text)
      {
      d3.select('.' + this.props.vertexClass).select('title').text(this.state.text);
      }
      if(this.state.letters) {
      d3.select('.' + this.props.vertexClass).select('text').text(this.state.letters);
      }
    }
    else {
      this.clearSVG();
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
    this.finish();
    this.props.viewstore.removeViewPropertiesUpdateListener(this._onViewPropertiesUpdate);
  }

  render() {
    return (
      <button className='ui button compact'
              ref='button'
              onClick={this.setMode}
              style={this.buttonStyle}
              data-content="Marquer un point remarquable de l'image sélectionnée">
        <i className='ui large marker icon'></i>
      </button>
    );
  }

}

export default CreatePoI;