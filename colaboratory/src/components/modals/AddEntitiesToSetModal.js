/**
 * Created by dmitri on 20/04/16.
 */
'use strict';

import React from 'react';

import AbstractModal from './AbstractModal';

import Basket from '../manager/Basket';

import ModalConstants from '../../constants/ModalConstants';
import ModeConstants from '../../constants/ModeConstants';

import ManagerActions from '../../actions/ManagerActions';
import MetadataActions from '../../actions/MetadataActions';
import ModalActions from '../../actions/ModalActions';
import ViewActions from '../../actions/ViewActions';
import BasketActions from '../../actions/BasketActions';

import ServiceMethods from '../../utils/ServiceMethods';

class AddEntitiesToSetModal extends AbstractModal {
  constructor(props) {
    super(props);

    this._onMetadataAvailable = () => {
      const updateDisplayedName = () => this.updateDisplayName();
      return updateDisplayedName.apply(this);
    };

    this._onBasketUpdate = () => {
      const refresh = () => this.setState({});
      return refresh.apply(this);
    };

    this.state.source = 'subset';
    this.state.parentId = null;
    // this.state.parentIndex = null;
    this.state.displayName = '';
    this.state.nameInput = '';
    this.state.validatedItems = [];
    this.modalName = ModalConstants.Modals.addEntitiesToSet;
  }

  clearState(state) {
    state.parentId = null;
    state.displayName = '';
    state.nameInput = '';
    state.validatedItems = [];
  }

  create() {
    if(!this.state.parentId) {
      console.error('No parent selected');
      alert('Aucun set parent sélectionné');
      return;
    }
    switch(this.state.source) {
      case 'subset':
        this.createSubSet();
        break;
      case 'recolnat':
        this.createFromBasket();
        break;
      case 'web':
        this.createFromWeb();
        break;
      default:
        console.warning('No handler for source ' + this.state.source);
    }
    ModalActions.showModal(null, null, null);
  }

  updateDisplayName() {
    this.props.metastore.removeMetadataUpdateListener(this.state.parentId, this._onMetadataAvailable);
    this.setState({displayName: this.props.metastore.getMetadataAbout(this.state.parentId).name});
  }

  createSubSet() {
    var name = this.state.nameInput;
    ServiceMethods.createSet(this.state.nameInput, this.state.parentId, this.subSetCreated.bind(this));
  }

  subSetCreated(message) {
    if(message.clientProcessError) {
      alert('Impossible de créer le set ' + name);
    }
    else {
      window.setTimeout(ManagerActions.selectEntityInSetById.bind(null, message.data.parentSet, message.data.subSet), 10);
      window.setTimeout(ManagerActions.select.bind(null, message.data.subSet, 'Set', this.state.nameInput, message.data.parentSet, message.data.link), 20);
    }
  }

