/**
* Main application window (& general layout definition). Stores are created here.
*/

'use strict';

import React from 'react';

//import VirtualBenchLab from './components/VirtualBenchLab';
import LeftPane from './components/panes/LeftPane';
import CenterPane from './components/panes/CenterPane';
import RightPane from './components/panes/RightPane';
//import PopupToolContainer from './components/PopupToolComponent';
//import Tooltip from './components/ActiveToolTooltip';
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
import DragNDropStore from './stores/DragNDropStore';
import InspectorStore from './stores/InspectorStore';
import BasketStore from './stores/BasketStore';
import WebSocketConnector from './utils/WebSocketConnector';

import OrbalContextMenu from './components/context-menu/OrbalContextMenu';
import WebSocketStatus from './components/common/WebSocketStatus';

import ViewActions from './actions/ViewActions';
import MetadataActions from './actions/MetadataActions';
import ModalActions from './actions/ModalActions';

import ViewConstants from './constants/ViewConstants';
import ModalConstants from './constants/ModalConstants';

import InterStoreCommunicationsController from './utils/InterStoreCommunicationsController';

import conf from './conf/ApplicationConfiguration';

const socket = new WebSocketConnector();
const ministore = new MinimapStore(socket);
const viewstore = new ViewStore(socket);
const toolstore = new ToolStore(socket);
const userstore = new UserStore(socket);
const menustore = new MenuStore(socket);
const managerstore = new ManagerStore(socket);
const imagestore = new ImageStore(socket);
const metastore = new MetadataStore(socket);
const modalstore = new ModalStore(socket);
const benchstore = new LabBenchStore(socket);
const basketstore = new BasketStore(socket);
const modestore = new ModeStore(socket);
const inspecstore = new InspectorStore(socket);
const dragstore = new DragNDropStore(socket);
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

    this.menuHeight = 58;
    this.closeTopPaneButtonHeight = 30;
    this.leftPaneWidth = 200;
    this.rightPaneWidth = 350;

    this.containerStyle = {
      position: 'relative',
      //height: '100vh',
      //width: '100vw',
      height: '100%',
      width: '100%',
      backgroundColor: 'rgba(245,241,222, 1.0)'
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
      overflowX: 'hidden',
      overflowY: 'auto',
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
      //top: '10vh',
      top: '10%',
      zIndex: ViewConstants.zIndices.leftPaneCloseButton,
      height: '20px',
      width: '10px',
      opacity: 0.6,
      WebkitTransition: 'left 1s',
      transition: 'left 1s'
    };

    this.rightButtonStyle = {
      position: 'absolute',
      right: this.rightPaneWidth + 'px',
      //top: '10vh',
      top: '10%',
      zIndex: ViewConstants.zIndices.rightPaneCloseButton,
      height: '20px',
      width: '10px',
      opacity: 0.6,
      WebkitTransition: 'right 1s',
      transition: 'right 1s'
    };

    this.recolnatMenuStyle = {
      border: 'medium none',
      borderBottom: '1px solid grey',
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
      leftSidebarIcon: 'left',
      rightSidebarIcon: 'right',
      activeSetName: userstore.getText('noSetLoaded')
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
    this.setState({userLoggedIn: true});
  }

  logout() {
    //api.closeWebsocket();
    this.setState({userLoggedIn: false});
  }

  receiveMessage(event) {
    if(event.origin.indexOf(conf.integration.recolnatMenuBarOrigin) == 0) {
      if(event.data.source) {
        if (event.data.source.indexOf('react') === 0) {
          return;
        }
      }
      switch(event.data.action) {
        case 'login':
          this.redirectCASLogin();
          break;
        case 'logout':
          this.redirectCASLogout();
          break;
        case 'profile':
          alert(userstore.getText('operationNotAvailableInVersion'));
          break;
        default:
          //console.log('Unknown event action ' + event.data.action);
          //console.log(JSON.stringify(event.data));
      }
    }
  }

  redirectCASLogin() {
    window.location.href = 'https://cas.recolnat.org/login?service=' + window.location.href;
  }

  redirectCASLogout() {
    window.location.href = 'https://cas.recolnat.org/logout';
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

  displayTestModal(event) {
    //console.log('key pressed ' + event.keyCode);
    if(event.ctrlKey && event.altKey && event.keyCode === 84) {
      event.preventDefault();
      event.stopPropagation();
      ModalActions.showModal(ModalConstants.Modals.testRunnerModal);
    }
  }

  signalIframeReady() {
    this.setState({menuIframe: true});
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
    userstore.addLanguageChangeListener(this.setState.bind(this, {}));
    window.setTimeout(ViewActions.updateViewport.bind(null, null, null, window.innerWidth-this.leftPaneWidth + this.rightPaneWidth, window.innerHeight -this.menuHeight, null), 10);
    window.setTimeout(ViewActions.updateViewportLocation.bind(null, this.menuHeight, this.leftPaneWidth), 10);
    window.addEventListener('resize', this.handleResize.bind(this));
    // Add recolnat-menu listeners
    window.addEventListener("message", this.receiveMessage.bind(this));
    window.addEventListener('keyup', this.displayTestModal.bind(this));
  }

  componentWillUpdate(nextProps, nextState) {
    let width = window.innerWidth;
    let height = window.innerHeight;
    let left = 0;
    //console.log('window width ' + width);
    this.containerStyle.height = height;
    this.containerStyle.width = width;

    this.leftButtonStyle.top = height/10;
    this.rightButtonStyle.top = height/10;

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

    this.columnMiddleStyle.left = left + 'px';
    this.columnMiddleStyle.width = width + 'px';
    this.columnLeftSideStyle.height = (window.innerHeight - this.menuHeight) + 'px';
    this.columnRightSideStyle.height = (window.innerHeight - this.menuHeight) + 'px';
    this.columnMiddleStyle.height = (window.innerHeight - this.menuHeight) + 'px';

    window.setTimeout(ViewActions.updateViewport.bind(null, null, null, width, window.innerHeight-this.menuHeight, null), 10);
    window.setTimeout(ViewActions.updateViewportLocation.bind(null, this.menuHeight, left), 10);
  }

  componentDidUpdate(prevProps, prevState) {
    if(this.state.userLoggedIn) {
      var frame = this.refs.recolnatMenu.getDOMNode().contentWindow;
      frame.postMessage({type: "user", username: userstore.getUser().login, userProfile: ''}, conf.integration.recolnatMenuBarUrl);
    }
  }

  componentWillUnmount() {
    userstore.removeUserLogInListener(this._onUserLogIn);
    userstore.removeUserLogOutListener(this._onUserLogOut);
    userstore.removeLanguageChangeListener(this.setState.bind(this, {}));
    window.removeEventListener('resize', this.handleResize.bind(this));
  }

  render() {
    return(
      <div style={this.containerStyle}>

          <iframe id="recolnatMenu"
                  ref='recolnatMenu'
                  style={this.recolnatMenuStyle}
                  seamless="seamless"
                  scrolling="no"
                  onLoad={this.signalIframeReady.bind(this)}
                  src={conf.integration.recolnatMenuBarUrl}></iframe>

        <Modals userstore={userstore}
                viewstore={viewstore}
                toolstore={toolstore}
                menustore={menustore}
                metastore={metastore}
                modalstore={modalstore}
                ministore={ministore}
                benchstore={benchstore}
                modestore={modestore}
                inspecstore={inspecstore}
                imagestore={imagestore}
                basketstore={basketstore}
                managerstore={managerstore} />
        <MainMenu top={this.menuHeight}
                  width={300}
                  userstore={userstore}
                  benchstore={benchstore}
                  viewstore={viewstore}
                  toolstore={toolstore}
                  menustore={menustore}
                  ministore={ministore}
                  metastore={metastore}
                  modestore={modestore}
                  inspecstore={inspecstore}
                  managerstore={managerstore} />
        <OrbalContextMenu
          menustore={menustore}
          userstore={userstore}
          ministore={ministore}
          metastore={metastore}
          benchstore={benchstore}
          viewstore={viewstore}
          toolstore={toolstore}
        />
        <WebSocketStatus socket={socket}
                         userstore={userstore}/>

        <div>
          <div style={this.columnLeftSideStyle}>
            <LeftPane
              imagestore={imagestore}
              userstore={userstore}
              viewstore={viewstore}
              toolstore={toolstore}
              menustore={menustore}
              metastore={metastore}
              modalstore={modalstore}
              modestore={modestore}
              ministore={ministore}
              benchstore={benchstore}
              managerstore={managerstore}
              dragstore={dragstore}
              inspecstore={inspecstore}
              />
          </div>
          <div className="ui right attached button mini compact" style={this.leftButtonStyle} onClick={this.toggleLeftMenu.bind(this)}><i className={'ui icon chevron circle ' + this.state.leftSidebarIcon} /></div>
          <div style={this.columnMiddleStyle}>
            <CenterPane
              imagestore={imagestore}
              userstore={userstore}
              viewstore={viewstore}
              toolstore={toolstore}
              menustore={menustore}
              metastore={metastore}
              modalstore={modalstore}
              modestore={modestore}
              ministore={ministore}
              benchstore={benchstore}
              managerstore={managerstore}
              dragstore={dragstore}
              inspecstore={inspecstore}
            />
          </div>
          <div className="ui left attached button mini compact" style={this.rightButtonStyle} onClick={this.toggleRightMenu.bind(this)}><i className={'ui icon chevron circle ' + this.state.rightSidebarIcon} /></div>
          <div style={this.columnRightSideStyle}>
            <RightPane
              visibleHeight={window.innerHeight - this.menuHeight}
              userstore={userstore}
              viewstore={viewstore}
              toolstore={toolstore}
              menustore={menustore}
              metastore={metastore}
              modalstore={modalstore}
              modestore={modestore}
              ministore={ministore}
              benchstore={benchstore}
              managerstore={managerstore}
              dragstore={dragstore}
              inspecstore={inspecstore}
              />
          </div>
        </div>
      </div>
    )
  }
}

//

export default Window;
