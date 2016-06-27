/**
 * Created by dmitri on 23/06/16.
 */
'use strict';

import React from 'react';

import Basket from '../manager/Basket';

import AbstractModal from './AbstractModal';

import ModalConstants from '../../constants/ModalConstants';

import ViewActions from '../../actions/ViewActions';
import ManagerActions from '../../actions/ManagerActions';
import BasketActions from '../../actions/BasketActions';
import InspectorActions from '../../actions/InspectorActions';

import REST from '../../utils/REST';

class CreateAndFillSet extends AbstractModal {
  constructor(props) {
    super(props);

    this.modalName = ModalConstants.Modals.createAndFillSet;

    this.state.nameInput = '';
  }

  clearState(state) {
    this.state.nameInput = '';
  }

  onNameChange(event) {
    this.setState({nameInput: event.target.value});
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

  create() {
    if(this.state.nameInput.length < 1) {
      alert('Le nom du nouveau set est obligatoire');
      return;
    }
    window.setTimeout(ViewActions.changeLoaderState.bind(null, "Création du set... "), 10);

    var name = this.state.nameInput;

    var keepInBasket = true;
    var items = this.props.basketstore.getBasketSelection();
    var specimens = [];
    for(var i = 0; i < items.length; ++i) {
      var itemId = items[i];
      var itemUuid = itemId.slice(0, 8) + '-'
        + itemId.slice(8, 12) + '-'
        + itemId.slice(12, 16) + '-'
        + itemId.slice(16, 20) + '-'
        + itemId.slice(20);

      var itemData = this.props.basketstore.getBasketItem(itemId);
      //console.log('uuid=' + itemUuid);
      specimens.push({
        recolnatSpecimenUuid: itemUuid,
        images: itemData.image,
        name: itemData.scientificname
      });
    }

    var onImportSuccess = function(response) {
      window.setTimeout(ManagerActions.reloadDisplayedSets, 10);
      window.setTimeout(BasketActions.changeBasketSelectionState.bind(null, null, false), 10);
      if(!keepInBasket) {
        for (var j = 0; j < items.length; ++j) {
          window.setTimeout(BasketActions.removeItemFromBasket.bind(null, items[j]), 10);
        }
      }
      window.setTimeout(ViewActions.changeLoaderState.bind(null, null), 10);
    };

    var onImportError = function(err, response) {
      alert("Echec de l'import. Veuillez réessayer plus tard");
      window.setTimeout(ViewActions.changeLoaderState.bind(null, null), 10);
    };

    // On set creation success, import images
    var onSetCreationSuccess = function(parentId, newSetId, linkId) {
      window.setTimeout(ViewActions.changeLoaderState.bind(null, "Import des données dans le nouveau set... "), 10);

      window.setTimeout(ManagerActions.select.bind(null,newSetId, 'Set', name, parentId, linkId),10);
      window.setTimeout(ManagerActions.selectEntityInSetById.bind(null, parentId, newSetId), 10);
      window.setTimeout(InspectorActions.setInspectorData.bind(null, [newSetId]), 10);

      REST.importRecolnatSpecimensIntoSet(specimens, newSetId, onImportSuccess, onImportError);
    };

    var onSetCreationError = function(err, res) {
      alert('Impossible de créer le nouveau set. Veuillez réessayer plus tard');
      window.setTimeout(ViewActions.changeLoaderState.bind(null, null), 10);
    };

    REST.createSubSet(
      null,
      this.state.nameInput,
      onSetCreationSuccess,
      onSetCreationError);
  }

  componentWillUpdate(nextProps, nextState) {
    if(!this.state.active && nextState.active) {
      window.setTimeout(BasketActions.reloadBasket, 10);
    }
    super.componentWillUpdate(nextProps, nextState);
  }

  render() {
    return <div className='ui modal' ref='modal'>
      <i className="close icon"></i>
      <div className="header">
        Nouveau set
      </div>
      <div className="content" onKeyUp={this.checkKey.bind(this)}>
          <div className='description'>
            <p>Nom du nouveau set</p>
            <div className='ui input'>
              <input type='text'
                     autofocus='true'
                     value={this.state.nameInput}
                     onChange={this.onNameChange.bind(this)}/>
            </div>
          </div>
        <div className='header'>Ajouter les {this.props.basketstore.getBasketSelection().length} planches sélectionnées dans le panier au set {this.state.nameInput}
        </div>
        <Basket basketstore={this.props.basketstore} />
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

export default CreateAndFillSet;