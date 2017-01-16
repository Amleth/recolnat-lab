/**
 * Created by dmitri on 20/04/16.
 */
'use strict';

import React from 'react';

import ModalConstants from '../../constants/ModalConstants';
import ViewConstants from '../../constants/ViewConstants';

class LoginModal extends React.Component {
  constructor(props) {
    super(props);

    this.loginModalStyle = {
      zIndex: ViewConstants.zIndices.loginRequiredModal,
      position: 'absolute',
      top: '100px !important',
      left: '50% !important'
    };

    this._onUserLogIn = () => {
      const userLogIn = () => this.hide();
      return userLogIn.apply(this);
    };

    this._onUserLogOut = () => {
      const userLogOut = () => this.requestLogin();
      return userLogOut.apply(this);
    };

    this.loginWindow = null;

    this.state = {
      active: !props.userstore.isUserAuthorized()
    };
  }

  requestLogin() {
    this.setState({active: true});
  }

  hide() {
    this.setState({active: false});
  }

  openLoginPopup() {
    this.loginWindow = window.open('https://cas.recolnat.org/login',
       'casLogin', 'menubar=no,status=no,titlebar=no,toolbar=no,width=700,height=800,top=' + window.self.screenY + ',left=' + window.self.screenX);
  }

  openRegisterPopup() {
    window.open('http://signup.recolnat.org/#/register', 'menubar=no,status=no,titlebar=no,toolbar=no,width=700,height=800,top=' + window.self.screenY + ',left=' + window.self.screenX);
  }

  componentDidMount() {
    this.props.userstore.addUserLogInListener(this._onUserLogIn);
    this.props.userstore.addUserLogOutListener(this._onUserLogOut);
    this.props.userstore.addLanguageChangeListener(this.setState.bind(this, {}));
    $(React.findDOMNode(this))
      .modal({closable: false, detachable: false});
  }

  componentWillUpdate(nextProps, nextState) {
    if(!nextState.active && this.state.active) {
      $(React.findDOMNode(this)).modal('hide');
      if(this.loginWindow) {
        this.loginWindow.close();
        this.loginWindow = null;
      }
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if(this.state.active) {
      $(React.findDOMNode(this))
        .modal('show');
    }
  }

  componentWillUnmount() {
    this.props.userstore.removeLanguageChangeListener(this.setState.bind(this, {}));
    this.props.userstore.removeUserLogInListener(this._onUserLogIn);
    this.props.userstore.removeUserLogOutListener(this._onUserLogOut);
  }

  render() {
    return <div ref='modal' className='ui modal' style={this.loginModalStyle}>
      <div className='ui header'>{this.props.userstore.getText('loginRequired')}</div>
      <div className='ui content'>
        <p>{this.props.userstore.getText('loginHelp')}</p>
        <a className='ui button'
           onClick={this.openLoginPopup.bind(this)}>
          {this.props.userstore.getText('login')}
        </a>
        <a className='ui button'
           onClick={this.openRegisterPopup.bind(this)}>
          {this.props.userstore.getText('createAccount')}
        </a>
      </div>
    </div>
  }
}

export default LoginModal;