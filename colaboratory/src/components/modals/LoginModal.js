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
      zIndex: ViewConstants.zIndices.loginRequiredModal
    };

    this._onUserLogIn = () => {
      const userLogIn = () => this.hide();
      return userLogIn.apply(this);
    };

    this._onUserLogOut = () => {
      const userLogOut = () => this.requestLogin();
      return userLogOut.apply(this);
    };

    this.state = {
      active: false
    };
  }

  requestLogin() {
    this.setState({active: true});
  }

  hide() {
    this.setState({active: false});
  }

  componentDidMount() {
    this.props.userstore.addUserLogInListener(this._onUserLogIn);
    this.props.userstore.addUserLogOutListener(this._onUserLogOut);
  }

  componentWillUpdate(nextProps, nextState) {
    if(nextState.active && !this.state.active) {
      $(this.refs.modal.getDOMNode()).modal('hide');
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if(this.state.active && !prevState.active) {
      $(this.refs.modal.getDOMNode())
        .modal('setting', 'closable', false)
        .modal('show');
    }
  }

  componentWillUnmount() {
    this.props.userstore.removeUserLogInListener(this._onUserLogIn);
    this.props.userstore.removeUserLogOutListener(this._onUserLogOut);
  }

  render() {
    return <div ref='modal' className='ui modal' style={this.loginModalStyle}>
      <div className='ui header'>Connexion nécessaire</div>
      <div className='ui content'>
        <p>Vous devez être connecté avec votre compte ReColNat afin de pouvoir accéder au Collaboratoire</p>
        <a className='ui button'
           target='_blank'
           href={'https://cas.recolnat.org/login?service=' + window.location.protocol  + '//' + window.location.hostname + '/' + window.location.pathname}>Me Connecter</a>
        <a className='ui button'
           target='_blank'
           href='http://signup.recolnat.org/#/register'>Créer compte</a>
      </div>
    </div>
  }
}

export default LoginModal;