  createFromBasket() {
    if(this.state.parentId.length < 1) {
      alert('Aucun set sélectionné');
      return;
    }
    window.setTimeout(ViewActions.changeLoaderState.bind(null, "Import en cours... "), 10);

    var items = this.props.basketstore.getBasketSelection();
    if(items.length === 0) {
      alert('Aucune image à importer');
      return;
    }
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

    var importedEntities = [];
    var errors = 0;
    var onSuccess = null;
    var onError = null;
    var keepInBasket = false;
    switch(this.props.modestore.getMode()) {
      case ModeConstants.Modes.SET:
        onSuccess = function(message) {
          //window.setTimeout(BasketActions.changeBasketSelectionState.bind(null, message.data.recolnatUuid, false), 10);
          if(!keepInBasket) {
            // Remove this entity from basket
            window.setTimeout(BasketActions.removeItemFromBasket.bind(null, message.data.recolnatUuid), 10);
          }
          importedEntities.push(message.data);
        };
        onError = function() {
          errors++;
        };
        break;
      case ModeConstants.Modes.ORGANISATION:
      case ModeConstants.Modes.OBSERVATION:
        var placed = 0;
        var imagesToPlace = 0;
        var onEntityPlaced = function(message) {
          placed++;
          if(placed === imagesToPlace) {
            window.setTimeout(ViewActions.changeLoaderState.bind(null, null), 10);
          }
        };
        onSuccess = function(response) {
          importedEntities.push(response.data);
          if(!keepInBasket) {
            window.setTimeout(BasketActions.removeItemFromBasket.bind(null, response.data.recolnatUuid), 10);
          }

          if(importedEntities.length + errors === specimens.length) {
            // Place specimens in middle of screen
            window.setTimeout(ViewActions.changeLoaderState.bind(null, 'Placement des images...'), 10);
            var viewId = this.props.benchstore.getActiveViewId();

            var view = this.props.viewstore.getView();
            var x = view.left + view.width / 2;
            var y = view.top + view.height / 2;
            for(var j = 0; j < importedEntities.length; ++j) {
              var linkedEntity = importedEntities[j];
              for(var k = 0; k < linkedEntity.images.length; ++k) {
                var image = linkedEntity.images[k];
                imagesToPlace++;
                ServiceMethods.place(viewId, image.uid, x, y, onEntityPlaced.bind(this));
                x = x+image.width + 100;
              }
            }
          }
        };
        onError = function() {
          alert("Problème lors de l'import. Veuillez réessayer plus tard.");
          window.setTimeout(ViewActions.changeLoaderState.bind(null, null), 10);
        };
        break;
      default:
        log.error('Modal called from unsupported mode ' + this.props.modestore.getMode());
        break;
    }

    var onResponse = function(message) {
      if(importedEntities.length + errors + 1 === specimens.length) {
        if(errors > 0) {
          alert("Des problèmes sont survenus lors de l'import. Les spécimens concernés sont restés dans le panier.");
        }
        window.setTimeout(ViewActions.changeLoaderState.bind(null, null), 10);
      }
      else {
        window.setTimeout(ViewActions.changeLoaderState.bind(null, "Import en cours... "  + (importedEntities.length+1) +'/' + specimens.length + ' (' + errors + ' erreurs)'), 10);
      }
      if(message.clientProcessError) {
        errors++;
        onError.call(this);
      }
      else {
        onSuccess.call(this, message);
      }
    };

    for(var s = 0; s < specimens.length; ++s) {
      ServiceMethods.importRecolnatSpecimen(this.state.parentId, specimens[s].name, specimens[s].recolnatSpecimenUuid, specimens[s].images, onResponse.bind(this));
    }
  }

  createFromWeb() {

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
    var self = this;
    $('.menu .item', $(this.refs.modal.getDOMNode())).tab({
      onLoad: function(path) {
        console.log(path);
        $(self.refs.modal.getDOMNode()).modal('refresh');
        window.setTimeout(self.setState.bind(self, {source: path}), 10);
      }
    });
    this.props.basketstore.addBasketUpdateListener(this._onBasketUpdate);
  }

  componentWillUpdate(nextProps, nextState) {
    if(!this.state.active && nextState.active) {
      nextState.parentId = this.props.modalstore.getTargetData().parent;
      // nextState.parentIndex = this.props.modalstore.getTargetData().index;
      var metadata = nextProps.metastore.getMetadataAbout(nextState.parentId);
      if(metadata) {
        nextState.displayName = metadata.name;
      }
      else {
        this.props.metastore.addMetadataUpdateListener(nextState.parentId, this._onMetadataAvailable);
      }
      window.setTimeout(BasketActions.reloadBasket, 10);
    }
    super.componentWillUpdate(nextProps, nextState);
  }

  componentWillUnmount() {
    super.componentWillUnmount();
    this.props.basketstore.removeBasketUpdateListener(this._onBasketUpdate);
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
        </div>
        <div className="ui bottom attached active tab segment" data-tab="subset">
          <div className='description'>
            <div className='header'>Le nouveau set sera crée dans {this.state.displayName}</div>
            <p>Veuillez entrer le nom du set à créer : </p>
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
              <div className='header'>Ajouter les {this.props.basketstore.getBasketSelection().length} planches sélectionnées dans le panier au set {this.state.displayName}
              </div>
              <Basket basketstore={this.props.basketstore}/>
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

//<a className="item" data-tab="web">Web</a>

//<div className="ui bottom attached tab segment disabled" data-tab="web">
//  <div className='content'>
//    <div className='description'>
//      <div className='header'>Pour chaque image que vous voulez ajouter, entrez les informations demandées et cliquez sur Valider</div>
//      <div className='ui form'>
//        <div className='fields'>
//          <div className='field required'>
//            <label>Nom</label>
//            <input placeholder='Nom' type='text'/>
//          </div>
//          <div className='field required'>
//            <label>URL</label>
//            <input placeholder='URL' type='text'/>
//          </div>
//          <div className='field'>
//            <label>URL vignette</label>
//            <input placeholder='URL vignette' type='text'/>
//          </div>
//        </div>
//      </div>
//    </div>
//  </div>
//</div>

export default AddEntitiesToSetModal;
