/**
 * Created by dmitri on 17/12/15.
 */
'use strict';

import React from 'react';
import polygonArea from '2d-polygon-area';
import d3 from 'd3';

import AbstractTool from '../AbstractTool';

import Classes from '../../constants/CommonSVGClasses';

import ToolActions from '../../actions/ToolActions';

import Popup from '../popups/CreateRoIPopup';

import conf from '../../conf/ApplicationConfiguration';
import ToolConf from '../../conf/Tools-conf';

import icon from '../../images/polygon.png';
/**
 * Used to create polyline-like ROIs. However SVG polylines should not be used as each line must have its own onclick handler to split a line into two. Lines are grouped in a group in order to identify the ROI for an annotation. The shape does not need to be closed to be a valid annotation.
 *
 * NOTE: Remember when comparing vertex positions to allow some space (for example a 5-pixel-radius area) for floating-point comparisons
 */
class CreateRoI extends AbstractTool {
  constructor(props) {
    super(props);

    var self = this;

    this.drag = d3.behavior.drag()
      .origin(d => d)
      .on('dragstart', this.vertexDragStart)
      .on("drag", this.vertexDragged)
      .on("dragend", function(d, i) {
        self.vertexDragEnded.call(this, d, self);
      });

    this.iconStyle = {
      margin: '8px 10px 0px 0px'
    };

    this.state = this.initialState();
  }

  /**
   * interactionState:
   * 0: the tool is ready to draw, respond only to requests to add new vertices
   * 1: the tool is done drawing a complete area, respond only to requests to move vertices (drag vertex), split edges (doubleclick edge), or remove vertices (doubleclick vertex - DOES NOT WORK with drag enabled...), or ENTER, which validates and saves the area on the server
   */
  initialState() {
    return {
      edges: [],
      start: null,
      interactionState: 0,
      active: false,
      name: ''
    };
  }

  static classes() {
    return {
      selfSvgClass: "CREATE_ROI_TOOL_CLASS",
      activeLineClass: "CREATE_ROI_TOOL_ACTIVE_LINE_CLASS"
    };
  }

  dataToSVG() {
    var imageId = this.props.entitystore.getSelectedEntity().id;

    var overImageGroup = d3.select('#OVER-' + imageId);
    var toolDisplayGroup = overImageGroup.append('g')
      .attr('class', CreateRoI.classes().selfSvgClass);

    var self = this;
    for(var i = 0 ; i < this.state.edges.length; ++i) {
      var edge = this.state.edges[i];
      var bLine = toolDisplayGroup.append('line');
      bLine
        .attr('x1', edge.start.x)
        .attr('y1', edge.start.y)
        .attr('x2', edge.end.x)
        .attr('y2', edge.end.y)
        .attr('stroke-width', 4)
        .attr('stroke', 'black');

      var wLine = toolDisplayGroup.append('line');
      wLine
        .attr('x1', edge.start.x)
        .attr('y1', edge.start.y)
        .attr('x2', edge.end.x)
        .attr('y2', edge.end.y)
        .attr('stroke-width', 1)
        .attr('stroke', 'white');

      if(this.state.interactionState == 1) {
        bLine.
        on('dblclick', (function (idx) {
          return function() {self.splitEdge(idx, self)};
        })(i));

        wLine.
        on('dblclick', (function (idx) {
          return function() {self.splitEdge(idx, self)};
        })(i));
      }
    }

    for(var i = 0 ; i < this.state.edges.length; ++i) {
      var edge = this.state.edges[i];
      var circle = toolDisplayGroup.append('circle');
      circle
        .attr("cx", edge.start.x)
        .attr("cy", edge.start.y)
        .attr("r", 6)
        .style("fill", "black");
      if(this.state.interactionState == 1) {
        circle.datum({x: edge.start.x, y: edge.start.y})
          .attr("x", function(d) {return d.x;})
          .attr("y", function(d) {return d.y;})
          .style('cursor', '-webkit-grab')
          .style('cursor', 'grab')
          .call(this.drag);
      }
    }

    if(this.state.start) {
      toolDisplayGroup.append('line')
        .attr('x1', this.state.start.x)
        .attr('y1', this.state.start.y)
        .attr('x2', this.state.start.x)
        .attr('y2', this.state.start.y)
        .attr('class', CreateRoI.classes().activeLineClass)
        .attr('stroke-width', 2)
        .attr('stroke', 'black');

      d3.select('#GROUP-' + imageId)
        .on('mousemove', function(d, i) {
          self.setLineEndPosition.call(this, self)});

      toolDisplayGroup.append('circle')
        .attr("cx", this.state.start.x)
        .attr("cy", this.state.start.y)
        .attr("r", 6)
        .style("fill", "black");
    }
  }

