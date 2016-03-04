'use strict';

import React from 'react';

import ViewActions from '../../actions/ViewActions';

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

  logError(err) {
    console.error(err);
    alert('La suppression a échoué');
  }

  reloadMetadata(res) {
    ViewActions.updateMetadata(this.props.entitystore.getSelectedImageId());
  }

  componentDidMount() {
    $(this.refs.self.getDOMNode()).popup({
      inline: true,
      hoverable: true,
      position: 'right center',
      prefer: 'opposite',
      lastResort: 'left center',
      closable: 'true',
      transition: 'horizontal flip',
      offset: 0,
      delay: {
        show: 500,
        hide: 450
      }
    });
  }

  render() {
    return <div className='ui container'>
      <div ref='self'
           className='ui item'
           onMouseEnter={this.beginHilight.bind(this)}
           onMouseLeave={this.endHilight.bind(this)}>
        {this.props.item.name.substr(0,30)}<i className='caret right icon' />
      </div>
      {this.actions()}
    </div>;
  }
}

export default ContextMenuItem;