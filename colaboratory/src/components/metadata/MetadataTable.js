/**
 * Created by dmitri on 15/02/16.
 */
'use strict';

import React from 'react';

class MetadataTable extends React.Component {
  constructor(props) {
    super(props);

    this.textStyle = {
      wordBreak: 'break-all',
      fontSize: 10,
      lineHeight: '10px',
      margin: 0,
      padding: '1px 1px 1px 3px'
    };

    this.labelStyle = {
      //wordBreak: 'break-all',
      fontSize: 10,
      lineHeight: '10px',
      margin: 0,
      padding: '1px 3px 1px 1px'
    };

    this.accordionTitleStyle = {
      marginBottom: 0
      //backgroundColor: '#a39d76'
    };

    this.headerStyle = {
      height: 0,
      lineHeight:0,
      overflow: 'hidden',
      margin: 0,
      padding:0
    };

    this.headerRowStyle = {
      padding:0,
      margin:0
    };

    this.headerCellStyle = {
      padding:0,
      margin:0
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

  componentDidMount() {
    this.props.userstore.addLanguageChangeListener(this.setState.bind(this, {}));
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

  componentWillUnmount() {
    this.props.userstore.removeLanguageChangeListener(this.setState.bind(this, {}));
  }

  buildDisplayTableBody() {
    //console.log(JSON.stringify(this.state.metadata));
    return <tbody>{this.state.metadata.map(function(elt, index) {
      return (
        <tr key={'META-' + index}>
          <td className='ui right aligned' >{elt.key}</td>
          <td style={self.textStyle} className='ui left aligned'>{elt.value}</td>
        </tr>);
    })}</tbody>;
  }

  render() {
    if(this.state.metadata.length == 0) {
      return null;
    }

    return <div className='ui container'>
      <p className='ui title' style={this.accordionTitleStyle}>
        <i className="dropdown icon"></i>
        {this.props.title}
      </p>
      <div className='ui content' style={this.contentStyle}>
        <table className='ui basic striped very compact table'>
          <thead style={this.headerStyle}>
            <tr style={this.headerRowStyle}>
              <th className='six wide' style={this.headerCellStyle}></th>
              <th className='ten wide' style={this.headerCellStyle}></th>
            </tr>
          </thead>
          {this.buildDisplayTableBody()}
        </table>
      </div>
    </div>
  }
}

export default MetadataTable;
