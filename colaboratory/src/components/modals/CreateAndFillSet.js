/**
 * Created by dmitri on 23/06/16.
 */
'use strict';

import React from 'react';

import Basket from '../manager/Basket';

import AbstractModal from './AbstractModal';

import ModalConstants from '../../constants/ModalConstants';
import ServerConstants from '../../constants/ServerConstants';

import ViewActions from '../../actions/ViewActions';
import ManagerActions from '../../actions/ManagerActions';
import BasketActions from '../../actions/BasketActions';
import InspectorActions from '../../actions/InspectorActions';

import ServiceMethods from '../../utils/ServiceMethods';

class CreateAndFillSet extends AbstractModal {
  constructor(props) {
    super(props);

    this.modalName = ModalConstants.Modals.createAndFillSet;

    this._onBasketUpdate = () => {
      const refresh = () => this.setState({});
      return refresh.apply(this);
    };

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

    var keepInBasket = false;
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

    var imported = 0;
    var errors = 0;

    var onImportResponse = function(message) {
      imported++;
      if(message.clientProcessError) {
        errors++;
      }
      else {
        //window.setTimeout(BasketActions.changeBasketSelectionState.bind(null, null, false), 10);
        if (!keepInBasket) {
            window.setTimeout(BasketActions.removeItemFromBasket.bind(null, message.data.recolnatUuid), 10);
        }
      }

      window.setTimeout(ViewActions.changeLoaderState.bind(null, "Import en cours... "  + imported +'/' + specimens.length + ' (' + errors + ' erreurs)'), 10);

      if(imported === specimens.length) {
        if(errors > 0) {
          alert("Certains spécimens n'ont pas pu être importés. Ils sont restés dans le panier.");
        }
        window.setTimeout(ViewActions.changeLoaderState.bind(null, null), 10);
      }
    };

    // On set creation success, import images
    var onSetCreationResponse = function(message) {
      if(message.clientProcessError) {
        alert('Impossible de créer le nouveau set. Veuillez réessayer plus tard');
        window.setTimeout(ViewActions.changeLoaderState.bind(null, null), 10);
      }
      else {
        if(items.length > 0) {
          window.setTimeout(ViewActions.changeLoaderState.bind(null, "Import des données dans le nouveau set... "), 10);

          console.log(JSON.stringify(message));

          window.setTimeout(ManagerActions.select.bind(null, message.data.subSet, 'Set', name, message.data.parentSet, message.data.link), 10);
          window.setTimeout(ManagerActions.selectEntityInSetById.bind(null, message.data.parentSet, message.data.subSet), 10);
          window.setTimeout(InspectorActions.setInspectorData.bind(null, [message.data.subSet]), 10);

          for (var s = 0; s < specimens.length; ++s) {
            ServiceMethods.importRecolnatSpecimen(message.data.subSet, specimens[s].name, specimens[s].recolnatSpecimenUuid, specimens[s].images, onImportResponse);
          }
        }
        else {
          window.setTimeout(ViewActions.changeLoaderState.bind(null, null), 10);
        }
      }

    };

    ServiceMethods.createSet(
      this.state.nameInput,
      null,
      onSetCreationResponse);
  }

  componentDidMount() {
    super.componentDidMount();
    this.props.basketstore.addBasketUpdateListener(this._onBasketUpdate);
  }

  componentWillUpdate(nextProps, nextState) {
    if(!this.state.active && nextState.active) {
      window.setTimeout(BasketActions.reloadBasket, 10);
    }
    super.componentWillUpdate(nextProps, nextState);
  }

  componentWillUnmount() {
    super.componentWillUnmount();
    this.props.basketstore.removeBasketUpdateListener(this._onBasketUpdate);
  }

  render() {
    return <div className='ui small modal' ref='modal'>
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
