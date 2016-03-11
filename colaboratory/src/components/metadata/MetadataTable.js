/**
 * Created by dmitri on 15/02/16.
 */
'use strict';

import React from 'react';

class MetadataTable extends React.Component {
  constructor(props) {
    super(props);

    this.textStyle = {
      wordBreak: 'break-all'
    };

    this.accordionTitleStyle = {
      backgroundColor: '#a39d76'
    };

    this.contentStyle = {
      padding: '2px 2px 2px 2px'
    };

    this.state = {
      metadata: []
    };

    if(props.metadata) {
      this.state.metadata = JSON.parse(JSON.stringify(this.props.metadata));
    }
  }

  componentWillUpdate(nextProps, nextState) {
    //console.log('Updating metadata with ' + JSON.stringify(nextProps.metadata));
    if(nextProps.metadata) {
      nextState.metadata = JSON.parse(JSON.stringify(nextProps.metadata));
    }
    else {
      nextState.metadata = [];
    }
  }

  buildDisplayTableBody() {
    console.log(JSON.stringify(this.state.metadata));
    return <tbody>{this.state.metadata.map(function(elt, index) {
      return <tr key={'META-' + index}><td className='ui right aligned' >{elt.key}</td><td style={self.textStyle} className='ui left aligned'>{elt.value}</td></tr>;
    })}</tbody>;
  }

  render() {
    if(this.state.metadata.length == 0) {
      return null;
    }

    return <div className='ui container'>
      <p className='ui title' style={this.accordionTitleStyle}>{this.props.title}</p>
      <div className='ui content' style={this.contentStyle}>
        <table className='ui selectable striped very compact table'>
          <thead>
          <tr><th className='four wide'>Nom</th><th className='twelve wide'>Valeur</th></tr>
          </thead>
          {this.buildDisplayTableBody()}
        </table>
      </div>
    </div>
  }
}

export default MetadataTable;