'use strict';

import React from 'react';
import request from 'superagent';

import VirtualWorkbench from './components/VirtualWorkbench';
import PaletteAccordion from './components/PaletteAccordion';
import RightPane from './components/RightPane';
import PopupToolContainer from './components/PopupToolComponent';
import Tooltip from './components/ActiveToolTooltip';
import TopPane from './components/TopPane';

import EntityStore from './stores/EntitiesStore';
import MinimapStore from './stores/MinimapStore';
import ViewStore from './stores/ViewStore';
import ToolStore from './stores/ToolStore';
import UserStore from './stores/UserStore';
import MenuStore from './stores/MenuStore';
import ManagerStore from './stores/ManagerStore';

import ViewActions from './actions/ViewActions';

import API from './utils/API.js';

import conf from './conf/ApplicationConfiguration';

const ministore = new MinimapStore();
const viewstore = new ViewStore();
const entitystore = new EntityStore();
const toolstore = new ToolStore();
const userstore = new UserStore();
const menustore = new MenuStore();
const managerstore = new ManagerStore();
const api = new API();

class Window extends React.Component {
  constructor(props) {
    super(props);

    this.menuHeight = 35;
    this.closeTopPaneButtonHeight = 30;

    this.containerStyle = {
      position: 'relative',
      height: '100vh',
      width: '100vw',
      backgroundColor: 'rgba(245,241,222, 1.0)'
    };

    this.topSliderStyle = {
      position: 'fixed',
      top: '0',
      left: '0',
      height: (window.innerHeight) + 'px',
      width: '100%',
      zIndex: '502',
      paddingTop: this.menuHeight + 'px',
      backgroundColor: 'rgba(0,0,0,0.0)',
      WebkitTransition: 'top 1s, width 1s',
      transition: 'top 1s, width 1s'
    };

    this.columnLeftSideStyle = {
      position: 'fixed',
      top: this.menuHeight + 'px',
      left: '0',
      zIndex: '500',
      width: '200px',
      height: (window.innerHeight - this.menuHeight) + 'px',
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
      top: this.menuHeight + 'px',
      zIndex: '500',
      width: '300px',
      height: (window.innerHeight - this.menuHeight) + 'px',
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
      top: this.menuHeight + 'px',
      width: (window.innerWidth - 500) + 'px',
      height: (window.innerHeight - this.menuHeight) + 'px',
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

    this.topButtonStyle = {
      position: 'fixed',
      left: '35vw',
      top: (window.innerHeight -this.closeTopPaneButtonHeight) + 'px',
      zIndex: '502',
      height: this.closeTopPaneButtonHeight + 'px',
      maxHeight: this.closeTopPaneButtonHeight + 'px',
      width: '200px',
      maxWidth: '200px',
      fontSize: '12',
      WebkitTransition: 'top 1.1s',
      transition: 'top 1.1s'
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
      height: this.menuHeight + 'px',
      overflow: 'hidden',
      position: 'fixed',
      width: '100%',
      zIndex: '9000'
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

    this.loginModalStyle = {
      zIndex: 99999
    };

    this.state = {
      userLoggedIn: false,
      leftSidebar: true,
      rightSidebar: true,
      topSidebar: true,
      leftSidebarIcon: 'left',
      rightSidebarIcon: 'right',
      workbench: "Pas d'étude chargée"
    };

    this._onUserLogIn = () => {
      const userLogIn = () => this.login();
      return userLogIn.apply(this);
    };

    this._onUserLogOut = () => {
      const userLogOut = () => this.logout();
      return userLogOut.apply(this);
    };

    this._onManagerVisibilityToggle = () => {
      const toggle = () => this.toggleTopMenu(managerstore.getManagerVisibility());
      return toggle.apply(this);
    };

    this._onWorkbenchChange = () => {
      const changeDisplayedName = () => this.setWorkbenchName();
      return changeDisplayedName.apply(this);
    }
  }

  login() {
    console.log('calling login in window');
    // Open connection to websocket
    api.openWebsocket();
    this.setState({userLoggedIn: true});
  }

  logout() {
    api.closeWebsocket();
    this.setState({userLoggedIn: false});
  }

  receiveMessage(event) {
    if(event.origin.indexOf('https://www.recolnat.org') == 0) {
      switch(event.data.action) {
        case 'login':
          this.redirectCASLogin();
          break;
        case 'logout':
          this.redirectCASLogout();
          break;
        case 'profile':
          alert('Profil utilisateur indisponible dans la démo');
          break;
        default:
          console.log('Unknown event action ' + event.data.action);
      }
    }
    else {
      console.log('Rejected unauthorized event from ' + event.origin + ' : ' + JSON.stringify(event.data));
    }
  }

  redirectCASLogin() {
    window.location.href = 'https://cas.recolnat.org/login';
  }

  redirectCASLogout() {
    window.location.href = 'https://cas.recolnat.org/logout';
  }

  setWorkbenchName() {
    console.log('estore=' + entitystore.getWorkbenchId());
    var id = entitystore.getWorkbenchId();
    var name = managerstore.getWorkbench(id).name;
      this.setState({workbench: name});
  }

  toggleTopMenu(visible = undefined) {
    if(visible === undefined) {
      ViewActions.setActiveWorkbench(entitystore.getWorkbenchId());
      this.setState({topSidebar: !this.state.topSidebar});
    }
    else {
      this.setState({topSidebar: visible});
    }
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

  handleResize() {
    this.setState({});
  }

  componentDidMount() {
    userstore.addUserLogInListener(this._onUserLogIn);
    userstore.addUserLogOutListener(this._onUserLogOut);
    managerstore.addManagerVisibilityListener(this._onManagerVisibilityToggle);
    viewstore.setViewportData(null, null, window.innerWidth-500, window.innerHeight -this.menuHeight, null);
    viewstore.setViewportLocationInWindow(this.menuHeight, 200);
    entitystore.addChangeWorkbenchListener(this._onWorkbenchChange);
    window.addEventListener('resize', this.handleResize.bind(this));
    // Add recolnat-menu listeners
    window.addEventListener("message", this.receiveMessage.bind(this));
  }

  signalIframeReady() {
    this.setState({menuIframe: true});
  }

  componentWillUpdate(nextProps, nextState) {
    var width = window.innerWidth;
    var height = window.innerHeight;
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

    if(nextState.topSidebar) {
      this.topSliderStyle.top = '0px';
      this.topSliderStyle.height = height + 'px';
      this.topButtonStyle.top = (height -this.closeTopPaneButtonHeight) + 'px';
    }
    else {
      this.topSliderStyle.height = height + 'px';
      this.topSliderStyle.top = (-height) + 'px';
      this.topButtonStyle.top = this.menuHeight + 'px';
    }

    this.columnMiddleStyle.left = left + 'px';
    this.columnMiddleStyle.width = width + 'px';
    this.columnLeftSideStyle.height = (window.innerHeight - this.menuHeight) + 'px';
    this.columnRightSideStyle.height = (window.innerHeight - this.menuHeight) + 'px';
    this.columnMiddleStyle.height = (window.innerHeight - this.menuHeight) + 'px';

    viewstore.setViewportData(null, null, width, window.innerHeight -this.menuHeight, null);
    viewstore.setViewportLocationInWindow(this.menuHeight, left);
  }

  componentDidUpdate(prevProps, prevState) {
    if(!this.state.userLoggedIn) {
      $(this.refs.loginPromptModal.getDOMNode())
        .modal('setting', 'closable', false)
        .modal('show');
    }
    else {
      $(this.refs.loginPromptModal.getDOMNode())
        .modal('setting', 'closable', false)
        .modal('hide');

      var frame = this.refs.recolnatMenu.getDOMNode().contentWindow;
      frame.postMessage({type: "user", username: userstore.getUser().login, userProfile: ''}, 'https://www.recolnat.org/menu');
    }
  }

  componentWillUnmount() {
    userstore.removeUserLogInListener(this._onUserLogIn);
    userstore.removeUserLogOutListener(this._onUserLogOut);
    managerstore.removeManagerVisibilityListener(this._onManagerVisibilityToggle);
    entitystore.removeChangeWorkbenchListener(this._onWorkbenchChange);
    window.removeEventListener('resize', this.handleResize.bind(this));
  }

  render() {
    return(
      <div style={this.containerStyle}>

        <div ref='loginPromptModal' className='ui modal' style={this.loginModalStyle}>
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
          <iframe id="recolnatMenu"
                  ref='recolnatMenu'
                  style={this.recolnatMenuStyle}
                  seamless="seamless"
                  scrolling="no"
                  onLoad={this.signalIframeReady.bind(this)}
                  src='https://www.recolnat.org/menu'></iframe>
        </div>

        <div style={this.topSliderStyle}>
          <TopPane userstore={userstore}
                   viewstore={viewstore}
                   entitystore={entitystore}
                   toolstore={toolstore}
                   menustore={menustore}
                   ministore={ministore}
                   managerstore={managerstore}
                   menuHeight={this.menuHeight}
                   windowHeight={window.innerHeight}
                   closeButtonHeight={this.closeTopPaneButtonHeight}
          />
          </div>
          <div className="ui bottom attached button mini compact"
               style={this.topButtonStyle} onClick={this.toggleTopMenu.bind(this, undefined)}><i className={'ui icon sidebar'} />{this.state.workbench}</div>
        <div>
          <div style={this.columnLeftSideStyle}>
            <div style={this.collabTitleStyle}>Le Collaboratoire</div>
            <PaletteAccordion ministore={ministore} viewstore={viewstore} entitystore={entitystore} toolstore={toolstore} userstore={userstore}/>
          </div>
          <div className="ui right attached button mini compact" style={this.leftButtonStyle} onClick={this.toggleLeftMenu.bind(this)}><i className={'ui icon chevron circle ' + this.state.leftSidebarIcon} /></div>
          <div style={this.columnMiddleStyle}>
            <VirtualWorkbench
              userstore={userstore}
              viewstore={viewstore}
              entitystore={entitystore}
              toolstore={toolstore}
              menustore={menustore}
              ministore={ministore}
              wsconnector={api} />
          </div>
          <div className="ui left attached button mini compact" style={this.rightButtonStyle} onClick={this.toggleRightMenu.bind(this)}><i className={'ui icon chevron circle ' + this.state.rightSidebarIcon} /></div>
          <div style={this.columnRightSideStyle}>
            <RightPane
              viewstore={viewstore}
              entitystore={entitystore}
              userstore={userstore}/>
          </div>
        </div>
      </div>
    )
  }
}

//

export default Window;