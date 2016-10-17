/**
 * Created by dmitri on 17/10/16.
 */
import React from 'react';
import request from 'superagent';

import conf from './Configuration.js';

var W3CWebSocket = require('websocket').w3cwebsocket;

class App extends React.Component {
  constructor(props) {
    super(props);

    this.containerStyle = {
      display: 'flex',
      flexDirection: 'column',
      width: '400px'
    };

    this.statusLineStyle = {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      height: '40px',
      alignItems: 'center'
    };

    this.statusUnknownStyle = {
      backgroundColor: 'blue',
      width: '40px'
    };

    this.statusErrorStyle = {
      backgroundColor: 'red',
      width: '40px'
    };

    this.statusOKStyle = {
      backgroundColor: 'green',
      width: '40px'
    };

    this.state = {
      status: [
        {style: this.statusUnknownStyle, state: 'Checking...'},
        {style: this.statusUnknownStyle, state: 'Checking...'},
        {style: this.statusUnknownStyle, state: 'Checking...'},
        {style: this.statusUnknownStyle, state: 'Checking...'}
      ]
    };
  }

  updateStatus(position, isError) {
    var status = JSON.parse(JSON.stringify(this.state.status));
    status[position] = {
      style: isError?this.statusErrorStyle : this.statusOKStyle,
      state: isError?'Error': 'OK'
    };

    this.setState({status: status});
  }

  componentDidMount() {
    // Begin status check
    var self = this;
    request.get('https://wp5test.recolnat.org')
      .end((err, res) => {
        var isError = true;
        if(err) {
          if(err.status === 403) {
            isError = false;
          }
        }
        else {
          isError = false;
        }
        this.updateStatus(0, isError);
      });

    var websocket1 = new W3CWebSocket(conf.colab.dev, "", conf.colab.dev);

    websocket1.onerror = function(message) {
      self.updateStatus(1, true);
    };

    websocket1.onopen = function(message) {
      console.log('socket open to Dev');
      self.updateStatus(1, false);
    };


    var websocket2 = new W3CWebSocket(conf.colab.test, "", conf.colab.test);

    websocket2.onerror = function(message) {
      self.updateStatus(2, true);
    };

    websocket2.onopen = function(message) {
      console.log('socket open to Test');
      self.updateStatus(2, false);
    };


    var websocket3 = new W3CWebSocket(conf.colab.vm, "", conf.colab.vm);

    websocket3.onerror = function(message) {
      self.updateStatus(3, true);
    };

    websocket3.onopen = function(message) {
      console.log('socket open to Vm');
      self.updateStatus(3, false);
    };
  }

  render() {
    return(
    <div style={this.containerStyle}>
      <p>Reload this page to update status.</p>
      <p>You must be logged into CAS to view Colaboratory status.</p>
      <div style={this.statusLineStyle}>
        <div>Server wp5test.recolnat.org</div>
        <div style={this.state.status[0].style}>{this.state.status[0].state}</div>
      </div>
      <div style={this.statusLineStyle}>
        <div>Colaboratory (Dev)</div>
        <div style={this.state.status[1].style}>{this.state.status[1].state}</div>
      </div>
      <div style={this.statusLineStyle}>
        <div>Colaboratory (Test)</div>
        <div style={this.state.status[2].style}>{this.state.status[2].state}</div>
      </div>
      <div style={this.statusLineStyle}>
        <div>Colaboratory (Vm)</div>
        <div style={this.state.status[3].style}>{this.state.status[3].state}</div>
      </div>
    </div>)
  }
}

export default App;