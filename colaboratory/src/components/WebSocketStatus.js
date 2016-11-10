/**
 * Created by dmitri on 28/10/16.
 */
'use strict';

import React from 'react';

class WebSocketStatus extends React.Component {
  constructor(props) {
    super(props);

    this.componentStyle = {
      display: 'none',
      position: 'fixed',
      right: '400px',
      top: '55px',
      maxHeight: '60px',
      maxWidth: '250px',
      margin: 0,
      padding: '5px 5px 5px 5px',
      backgroundColor: 'rgba(255,255,255,0.4)',
      zIndex: 5000
    };

    this._onWebSocketStatusChange = () => {
      const updateStatusDisplay = () => this.setComponentVisibility();
      return updateStatusDisplay.apply(this);
    };

    this.state = {
      countPendingMessages: 0
    };
  }

  setComponentVisibility() {
    this.setState({countPendingMessages: this.props.socket.countPendingMessages()});
  }

  componentDidMount() {
    this.props.socket.addStateChangeListener(this._onWebSocketStatusChange);
  }

  componentWillUpdate(nextProps, nextState) {
    if(nextState.countPendingMessages > 0) {
      this.componentStyle.display = null;
    }
    else {
      this.componentStyle.display = 'none';
    }
  }

  componentWillUnmount() {
    this.props.socket.removeStateChangeListener(this._onWebSocketStatusChange);
  }

  render() {
    return <div style={this.componentStyle} className='ui text segment'>
      <div className="ui active small inline loader"></div>Synchronisation des données... {this.state.countPendingMessages}
    </div>
  }
}

export default WebSocketStatus;
