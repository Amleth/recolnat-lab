/**
 * Implementation of AbstractTool to create Trails of Interest.
 *
 * Created by dmitri on 10/12/15.
 */
'use strict';

import React from 'react';
import d3 from 'd3';

import AbstractTool from '../AbstractTool';

import ToolActions from '../../actions/ToolActions';
import ViewActions from '../../actions/ViewActions';

import Classes from "../../constants/CommonSVGClasses";

import Globals from '../../utils/Globals';
import ServiceMethods from '../../utils/ServiceMethods';

import Popup from '../popups/CreatePathPopup';

import conf from '../../conf/ApplicationConfiguration';
import ToolConf from "../../conf/Tools-conf";

import icon from '../../images/polyline.png';

class CreatePath extends AbstractTool {
  constructor(props) {
    super(props);

    this.toolContainerSVGClass = "CREATE_PATH_TOOL_CLASS";
    this.activeLineClass = "CREATE_PATH_TOOL_ACTIVE_LINE_CLASS";

    let self = this;

    this.drag = d3.behavior.drag()
      .origin(d => d)
      .on('dragstart', this.vertexDragStart)
      .on("drag", this.vertexDragged)
      .on("dragend", function(d, i) {
        self.vertexDragEnded.call(this, d, self);
      });

    this._onViewChange = () => {
      const adaptDisplayToZoom = () => this.adaptElementSizeToZoom(this.props.viewstore.getView().scale);
      return adaptDisplayToZoom.apply(this);
    };

    this.state = this.initialState();
  }

  initialState() {
    return {
      imageLinkId: null,
      imageUri: null,
      edges: [],
      start: null,
      interactionState: 0,
      active: false,
      name: ''
    };
  }

  /**
   * INHERITED API
   */
  addVertex(x, y, data) {
      if (this.state.interactionState == 0) {
        // Two possibilities:
        // a) We are not currently in the process of creating a new edge
        // b) We are in the process of creating a new edge
        // Consequently the following situations have to be taken into account:
        // aa/ There is no vertex at this location. In this case this is a fully new ROI
        // ab/ There is a vertex at this location. This vertex is part of only one edge, create a new edge starting there.
        // ac/ There is a vertex at this location. The vertex is already part of two edges, no new line can be added. A vertex can only be in up to two edges.
        // ba/ The target is not a vertex. Create a new vertex here and a new edge linking start to end. Continue with a new edge starting at this location.
        // bb/ The target is a vertex. The target vertex is part of one edge. Creating a connecting new edge will
        // close the current path. Close shape, end editing.
        // bc/ The target is a vertex. The target vertex is part of two edges. The connection cannot be made. Do nothing.
        let count = Globals.countEdges(x, y, this.state.edges, 1);
        if (this.state.start == null) {
          // a
          if (count == 0) {
            // aa
            this.setState({edges: [], start: {x: x, y: y}});
          }
          else if (count == 1) {
            // ab
            let vertex = Globals.matchVertex(x, y, this.state.edges, 1);
            this.setState({start: {x: vertex.x, y: vertex.y}});
          }
          else if (count == 2) {
            // ac
            window.setTimeout(ToolActions.updateTooltipData.bind(null, this.props.userstore.getText('newPathCannotStart')), 10);
          }
          else {
            console.error("Whoops. This vertex is in too many edges. How unexpectedly theoretically impossible!");
          }
        }
        else {
          // b
          if (count == 0) {
            // ba
            let edges = this.state.edges;
            edges.push({
              start: {
                x: this.state.start.x,
                y: this.state.start.y
              },
              end: {
                x: x,
                y: y
              }
            });
            this.setState({edges: edges, start: {x: x, y: y}});
          }
          else if (count == 1) {
            // bb
            let vertex = Globals.matchVertex(x, y, this.state.edges, 1);
            let edges = this.state.edges;
            edges.push({
              start: {
                x: this.state.start.x,
                y: this.state.start.y
              },
              end: {
                x: vertex.x,
                y: vertex.y
              }
            });
            this.setState({interactionState: 1, start: null, edges: edges});
          }
          else if (count == 2) {
            // bc
            window.setTimeout(ToolActions.updateTooltipData.bind(null, this.props.userstore.getText('newPathVertexError')), 10);
          }
          else {
            console.error("Whoops. This vertex is in too many edges. How unexpected.");
          }
        }
      }
  }

  canSave() {
    return true;
  }

