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
      height: '5%'
    };

    this.buttonRowStyle = {
      height: '5%'
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
      actions: []
    };

    this.title = "Cahier de laboratoire";
  }

  componentDidMount() {
    this.props.userstore.addUserLogInListener(this._onUserLogIn);
    this.props.userstore.addUserLogOutListener(this._onUserLogOut);
  }

  componentWillUnmount() {
    this.props.userstore.removeUserLogInListener(this._onUserLogIn);
    this.props.userstore.removeUserLogOutListener(this._onUserLogOut);
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

  render() {
    var self = this;
    return (
      <div style={this.containerStyle}>
        <p style={this.titleStyle}>{this.title}</p>
        <div  style={this.buttonRowStyle} className='ui buttons'>
          <button className='ui button'
                  data-content='Mettre à jour avec les dernières actions'
                  onClick={this.loadLog.bind(this)}>
            <i className='ui icon history'></i>
          </button>
        </div>
        <div style={this.actionListStyle} className='ui segments'>
          <div className='ui segment'>
            <p>
              PRÉSENT
              </p></div>
          {this.state.actions.map(function(action) {
            return <LabBookEntry key={action.key} action={action} userstore={self.props.userstore} />
          })}
          <div className='ui segment'>
            <p>
              DÉBUT DU CAHIER
            </p></div>
        </div>
      </div>
    );
  }
}

export default LabBook;