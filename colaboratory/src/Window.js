'use strict';

import React from 'react';
import request from 'superagent';

import VirtualWorkbench from './components/VirtualWorkbench';
import PaletteAccordion from './components/PaletteAccordion';
import RightPane from './components/RightPane';
import PopupToolContainer from './components/PopupToolComponent';
import Tooltip from './components/ActiveToolTooltip';

import EntityStore from './stores/EntitiesStore';
import MinimapStore from './stores/MinimapStore';
import ViewStore from './stores/ViewStore';
import ToolStore from './stores/ToolStore';
import UserStore from './stores/UserStore';

import API from './utils/API.js';

import conf from './conf/ApplicationConfiguration';

const ministore = new MinimapStore();
const viewstore = new ViewStore();
const entitystore = new EntityStore();
const toolstore = new ToolStore();
const userstore = new UserStore();
const api = new API();

class Window extends React.Component {
  constructor(props) {
    super(props);

    this.containerStyle = {
      position: 'relative',
      height: '100vh',
      width: '100vw',
      backgroundColor: 'rgba(245,241,222, 1.0)'
    };

    this.columnLeftSideStyle = {
      position: 'fixed',
      top: '35px',
      left: '0',
      zIndex: '500',
      width: '200px',
      height: (window.innerHeight - 35) + 'px',
      backgroundColor: '#F2F2F2',
      WebkitTransition: 'left 1s',
      transition: 'left 1s',
      overflow: 'auto',
      WebkitBoxShadow: '3px 0px 10px -3px rgba(0,0,0,0.75)',
      MozBoxShadow: '3px 0px 10px -3px rgba(0,0,0,0.75)',
      boxShadow: '3px 0px 10px -3px rgba(0,0,0,0.75)'
    };

    this.columnRightSideStyle = {
      position: 'fixed',
      right: '0px',
      top: '35px',
      zIndex: '500',
      width: '300px',
      height: (window.innerHeight - 35) + 'px',
      backgroundColor: '#F2F2F2',
      WebkitTransition: 'right 1s',
      transition: 'right 1s',
      //overflow: 'auto',
      WebkitBoxShadow: '-3px 0px 10px -3px rgba(0,0,0,0.75)',
      MozBoxShadow: '-3px 0px 10px -3px rgba(0,0,0,0.75)',
      boxShadow: '-3px 0px 10px -3px rgba(0,0,0,0.75)'
    };

    this.columnMiddleStyle = {
      position: 'fixed',
      left: '200px',
      top: '35px',
      width: (window.innerWidth - 500) + 'px',
      height: (window.innerHeight - 35) + 'px',
      WebkitTransition: 'left 1s, width 1s',
      transition: 'left 1s, width 1s'
    };

    this.leftButtonStyle = {
      position: 'fixed',
      left: '200px',
      top: '50vh',
      zIndex: '499',
      height: '20px',
      WebkitTransition: 'left 1s',
      transition: 'left 1s'
    };

    this.rightButtonStyle = {
      position: 'absolute',
      right: '300px',
      top: '50vh',
      zIndex: '499',
      height: '20px',
      WebkitTransition: 'right 1s',
      transition: 'right 1s'
    };

    this.recolnatMenuStyle = {
      border: 'medium none',
      height: '35px',
      overflow: 'hidden',
      position: 'fixed',
      width: '100%',
      zIndex: '1000'
    };

    this.collabTitleStyle = {
      width: '97%',
      cursor: 'default',
      color: '#0C0400',
      fontVariant: 'small-caps',
      fontSize: '16pt',
      margin: '3px 3px 3px 3px',
      padding: '5px 5px 5px 5px'
    };

    this.state = {
      leftSidebar: true,
      rightSidebar: true,
      leftSidebarIcon: 'left',
      rightSidebarIcon: 'right'
    };

    this._onUserLogIn = () => {
      const userLogIn = () => this.login();
      return userLogIn.apply(this);
    };

    this._onUserLogOut = () => {
      const userLogOut = () => this.logout();
      return userLogOut.apply(this);
    };
  }

  login() {
    api.openWebsocket();
    $('.ui.modal')
      .modal('setting', 'closable', false)
      .modal('hide');
  }

