/**
 * Created by dmitri on 20/04/16.
 */
'use strict';

import React from 'react';

import AbstractModal from './AbstractModal';

import Globals from '../../utils/Globals';

import ModalConstants from '../../constants/ModalConstants';

class NewStudyModal extends AbstractModal {
  constructor(props) {
    super(props);

    this.state.newStudyNameInput = '';
    this.modalName = ModalConstants.Modals.createStudy;
  }

  clearState(state) {
    state.newStudyNameInput = '';
  }

  checkKey(event) {
    switch(event.keyCode) {
      case 13:
        this.createNewStudy();
        break;
      case 27:
        this.cancel();
        break;
    }
  }

  onNameChange(event) {
    this.setState({newStudyNameInput: event.target.value});
  }

  createNewStudy() {
    if(this.state.newStudyNameInput.length < 1) {
      alert('Une étude doit avoir un nom');
      return;
    }
    Globals.createStudy(this.state.newStudyNameInput, ManagerActions.loadStudiesAndSets);
  }

  render() {
    return <div className="ui small modal" ref='modal'>
      <i className="close icon"></i>
      <div className="header">
        Nouvelle étude
      </div>
      <div className="content" onKeyUp={this.checkKey.bind(this)}>
        <div className="description">
          <p>Quel nom souhaitez-vous donner à la nouvelle étude ?</p>
          <div className='ui input'>
            <input type='text'
                   autofocus='true'
                   value={this.state.newStudyNameInput}
                   onChange={this.onNameChange.bind(this)}/>
          </div>
        </div>
      </div>
      <div className="actions">
        <div className="ui black deny button" onClick={this.cancel.bind(this)}>
          Annuler

        </div>
        <div className="ui positive right labeled icon button"
             onClick={this.createNewStudy.bind(this)}>
          Créer étude
          <i className="checkmark icon"></i>
        </div>
      </div>
    </div>;
  }
}

export default NewStudyModal;