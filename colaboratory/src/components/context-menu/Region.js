'use strict';

import React from 'react';
import d3 from 'd3';

import ContextMenuItem from './ContextMenuItem';

class Region extends ContextMenuItem {
  constructor(props){
    super(props);

    this.state = {
      d3component: null,
      color: null
    };
  }

  beginHilight() {
    var comp = d3.select('#ROI-' + this.props.item.uid);
    var color = comp.attr('fill');
    var newColor = 'red';
    if(color == 'red') {
      newColor = 'blue';
    }

    this.setState(
      {d3component: comp,
        color: color});

    window.setTimeout(function() {
      ContextMenuItem.blink(comp, color, newColor, 'fill');
    }, 10);

  }

  endHilight() {
    this.state.d3component.interrupt().transition().attr('fill', this.state.color);
    this.setState({d3component: null,  color: null});
  }

  componentWillUnmount() {
    if(this.state.d3component) {
      this.state.d3component.interrupt().transition().attr('fill', this.state.color);
    }
  }

  actions() {
    return <div className='ui inverted flowing popup'>
      <div className='vertical inverted compact menu'>
        <a className='vertically fitted item'>Modifier</a>
        <a className='vertically fitted item'>Ajouter une annotation</a>
        <Remove errorCallback={this.logError.bind(this)} successCallback={this.reloadMetadata.bind(this)} id={this.props.item.uid} metadata={this.props.metadata}/>
      </div>
    </div>;
  }
}

export default Region;