  clearSVG() {
    d3.selectAll('.' + CreateRoI.classes().selfSvgClass).remove();
  }

  begin() {
    window.setTimeout(function() {
      ToolActions.updateTooltipData(ToolConf.newRegionOfInterest.tooltip);
    }, 50);
    this.setState({edges: [], start: null, interactionState: 0, active: true, name: ''});
  }

  reset() {
    window.setTimeout(function() {
      ToolActions.updateTooltipData(ToolConf.newRegionOfInterest.tooltip);
    }, 10);
    this.setState({edges: [], start: null, interactionState: 0, name: ''});
  }

  finish() {
    window.setTimeout(function() {
      ToolActions.updateTooltipData("");
    }, 10);
    this.setState(this.initialState());
  }

  canSave() {
    return true;
  }

  save() {
    console.log("CreateROI: building save data");
    if(this.state.interactionState != 1) {
      alert("Sauvegarde impossible: le polygone n'est pas terminé.");
      return null;
    }
    if(this.state.name.length < 1) {
      alert('Le nom est obligatoire');
      return null;
    }
    // Create polygon or polyline representation of this area..
    var data = {};
    data.serviceUrl = conf.actions.imageEditorServiceActions.createPolygon;
    data.payload = {};
    data.payload.polygon = [];
    data.payload.name = this.state.name;
    data.payload.perimeter = 0;
    var x = null;
    var y = null;
    var edges = this.state.edges;
    while(edges.length > 0) {
      var edge = CreateRoI.getNextEdge(edges, x, y);
      x = edge.end.x;
      y = edge.end.y;

      data.payload.polygon.push([edge.start.x, edge.start.y]);
      data.payload.perimeter += Math.sqrt(Math.pow(Math.abs(edge.end.y) - Math.abs(edge.start.y), 2) + Math.pow(Math.abs(edge.end.x) - Math.abs(edge.start.x), 2));
    }
    data.payload.area = Math.abs(polygonArea(data.payload.polygon));

    console.log("CreateROI: sending save data " + JSON.stringify(data));
    return data;
  }

  static getNextEdge(edges, x, y) {
    if(x == null || y == null || edges.length == 1) {
      var edge = {start: {x: edges[0].start.x, y: edges[0].start.y}, end: {x: edges[0].end.x, y: edges[0].end.y}};
      edges.splice(0, 1);
      return edge;
    }
    for(var i = 0; i < edges.length; ++i) {
      var edge = {start: {x: edges[i].start.x, y: edges[i].start.y}, end: {x: edges[i].end.x, y: edges[i].end.y}};
      if(edge.start.x-5 < x && edge.start.x +5 > x
        && edge.start.y-5 < y && edge.start.y +5 > y) {
        edges.splice(i, 1);
        return edge;
      }
    }
  }




