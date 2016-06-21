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

import markerSvg from '../../images/poi.svg';

class CreatePoI extends AbstractTool {
  constructor(props) {
    super(props);
    this.vertexClass = "CREATE_POI_VERTEX";

    this.state = this.initialState();

    this._onViewPropertiesUpdate = () => {
      const viewPropsUpdate = () => d3.select('.' + this.vertexClass).attr('transform', 'translate(' + this.state.x + ',' + this.state.y + ')scale(' + this.props.viewstore.getViewProperties().sizeOfTextAndObjects + ')');
      return viewPropsUpdate.apply(this);
    };

    this._onViewChange = () => {
      const adaptPoIScale = () => this.drawPointInSVG();
      return adaptPoIScale.apply(this);
    }
  }

  initialState() {
    return {
      imageUri: null,
      imageLinkUri: null,
      active: false,
      x: null,
      y: null,
      displayX: null,
      displayY: null,
      name: ''
    };
  }

  /**
   * INHERITED API
   */
  canSave() {
    return true;
  }

  setMode() {
    ToolActions.setTool(ToolConf.newPointOfInterest.id);
  }

  save() {
    var data = {};
    data.serviceUrl = conf.actions.imageServiceActions.createPointOfInterest;
    data.parent = this.state.imageUri;
    data.payload = {};
    data.payload.x = this.state.x;
    data.payload.y = this.state.y;
    data.payload.name = this.state.name;

    return data;
  }

  begin() {
    var popup = <Popup vertexClass={this.vertexClass}
                       setNameCallback={this.setName.bind(this)}
    />;
    window.setTimeout(ToolActions.updateTooltipData.bind(null, ToolConf.newPointOfInterest.tooltip), 10);
    window.setTimeout(ToolActions.activeToolPopupUpdate.bind(null, popup), 10);

    var self = this;
    d3.selectAll('.' + Classes.CHILD_GROUP_CLASS)
      .on('click', function(d, i) {
        if(d3.event.defaultPrevented) return;
        if(d3.event.button == 0) {
          d3.event.preventDefault();
          d3.event.stopPropagation();
          self.leftClick.call(this, self, d);
        }
      })
      .on('contextmenu', function(d, i) {
        if(d3.event.defaultPrevented) return;
        d3.event.preventDefault();
        d3.event.stopPropagation();
        self.rightClick.call(this, self, d);
      })
      .style('cursor', 'crosshair');

    this.props.viewstore.addViewportListener(this._onViewChange);

    this.setState({active: true});
  }

  reset() {
    window.setTimeout(ToolActions.updateTooltipData.bind(null, ToolConf.newPointOfInterest.tooltip), 10);
    this.clearSVG();
    this.setState({x: null, y: null, displayX: null, displayY: null, imageUri: null, imageLinkUri: null, name: ''});
  }

  finish() {
    window.setTimeout(ToolActions.activeToolPopupUpdate, 10);
    window.setTimeout(ToolActions.updateTooltipData.bind(null, ""), 10);
    this.clearSVG();

    this.props.viewstore.removeViewportListener(this._onViewChange);

    d3.selectAll('.' + Classes.CHILD_GROUP_CLASS)
      .on('click', null)
      .on('contextmenu', null)
      .style('cursor', 'default');

    this.setState(this.initialState());
  }

  /**
   * INTERNAL METHODS
   */
  leftClick(self, d) {
    var coords = d3.mouse(this);
    self.setState({imageUri: d.entity, imageLinkUri: d.link});
    self.setPointCoordinates.call(self, coords[0], coords[1], d);
  }

  rightClick(self, d) {

  }

  setPointCoordinates(x, y, data) {
    if(x >= 0 && y >= 0 && x <= data.width && y <= data.height ) {
      this.setState({x: x, y: y});
    }
    else {
      window.setTimeout(function() {
          ToolActions.updateTooltipData("Le point doit se situer à l'intérieur de l'image active");},
        50);
    }
  }

  drawPointInSVG() {
    var vertex = d3.select("." + this.vertexClass);
    if(vertex.empty()) {

      var toolDisplayGroup = d3.select('#OVER-' + this.state.imageLinkUri);

      vertex = toolDisplayGroup
        .append('g')
        .attr("class", this.vertexClass);

      vertex.append("svg:title");

      //vertex.append('rect')
      //  .attr('rx', 5)
      //  .attr('ry', 5)
      //  .attr('width', 50)
      //  .attr('height', 30);

      vertex.append('svg:image')
        .attr("height", 100)
        .attr("width", 60)
        .attr('xlink:href', markerSvg);
    }

    var view = this.props.viewstore.getView();
    var viewProps = this.props.viewstore.getViewProperties();

    vertex
      .attr('transform', 'translate(' + this.state.x + ',' + this.state.y + ')scale(' + viewProps.sizeOfTextAndObjects/view.scale + ')');

    //vertex
    //  .select('rect')
    //  .attr("x", -25)
    //  .attr("y", -55);

    vertex.select('image')
      .attr("x", -30)
      .attr("y", -100);

    vertex.select('title').text(this.state.name);
  }

  setName(name) {
    //console.log("set data " + text + " " + letters);
    this.setState({name: name});
  }

  clearSVG() {
    d3.select("." + this.vertexClass).remove();
  }

  /**
   * REACT API
   */
  componentDidMount() {
    this.props.viewstore.addViewPropertiesUpdateListener(this._onViewPropertiesUpdate);
    ToolActions.registerTool(ToolConf.newPointOfInterest.id, this.click, this);
    $(this.refs.button.getDOMNode()).popup();
  }

  componentDidUpdate() {
    if(this.state.x) {
      this.drawPointInSVG();
      if(this.state.name)
      {
        d3.select('.' + this.props.vertexClass).select('title').text(this.state.name);
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
