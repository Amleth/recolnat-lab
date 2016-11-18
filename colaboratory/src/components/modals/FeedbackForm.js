/**
 * Created by dmitri on 30/05/16.
 */
'use strict';

import React from 'react';

import AbstractModal from './AbstractModal';

import Globals from '../../utils/Globals';
import ServiceMethods from '../../utils/ServiceMethods';

import ModalConstants from '../../constants/ModalConstants';
import ServerConstants from '../../constants/ServerConstants';

import ManagerActions from '../../actions/ManagerActions';

import conf from '../../conf/ApplicationConfiguration';

class FeedbackForm extends AbstractModal {
  constructor(props) {
    super(props);

    this.modalName = ModalConstants.Modals.feedback;

    this.state = {
      feedbackType: null,
      message: '',
      userWantsAnswer: false
    };
  }

  clearState(state) {
    state.feedbackType = null;
    state.message = '';
    state.userWantsAnswer = false;
  }

  shouldModalClose() {
    return this.postFeedback();
  }

  checkKey(event) {
    switch(event.keyCode) {
      case 13:
        this.postFeedback();
        break;
      case 27:
        this.cancel();
        break;
    }
  }

  receiveMessage(message) {
    if(message.action === ServerConstants.ActionTypes.Receive.DONE) {
      this.props.modalstore.runSuccessCallback(message);
    }
    else {
      this.props.modalstore.runErrorCallback(message);
    }
  }

  postFeedback() {
    if(!this.state.feedbackType) {
      alert('Vous devez faire une sélection dans la liste déroulante');
      return false;
    }
    if(this.state.message.length < 2) {
      alert('Vous devez entrer un message');
      return false;
    }

    var message = {
      type: this.state.feedbackType,
      text: this.state.message,
      rsvp: this.state.userWantsAnswer
    };

    ServiceMethods.sendFeedback(message);

    this.setState({feedbackType: null,
      message: '',
      userWantsAnswer: false})

    return true;
  }

  toggleAnswerDemand() {
    if(this.state.userWantsAnswer) {
      this.setState({userWantsAnswer: false});
    }
    else {
      this.setState({userWantsAnswer: true});
    }
  }

  onTextChange(e) {
    this.setState({message: e.target.value});
  }

  selectFeedbackOption(e) {
    this.setState({feedbackType: e.target.value});
  }

  render() {
    //console.log('rendering confirm delete');
    return <div className="ui small modal" ref='modal'>
      <i className="close icon"></i>
      <div className="header">
        Formulaire de Contact
      </div>
      <div className="content" onKeyUp={this.checkKey.bind(this)}>
        <div className="description">
          <div className='ui form'>

              <select value={this.state.type} className='menu' onChange={this.selectFeedbackOption.bind(this)}>
                <option className='item' value={null} >Vous voulez... (sélectionnez dans la liste)</option>
                <option className='item' value='bug'>Signaler un bug</option>
                <option className='item' value='enhancement'>Proposer une amélioration</option>
                <option className='item' value='feedback'>Nous parler de votre expérience</option>
                <option className='item' value='other'>Autre</option>
              </select>

            <div className='field'>
            <textarea rows='6'
                      autofocus='true'
                      value={this.state.message}
                      onChange={this.onTextChange.bind(this)}/>
            </div>
            <div className='ui checkbox'>
              <input type='checkbox' checked={this.state.userWantsAnswer} onChange={this.toggleAnswerDemand.bind(this)} />
              <label>Je souhaite être tenu au courant des réponses à ma requête. Les réponses vous seront communiquées via l'adresse e-mail renseignée à la création de votre compte ReColNat</label>
            </div>
          </div>
        </div>
      </div>
      <div className="actions">
        <div className="ui black deny button" onClick={this.cancel.bind(this)}>
          Annuler
        </div>
        <div className="ui positive right labeled icon button">
          Envoyer
          <i className="unlink icon"></i>
        </div>
      </div>
    </div>;
  }
}

export default FeedbackForm;