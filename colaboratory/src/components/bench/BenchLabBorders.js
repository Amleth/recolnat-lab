/**
 * Created by dmitri on 02/03/16.
 */
'use strict';

import React from 'react';

import ViewActions from '../../actions/ViewActions';

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

    this.borderSize = '20px';
    this.leftBorderStyle = {
      position: 'absolute',
      left: 0,
      top: 0,
      width: this.borderSize,
      height: '100%',
      //backgroundColor: 'rgba(127,127,127,0.3)',
      pointerEvents: 'auto'
    };

    this.rightBorderStyle = {
      position: 'absolute',
      right: 0,
      top: 0,
      width: this.borderSize,
      height: '100%',
      //backgroundColor: 'rgba(127,127,127,0.3)',
      pointerEvents: 'auto'
    };

    this.topBorderStyle = {
      position: 'absolute',
      left: 0,
      top: 0,
      width: '100%',
      height: this.borderSize,
      //backgroundColor: 'rgba(127,127,127,0.3)',
      pointerEvents: 'auto'
    };

    this.bottomBorderStyle = {
      position: 'absolute',
      left: 0,
      bottom: 0,
      width: '100%',
      height: this.borderSize,
      //backgroundColor: 'rgba(127,127,127,0.3)',
      pointerEvents: 'auto'
    };

    let view = props.viewstore.getView();

    this.arrowNStyle = {
      position: 'absolute',
      top: 0,
      left: view.width/2,
      pointerEvents: 'auto',
      width: 0,
      height: 0,
      borderLeft: '30px solid transparent',
      borderRight: '30px solid transparent',
      borderBottom: '30px solid rgba(127,127,127,0.5)'
    };

    this.arrowSStyle = JSON.parse(JSON.stringify(this.arrowNStyle));
    this.arrowSStyle.top = null;
    this.arrowSStyle.bottom = 0;
    this.arrowSStyle.WebkitTransform = 'rotate(180deg)';
    this.arrowSStyle.transform = 'rotate(180deg)';

    this.arrowWStyle = JSON.parse(JSON.stringify(this.arrowNStyle));
    this.arrowWStyle.top = view.height/2;
    this.arrowWStyle.left = '-10px';
    this.arrowWStyle.WebkitTransform = 'rotate(-90deg)';
    this.arrowWStyle.transform = 'rotate(-90deg)';

    this.arrowEStyle = JSON.parse(JSON.stringify(this.arrowNStyle));
    this.arrowEStyle.top = view.height/2;
    this.arrowEStyle.left = null;
    this.arrowEStyle.right = '-10px';
    this.arrowEStyle.WebkitTransform = 'rotate(90deg)';
    this.arrowEStyle.transform = 'rotate(90deg)';

    this.arrowNWStyle = JSON.parse(JSON.stringify(this.arrowNStyle));
    this.arrowNWStyle.top = '-3px';
    this.arrowNWStyle.left = '-15px';
    this.arrowNWStyle.WebkitTransform = 'rotate(-45deg)';
    this.arrowNWStyle.transform = 'rotate(-45deg)';

    this.arrowNEStyle = JSON.parse(JSON.stringify(this.arrowNStyle));
    this.arrowNEStyle.top = '-3px';
    this.arrowNEStyle.left = null;
    this.arrowNEStyle.right = '-15px';
    this.arrowNEStyle.WebkitTransform = 'rotate(45deg)';
    this.arrowNEStyle.transform = 'rotate(45deg)';

    this.arrowSWStyle = JSON.parse(JSON.stringify(this.arrowNStyle));
    this.arrowSWStyle.top = null;
    this.arrowSWStyle.bottom = '-3px';
    this.arrowSWStyle.left = '-15px';
    this.arrowSWStyle.WebkitTransform = 'rotate(-135deg)';
    this.arrowSWStyle.transform = 'rotate(-135deg)';

    this.arrowSEStyle = JSON.parse(JSON.stringify(this.arrowNStyle));
    this.arrowSEStyle.top = null;
    this.arrowSEStyle.left = null;
    this.arrowSEStyle.bottom = '-3px';
    this.arrowSEStyle.right = '-15px';
    this.arrowSEStyle.WebkitTransform = 'rotate(135deg)';
    this.arrowSEStyle.transform = 'rotate(135deg)';

    this.scrollInterval = null;

    this._onViewChange = () => {
      const updateArrowPositions = () => this.updateArrowPositions(this.props.viewstore.getView());
      return updateArrowPositions.apply(this);
    };
  }

  updateArrowPositions(view) {
    this.arrowNStyle.left = view.width / 2;
    this.arrowSStyle.left = view.width / 2;
    this.arrowEStyle.top = view.height / 2;
    this.arrowWStyle.top = view.height / 2;
    this.setState({});
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

  componentDidMount() {
    this.props.viewstore.addViewportListener(this._onViewChange);
  }

  componentWillUnmount() {
    this.props.viewstore.removeViewportListener(this._onViewChange);
  }

  render() {
    return <div style={this.componentStyle}>
      <div style={this.arrowNWStyle}
           onMouseEnter={this.startScroll.bind(this, true, false, false, true)}
           onMouseLeave={this.stopScrolling.bind(this)}>
      </div>
      <div style={this.arrowNStyle}
           onMouseEnter={this.startScroll.bind(this, true, false, false, false)}
           onMouseLeave={this.stopScrolling.bind(this)}> </div>
      <div style={this.arrowNEStyle}
           onMouseEnter={this.startScroll.bind(this, true, true, false, false)}
           onMouseLeave={this.stopScrolling.bind(this)}> </div>

      <div style={this.arrowWStyle}
           onMouseEnter={this.startScroll.bind(this, false, false, false, true)}
           onMouseLeave={this.stopScrolling.bind(this)}> </div>
      <div style={this.arrowEStyle}
           onMouseEnter={this.startScroll.bind(this, false, true, false, false)}
           onMouseLeave={this.stopScrolling.bind(this)}> </div>

      <div style={this.arrowSWStyle}
           onMouseEnter={this.startScroll.bind(this, false, false, true, true)}
           onMouseLeave={this.stopScrolling.bind(this)}> </div>
      <div style={this.arrowSStyle}
           onMouseEnter={this.startScroll.bind(this, false, false, true, false)}
           onMouseLeave={this.stopScrolling.bind(this)}> </div>
      <div style={this.arrowSEStyle}
           onMouseEnter={this.startScroll.bind(this, false, true, true, false)}
           onMouseLeave={this.stopScrolling.bind(this)}> </div>

    </div>
  }
}

export default WorkbenchBorders;