  logout() {
    api.closeWebsocket();
    $('.ui.modal')
      .modal('setting', 'closable', false)
      .modal('show');
  }

  toggleLeftMenu() {
    if(this.state.leftSidebar) {
      this.setState({leftSidebar: false, leftSidebarIcon: 'right'});
    }
    else {
      this.setState({leftSidebar: true, leftSidebarIcon: 'left'});
    }
  }

  toggleRightMenu() {
    if(this.state.rightSidebar) {
      this.setState({rightSidebar: false, rightSidebarIcon: 'left'});
    }
    else {
      this.setState({rightSidebar: true, rightSidebarIcon: 'right'});
    }
  }

  componentDidMount() {
    userstore.addUserLogInListener(this._onUserLogIn);
    userstore.addUserLogOutListener(this._onUserLogOut);
    window.addEventListener('resize', this.setState.bind(this));
  }

  componentWillUpdate(nextProps, nextState) {
    var width = window.innerWidth;
    var left = 0;
    console.log('window width ' + width);
    if(nextState.leftSidebar) {
      width = width - 200;
      left = 200;
      this.columnLeftSideStyle.left = '0px';
      this.leftButtonStyle.left = '200px';
    }
    else {
      this.columnLeftSideStyle.left = '-200px';
      this.leftButtonStyle.left = '0px';
    }

    if(nextState.rightSidebar) {
      this.columnRightSideStyle.right = '0px';
      this.rightButtonStyle.right = '300px';
      width = width -300;
    }
    else {
      this.columnRightSideStyle.right = '-300px';
      this.rightButtonStyle.right = '0px';
    }

    this.columnMiddleStyle.left = left + 'px';
    this.columnMiddleStyle.width = width + 'px';
    this.columnLeftSideStyle.height = (window.innerHeight - 35) + 'px';
    this.columnRightSideStyle.height = (window.innerHeight - 35) + 'px';
    this.columnMiddleStyle.height = (window.innerHeight - 35) + 'px';
  }

  componentWillUnmount() {
    userstore.removeUserLogInListener(this._onUserLogIn);
    userstore.removeUserLogOutListener(this._onUserLogOut);
    window.removeEventListener('resize', this.setState({}));
  }

  render() {
    return(
      <div style={this.containerStyle}>
        <div className='ui modal'>
          <div className='ui header'>Connexion nécessaire</div>
          <div className='ui content'>
            <p>Vous devez être connecté avec votre compte ReColNat afin de pouvoir accéder au Collaboratoire</p>
            <a className='ui button'
               href='https://cas.recolnat.org/login?service=https://wp5test.recolnat.org/labo'>Me Connecter</a>
            <a className='ui button'
               href='http://signup.recolnat.org/#/register'>Créer compte</a>
          </div>
        </div>
        <div>
          <iframe id="recolnatMenu" style={this.recolnatMenuStyle} seamless="seamless" scrolling="no" src="http://wp5prod.recolnat.org/menu/"></iframe>
        </div>
        <div>
          <div style={this.columnLeftSideStyle}>
            <div style={this.collabTitleStyle}>Le Collaboratoire</div>
            <PaletteAccordion ministore={ministore} viewstore={viewstore} entitystore={entitystore} toolstore={toolstore} userstore={userstore}/>
          </div>
          <div className="ui right attached button mini compact" style={this.leftButtonStyle} onClick={this.toggleLeftMenu.bind(this)}><i className={'ui icon chevron circle ' + this.state.leftSidebarIcon} /></div>
          <div style={this.columnMiddleStyle}>
            <VirtualWorkbench userstore={userstore} viewstore={viewstore} entitystore={entitystore} toolstore={toolstore} wsconnector={api} />
          </div>
          <div className="ui left attached button mini compact" style={this.rightButtonStyle} onClick={this.toggleRightMenu.bind(this)}><i className={'ui icon chevron circle ' + this.state.rightSidebarIcon} /></div>
          <div style={this.columnRightSideStyle}>
            <RightPane viewstore={viewstore} entitystore={entitystore} userstore={userstore}/>
          </div>
        </div>
      </div>
    )
  }
}

//

export default Window;