/**
 * Created by dmitri on 07/04/16.
 */
'use strict';

import React from 'react';

import ModalConstants from '../constants/ModalConstants';

import AddEntitiesToSetModal from './modals/AddEntitiesToSetModal';
import NewStudyModal from './modals/NewStudyModal';
import LoginModal from './modals/LoginModal';
import ConfirmDeleteModal from './modals/ConfirmDelete';
import AddAnnotationToEntity from './modals/AddAnnotationToEntity';
import CreateAndFillSet from './modals/CreateAndFillSet';

class ManagerModals extends React.Component {
  constructor(props) {
    super(props);

    this.containerStyle = {
      display: 'none',
      position: 'fixed',
      zIndex: 99999,
      top: 0,
      left: 0
    };

    this._onModalChange = () => {
      const updateDisplay = () => this.setState({showModal: this.props.modalstore.getModalId()});
      return updateDisplay.apply(this);
    };

    this.state = {
      showModal: null
    };
  }

  componentDidMount() {
    this.props.modalstore.addModalChangeListener(this._onModalChange);
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
  }

  render() {
    return <div style={this.containerStyle}>
      <LoginModal userstore={this.props.userstore} />
      <NewStudyModal modalstore={this.props.modalstore}
                     managerstore={this.props.managerstore} />
      <CreateAndFillSet modalstore={this.props.modalstore}
                        basketstore={this.props.basketstore}
                     managerstore={this.props.managerstore} />
      <AddEntitiesToSetModal modalstore={this.props.modalstore}
                             metastore={this.props.metastore}
                             managerstore={this.props.managerstore}
                             viewstore={this.props.viewstore}
                             benchstore={this.props.benchstore}
                             basketstore={this.props.basketstore}
                             modestore={this.props.modestore} />
      <ConfirmDeleteModal modalstore={this.props.modalstore}
                          metastore={this.props.metastore} />
      <AddAnnotationToEntity modalstore={this.props.modalstore}
      />
    </div>
  }
}

export default ManagerModals;
