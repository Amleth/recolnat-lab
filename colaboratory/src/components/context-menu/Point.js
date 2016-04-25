'use strict';

import React from 'react';
import d3 from 'd3';

import ContextMenuItem from './ContextMenuItem';

class Point extends ContextMenuItem {
  constructor(props){
    super(props);

    this.state = {
      rect: null,
      text: null,
      rectColor: null,
      textColor: null
    };
  }

  beginHilight() {
    var bakRect = d3.select('#POI-' + this.props.item.uid).select('rect');
    var text = d3.select('#POI-' + this.props.item.uid).select('text');
    this.setState({rect: bakRect,
        text: text,
        rectColor: bakRect.attr('fill'),
        textColor: text.attr('fill')});

    window.setTimeout(function() {
      ContextMenuItem.blink(bakRect, bakRect.attr('fill'), text.attr('fill') , 'fill');
      ContextMenuItem.blink(text, text.attr('fill'), bakRect.attr('fill') , 'fill');
    }, 10);

  }

  endHilight() {
    this.state.rect.interrupt().transition().attr('fill', this.state.rectColor);
    this.state.text.interrupt().transition().attr('fill', this.state.textColor);
    this.setState({rect: null, text: null, rectColor: null, textColor: null});
  }

  logError(err) {
    console.error(err);
    alert('La suppression a échoué');
  }

  reloadMetadata(res) {
    ViewActions.updateMetadata(this.props.item.uid);
  }

  componentWillUnmount() {
    if(this.state.rect) {
      this.state.rect.interrupt().transition().attr('fill', this.state.rectColor);
      this.state.text.interrupt().transition().attr('fill', this.state.textColor);
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

export default Point;