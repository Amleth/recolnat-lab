'use strict';

import React from 'react';

class ContextMenuItem extends React.Component {
  constructor(props) {
    super(props);
  }
  
  actions() {
    console.error('Call to method code which must be extended in subclass');
    return null;
  }
  
  beginHilight() {
    console.error('Call to method code which must be extended in subclass');
  }
  
  endHilight() {
    console.error('Call to method code which must be extended in subclass');
  }
  
  static blink(d3Node, startAttributeValue, endAttributeValue, attributeName) {
    function repeat() {
      d3Node.attr(attributeName, startAttributeValue)
      .transition()
      .duration(1000)
      .ease('linear')
      .attr(attributeName, endAttributeValue)
      .transition()
      .duration(1000)
      .ease('linear')
      .attr(attributeName, startAttributeValue)
      .each('end', repeat);
    }
    
    repeat();
  }
  
  render() {
    return <div className='ui dropdown item' 
    onMouseEnter={this.beginHilight.bind(this)} 
    onMouseLeave={this.endHilight.bind(this)}>
    {this.props.item.name.substr(0,30)} <i className='ui dropdown icon'/>
    <div className='ui menu'>
    {this.actions.bind(this)}
    </div>
    </div>
  }
}

export default ContextMenuItem;