/**
 * Created by dmitri on 07/06/16.
 */
'use strict';

import React from 'react';

import AbstractModal from './AbstractModal';

import ModalConstants from '../../constants/ModalConstants';

import REST from '../../utils/REST';

class AddAnnotationToEntity extends AbstractModal {
  constructor(props) {
    super(props);
    this.state.annotationTextInput = '';
    this.modalName = ModalConstants.Modals.addAnnotationToEntity;
  }

  clearState(state) {
    state.annotationTextInput = '';
  }

  checkKey(event) {
    switch(event.keyCode) {
      //case 13:
      //  this.addAnnotation();
      //  break;
      case 27:
        this.cancel();
        break;
    }
  }

  addAnnotation() {
    if(this.state.annotationTextInput.length < 1) {
      alert('Le texte est obligatoire');
      return;
    }
    REST.addAnnotation(this.state.annotationTextInput, this.props.modalstore.getTargetData().entity, this.props.modalstore.runSuccessCallback.bind(this.props.modalstore), this.props.modalstore.runErrorCallback.bind(this.props.modalstore));
    this.cancel();
  }

  onTextChange(event) {
    this.setState({annotationTextInput: event.target.value});
  }

  render() {
    return <div className="ui small modal" ref='modal'>
      <i className="close icon"></i>
      <div className="header">
        Nouvelle annotation
      </div>
      <div className="content" onKeyUp={this.checkKey.bind(this)}>
        <div className="description">
          <div className='ui form'>
            <div className='field'>
              <label>Texte de l'annotation</label>
            <textarea rows='6'
                      autofocus='true'
                      value={this.state.annotationTextInput}
                      onChange={this.onTextChange.bind(this)}/>
            </div>
          </div>
        </div>
      </div>
      <div className="actions">
        <div className="ui black deny button" onClick={this.cancel.bind(this)}>
          Annuler
        </div>
        <div className="ui positive right labeled icon button"
             onClick={this.addAnnotation.bind(this)}>
          Ajouter annotation
          <i className="checkmark icon"></i>
        </div>
      </div>
    </div>;
  }
}

export default AddAnnotationToEntity;