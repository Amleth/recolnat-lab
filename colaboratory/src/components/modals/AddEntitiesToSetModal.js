/**
 * Created by dmitri on 20/04/16.
 */
'use strict';

import React from 'react';

import AbstractModal from './AbstractModal';

import ModalConstants from '../../constants/ModalConstants';

class AddEntitiesToSetModal extends AbstractModal {
  constructor(props) {
    super(props);

    this.state.nameInput = '';
    this.modalName = ModalConstants.Modals.addEntitiesToSet;
  }

  clearState(state) {
    state.nameInput = '';
  }

  create() {

  }

  checkKey(event) {
    switch(event.keyCode) {
      case 13:
        this.create();
        break;
      case 27:
        this.cancel();
        break;
    }
  }

  onNameChange(event) {
    this.setState({nameInput: event.target.value});
  }

  componentDidMount() {
    super.componentDidMount();

    $('.menu .item', $(this.refs.modal.getDOMNode())).tab();
  }

  render() {
return <div className="ui modal" ref='modal'>
  <i className="close icon"></i>
  <div className="header">
    Ajouter au set
  </div>
  <div className="content" onKeyUp={this.checkKey.bind(this)}>
    <div className="ui top attached tabular menu">
      <a className="active item" data-tab="subset">Sous-set</a>
      <a className="item" data-tab="recolnat">Panier ReColNat</a>
      <a className="item" data-tab="web">Web</a>
    </div>
    <div className="ui bottom attached active tab segment" data-tab="subset">
      <div className='description'>
        <div className='header'>La nouvelle étude sera créée dans {this.props.managerstore.getSelected().name}</div>
        <p>Veuillez entrer le nom de l'étude à créer : </p>
        <div className='ui input'>
          <input type='text'
                 autofocus='true'
                 value={this.state.nameInput}
                 onChange={this.onNameChange.bind(this)}/>
        </div>
      </div>
    </div>
    <div className="ui bottom attached tab segment" data-tab="recolnat">
      <div className='content'>
        <div className='description'>
          <div className='header'>Ajouter les {this.props.managerstore.getBasketSelection().length} planches sélectionnées dans le panier à l'étude {this.props.managerstore.getSelected().name}
          </div>
        </div>
      </div>
    </div>
    <div className="ui bottom attached tab segment" data-tab="web">
      <div className='content'>
        <div className='description'>
          <div className='header'>Les images du fichier choisi seront importées en tant que planches dans l'étude {this.props.managerstore.getSelected().name}</div>
        </div>
      </div>
    </div>
  </div>
  <div className="actions">
    <div className="ui black deny button" onClick={this.cancel.bind(this)}>
      Annuler
    </div>
    <div className="ui positive right labeled icon button"
         onClick={this.create.bind(this)}>
      Ajouter
      <i className="checkmark icon"></i>
    </div>
  </div>
</div>;
  }
}

export default AddEntitiesToSetModal;