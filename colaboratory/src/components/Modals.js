/**
 * Created by dmitri on 07/04/16.
 */
'use strict';

import React from 'react';

import LoginModal from './modals/LoginModal';
import ConfirmDeleteModal from './modals/ConfirmDelete';
import AddAnnotationToEntity from './modals/AddAnnotationToEntity';
import TestRunnerModal from './modals/TestRunnerModal';
import FeedbackForm from './modals/FeedbackForm';
import AddToSet from './modals/AddToSet';
import OrganiseSet from './modals/OrganiseSet';
import DownloadSetImages from './modals/DownloadSetImages';

import ViewConstants from '../constants/ViewConstants';

class Modals extends React.Component {
  constructor(props) {
    super(props);

    this.containerStyle = {
      display: '',
      // position: 'fixed',
      zIndex: ViewConstants.zIndices.modalDimmer,
      top: 0,
      left: 0
    };

    this._onModalChange = () => {
      const updateDisplay = () => this.setState({showModal: this.props.modalstore.getModalId()});
      return updateDisplay.apply(this);
    };

    this._onUserLogIn = () => {
      const userLogIn = () => this.setState({showModal: null});
      return userLogIn.apply(this);
    };

    this._onUserLogOut = () => {
      const userLogOut = () => this.setState({showModal: true});
      return userLogOut.apply(this);
    };

    this.state = {
      showModal: !props.userstore.isUserAuthorized()
    };
  }

  componentDidMount() {
    this.props.modalstore.addModalChangeListener(this._onModalChange);
    this.props.userstore.addUserLogInListener(this._onUserLogIn);
    this.props.userstore.addUserLogOutListener(this._onUserLogOut);
  }

  componentWillUpdate(nextProps, nextState) {
    if(this.state.showModal && !nextState.showModal) {
      this.containerStyle.display = 'none';
    }
    if(!this.state.showModal && nextState.showModal) {
      this.containerStyle.display = '';
    }
  }

  componentWillUnmount() {
    this.props.modalstore.removeModalChangeListener(this._onModalChange);
    this.props.userstore.addUserLogInListener(this._onUserLogIn);
    this.props.userstore.addUserLogOutListener(this._onUserLogOut);
  }

  render() {
    return <div style={this.containerStyle}>
      <LoginModal userstore={this.props.userstore} />
      <AddToSet modalstore={this.props.modalstore}
                metastore={this.props.metastore}
                managerstore={this.props.managerstore}
                viewstore={this.props.viewstore}
                benchstore={this.props.benchstore}
                basketstore={this.props.basketstore}
                userstore={this.props.userstore}
                modestore={this.props.modestore} />
      <ConfirmDeleteModal modalstore={this.props.modalstore}
                          userstore={this.props.userstore}
                          metastore={this.props.metastore} />
      <AddAnnotationToEntity modalstore={this.props.modalstore}
                             userstore={this.props.userstore}
      />
      <TestRunnerModal modalstore={this.props.modalstore}
                       userstore={this.props.userstore}/>
      <FeedbackForm modalstore={this.props.modalstore}
                    userstore={this.props.userstore}/>
      <OrganiseSet metastore={this.props.metastore}
                   benchstore={this.props.benchstore}
                   userstore={this.props.userstore}
                   modalstore={this.props.modalstore} />
      <DownloadSetImages metastore={this.props.metastore}
                         benchstore={this.props.benchstore}
                         userstore={this.props.userstore}
                         modalstore={this.props.modalstore}/>
    </div>
  }
}

export default Modals;
