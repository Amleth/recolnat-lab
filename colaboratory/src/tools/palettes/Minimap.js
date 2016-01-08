/**
 * Created by hector on 04/08/15.
 */
"use strict";

import React from "react";

import MinimapActions from "../../actions/MinimapActions";
import ViewActions from "../../actions/ViewActions";

import AbstractTool from "../AbstractTool";
import MoveObject from "../impl/MoveObject";
import SelectObject from '../impl/SelectObject';

class Minimap extends React.Component {
  constructor(props) {
    super(props);

    this.componentStyle = {
//       display: "none",
      flexDirection: "row"
    };

    this.imageContainerStyle = {
      position: "relative",
      left: "0px",
      top: "0px",
      overflow: "hidden"
    };

    this.imageStyle = {
      width: '185px'
    };

    this.boundingBoxStyle = {
      display: "inline",
      position: "absolute",
      borderStyle: "solid",
      borderWidth: "1px",
      borderColor: "red"
    };

    this.buttonColumnStyle = {
      display: "none",
      flexDirection: "row",
      flexWrap: 'wrap'
    };

    this.buttonStyle = {
      fontFamily: 'Roboto Condensed',
      fontWeight: '300'
    };

    this._onImageInit = () => {
      const initMap = () => this.initMinimap(this.props.ministore.getImage(), this.props.viewstore.getView());
      return initMap.apply(this);
    };

    this._onViewChange = () => {
      const updateView = () => this.updateViewportLocation(this.props.viewstore.getView());
      return updateView.apply(this);
    };

    this.state = {
      init: {
        xZero: 0,
        yZero: 0,
        imgUrl: null,
        imgHeight: null,
        imgWidth: null
      },
      view: {
        top: 0,
        left: 0,
        height: 0,
        width: 0,
        zoom: 1.0
      },
      ratio: null,
      dragging: false
    };

    this.timeout = null;
  }

  componentDidMount() {
    this.props.ministore.addInitListener(this._onImageInit);
    this.props.viewstore.addViewportListener(this._onViewChange);
    $('.ui.button.small.compact').popup();
  }

