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

import REST from '../../utils/REST';

class AddEntitiesToSetModal extends AbstractModal {
  constructor(props) {
    super(props);

    this._onMetadataAvailable = () => {
      const updateDisplayedName = () => this.updateDisplayName();
      return updateDisplayedName.apply(this);
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
    //state.source = 'subset';
    state.parentId = null;
    // state.parentIndex = null;
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
    REST.createSubSet(
      this.state.parentId,
      this.state.nameInput,
      function(parentId, newSetId, linkId) {
        window.setTimeout(ManagerActions.selectEntityInSetById.bind(null, parentId, newSetId), 10);
        window.setTimeout(ManagerActions.select.bind(null, newSetId, 'Set', name, parentId, linkId), 20);

        window.setTimeout(ManagerActions.reloadDisplayedSets.bind(null), 30);
    });
  }

  createFromBasket() {
    if(this.state.parentId.length < 1) {
      alert('Aucun set sélectionné');
      return;
    }
    window.setTimeout(ViewActions.changeLoaderState.bind(null, "Import en cours... "), 10);

    var items = this.props.managerstore.getBasketSelection();
    var specimens = [];
    for(var i = 0; i < items.length; ++i) {
      var itemId = items[i];
      var itemUuid = itemId.slice(0, 8) + '-'
        + itemId.slice(8, 12) + '-'
        + itemId.slice(12, 16) + '-'
        + itemId.slice(16, 20) + '-'
        + itemId.slice(20);

      var itemData = this.props.managerstore.getBasketItem(itemId);
      //console.log('uuid=' + itemUuid);
      specimens.push({
        recolnatSpecimenUuid: itemUuid,
        images: itemData.image,
        name: itemData.scientificname
      });
    }

    var onSuccess = null;
    var onError = null;
    switch(this.props.modestore.getMode()) {
      case ModeConstants.Modes.SET:
        this.props.managerstore.addBasketItemsToSet(specimens, this.state.parentId, true);
        return;
      case ModeConstants.Modes.ORGANISATION:
      case ModeConstants.Modes.OBSERVATION:
        onSuccess = function(response) {
          // Place specimens in middle of screen
          window.setTimeout(ViewActions.changeLoaderState.bind(null, 'Placement des images...'), 10);
          window.setTimeout(ManagerActions.changeBasketSelectionState.bind(null, null, false), 10);
          var viewId = this.props.benchstore.getActiveViewId();

          var data = [];
          var view = this.props.viewstore.getView();
          var x = view.left + view.width / 2;
          var y = view.top + view.height / 2;
          for(var j = 0; j < response.linkedEntities.length; ++j) {
            var linkedEntity = response.linkedEntities[j];
            for(var k = 0; k < linkedEntity.images.length; ++k) {
              var image = linkedEntity.images[k];
              data.push({
                x: x,
                y: y,
                view: viewId,
                entity: image.uid
              });
              x = x+image.width + 100;
            }
          }

          REST.placeEntityInView(data, MetadataActions.updateLabBenchFrom);
        };
        onError = function(err) {
          alert("Problème lors de l'import. Veuillez réessayer plus tard.");
          window.setTimeout(ViewActions.changeLoaderState.bind(null, null), 10);
        };
      break;
      default:
      log.error('Modal called from unsupported mode ' + this.props.modestore.getMode());
      break;
    }

    REST.importRecolnatSpecimensIntoSet(specimens, this.state.parentId, onSuccess.bind(this), onError);
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
  }

  componentWillUpdate(nextProps, nextState) {
    if(!this.state.active && nextState.active) {
      nextState.parentId = this.props.modalstore.getTargetData().parent;
      // nextState.parentIndex = this.props.modalstore.getTargetData().index;
      this.props.metastore.addMetadataUpdateListener(nextState.parentId, this._onMetadataAvailable);
      window.setTimeout(MetadataActions.updateMetadata.bind(null, [nextState.parentId]), 10);
    }
    super.componentWillUpdate(nextProps, nextState);
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
              <div className='header'>Ajouter les {this.props.managerstore.getBasketSelection().length} planches sélectionnées dans le panier au set {this.state.displayName}
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
