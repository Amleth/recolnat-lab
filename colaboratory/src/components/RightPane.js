/**
 * Created by dmitri on 30/11/15.
 */
'use strict';

import React from 'react';

import MetadataViewer from './MetadataViewer';
import UserLabBook from './lab-book/UserLabBook';
import SheetLabBook from './lab-book/SheetLabBook';
import GroupLabBook from './lab-book/GroupLabBook';

class RightPane extends React.Component {

  constructor(props) {
    super(props);

    this.containerStyle = {
      backgroundColor: '#F2F2F2',
      height: '95%',
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
    $('.menu .worktab', $(this.refs.tabs.getDOMNode())).tab();
  }

  componentWillUnmount() {

  }

  componentWillUpdate(nextProps, nextState) {

  }

  render() {
    var self = this;
    return(
      <div style={this.containerStyle}>
        <div className='ui top attached tabular menu'
             ref='tabs'
             style={this.tabTitleStyle}>
          <a className={"ui active item worktab"}
             data-tab="metadata">
            <i className="ui find icon"></i>
          </a>
          <a className={"ui item"}
             data-tab="journal">
            <i className="ui book icon"></i>
          </a>
          <a className={"ui item"}
             data-tab="comments">
            <i className="ui comments icon"></i>
          </a>
        </div>
        <div className="ui bottom attached active tab segment"
             data-tab="metadata"
             style={this.tabContentStyle}>
          <MetadataViewer viewstore={this.props.viewstore} entitystore={this.props.entitystore}/>
        </div>
        <div className="ui bottom attached tab segment"
             data-tab="journal"
             style={this.tabContentStyle}>
          <div className='ui top attached tabular menu'
               style={this.tabTitleStyle}>
            <a className={"ui active item"}
               data-tab="journal-user"><i className="ui user icon"></i></a>
            <a className={"ui item"}
               data-tab="journal-group"><i className="ui users icon"></i></a>
            <a className={"ui item"}
               data-tab="journal-sheet"><i className="ui newspaper icon"></i></a>
          </div>
          <div className='ui bottom attached active tab segment'
               data-tab='journal-user'
               style={this.tabContentStyle}>
            <UserLabBook userstore={this.props.userstore}/>
          </div>
          <div className='ui bottom attached tab segment'
               data-tab='journal-sheet'
               style={this.tabContentStyle}>
            <SheetLabBook userstore={this.props.userstore} entitystore={this.props.entitystore}/>
          </div>
          <div className='ui bottom attached tab segment'
               data-tab='journal-group'
               style={this.tabContentStyle}>
            <GroupLabBook userstore={this.props.userstore}/>
          </div>

        </div>
        <div className="ui bottom attached tab segment"
             data-tab="comments"
             style={this.tabContentStyle}>
          <p>Discussions et commentaires</p>
        </div>
      </div>
    );
  }
}

export default RightPane;