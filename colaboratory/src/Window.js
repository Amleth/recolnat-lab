'use strict';

import React from 'react';
import request from 'superagent';

import VirtualBenchLab from './components/VirtualBenchLab';
import LeftPane from './components/LeftPane';
import RightPane from './components/RightPane';
import PopupToolContainer from './components/PopupToolComponent';
import Tooltip from './components/ActiveToolTooltip';
import TopPane from './components/TopPane';
import MainMenu from './components/MainMenu';
import Modals from './components/Modals';

import MinimapStore from './stores/MinimapStore';
import ViewStore from './stores/ViewStore';
import ToolStore from './stores/ToolStore';
import UserStore from './stores/UserStore';
import MenuStore from './stores/MenuStore';
import ManagerStore from './stores/ManagerStore';
import ImageStore from './stores/ImageStore';
import MetadataStore from './stores/MetadataStore';
import ModalStore from './stores/ModalStore';
import LabBenchStore from './stores/LabBenchStore';
import ModeStore from './stores/ModeStore';

import ViewActions from './actions/ViewActions';
import MetadataActions from './actions/MetadataActions';

import ViewConstants from './constants/ViewConstants';

import InterStoreCommunicationsController from './utils/InterStoreCommunicationsController';

import conf from './conf/ApplicationConfiguration';

const ministore = new MinimapStore();
const viewstore = new ViewStore();
const toolstore = new ToolStore();
const userstore = new UserStore();
const menustore = new MenuStore();
const managerstore = new ManagerStore();
const imagestore = new ImageStore();
const metastore = new MetadataStore();
const modalstore = new ModalStore();
const benchstore = new LabBenchStore();
const modestore = new ModeStore();
const controller = new InterStoreCommunicationsController({
  ministore: ministore,
  viewstore: viewstore,
  toolstore: toolstore,
  userstore: userstore,
  menustore: menustore,
  managerstore: managerstore,
  metastore: metastore,
  modalstore: modalstore,
  benchstore: benchstore,
  modestore: modestore
});

class Window extends React.Component {
  constructor(props) {
    super(props);

    this.menuHeight = 35;
    this.closeTopPaneButtonHeight = 30;
    this.leftPaneWidth = 200;
    this.rightPaneWidth = 300;

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
      zIndex: ViewConstants.zIndices.topPane,
      paddingTop: this.menuHeight + 'px',
      backgroundColor: 'rgba(0,0,0,0.0)',
      WebkitTransition: 'top 1s, width 1s',
      transition: 'top 1s, width 1s'
    };

    this.columnLeftSideStyle = {
      position: 'fixed',
      top: this.menuHeight + 'px',
      left: '0',
      zIndex: ViewConstants.zIndices.leftPane,
      width: this.leftPaneWidth + 'px',
      height: (window.innerHeight - this.menuHeight) + 'px',
      backgroundColor: '#F2F2F2',
      WebkitTransition: 'left 1s',
      transition: 'left 1s',
      overflowX: 'hidden',
      overflowY: 'auto',
      WebkitBoxShadow: '3px 0px 10px -3px rgba(0,0,0,0.75)',
      MozBoxShadow: '3px 0px 10px -3px rgba(0,0,0,0.75)',
      boxShadow: '3px 0px 10px -3px rgba(0,0,0,0.75)'
    };

    this.columnRightSideStyle = {
      position: 'fixed',
      right: '0px',
      top: this.menuHeight + 'px',
      zIndex: ViewConstants.zIndices.rightPane,
      width: this.rightPaneWidth + 'px',
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
      left: this.leftPaneWidth + 'px',
      top: this.menuHeight + 'px',
      width: (window.innerWidth - 500) + 'px',
      height: (window.innerHeight - this.menuHeight) + 'px',
      WebkitTransition: 'left 1s, width 1s',
      transition: 'left 1s, width 1s'
    };

    this.leftButtonStyle = {
      position: 'fixed',
      left: this.leftPaneWidth + 'px',
      top: '50vh',
      zIndex: ViewConstants.zIndices.leftPaneCloseButton,
      height: '20px',
      WebkitTransition: 'left 1s',
      transition: 'left 1s'
    };

    this.topButtonStyle = {
      position: 'fixed',
      left: '35vw',
      top: (window.innerHeight -this.closeTopPaneButtonHeight) + 'px',
      zIndex: ViewConstants.zIndices.topPaneCloseButton,
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
      right: this.rightPaneWidth + 'px',
      top: '50vh',
      zIndex: ViewConstants.zIndices.rightPaneCloseButton,
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
      zIndex: ViewConstants.zIndices.mainMenu
    };

    //this.collabTitleStyle = {
    //  position: 'fixed',
    //  zIndex: '99999',
    //  left: 0,
    //  top: this.menuHeight + 'px',
    //  width: this.leftPaneWidth + 'px',
    //  cursor: 'default',
    //  color: '#0C0400',
    //  fontVariant: 'small-caps',
    //  fontSize: '16pt',
    //  margin: '3px 3px 3px 3px',
    //  padding: '5px 5px 5px 5px'
    //};

    this.state = {
      userLoggedIn: false,
      leftSidebar: true,
      rightSidebar: true,
      topSidebar: true,
      leftSidebarIcon: 'left',
      rightSidebarIcon: 'right',
      activeSetName: "Pas d'étude chargée"
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

    this._onSetIdChange = () => {
      const changeDisplayedName = () => this.setActiveSetName();
      return changeDisplayedName.apply(this);
    }
  }

  login() {
    //console.log('calling login in window');
    // Open connection to websocket
    //api.openWebsocket();
    this.setState({userLoggedIn: true});
  }