  save() {
    if(this.state.name.length < 1) {
      alert(this.props.userstore.getText('nameMandatory'));
      return null;
    }
    // Create polyline representation of this path.
    let path = [];
    let length = 0;
    let name = this.state.name;
    let x = null;
    let y = null;
    let edges = this.state.edges;
    while(edges.length > 0) {
      let edge = Globals.getNextEdge(x, y, edges, 5);

      // Check if this vertex is not already part of the previous edge
      if(edge.start.x !== x && edge.start.y !== y) {
        path.push([edge.start.x, edge.start.y]);
      }
      path.push([edge.end.x, edge.end.y]);

      x = edge.end.x;
      y = edge.end.y;

      length += Math.sqrt(Math.pow(Math.abs(edge.end.y) - Math.abs(edge.start.y), 2) + Math.pow(Math.abs(edge.end.x) - Math.abs(edge.start.x), 2));
    }

    ServiceMethods.createTrailOfInterest(this.state.imageUri, length, path, name, Globals.setSavedEntityInInspector);

    window.setTimeout(ToolActions.updateTooltipData.bind(null, this.props.userstore.getText('newPathTooltip')), 10);

    this.setState({
      interactionState: 0,
      edges: [],
      start: null,
      end: null
    });
  }

  begin() {
    window.setTimeout(ToolActions.activeToolPopupUpdate.bind(null, null), 10);
    window.setTimeout(ToolActions.updateTooltipData.bind(null, this.props.userstore.getText('newPathTooltip')), 10);
    window.setTimeout(ViewActions.updateDisplayFilters.bind(null, {trails: true}), 10);

    let self = this;

    // Mount listener for validation of path
    d3.select('.' + Classes.ROOT_CLASS)
      .on('mouseenter', this.activateEnter.bind(self))
      .on('mouseleave', this.deactivateEnter);

    let popup = <Popup userstore={this.props.userstore}
                       setDataCallback={this.setData.bind(this)}
                       toolstore={this.props.toolstore}/>;
    window.setTimeout(ToolActions.activeToolPopupUpdate.bind(null, popup), 10);

    // Mount listeners on all image groups
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

    this.setState({active: true, name: '', imageLinkId: null});

  }

  reset() {
    this.clearSVG();
    this.setState({
      edges: [],
      start: null,
      imageLinkId: null,
      interactionState: 0});

    let popup = <Popup setDataCallback={this.setData.bind(this)}
                       userstore={this.props.userstore}
                       toolstore={this.props.toolstore}/>;
    window.setTimeout(ToolActions.activeToolPopupUpdate.bind(null, popup), 10);

    window.setTimeout(ToolActions.updateTooltipData.bind(null, this.props.userstore.getText('newPathTooltip')), 10);
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

    this.setState(this.initialState());
  }

  setMode(){
    ToolActions.setTool(ToolConf.newPath.id);
  }

  /**
   * INTERNAL METHODS
   */

  adaptElementSizeToZoom(scale) {
    let tool = d3.select('.' + this.toolContainerSVGClass);

    tool.selectAll('.blackLine')
      .attr('stroke-width', 4/scale);
    tool.selectAll('.whiteLine')
      .attr('stroke-width', 4/scale)
      .attr('stroke-dasharray', 8/scale + ',' + 8/scale);
    tool.selectAll('.currentLine')
      .attr('stroke-width', 2/scale);
    tool.selectAll('circle')
      .attr('stroke-width', 3/scale)
      .attr("r", 6/scale);
  }

  leftClick(self, d) {
    // If no image set image and add vertex
    if(!self.state.imageLinkId) {
      let coords = d3.mouse(this);
      self.setState({imageLinkId: d.link, imageUri: d.entity});
      self.addVertex.call(self, coords[0], coords[1], d);
    }
    if(self.state.imageLinkId == d.link) {
      // If same image add vertex
      let coords = d3.mouse(this);
      self.addVertex.call(self, coords[0], coords[1], d);
    }
    else {
      // If different image display error and do nothing else
      console.error('Attempt to apply a single image operation as cross-image');
    }
  }

  rightClick(self, d) {
    if(self.state.interactionState == 0) {
      self.setState({interactionState: 1});
    }
    // If creation mode, remove last vertex
    // If confirm mode, confirm and save (if box full)
  }

