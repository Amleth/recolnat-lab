'use strict';

import React from 'react';
import _ from 'lodash';

import D3FreeSpace from './D3FreeSpace';

import MinimapActions from "../actions/MinimapActions";
import MetadataActions from '../actions/MetadataActions';
import ViewActions from '../actions/ViewActions';
import ToolActions from '../actions/ToolActions';

import ModeConstants from '../constants/ModeConstants';

import ToolConf from '../conf/Tools-conf';

let d3Component = new D3FreeSpace();

class FreeSpace extends React.Component {
  constructor(props) {
    super(props);

    this.style = {
      width: this.props.width,
      height: this.props.height
    };

    this._onChangeSetId = () => {
      const requestLoad = () =>
        this.clearLabBench();
      return requestLoad.apply(this);
    };

    this._onActiveViewChange = () => {
      const displayLabBench = () => this.displayLabBench();
      return displayLabBench.apply(this);
    };

    this._onBenchLoaded = () => {
      const displayLabBench = () => this.displayLabBench();
      return displayLabBench.apply(this);
    };

    this._onFitView = () => {
      const fitView = () => this.fitView();
      return fitView.apply(this);
    };

    this._onViewportUpdate = () => {
      const viewportUpdate = () => this.viewportUpdate(this.props.viewstore.getView());
      return viewportUpdate.apply(this);
    };

    this._onViewPropertiesUpdate = () => {
      const viewPropertiesUpdate = () => this.viewPropertiesUpdate(this.props.viewstore.getViewProperties());
      return viewPropertiesUpdate.apply(this);
    };

    this.state = {
      pinchLength: null
    };
  }

  clearLabBench() {
    d3Component.clearDisplay();
    d3Component.newLabBench();
    var id = this.props.managerstore.getSelected().id;
    window.setTimeout(MetadataActions.loadLabBench.bind(null, id), 10);
    window.setTimeout(MinimapActions.unsetMinimap, 10);
  }

  displayLabBench() {
    if(this.props.benchstore.getActiveViewId()) {
      d3Component.loadView(this.props.benchstore.getActiveViewId());

      if(this.props.modestore.isInOrganisationMode()) {
        window.setTimeout(
          ToolActions.setTool.bind(null, ToolConf.moveObject.id), 500
        );
      }
    }
  }

  displayDragged(event) {
    if(this.props.drag.getType() == 'inboxMove') {
      event.preventDefault();
      d3Component.displayShadow(this.props.drag.getData());
    }
  }

  fitView() {
    d3Component.fitViewportToData();
  }

  viewportUpdate(view) {
    d3Component.updateViewport(view.left, view.top, view.scale, view.animate);
  }

  viewPropertiesUpdate(viewProps) {
    d3Component.updateViewWithProperties(viewProps);
  }

  pinchZoom(event) {
    if(event.touches.length == 2) {
      var length = Math.pow((event.touches[0].screenX - event.touches[1].screenX),2) + Math.pow((event.touches[0].screenY - event.touches[1].screenY), 2);
      if (this.state.pinchLength) {
        var view = this.props.viewstore.getView();
        if(this.state.pinchLength < length) {
          // User zooming out
          window.setTimeout(ViewActions.updateViewport.bind(null, null, null, null, null, view.scale*0.99), 10);
        }
        else {
          // User zooming in
          window.setTimeout(ViewActions.updateViewport.bind(null, null, null, null, null, view.scale*1.01), 10);
        }
      }
        this.setState({pinchLength: length});
    }
  }

  clearTouch(event) {
    this.setState({pinchLength: null});
  }

  componentDidMount() {
    let el = React.findDOMNode(this);
    d3Component.create(
      el,
      {
        width: '100%',
        height: '100%'
      }
    );
    d3Component.setMetadataStore(this.props.metastore);
    d3Component.setLabBenchStore(this.props.benchstore);
    d3Component.setViewStore(this.props.viewstore);
    this.props.viewstore.addFitViewListener(this._onFitView);
    this.props.viewstore.addViewportListener(this._onViewportUpdate);
    this.props.viewstore.addViewPropertiesUpdateListener(this._onViewPropertiesUpdate);
    this.props.benchstore.addActiveSetChangeListener(this._onChangeSetId);
    this.props.benchstore.addLabBenchLoadListener(this._onBenchLoaded);
  }

  componentWillUnmount() {
    this.props.viewstore.removeFitViewListener(this._onFitView);
    this.props.viewstore.removeViewportListener(this._onViewportUpdate);
    this.props.viewstore.removeViewPropertiesUpdateListener(this._onViewPropertiesUpdate);
    this.props.benchstore.removeActiveSetChangeListener(this._onChangeSetId);
    this.props.benchstore.removeLabBenchLoadListener(this._onBenchLoaded);
  }

  render() {
    return (
      <div className="freespace"
           onTouchMove={this.pinchZoom.bind(this)}
           onTouchEnd={this.clearTouch.bind(this)}
           onDragEnter={this.displayDragged.bind(this)}
           style={this.style}></div>
    );
  }
}

export default FreeSpace;
