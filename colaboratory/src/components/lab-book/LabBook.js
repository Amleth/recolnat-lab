/**
 * Created by dmitri on 03/12/15.
 */
'use strict';

import React from 'react';
import request from 'superagent';
import uuid from 'node-uuid';

import LabBookEntry from './LabBookEntry';

import conf from '../../conf/ApplicationConfiguration';

class LabBook extends React.Component {
  constructor(props) {
    super(props);

    this.containerStyle = {
      height: '95%'
    };

    this.titleStyle = {
      //height: '5%'
    };

    this.buttonRowStyle = {
      //height: '5%'
    };

    this.actionListStyle = {
      height: '90%',
      //maxHeight: '100%',
      overflow: 'auto'
    };

    this._onUserLogIn = () => {
      const userLogIn = () => this.loadLog();
      return userLogIn.apply(this);
    };

    this._onUserLogOut = () => {
      const userLogOut = () => this.setState({actions: []});
      return userLogOut.apply(this);
    };

    this.state = {
      actions: [],
      active: false,
      actionsPerPage: 10,
      offset: 0,
      previousPage: '',
      nextPage: ''
    };

    this.title = "Cahier de laboratoire";
  }

  loadLog() {
    request.post(conf.actions.userProfileServiceActions.getRecentActivity)
      .send({user: this.props.userstore.getUser().rPlusId})
      .withCredentials()
      .end((err, res) => {
        if(err) {
          console.error("Could not get data about object " + err);
        } else {
          var response = JSON.parse(res.text);
          response.actions.forEach(function(value, index, array) {
            value.key = "KEY-" + uuid.v4();
          });
          this.setState({actions: _.sortBy(response.actions, function(action) {return -action.date})});
        }
      });
  }

  previousActions() {
    if(this.state.offset < this.state.actionsPerPage-1) {
      this.setState({offset: 0});
    }
    this.setState({offset: this.state.offset - this.state.actionsPerPage});
  }

  nextActions() {
    if(this.state.offset + this.state.actionsPerPage > this.state.actions.length) {
      return;
    }
    this.setState({offset: this.state.offset + this.state.actionsPerPage});
  }

  activate() {
    console.log('setting active lab book');
    this.setState({active: true});
  }

  getPagination() {
    var pages = Math.ceil(this.state.actions.length / this.state.actionsPerPage);
    var activePage = Math.ceil(this.state.offset / this.state.actionsPerPage);
    if(activePage == 0) {
      activePage = 1;
    }
    var pageItems = [];
    if(activePage > 2) {
      var active = activePage==1 ? 'active' : '';
      pageItems.push(<a key={'PAGE-' + 1} className={'item ' + active}>{1}</a>);
    }
    if(activePage > 3) {
      pageItems.push(<a key={'PAGE-early'} className={'item'}>...</a>);
    }
    for(var i = activePage-1; i <= activePage+1 && i <= pages; ++i) {
      var active = activePage==i ? 'active' : '';
      pageItems.push(<a key={'PAGE-' + i} className={'item ' + active}>{i}</a>);
    }
    if(pages > activePage+2) {
      pageItems.push(<a key={'PAGE-late'} className={'item'}>...</a>);
    }
    if(pages > activePage+1) {
      var active = activePage==pages ? 'active' : '';
      pageItems.push(<a key={'PAGE-' + pages}
                          className={'item ' + active}>{pages}</a>);
    }

    return <div className='ui fitted menu'>
      <a className={'item ' + this.state.previousPage}
         onClick={this.previousActions.bind(this)}>
        <i className='icon left chevron'></i>
      </a>
      {pageItems.map(function(page) {
        return page;
      })}
      <a className={'item ' + this.state.nextPage}
         onClick={this.nextActions.bind(this)}>
        <i className='icon right chevron'></i>
      </a>
    </div>;
  }

  componentDidMount() {
    this.props.userstore.addUserLogInListener(this._onUserLogIn);
    this.props.userstore.addUserLogOutListener(this._onUserLogOut);
  }

  componentWillUpdate(nextProps, nextState) {
    if(nextState.offset < nextState.actionsPerPage) {
      nextState.previousPage = 'disabled';
    }
    else {
      nextState.previousPage = '';
    }
    if(nextState.offset + nextState.actionsPerPage > nextState.actions.length) {
      nextState.nextPage = 'disabled';
    }
    else {
      nextState.nextPage = '';
    }
  }

  componentWillUnmount() {
    this.props.userstore.removeUserLogInListener(this._onUserLogIn);
    this.props.userstore.removeUserLogOutListener(this._onUserLogOut);
  }

  render() {
    var self = this;
    return (
      <div className='ui container' style={this.containerStyle} onMouseEnter={this.activate.bind(this)}>
        <div style={this.titleStyle}
             className='ui fluid compact button'
             onClick={this.loadLog.bind(this)}
             data-content='Mettre à jour avec les dernières actions'>
          <i className='ui icon history'></i>{this.title}
        </div>
        {this.getPagination()}
        <div style={this.actionListStyle} className='ui segments'>
          {this.state.actions.map(function(action, index) {
            if(index < self.state.offset || index > self.state.offset + self.state.actionsPerPage) {
              return null;
            }
            return <LabBookEntry key={action.key} action={action} active={self.state.active} userstore={self.props.userstore} />
          })}
        </div>
      </div>
    );
  }
}

export default LabBook;