  logout() {
    //api.closeWebsocket();
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
      //console.log('Rejected unauthorized event from ' + event.origin + ' : ' + JSON.stringify(event.data));
    }
  }

  redirectCASLogin() {
    window.location.href = 'https://cas.recolnat.org/login';
  }

  redirectCASLogout() {
    window.location.href = 'https://cas.recolnat.org/logout';
  }

  setActiveSetName() {
    console.log(JSON.stringify(managerstore.getSelected()));
    if(managerstore.getSelected().name) {
      this.setState({activeSetName: managerstore.getSelected().name});
    }
  }

  toggleTopMenu(visible = undefined) {
    if(visible === undefined) {
      if(managerstore.getSelected().id) {
        ViewActions.setActiveSet(managerstore.getSelected().id);
      }
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

  componentWillMount() {
    var locationParts = window.location.href.split(/[?#]/);
    if(locationParts.length > 1) {
      window.location.href = locationParts[0];
    }
  }

  componentDidMount() {
    userstore.addUserLogInListener(this._onUserLogIn);
    userstore.addUserLogOutListener(this._onUserLogOut);
    managerstore.addManagerVisibilityListener(this._onManagerVisibilityToggle);
    viewstore.setViewportData(null, null, window.innerWidth-this.leftPaneWidth + this.rightPaneWidth, window.innerHeight -this.menuHeight, null);
    viewstore.setViewportLocationInWindow(this.menuHeight, this.leftPaneWidth);
    managerstore.addSelectionChangeListener(this._onSetIdChange);
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
    //console.log('window width ' + width);
    if(nextState.leftSidebar) {
      width = width - this.leftPaneWidth;
      left = this.leftPaneWidth;
      this.columnLeftSideStyle.left = '0px';
      this.leftButtonStyle.left = this.leftPaneWidth + 'px';
    }
    else {
      this.columnLeftSideStyle.left = -this.leftPaneWidth + 'px';
      this.leftButtonStyle.left = '0px';
    }

    if(nextState.rightSidebar) {
      this.columnRightSideStyle.right = '0px';
      this.rightButtonStyle.right = this.rightPaneWidth + 'px';
      width = width -this.rightPaneWidth;
    }
    else {
      this.columnRightSideStyle.right = -this.rightPaneWidth + 'px';
      this.rightButtonStyle.right = '0px';
    }

    if(nextState.topSidebar) {
      if(!this.state.topSidebar) {
        window.setTimeout(
        MetadataActions.loadLabBench.bind(null, managerstore.getSelected().id), 10
        );
      }
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
    if(this.state.userLoggedIn) {
      var frame = this.refs.recolnatMenu.getDOMNode().contentWindow;
      frame.postMessage({type: "user", username: userstore.getUser().login, userProfile: ''}, 'https://www.recolnat.org/menu');
    }
  }

  componentWillUnmount() {
    userstore.removeUserLogInListener(this._onUserLogIn);
    userstore.removeUserLogOutListener(this._onUserLogOut);
    managerstore.removeManagerVisibilityListener(this._onManagerVisibilityToggle);
    managerstore.addSelectionChangeListener(this._onSetIdChange);
    window.removeEventListener('resize', this.handleResize.bind(this));
  }

  render() {
    return(
      <div style={this.containerStyle}>
        <div>
          <iframe id="recolnatMenu"
                  ref='recolnatMenu'
                  style={this.recolnatMenuStyle}
                  seamless="seamless"
                  scrolling="no"
                  onLoad={this.signalIframeReady.bind(this)}
                  src='https://www.recolnat.org/menu'></iframe>
        </div>
        <Modals userstore={userstore}
                viewstore={viewstore}
                toolstore={toolstore}
                menustore={menustore}
                metastore={metastore}
                modalstore={modalstore}
                ministore={ministore}
                benchstore={benchstore}
                modestore={modestore}
                managerstore={managerstore} />
        <MainMenu top={this.menuHeight}
                  width={this.leftPaneWidth}
                  userstore={userstore}
                  viewstore={viewstore}
                  toolstore={toolstore}
                  menustore={menustore}
                  ministore={ministore}
                  metastore={metastore}
                  modestore={modestore}
                  managerstore={managerstore} />
        <div style={this.topSliderStyle}>
          <TopPane userstore={userstore}
                   viewstore={viewstore}
                   toolstore={toolstore}
                   menustore={menustore}
                   ministore={ministore}
                   metastore={metastore}
                   modestore={modestore}
                   modalstore={modalstore}
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
            <LeftPane
              ministore={ministore}
              benchstore={benchstore}
              viewstore={viewstore}
              metastore={metastore}
              toolstore={toolstore}
              modestore={modestore}
              userstore={userstore}/>
          </div>
          <div className="ui right attached button mini compact" style={this.leftButtonStyle} onClick={this.toggleLeftMenu.bind(this)}><i className={'ui icon chevron circle ' + this.state.leftSidebarIcon} /></div>
          <div style={this.columnMiddleStyle}>
            <VirtualBenchLab
              userstore={userstore}
              viewstore={viewstore}
              toolstore={toolstore}
              menustore={menustore}
              metastore={metastore}
              modalstore={modalstore}
              modestore={modestore}
              ministore={ministore}
              benchstore={benchstore}
              managerstore={managerstore}/>
          </div>
          <div className="ui left attached button mini compact" style={this.rightButtonStyle} onClick={this.toggleRightMenu.bind(this)}><i className={'ui icon chevron circle ' + this.state.rightSidebarIcon} /></div>
          <div style={this.columnRightSideStyle}>
            <RightPane
              viewstore={viewstore}
              metastore={metastore}
              modestore={modestore}
              userstore={userstore}/>
          </div>
        </div>
      </div>
    )
  }
}

//

export default Window;