  activateEnter() {
    let self = this;
    d3.select("body").on('keyup', function(d, i) {
      if(d3.event.which == 13) {
        // 'Enter' key
        d3.event.stopPropagation();
        d3.event.preventDefault();
        self.nextInteractionState.call(this, self);
      }
    });
  }

  deactivateEnter() {
    d3.select("body").on('keyup', null);
  }

  nextInteractionState(self) {
      if(self.state.interactionState == 0) {
        self.setState({interactionState: 1});
      }
      else if(self.state.interactionState == 1) {
        window.setTimeout(
          ToolActions.save, 10);
      }
  }

  dataToSVG() {
    if(!this.state.imageLinkId) {
      return;
    }

    let view = this.props.viewstore.getView();

    let overSheetGroup = d3.select('#OVER-' + this.state.imageLinkId);
    let toolDisplayGroup = overSheetGroup
      .append('g')
      .attr('class', this.toolContainerSVGClass)
      .style('pointer-events', 'none');

    let self = this;
    for(let i = 0 ; i < this.state.edges.length; ++i) {
      let edge = this.state.edges[i];
      let bLine = toolDisplayGroup.append('line');
      bLine
        .attr('class', 'blackLine')
        .attr('x1', edge.start.x)
        .attr('y1', edge.start.y)
        .attr('x2', edge.end.x)
        .attr('y2', edge.end.y)
        .attr('stroke-width', 4/view.scale)
        .attr('stroke', 'black');

      let wLine = toolDisplayGroup.append('line');
      wLine
        .attr('class', 'whiteLine')
        .attr('x1', edge.start.x)
        .attr('y1', edge.start.y)
        .attr('x2', edge.end.x)
        .attr('y2', edge.end.y)
        .attr('stroke-width', 4/view.scale)
        .attr('stroke-dasharray', 8/view.scale + ',' + 8/view.scale)
        .attr('stroke', 'white');

      //var edge = this.state.edges[i];
      let circle = toolDisplayGroup.append('circle');
      circle
        .attr("cx", edge.start.x)
        .attr("cy", edge.start.y)
        .attr("r", 6/view.scale)
        .attr('stroke-width', 3/view.scale)
        .attr('stroke', 'white')
        .attr("fill", "black");

      if(this.state.interactionState == 1) {
        bLine.
        on('dblclick', (function (idx) {
          return function() {self.splitEdge(idx, self)};
        })(i));

        wLine.
        on('dblclick', (function (idx) {
          return function() {self.splitEdge(idx, self)};
        })(i));

        circle.datum({x: edge.start.x, y: edge.start.y})
          .attr("x", function(d) {return d.x;})
          .attr("y", function(d) {return d.y;})
          .style('cursor', '-webkit-grab')
          .style('cursor', 'grab')
          .call(this.drag);
      }
    }

    if(this.state.interactionState == 1) {
      // Append the last circle, which marks the end of the trail
      let edge = this.state.edges[this.state.edges.length-1];
      let circle = toolDisplayGroup.append('circle');
      circle
        .datum({x: edge.end.x, y: edge.end.y})
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r", 6/view.scale)
        .attr('stroke-width', 3/view.scale)
        .attr('stroke', 'white')
        .attr("fill", "black")
        .attr("x", function(d) {return d.x;})
        .attr("y", function(d) {return d.y;})
        .style('cursor', '-webkit-grab')
        .style('cursor', 'grab')
        .call(this.drag);
    }

    if(this.state.start && this.state.interactionState == 0) {
      toolDisplayGroup.append('line')
        .attr('class', 'currentLine')
        .attr('x1', this.state.start.x)
        .attr('y1', this.state.start.y)
        .attr('x2', this.state.start.x)
        .attr('y2', this.state.start.y)
        .attr('class', this.activeLineClass)
        .attr('stroke-width', 2/view.scale)
        .attr('stroke', 'black');

      //console.log("mounting mouse move listener");
      d3.select('#GROUP-' + this.state.imageLinkId)
        .on('mousemove', function(d, i) {
          self.setLineEndPosition.call(this, self)});

      toolDisplayGroup.append('circle')
        .attr("cx", this.state.start.x)
        .attr("cy", this.state.start.y)
        .attr("r", 6/view.scale)
        .attr('stroke-width', 3/view.scale)
        .attr('stroke', 'white')
        .attr("fill", "black");
    }
  }

