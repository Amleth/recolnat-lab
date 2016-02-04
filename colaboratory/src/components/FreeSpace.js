'use strict';

import React from 'react';
import _ from 'lodash';

import D3FreeSpace from './D3FreeSpace';

import MinimapActions from "../actions/MinimapActions";

let d3Component = new D3FreeSpace();

class FreeSpace extends React.Component {
  constructor(props) {
    super(props);

    this.style = {
      width: this.props.width,
      height: this.props.height
    };

    this._onFitView = () => {
      const fitView = () => this.fitView();
      return fitView.apply(this);
    };

    this._onViewportUpdate = () => {
      const viewportUpdate = () => this.viewportUpdate(this.props.viewstore.getView());
      return viewportUpdate.apply(this);
    };

    this._onMetadataUpdate = () => {
      const metadataUpdate = () => this.setState({entityMetadata: this.props.entitystore.getAllMetadata()});
      return metadataUpdate.apply(this);
    };

    this._onViewPropertiesUpdate = () => {
      const viewPropertiesUpdate = () => this.setState({viewProps: this.props.viewstore.getViewProperties()});
      return viewPropertiesUpdate.apply(this);
    };

    this.state = {
      entityMetadata: this.props.entitystore.getAllMetadata(),
      viewProps: this.props.viewstore.getViewProperties()
    };
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
    d3Component.setDataStore(this.props.entitystore);
    this.props.viewstore.addFitViewListener(this._onFitView);
    this.props.viewstore.addViewportListener(this._onViewportUpdate);
    this.props.viewstore.addViewPropertiesUpdateListener(this._onViewPropertiesUpdate);
    this.props.entitystore.addMetadataUpdateListener(this._onMetadataUpdate);
  }

  componentDidUpdate(prevProps, prevState) {
    let el = React.findDOMNode(this);
    if(prevProps.workbench != this.props.workbench) {
      window.setTimeout(function() {
        MinimapActions.unsetMinimap();
      }, 25);
      d3Component.clearDisplay();
      d3Component.newWorkbench(this.props.childEntities, this.props.workbench);
    }
    else if(this.props.childEntities != prevProps.childEntities) {
      d3Component.updateChildEntities(this.props.childEntities);
    }
    d3Component.updateWorkbenchMetadata(this.props.metadata);
    d3Component.updateEntitiesMetadata(this.state.entityMetadata);
    d3Component.updateViewWithProperties(this.state.viewProps);
  }

  componentWillUnmount() {
    this.props.viewstore.removeFitViewListener(this._onFitView);
    this.props.viewstore.removeViewportListener(this._onViewportUpdate);
    this.props.viewstore.removeViewPropertiesUpdateListener(this._onViewPropertiesUpdate);
    this.props.entitystore.removeMetadataUpdateListener(this._onMetadataUpdate);
  }

  displayDragged(event) {
    if(this.props.drag.getType() == 'inboxMove') {
      event.preventDefault();
      d3Component.displayShadow(this.props.drag.getData());
    }
  }

  //updateDraggedPosition(event) {
  //  //var data = JSON.parse(event.dataTransfer.getData('text'));
  //  d3Component.moveShadow();
  //}

  fitView() {
    d3Component.fitViewportToData();
  }

  viewportUpdate(view) {
    //console.log("View update received");
    d3Component.updateViewport(view.left, view.top, view.width, view.height, view.scale);
  }

  render() {
    return (
      <div className="freespace"
           onDragEnter={this.displayDragged.bind(this)}
           style={this.style}></div>
    );
  }
}

export default FreeSpace;