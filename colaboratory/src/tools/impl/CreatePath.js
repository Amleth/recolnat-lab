/**
 * Created by dmitri on 10/12/15.
 */
'use strict';

import React from 'react';
import d3 from 'd3';

import AbstractTool from '../AbstractTool';

import ToolActions from '../../actions/ToolActions';

import Classes from "../../constants/CommonSVGClasses";

import conf from '../../conf/ApplicationConfiguration';
import ToolConf from "../../conf/Tools-conf";

import icon from '../../images/polyline.png';

class CreatePath extends AbstractTool {
  constructor(props) {
    super(props);

    this.toolContainerSVGClass = "CREATE_PATH_TOOL_CLASS";
    this.activeLineClass = "CREATE_PATH_TOOL_ACTIVE_LINE_CLASS";

    var self = this;

    this.drag = d3.behavior.drag()
      .origin(d => d)
      .on('dragstart', this.vertexDragStart)
      .on("drag", this.vertexDragged)
      .on("dragend", function(d, i) {
        self.vertexDragEnded.call(this, d, self);
      });

    this.state = this.initialState();
  }

  initialState() {
    return {
      edges: [],
      start: null,
      interactionState: 0,
      active: false
    };
  }

  /**
   * INHERITED API
   */
  click(self, x, y, data) {
    if(!this.props.entitystore.getSelectedImage()) {
      window.setTimeout(function() {
          ToolActions.updateTooltipData("Veuillez sélectionner une image via l'outil sélection avant d'utiliser l'outil de création de chemins.");},
        50);
      return;
    }
    var deltaX = this.props.entitystore.getSelectedImage().x;
    var deltaY = this.props.entitystore.getSelectedImage().y;
    var view = this.props.viewstore.getView();
    var displayX = (x-view.left)/view.scale;
    var displayY = (y-view.top)/view.scale;
    var imgX = displayX-deltaX;
    var imgY = displayY-deltaY;

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
        // bb/ The target is a vertex. The target vertex is part of one edge. Creating a connecting new edge will
        // close the current path. Close shape, end editing.
        // bc/ The target is a vertex. The target vertex is part of two edges. The connection cannot be made. Do nothing.
        var count = this.countEdges(imgX, imgY);
        if (this.state.start == null) {
          // a
          if (count == 0) {
            // aa
            this.setState({edges: [], start: {x: imgX, y: imgY}});
          }
          else if (count == 1) {
            // ab
            var vertex = this.matchVertex(imgX, imgY);
            this.setState({start: {x: vertex.x, y: vertex.y}});
          }
          else if (count == 2) {
            // ac
            window.setTimeout(function () {
              ToolActions.updateTooltipData("Impossible de commencer une ligne ici. Veuillez cliquer sur un point" +
                " au début ou à la fin du chemin existant.");
            }, 100);
          }
          else {
            console.error("Whoops. This vertex is in too many edges. How unexpectedly theoretically impossible!");
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
                x: imgX,
                y: imgY
              }
            });
            this.setState({edges: edges, start: {x: imgX, y: imgY}});
          }
          else if (count == 1) {
            // bb
            var vertex = this.matchVertex(imgX, imgY);
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
            this.setState({interactionState: 1, start: null, edges: edges});
          }
          else if (count == 2) {
            // bc
            window.setTimeout(function () {
              ToolActions.updateTooltipData("Impossible de faire passer le chemin par ce point.");
            }, 100);
          }
          else {
            console.log("Whoops. This vertex is in too many edges. How unexpected.");
          }
        }
      }
    }
  }

  canSave() {
    return true;
  }

  save() {
    // Create polyline representation of this path.
    var data = {};
    data.serviceUrl = conf.actions.imageEditorServiceActions.createPath;
    data.payload = {};
    data.payload.path = [];
    data.payload.length = 0;
    var x = null;
    var y = null;
    var edges = this.state.edges;
    while(edges.length > 0) {
      var edge = this.getNextEdge(x, y, edges);
      x = edge.end.x;
      y = edge.end.y;

      data.payload.path.push([edge.start.x, edge.start.y]);
      data.payload.path.push([edge.end.x, edge.end.y]);
      data.payload.length += Math.sqrt(Math.pow(Math.abs(edge.end.y) - Math.abs(edge.start.y), 2) + Math.pow(Math.abs(edge.end.x) - Math.abs(edge.start.x), 2));
    }

    return data;
  }

  begin() {
    window.setTimeout(function() {
      ToolActions.activeToolPopupUpdate(null);
      ToolActions.updateTooltipData(ToolConf.newPath.tooltip);
    }, 10);
    var self = this;
    d3.select('.' + Classes.ROOT_CLASS)
    .on('mouseover', this.activateEnter.bind(self))
    .on('mouseout', this.deactivateEnter);

    this.setState({active: true});

  }

  reset() {
    this.setState({edges: [], start: null, interactionState: 0});
    window.setTimeout(function() {
      ToolActions.updateTooltipData(ToolConf.newPath.tooltip);
    }, 10);
  }

  finish() {
    this.clearSVG();
    window.setTimeout(function() {
      ToolActions.activeToolPopupUpdate(null);
      ToolActions.updateTooltipData("");
    }, 10);
    d3.select('.' + Classes.ROOT_CLASS)
      .on('mouseover', null)
      .on('mouseout', null);
    this.setState(this.initialState());

  }

  setMode(){
    ToolActions.setTool(ToolConf.newPath.id);
  }

  /**
   * INTERNAL METHODS
   */
  activateEnter() {
    var self = this;
    d3.select("body").on('keyup', function(d, i) {self.nextInteractionState.call(this, self)});
  }

  deactivateEnter() {
    d3.select("body").on('keyup', null);
  }

  nextInteractionState(self) {
    if(d3.event.which == 13) {
      // 'Enter' is pressed
      if(self.state.interactionState == 0) {
        self.setState({interactionState: 1});
      }
      else if(self.state.interactionState == 1) {
        window.setTimeout(
        ToolActions.save, 10);
      }
    }
  }

  dataToSVG() {
    var selectedSheet = this.props.entitystore.getSelectedEntity();
    var overSheetGroup = d3.select('#OVER-' + selectedSheet.id);
    var toolDisplayGroup = overSheetGroup
      .append('g')
      .attr('class', this.toolContainerSVGClass);

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

    if(this.state.start && this.state.interactionState == 0) {
      toolDisplayGroup.append('line')
        .attr('x1', this.state.start.x)
        .attr('y1', this.state.start.y)
        .attr('x2', this.state.start.x)
        .attr('y2', this.state.start.y)
        .attr('class', this.activeLineClass)
        .attr('stroke-width', 2)
        .attr('stroke', 'black');

      console.log("mounting mouse move listener");
      d3.select('#GROUP-' + selectedSheet.id)
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
    var selectedSheet = this.props.entitystore.getSelectedEntity();
    d3.select('.' + this.toolContainerSVGClass).remove();
    d3.select('#GROUP-' + selectedSheet.id).on('mousemove', null);
  }

  /**
   * Finds edge starting "roughly" at (x,y) and remove it from edges. Returns the removed edge.
   * @param x
   * @param y
   * @returns {{start: {x: *, y: *}, end: {x: *, y: *}}}
   */
  getNextEdge(x, y, edges) {
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

  /**
   * Comparison must allow a +- 5 px interval for matching (can't expect the user to click on a precise pixel).
   * @param x
   * @param y
   * @returns
   */
  matchVertex(x, y) {
    for(var i = 0; i < this.state.edges.length; ++i) {
      var edge = this.state.edges[i];
      if(edge.start.x-5 < x && edge.start.x +5 > x
        && edge.start.y-5 < y && edge.start.y +5 > y) {
        return {x: edge.start.x, y: edge.start.y};
      }
      if(edge.end.x-5 < x && edge.end.x +5 > x
        && edge.end.y-5 < y && edge.end.y +5 > y) {
        return {x: edge.end.x, y: edge.end.y};
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

  updateEdgesPosition(oldX, oldY, newX, newY, edges) {
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
    this.setState({edges: edges});
  }

  deleteVertex(x, y) {
    //d3.event.stopPropagation();
    // Find the two edges that have x and y as start or end
    var startEdge = null;
    var endEdge = null;
    var edges = this.state.edges;
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

  setLineEndPosition(self) {
    var coords = d3.mouse(this);
    d3.select('.' + self.activeLineClass).attr("x2", coords[0]).attr("y2", coords[1]);
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
      var edges = self.state.edges;
      if(d.x && d.y && d.cx && d.cy) {
        self.updateEdgesPosition(d.x, d.y, d.cx, d.cy, edges);
      }
      self.setState({edges: edges});
    }
  }

  /**
   * REACT API
   */
  componentDidMount() {
    ToolActions.registerTool(ToolConf.newPath.id, this.click, this);
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
    if(this.state.interactionState == 1) {
      window.setTimeout(function() {
        ToolActions.updateTooltipData("Tirez un point pour le déplacer. Double-cliquez sur une ligne pour la scinder en deux. Appuyez sur ENTREE pour sauvegarder le tracé.");}, 500);
    }
    else if(this.state.interactionState == 0 && this.state.start) {
      window.setTimeout(function() {
        ToolActions.updateTooltipData("Cliquez sur l'image active pour créer un nouveau point et le relier au point précédent. Appuyez sur ENTREE pour terminer l'ajout de points ou cliquez sur le premier point pour terminer le tracé");}, 500);
    }
  }

  render() {
    return (
      <button
        style={this.buttonStyle}
        className='ui button compact'
        onClick={this.setMode}
        data-content="Créer un nouveau chemin">
        <img src={icon} style={this.iconStyle} height='20px' width='20px' />
      </button>
    );
  }
}

export default CreatePath;