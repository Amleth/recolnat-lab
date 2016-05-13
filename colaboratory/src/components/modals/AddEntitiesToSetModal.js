/**
 * Created by dmitri on 20/04/16.
 */
'use strict';

import React from 'react';

import AbstractModal from './AbstractModal';

import Basket from '../manager/Basket';

import ModalConstants from '../../constants/ModalConstants';

class AddEntitiesToSetModal extends AbstractModal {
  constructor(props) {
    super(props);

    this.state.nameInput = '';
    this.state.validatedItems = [];
    this.modalName = ModalConstants.Modals.addEntitiesToSet;
  }

  clearState(state) {
    state.nameInput = '';
    state.validatedItems = [];
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

  scrollHorizontal(event) {
    event.preventDefault();
    var node = this.refs.cards.getDOMNode();
    node.scrollLeft = node.scrollLeft + event.deltaY;
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
          <Basket managerstore={this.props.managerstore}/>
        </div>
      </div>
    </div>
    <div className="ui bottom attached tab segment" data-tab="web">
      <div className='content'>
        <div className='description'>
          <div className='header'>Pour chaque image que vous voulez ajouter, entrez les informations demandées et cliquez sur Valider</div>
          <div className='ui form'>
            <div className='fields'>
              <div className='field required'>
                <label>Nom</label>
                <input placeholder='Nom' type='text'/>
                </div>
              <div className='field required'>
                <label>URL</label>
                <input placeholder='URL' type='text'/>
              </div>
              <div className='field'>
                <label>URL vignette</label>
                <input placeholder='URL vignette' type='text'/>
              </div>
            </div>
          </div>

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

//<div ref='cards' style={this.cardRowStyle} onWheel={this.scrollHorizontal.bind(this)}>
//  {this.state.validatedItems.map(function(item, idx) {
//    return <WebItem content={item} key={'WEB-ITEM-' + idx}
//    />
//  })}
//</div>

export default AddEntitiesToSetModal;