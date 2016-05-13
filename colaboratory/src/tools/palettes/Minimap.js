/**
 * Created by hector on 04/08/15.
 */
"use strict";

import React from "react";

import MinimapActions from "../../actions/MinimapActions";
import ViewActions from "../../actions/ViewActions";

import AbstractTool from "../AbstractTool";
import MoveObject from "../impl/MoveObject";
import MoveView from "../impl/MoveView";
import SelectObject from '../impl/SelectObject';

class Minimap extends React.Component {
  constructor(props) {
    super(props);

    this.componentStyle = {
//       display: "none",
      display: 'flex',
      flexDirection: "column"
    };

    this.imageContainerStyle = {
      position: "relative",
      //left: "0px",
      //top: "0px",
      overflow: "hidden"
    };

    this.imageStyle = {
      minWidth: '185px',
      width: '185px',
      maxWidth: '185px'
    };

    this.boundingBoxStyle = {
      display: "inline",
      position: "absolute",
      borderStyle: "solid",
      borderWidth: "1px",
      borderColor: "red"
    };

    this._onImageInit = () => {
      const initMap = () => this.initMinimap(this.props.ministore.getImage(), this.props.viewstore.getView());
      return initMap.apply(this);
    };

    this._onViewChange = () => {
      const updateView = () => this.updateViewportLocation(this.props.viewstore.getView());
      return updateView.apply(this);
    };

    this._onLabBenchUpdate = () => {
      const updateStoreWithPosition = () => {
        this.updateStoreWithPosition();
      };
      return updateStoreWithPosition.apply(this);
    };

    this.state = {
      imgUrl: null,
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
  }

  updateStoreWithPosition() {
    var imageId = this.props.toolstore.getSelectedImageId();
    if(!imageId) {
      return;
    }
    var viewData = this.props.benchstore.getActiveViewData();
    var imageUrl = this.props.ministore.getImage().url;
    if(!imageUrl) {
      return;
    }

    for(var i = 0; i < viewData.displays.length; ++i) {
      if(viewData.displays[i].link == imageId) {
        var displayData = viewData.displays[i];

        window.setTimeout(
        MinimapActions.initMinimap.bind(null, imageUrl, displayData.displayWidth, displayData.displayHeight, displayData.x, displayData.y), 10);
        break;
      }
    }
  }

  initMinimap(image, view) {
    this.setState({
      imgUrl: image.url,
      ratio: null
    });
  }

  updateViewportLocation(view) {
    var node = this.refs.image.getDOMNode().getBoundingClientRect();
    var image = this.props.ministore.getImage();
    var ratio = image.height/node.height;
    this.setState({
      view: {
        top: -(view.top/view.scale + image.yZero)/(ratio),
        left: -(view.left/view.scale + image.xZero)/(ratio),
        height: view.height/(ratio*view.scale),
        width: view.width/(ratio*view.scale),
        zoom: view.scale
      },
      ratio: ratio
    });
  }

  moveViewToClickLocation(event) {
    var image = this.props.ministore.getImage();
    var node = this.refs.image.getDOMNode().getBoundingClientRect();

    ViewActions.updateViewport(
      -((event.clientX-node.left-this.state.view.width/2)*this.state.ratio + image.xZero)*this.state.view.zoom,
      -((event.clientY-node.top-this.state.view.height/2)*this.state.ratio + image.yZero)*this.state.view.zoom,
      this.state.view.width*this.state.ratio*this.state.view.zoom,
      this.state.view.height*this.state.ratio*this.state.view.zoom,
      this.state.view.zoom,
      true
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
    var image = this.props.ministore.getImage();
    if(event.deltaY < 0) {
      // Zoom out
      ViewActions.updateViewport(
        -((event.clientX-node.left-this.state.view.width/2)*this.state.ratio + image.xZero)*this.state.view.zoom*1.05,
        -((event.clientY-node.top-this.state.view.height/2)*this.state.ratio + image.yZero)*this.state.view.zoom*1.05,
        null,
        null,
        this.state.view.zoom*1.05,
        true
      );
    }
    if(event.deltaY > 0) {
      // Zoom in
      ViewActions.updateViewport(
        -((event.clientX-node.left-this.state.view.width/2)*this.state.ratio + image.xZero)*this.state.view.zoom*0.95,
        -((event.clientY-node.top-this.state.view.height/2)*this.state.ratio + image.yZero)*this.state.view.zoom*0.95,
        null,
        null,
        this.state.view.zoom*0.95,
        true
      );
    }
  }

  componentDidMount() {
    this.props.ministore.addInitListener(this._onImageInit);
    this.props.viewstore.addViewportListener(this._onViewChange);
    this.props.benchstore.addLabBenchLoadListener(this._onLabBenchUpdate);
    $('.ui.button.small.compact', this.refs.component.getDOMNode()).popup();
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
  }

  componentDidUpdate(prevProps, prevState) {
    if(this.state.ratio == null) {
      this.updateViewportLocation(this.props.viewstore.getView());
    }
  }

  componentWillUnmount() {
    this.props.ministore.removeInitListener(this._onImageInit);
    this.props.viewstore.removeViewportListener(this._onViewChange);
    this.props.benchstore.removeLabBenchLoadListener(this._onLabBenchUpdate);
  }

  render() {
    return(
      <div style={this.componentStyle}
           className='ui container'
           ref='component'>
        <div style={this.imageContainerStyle}
             onClick={this.moveViewToClickLocation.bind(this)}
             onMouseDown={this.beginDragViewport.bind(this)}
             onMouseUp={this.endDragViewport.bind(this)}
             onMouseMove={this.trackMouseMove.bind(this)}
             onWheel={this.changeZoom.bind(this)}>
          <img
            className='ui fluid image'
            style={this.imageStyle}
            src={this.state.imgUrl}
            alt="Pas d'image active"
            onDragStart={this.suppress.bind(this)}
            ref="image"/>
          <div style={this.boundingBoxStyle} />
        </div>
      </div>
    );
  }
}

export default Minimap;