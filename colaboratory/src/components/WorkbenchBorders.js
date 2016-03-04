/**
 * Created by dmitri on 02/03/16.
 */
'use strict';

import React from 'react';

import ViewActions from '../actions/ViewActions';

class WorkbenchBorders extends React.Component {
  constructor(props) {
    super(props);

    this.componentStyle = {
      position: 'absolute',
      left: 0,
      top: 0,
      height: '100%',
      width: '100%',
      pointerEvents: 'none'
    };

    this.borderSize = '30px';
    this.leftBorderStyle = {
      position: 'absolute',
      left: 0,
      top: 0,
      width: this.borderSize,
      height: '100%',
      backgroundColor: 'rgba(127,127,127,0.3)',
      pointerEvents: 'auto'
    };

    this.rightBorderStyle = {
      position: 'absolute',
      right: 0,
      top: 0,
      width: this.borderSize,
      height: '100%',
      backgroundColor: 'rgba(127,127,127,0.3)',
      pointerEvents: 'auto'
    };

    this.topBorderStyle = {
      position: 'absolute',
      left: 0,
      top: 0,
      width: '100%',
      height: this.borderSize,
      backgroundColor: 'rgba(127,127,127,0.3)',
      pointerEvents: 'auto'
    };

    this.bottomBorderStyle = {
      position: 'absolute',
      left: 0,
      bottom: 0,
      width: '100%',
      height: this.borderSize,
      backgroundColor: 'rgba(127,127,127,0.3)',
      pointerEvents: 'auto'
    };

    this.scrollInterval = null;
  }

  startScroll(top, right, bottom, left) {
    this.scrollInterval =
      window.setInterval(
        this.scroll.bind(this, top, right, bottom, left),
        10);
  }

  scroll(top, right, bottom, left) {
    var viewport = this.props.viewstore.getView();
    var newLeft = viewport.left;
    var newTop = viewport.top;
    var moveFactor = 1;

    if (viewport.scale < 0.1) {
      moveFactor = 2;
    }
    else if(viewport.scale < 0.5) {
      moveFactor = 3;
    }
      else if(viewport.scale < 1) {
      moveFactor = 4;
    }
    else {
      moveFactor = 5;
    }

    if (top) {
      newTop = newTop + moveFactor;
    }
    else if (bottom) {
      newTop = newTop - moveFactor;
    }

    if (right) {
      newLeft = newLeft - moveFactor;
    }
    else if (left) {
      newLeft = newLeft + moveFactor;
    }

    ViewActions.updateViewport(newLeft, newTop, null, null, null);
  }

  stopScrolling() {
    window.clearInterval(this.scrollInterval);
  }

  render() {
    return <div style={this.componentStyle}>
      <div style={this.leftBorderStyle}
           onMouseEnter={this.startScroll.bind(this, false, false, false, true)}
           onMouseLeave={this.stopScrolling.bind(this)}>
      </div>
      <div style={this.rightBorderStyle}
           onMouseEnter={this.startScroll.bind(this, false, true, false, false)}
           onMouseLeave={this.stopScrolling.bind(this)}>
      </div>
      <div style={this.topBorderStyle}
           onMouseEnter={this.startScroll.bind(this, true, false, false, false)}
           onMouseLeave={this.stopScrolling.bind(this)}>
      </div>
      <div style={this.bottomBorderStyle}
           onMouseEnter={this.startScroll.bind(this, false, false, true, false)}
           onMouseLeave={this.stopScrolling.bind(this)}>
      </div>
    </div>
  }
}

export default WorkbenchBorders;