  componentWillUpdate(nextProps, nextState) {
    if(nextState.view.left != null) {
      this.boundingBoxStyle.left = nextState.view.left + "px";
    }
    if(nextState.view.top != null) {
      this.boundingBoxStyle.top = nextState.view.top + "px";
    }
    if(nextState.view.width != null) {
      this.boundingBoxStyle.width = nextState.view.width + "px";
    }
    if(nextState.view.height != null) {
      this.boundingBoxStyle.height = nextState.view.height + "px";
    }

    if(nextState.init.imgUrl) {
      this.componentStyle.display = "flex";
      this.buttonColumnStyle.display = 'flex';
    }
    else {
      this.componentStyle.display = "none";
      this.buttonColumnStyle.display = 'none';
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if(this.state.ratio == null) {
      this.updateViewportLocation(this.props.viewstore.getView());
    }
  }

  initMinimap(image, view) {
    this.setState({
      init: {
        imgUrl: image.url,
        xZero: image.xZero,
        yZero: image.yZero,
        imgHeight: image.height,
        imgWidth: image.width
      },
      ratio: null
    });
  }

  updateViewportLocation(view) {
    var node = this.refs.image.getDOMNode().getBoundingClientRect();
    var ratio = this.state.init.imgHeight/node.height;
    this.setState({
      view: {
        top: -(view.top/view.scale + this.state.init.yZero)/(ratio),
        left: -(view.left/view.scale + this.state.init.xZero)/(ratio),
        height: view.height/(ratio*view.scale),
        width: view.width/(ratio*view.scale),
        zoom: view.scale
      },
      ratio: ratio
    });
  }

  moveViewToClickLocation(event) {
    var node = this.refs.image.getDOMNode().getBoundingClientRect();

    ViewActions.updateViewport(
      -((event.clientX-node.left-this.state.view.width/2)*this.state.ratio + this.state.init.xZero)*this.state.view.zoom,
      -((event.clientY-node.top-this.state.view.height/2)*this.state.ratio + this.state.init.yZero)*this.state.view.zoom,
      this.state.view.width*this.state.ratio*this.state.view.zoom,
      this.state.view.height*this.state.ratio*this.state.view.zoom,
      this.state.view.zoom
    );
  }

  fitViewToImage() {
    var node = this.refs.image.getDOMNode().getBoundingClientRect();
    var scale = 1.0;

    if(node.height > node.width) {
      scale = (this.props.viewstore.getView().height) / this.state.init.imgHeight;
    }
    else {
      scale = (this.props.viewstore.getView().width) / this.state.init.imgWidth;
    }

    ViewActions.updateViewport(
      -((this.state.init.xZero)*scale),
      -((this.state.init.yZero)*scale),
      null,
      null,
      scale
    );
  }

  beginDragViewport(event) {
    if(event.button == 0) {
      this.setState({dragging: true});
    }
  }

  endDragViewport(event) {
    this.setState({dragging: false});
  }

  trackMouseMove(event) {
    if(this.state.dragging) {
      event.preventDefault();
      event.stopPropagation();
      this.moveViewToClickLocation(event);
    }
  }

  suppress(event) {
    event.preventDefault();
    event.stopPropagation();
  }

  changeZoom(event) {
    //event.stopPropagation();
    event.preventDefault();
    // Needed to get offset from page to image
    var node = this.refs.image.getDOMNode().getBoundingClientRect();
    if(event.deltaY < 0) {
      // Zoom out
      ViewActions.updateViewport(
        -((event.clientX-node.left-this.state.view.width/2)*this.state.ratio + this.state.init.xZero)*this.state.view.zoom*1.05,
        -((event.clientY-node.top-this.state.view.height/2)*this.state.ratio + this.state.init.yZero)*this.state.view.zoom*1.05,
        null,
        null,
        this.state.view.zoom*1.05
      );
    }
    if(event.deltaY > 0) {
      // Zoom in
      ViewActions.updateViewport(
        -((event.clientX-node.left-this.state.view.width/2)*this.state.ratio + this.state.init.xZero)*this.state.view.zoom*0.95,
        -((event.clientY-node.top-this.state.view.height/2)*this.state.ratio + this.state.init.yZero)*this.state.view.zoom*0.95,
        null,
        null,
        this.state.view.zoom*0.95
      );
    }
  }

  zoomIn() {
    this.endZoom();
    var view = this.props.viewstore.getView();
    var self = this;
    this.timeout = window.setInterval(function() {
      ViewActions.updateViewport(
        (view.left-view.width*2.5/100)*1.05,
        (view.top-view.height*2.5/100)*1.05,
        null,
        null,
        self.state.view.zoom*1.05
      );
    }, 50);
  }

  zoomOut() {
    this.endZoom();
    var view = this.props.viewstore.getView();
    var self = this;
    this.timeout = window.setInterval(function() {
      ViewActions.updateViewport(
        (view.left+view.width*2.5/100)*0.95,
        (view.top+view.height*2.5/100)*0.95,
        null,
        null,
        self.state.view.zoom*0.95
      );
    }, 50);
  }

  endZoom() {
    window.clearInterval(this.timeout);
  }

  resetZoom() {
    var view = this.props.viewstore.getView();
    if(view.scale == 1.0) {
      return;
    }
    console.log(JSON.stringify(view));
    ViewActions.updateViewport(
      (view.left-view.width/2)/view.scale,
      (view.top-view.height/2)/view.scale,
      null,
      null,
      1.0
    );
  }

  displayAllElementsInView() {
    ViewActions.fitView();
  }

  render() {
    return(
      <div style={this.componentStyle}>
        <div style={this.imageContainerStyle}
             onClick={this.moveViewToClickLocation.bind(this)}
             onMouseDown={this.beginDragViewport.bind(this)}
             onMouseUp={this.endDragViewport.bind(this)}
             onMouseMove={this.trackMouseMove.bind(this)}
             onWheel={this.changeZoom.bind(this)}>
          <img
            className='ui fluid image'
            style={this.imageStyle}
            src={this.state.init.imgUrl}
            alt="Pas d'image active"
            onDragStart={this.suppress.bind(this)}
            ref="image"/>
          <div style={this.boundingBoxStyle} />
        </div>

        <div className='ui fluid buttons'>
          <button className='ui button small compact'
                  onMouseDown={this.zoomOut.bind(this)}
                  onMouseUp={this.endZoom.bind(this)}
                  onMouseOut={this.endZoom.bind(this)}><i className='ui large zoom out icon' /></button>
          <button style={this.buttonStyle}
                  className='ui button small compact'
                  disabled='disabled'>{(this.state.view.zoom*100).toFixed(0)}%</button>
          <button className='ui button small compact'
                  onMouseDown={this.zoomIn.bind(this)}
                  onMouseUp={this.endZoom.bind(this)}
                  onMouseOut={this.endZoom.bind(this)}><i className='ui large zoom icon' /></button>
        </div>

        <div className='ui fluid buttons'>
          <AbstractTool />
          <MoveObject />
          <SelectObject />
        </div>

        <div className='ui fluid buttons'>
          <button style={this.buttonStyle}
                  className='ui button small compact'
                  onClick={this.displayAllElementsInView.bind(this)}
                  data-content='Afficher toutes les images'>Tout</button>
          <button className='ui button small compact' data-content="Voir l'image à l'échelle 1:1"
                  style={this.buttonStyle}
                  onClick={this.resetZoom.bind(this)}>1:1</button>
          <button style={this.buttonStyle}
                  className='ui button small compact'
                  data-content="Afficher l'image active en entier"
                  onClick={this.fitViewToImage.bind(this)}>Planche</button>
        </div>
      </div>
    );
  }
}

export default Minimap;