  click(self, clickX, clickY, data) {
    if(!this.props.entitystore.getSelectedImage()) {
      window.setTimeout(function() {
          ToolActions.updateTooltipData("Veuillez sélectionner une image via l'outil sélection avant d'utiliser l'outil de création de chemins.");},
        50);
      return;
    }

    console.log("create roi received click with button=" + data.button);

    var deltaX = this.props.entitystore.getSelectedImage().x;
    var deltaY = this.props.entitystore.getSelectedImage().y;
    var view = this.props.viewstore.getView();
    var displayX = (clickX-view.left)/view.scale;
    var displayY = (clickY-view.top)/view.scale;
    var x = displayX-deltaX;
    var y = displayY-deltaY;

    if(data.button == 0) {
      if (this.state.interactionState == 0) {
        // Two possibilities:
        // a) We are not currently in the process of creating a new edge
        // b) We are in the process of creating a new edge
        // Consequently the following situations have to be taken into account:
        // aa/ There is no vertex at this location. In this case this is a fully new ROI
        // ab/ There is a vertex at this location. This vertex is part of only one edge, create a new edge starting there.
        // ac/ There is a vertex at this location. The vertex is already part of two edges, no new line can be added. A vertex can only be in up to two edges.
        // ba/ The target is not a vertex. Create a new vertex here and a new edge linking start to end. Continue with a new edge starting at this location.
        // bb/ The target is a vertex. The target vertex is part of one edge. Creating a connecting new edge will close the current ROI. Close shape, end editing.
        // bc/ The target is a vertex. The target vertex is part of two edges. The connection cannot be made. Do nothing.
        var count = this.countEdges(x, y);
        if (this.state.start == null) {
          // a
          if (count == 0) {
            // aa
            this.setState({edges: [], start: {x: x, y: y}});
          }
          else if (count == 1) {
            // ab
            var vertex = this.matchVertex(x, y);
            this.setState({start: {x: vertex.x, y: vertex.y}});
          }
          else if (count == 2) {
            // ac
            window.setTimeout(function () {
              ToolActions.updateTooltipData("Impossible de commencer une ligne ici. Veuillez cliquer sur un point au début ou à la fin de la zone.");
            }, 100);
          }
          else {
            console.error("Whoops. This vertex is in too many edges. How unexpected.");
          }
        }
        else {
          // b
          if (count == 0) {
            // ba
            var edges = this.state.edges;
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
            var vertex = this.matchVertex(x, y);
            var edges = this.state.edges;
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
            this.setState({edges: edges, start: null, interactionState: 1});
          }
          else if (count == 2) {
            // bc
            window.setTimeout(function () {
              ToolActions.updateTooltipData("Impossible de créer la ligne ici. Si vous souhaitez fermer le polygone, cliquez sur son premier point.");
            }, 100);
          }
          else {
            console.error("Whoops. This vertex is in too many edges. How unexpected.");
          }
        }
      }
    }
  }

  /**
   * Comparison must allow a +- 5 px interval for matching (can't expect the user to click on a precise pixel).
   * @param x
   * @param y
   * @returns {boolean}
   */
  matchVertex(x, y) {
    for(var i = 0; i < this.state.edges.length; ++i) {
      var edge = this.state.edges[i];
      if(edge.start.x-5 < x && edge.start.x +5 > x
        && edge.start.y-5 < y && edge.start.y +5 > y) {
        return edge.start;
      }
      if(edge.end.x-5 < x && edge.end.x +5 > x
        && edge.end.y-5 < y && edge.end.y +5 > y) {
        return edge.end;
      }
    }
    return null;
  }

  countEdges(x, y) {
    var count = 0;
    for(var i = 0; i < this.state.edges.length; ++i) {
      var edge = this.state.edges[i];
      if(edge.start.x-5 < x && edge.start.x +5 > x
        && edge.start.y-5 < y && edge.start.y +5 > y) {
        count++;
      }
      else if(edge.end.x-5 < x && edge.end.x +5 > x
        && edge.end.y-5 < y && edge.end.y +5 > y) {
        count++;
      }
    }
    return count;
  }

