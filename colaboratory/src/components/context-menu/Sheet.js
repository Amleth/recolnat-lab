
'use strict';

import React from 'react';
import d3 from 'd3';

import ContextMenuItem from './ContextMenuItem';

class Sheet extends ContextMenuItem {
  constructor(props){
    super(props);

    this.state = {
      d3component: null,
      color: null
    };
  }

  beginHilight() {
    var comp = d3.select('#BORDER-' + this.props.item.uid);
    var color = comp.attr('fill');
    var newColor = 'red';

    this.setState(
      {
        d3component: comp,
        color: color
      });

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
        <a className='vertically fitted item'>Sélectionner</a>
        <a className='vertically fitted item'>Ajouter une annotation</a>
        <a className='vertically fitted item'>Enlever de l'étude</a>
        <a className='vertically fitted item'>Ajouter aux favoris</a>
      </div>
    </div>;
  }
}

export default Sheet;