  clearSVG() {
    d3.select('.' + this.toolContainerSVGClass).remove();
    if(this.state.imageLinkId) {
      d3.select('#GROUP-' + this.state.imageLinkId).on('mousemove', null);
    }
  }

  splitEdge(i, self) {
    d3.event.stopPropagation();
    let edges = self.state.edges;
    let edge = edges[i];
    edges.splice(i, 1);
    let xm = (edge.end.x + edge.start.x)/2;
    let ym = (edge.end.y + edge.start.y)/2;
    edges.push({start: {x: edge.start.x, y: edge.start.y}, end: {x: xm, y: ym}});
    edges.push({start: {x: xm, y: ym}, end: {x: edge.end.x, y: edge.end.y}});
    this.setState({edges: edges});
  }

  deleteVertex(x, y) {
    //d3.event.stopPropagation();
    // Find the two edges that have x and y as start or end
    let startEdge = null;
    let endEdge = null;
    let edges = this.state.edges;
    for(let i = 0; i < edges.length; ++i) {
      let edge = edges[i];
      if(edge.start.x-5 < x && edge.start.x +5 > y
        && edge.start.y-5 < x && edge.start.y +5 > y) {
        startEdge = edge;
      }
      if(edge.end.x-5 < x && edge.end.x +5 > x
        && edge.end.y-5 < y && edge.end.y +5 > y) {
        endEdge = edge;
      }
    }

    // Merge both edges
    edges.splice(edges.indexOf(startEdge), 1);
    edges.splice(edges.indexOf(endEdge), 1);

    edges.push({start: {x: startEdge.end.x, y: startEdge.end.y}, end: {x: endEdge.start.x, y: endEdge.start.y}});

    // Update display
    this.setState({edges: edges});
  }

  setLineEndPosition(self) {
    let coords = d3.mouse(this);
    d3.select('.' + self.activeLineClass).attr("x2", coords[0]).attr("y2", coords[1]);
  }

  vertexDragStart() {
    if(d3.event.sourceEvent.which == 1) {
      d3.event.sourceEvent.preventDefault();
      d3.event.sourceEvent.stopPropagation();

      let circle = d3.select(this);
      circle
        .classed('dragging', true)
        .datum({tx: 0, ty: 0, origX: circle.cx, origY: circle.cy})
        .attr('origX', function(d) {return d.origX;})
        .attr('origY', function(d) {return d.origY;})
        .attr('tx', function(d) {return d.tx;})
        .attr('ty', function(d) {return d.ty;});
    }
  }

  vertexDragged(d) {
    if(d3.select(this).classed('dragging') == true) {
      let vertex = d3.select(this);
      vertex.attr('cx', d.cx = d3.event.x)
        .attr('cy', d.cy = d3.event.y);
    }
  }

  vertexDragEnded(d, self) {
    if(d3.event.sourceEvent.which == 1) {
      let circle = d3.select(this);
      circle.classed('dragging', false);
      let edges = self.state.edges;
      if(d.x && d.y && d.cx && d.cy) {
        Globals.updateEdgesPosition(d.x, d.y, d.cx, d.cy, edges, 0.1);
      }
      self.setState({edges: edges});
    }
  }

  setData(name) {
    //console.log("set data to " + name);
    this.setState({name: name});
  }

  /**
   * REACT API
   */
  componentDidMount() {
    super.componentDidMount();
    window.setTimeout(ToolActions.registerTool.bind(null, ToolConf.newPath.id, this.click, this), 10);
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
    if(this.state.active && this.state.imageLinkId) {
      this.clearSVG();
      this.dataToSVG();
    }
    if(this.state.interactionState == 1) {
      d3.select('.' + this.toolContainerSVGClass)
      .style('pointer-events', 'auto');

      if(prevState.interactionState != 1) {
        window.setTimeout(ToolActions.updateTooltipData.bind(null, this.props.userstore.getText('createPathTooltip0')), 10);
      }
    }
    else if(this.state.interactionState == 0 && this.state.start && !prevState.start) {
      window.setTimeout(ToolActions.updateTooltipData.bind(null, this.props.userstore.getText('createPathTooltip1')), 50);
    }
  }

  render() {
    return (
      <button ref='button'
        style={this.buttonStyle}
        className='ui button compact'
        onClick={this.setMode}
        data-content={this.props.userstore.getText('createNewPath')}>
        <img src={icon} style={this.iconStyle} height='20px' width='20px' />
      </button>
    );
  }
}

export default CreatePath;