  static updateEdgesPosition(oldX, oldY, newX, newY, edges) {
    for(var i = 0; i < edges.length; ++i) {
      var edge = edges[i];
      if(edge.start.x-5 < oldX && edge.start.x +5 > oldX
        && edge.start.y-5 < oldY && edge.start.y +5 > oldY) {
        edge.start.x = newX;
        edge.start.y = newY;
      }
      if(edge.end.x-5 < oldX && edge.end.x +5 > oldX
        && edge.end.y-5 < oldY && edge.end.y +5 > oldY) {
        edge.end.x = newX;
        edge.end.y = newY;
      }
    }
  }

  splitEdge(i, self) {
    d3.event.stopPropagation();
    var edges = self.state.edges;
    var edge = edges[i];
    edges.splice(i, 1);
    var xm = (edge.end.x + edge.start.x)/2;
    var ym = (edge.end.y + edge.start.y)/2;
    edges.push({start: {x: edge.start.x, y: edge.start.y}, end: {x: xm, y: ym}});
    edges.push({start: {x: xm, y: ym}, end: {x: edge.end.x, y: edge.end.y}});
    self.setState({edges: edges});
  }

  deleteVertex(x, y) {
    //d3.event.stopPropagation();
    // Find the two edges that have x and y as start or end
    var edges = this.state.edges;
    var startEdge = null;
    var endEdge = null;
    for(var i = 0; i < edges.length; ++i) {
      var edge = edges[i];
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

  setData(name) {
    this.setState({name: name});
  }

  setLineEndPosition(self) {
    var coords = d3.mouse(this);
    d3.select('.' + CreateRoI.classes().activeLineClass).attr("x2", coords[0]).attr("y2", coords[1]);
  }

  vertexDragStart() {
    if(d3.event.sourceEvent.which == 1) {
      d3.event.sourceEvent.preventDefault();
      d3.event.sourceEvent.stopPropagation();

      var circle = d3.select(this);
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
      var vertex = d3.select(this);
      vertex.attr('cx', d.cx = d3.event.x)
        .attr('cy', d.cy = d3.event.y);
    }
  }

  vertexDragEnded(d, self) {
    if(d3.event.sourceEvent.which == 1) {
      var circle = d3.select(this);
      circle.classed('dragging', false);
      if(d.x && d.y && d.cx && d.cy) {
        var edges = self.state.edges;
        CreateRoI.updateEdgesPosition(d.x, d.y, d.cx, d.cy, edges);
      }
      self.setState({edges: edges});
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

  componentDidUpdate(prevProps, prevState) {
    this.clearSVG();
    this.dataToSVG();

    if(this.state.active && !prevState.active) {
      var popup = <Popup setDataCallback={this.setData.bind(this)}
      />;

      window.setTimeout(function() {
          ToolActions.activeToolPopupUpdate(popup);},
        100);
    }

    if(this.state.interactionState == 1) {
      d3.select('.' + Classes.ROOT_CLASS)
        .on('mouseenter', CreateRoI.activateEnter)
        .on('mouseleave', CreateRoI.deactivateEnter);

      window.setTimeout(function() {
        ToolActions.updateTooltipData("Tirez un point pour le déplacer. Double-cliquez sur une ligne pour créer un nouveau point en son milieu.");}, 50);
    }
    else if(prevState.interactionState == 1 && this.state.interactionState != 1) {
      d3.select('.' + Classes.ROOT_CLASS)
        .on('mouseenter', null)
        .on('mouseleave', null);
    }

  }

  static activateEnter() {
    d3.select("body").on('keyup', ToolActions.save);
  }

  static deactivateEnter() {
    d3.select("body").on('keyup', null);
  }

  setMode() {
    ToolActions.setTool(ToolConf.newRegionOfInterest.id);
  }

  componentDidMount() {
    ToolActions.registerTool(ToolConf.newRegionOfInterest.id, this.click, this);
  }

  render() {
    return (
      <button
        style={this.buttonStyle}
        className='ui button compact'
        data-content='Créer un polygone'
        onClick={this.setMode}>
        <img src={icon} style={this.iconStyle} height='20px' width='20px' />
      </button>
    );
  }
}

export default CreateRoI;