/**
 * Created by dmitri on 30/11/15.
 */
'use strict';

import React from 'react';

import MetadataViewer from './../MetadataViewer';
import UserLabBook from './../lab-book/UserLabBook';
import SheetLabBook from './../lab-book/SheetLabBook';
import GroupLabBook from './../lab-book/GroupLabBook';
import ElementInspector from './../../tools/palettes/ElementInspector';
import TagCloud from './../../tools/palettes/TagCloud';

class RightPane extends React.Component {

  constructor(props) {
    super(props);

    this.containerStyle = {
      backgroundColor: '#F2F2F2',
      height: '100%',
      width: '100%'
      //overflow: 'auto'
    };

    this.textStyle = {
      wordBreak: 'break-all'
    };

    this.tabTitleStyle = {
      height: '5%'
      //padding: '5px 5px 5px 5px',
      //margin: '0'
    };

    this.tabContentStyle = {
      height: '95%',
      padding: '2px 2px 2px 2px'
      //overflow: 'auto'
    };

  }

  componentDidMount() {
  }

  render() {
    var self = this;
    return(
      <div style={this.containerStyle}>
          <MetadataViewer
            height='32%'
            toolstore={this.props.toolstore}
            metastore={this.props.metastore}
            viewstore={this.props.viewstore}
            benchstore={this.props.benchstore}
            />
        <TagCloud height='32%' />
        <ElementInspector
          height='32%'
        />
        </div>
    );
  }
}

export default RightPane;