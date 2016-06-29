/**
 * Created by dmitri on 20/04/16.
 */
'use strict';

import React from 'react';

import ModalActions from '../../actions/ModalActions';

class AbstractModal extends React.Component {
  constructor(props) {
    super(props);

    this._onModalChanged = () => {
      const activateModal = () => this.activateModal(this.props.modalstore.getModalId());
      return activateModal.apply(this);
    };

    this.modalName = 'empty';

    this.state = {
      active: false
    };
  }

  activateModal(modal) {
    //console.log('Activating modal ' + modal);
    if(modal == this.modalName) {
      this.setState({active: true});
    }
    else {
      this.setState({active: false});
    }
  }

  cancel() {
    window.setTimeout(
    ModalActions.showModal.bind(null, null, null),
      10);
  }

  clearState(state) {

  }

  componentDidMount() {
    this.props.modalstore.addModalChangeListener(this._onModalChanged);
  }

  componentWillUpdate(nextProps, nextState) {
    if(!nextState.active && this.state.active) {
      this.clearState(nextState);
      $(this.refs.modal.getDOMNode()).modal('hide');
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if(this.state.active && !prevState.active) {
      $(this.refs.modal.getDOMNode()).modal({
        onHide: this.cancel,
        observeChanges: true
      }).modal('show');
    }
  }

  componentWillUnmount() {
    this.props.modalstore.removeModalChangeListener(this._onModalChanged);
  }
}

export default AbstractModal;