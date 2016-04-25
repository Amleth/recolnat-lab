/**
 * Created by dmitri on 21/04/16.
 */
'use strict';

import React from 'react';

import ViewActions from '../../actions/ViewActions';

class ViewController extends React.Component {
  constructor(props) {
    super(props);

    this.buttonStyle = {
      fontFamily: 'Roboto Condensed',
      fontWeight: '300'
    };

    this.labelStyle = {
      position: 'relative',
      top: '-25px',
      left: '-10px'
    };

    this.state = {
      zoom: 1.0
    };

    this._onViewChange = () => {
      const updateView = () => this.updateViewData(this.props.viewstore.getView());
      return updateView.apply(this);
    };

    this.timeout = null;
  }

  updateViewData(view) {
    this.setState({zoom: view.scale});
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
        self.state.zoom*1.05
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
        self.state.zoom*0.95
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
    //console.log(JSON.stringify(view));
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

  fitViewToImage() {
    var image = this.props.ministore.getImage();
    var scale = 1.0;

    if(image.height > image.width) {
      scale = (this.props.viewstore.getView().height) / image.height;
    }
    else {
      scale = (this.props.viewstore.getView().width) / image.width;
    }

    ViewActions.updateViewport(
      -((image.xZero)*scale),
      -((image.yZero)*scale),
      null,
      null,
      scale
    );
  }

  render() {
    return <div
      style={this.componentStyle}
      className='ui container segment'
      ref='component'>
      <div className='ui blue tiny basic label'
           style={this.labelStyle}>
        Paillasse
      </div>
      <div className='ui three fluid buttons'>
        <button className='ui button small compact'
                onMouseDown={this.zoomOut.bind(this)}
                onMouseUp={this.endZoom.bind(this)}
                onMouseOut={this.endZoom.bind(this)}>
          <i className='ui large zoom out icon' />
        </button>
        <button style={this.buttonStyle}
                className='ui button small compact'
                disabled='disabled'>{(this.state.zoom*100).toFixed(0)}%
        </button>
        <button className='ui button small compact'
                onMouseDown={this.zoomIn.bind(this)}
                onMouseUp={this.endZoom.bind(this)}
                onMouseOut={this.endZoom.bind(this)}>
          <i className='ui large zoom icon' />
        </button>
      </div>

      <div className='ui three fluid buttons'>
        <button style={this.buttonStyle}
                className='ui button small compact'
                onClick={this.displayAllElementsInView.bind(this)}
                data-content='Afficher toutes les images'>Tout</button>
        <button style={this.buttonStyle}
                className='ui button small compact'
                data-content="Afficher l'image active en entier"
                onClick={this.fitViewToImage.bind(this)}>Planche</button>
        <button className='ui button small compact' data-content="Voir l'image à l'échelle 1:1"
                style={this.buttonStyle}
                onClick={this.resetZoom.bind(this)}>1:1</button>
      </div>
    </div>
  }
}

export default ViewController;