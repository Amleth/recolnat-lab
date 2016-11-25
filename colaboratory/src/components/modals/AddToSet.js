/**
 * Created by dmitri on 18/11/16.
 */
'use strict';

import React from 'react';
import csv from 'fast-csv';

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
import SetCreator from '../../utils/SetCreator';

class AddToSet extends AbstractModal {
  constructor(props) {
    super(props);

    this.newSubSetInputFieldStyle = {
      display: 'none'
    };

    this.basketPaneStyle = {
      display: 'none'
    };

    this.newSetStyle = {
      display: 'none'
    };

    this.selectCSVStyle = {
      display: 'none'
    };

    this.csvParseResultStyle = {
      display: 'none'
    };

    this.reloadButtonStyle = {
      display: 'none'
    };

    this.nextButtonStyle = {
      display: 'none'
    };

    this.launchRecolnatImportButtonStyle = {
      display: 'none'
    };

    this.launchWebImportButtonStyle = {
      display: 'none'
    };

    this.hiddenStyle = {
      maxHeight: 0,
      maxWidth: 0,
      opacity: 0
    };

    this._onMetadataAvailable = () => {
      const updateDisplayedName = () => this.updateDisplayName();
      return updateDisplayedName.apply(this);
    };

    this._onBasketUpdate = () => {
      const refresh = () => this.setState({});
      return refresh.apply(this);
    };

    // 1 displays first window, 2 displays CSV options
    this.state.stage = 1;
    // basket or csv or none
    this.state.source = 'basket';
    // current or new
    this.state.destination = 'current';

    this.state.parentId = null;

    // if destination = new
    this.state.newSetNameInput = '';

    // if source = csv
    this.state.separator = ',';
    this.state.inputSeparator = '';
    this.state.csvFileInput = null;
    this.state.isCSVInvalid = false;
    this.state.csvParseResult = [];
    this.state.csvParseMessages = [];
    this.state.csvParseErrors = [];

    this.state.displayName = '';

    this.modalName = ModalConstants.Modals.addToSet;
  }

  clearState(state) {
    state.stage = 1;
    // basket or csv or none
    state.source = 'basket';
    // current or new
    state.destination = 'current';

    state.parentId = null;

    // if destination = new
    state.newSetNameInput = '';

    // if source = csv
    state.separator = ',';
    state.inputSeparator = '';
    state.csvFileInput = null;
    state.isCSVInvalid = false;
    state.csvParseResult = [];
    state.csvParseMessages = [];
    state.csvParseErrors = [];

    state.displayName = '';
  }

  checkKey(event) {
    switch(event.keyCode) {
      case 13:
        this.launch(true);
        break;
      case 27:
        this.cancel();
        break;
    }
  }

  sourceChanged(event) {
    if(event.target.value === 'none') {
      this.setState({source: event.target.value, destination: 'new', stage: 1});
    }
    else {
      this.setState({source: event.target.value, stage: 1});
    }
  }

  destinationChanged(event) {
    this.setState({destination: event.target.value, stage: 1});
  }

  separatorChanged(event) {
    this.setState({separator: event.target.value});
  }

  inputSeparatorChanged(event) {
    this.setState({inputSeparator: event.target.value});
  }

  newSetNameInputChange(event) {
    this.setState({newSetNameInput: event.target.value});
  }

  scrollHorizontal(event) {
    event.preventDefault();
    var node = this.refs.cards.getDOMNode();
    node.scrollLeft = node.scrollLeft + event.deltaY;
  }

  loadFile(e) {
    //console.log(e.target.files[0]);
    this.setState({csvFileInput: e.target.files[0]});
  }

  showCsvParseResults() {
    this.setState({stage: 2});
    this.reloadCsv();
  }

  reloadCsv() {
    var reader = new FileReader();
    reader.onload = this.csvLoaded.bind(this);
    reader.readAsText(this.state.csvFileInput);
  }

  csvLoaded(e) {
    //console.log(e.target.result);
    var self = this;
    var parsedRows = [];
    var invalidRows = [];
    var messages = [];
    var csvInvalid = false;
    var rowCounter = 0;
    csv.fromString(e.target.result,
      {
        headers: true,
        strictColumnHandling: true,
        trim: true,
        ignoreEmpty: true,
        delimiter: this.state.separator === 'other' ? this.state.inputSeparator : this.state.separator
      })
      .validate(function(data) {
        if(!data) {
          return false;
        }
        if(!data.name || !data.url) {
          return false;
        }
        return true;
      })
      .on('data-invalid', function (data, index) {
        //rowCounter++;
        if(data) {
          var invalid = {
            data: data.join(self.state.separator === 'other'? self.state.inputSeparator : self.state.separator),
            row: index
          };
          invalidRows.push(invalid);
        }
        else {
          invalidRows[invalidRows.length-1].row = index;
        }
        csvInvalid = true;
      })
      .on('data', function (data) {
        //rowCounter++;
        parsedRows.push(data);
      })
      .on('error', function(error) {
        //rowCounter++;
        //var invalid = {
        //  data: error,
        //  row: rowCounter
        //};
        //invalidRows.push(invalid);
        messages.push("Un problème est survenu pendant la lecture du fichier. Le fichier choisi n'est pas au format CSV.");
        csvInvalid = true;
      })
      .on('end', function () {
        console.log('CSV parse end');
        self.setState({csvParseResult: parsedRows, csvParseErrors: invalidRows, csvParseMessages: messages, isCSVInvalid: csvInvalid});
      });
  }

  launch(keepInBasket) {
    window.setTimeout(ViewActions.changeLoaderState.bind(null, "Lancement de l'import..."), 10);
    var setProps = {
      name: this.state.destination === 'new' ? this.state.newSetNameInput : null,
      parent: this.state.destination === 'new' ? this.state.parentId : null,
      setId: this.state.destination === 'current' ? this.state.parentId : null
    };
    var imports = [];
    if(this.state.source === 'basket') {
      var items = this.props.basketstore.getBasketSelection();
      if(items.length === 0) {
        alert('Aucune image à importer');
        return;
      }
      for(var i = 0; i < items.length; ++i) {
        var itemId = items[i];
        var itemUuid = itemId.slice(0, 8) + '-'
          + itemId.slice(8, 12) + '-'
          + itemId.slice(12, 16) + '-'
          + itemId.slice(16, 20) + '-'
          + itemId.slice(20);

        var itemData = this.props.basketstore.getBasketItem(itemId);
        //console.log('uuid=' + itemUuid);
        var name = '';
        if(itemData.scientificname) {
          name = itemData.scientificname;
        } else if(itemData.catalognumber) {
          name = itemData.catalognumber;
        }
        else {
          name = "Spécimen " + itemId;
        }
        imports.push({
          source: 'recolnat',
            recolnatSpecimenUuid: itemUuid,
            images: itemData.image,
            name: name
        });
      }
    }
    else if(this.state.source === 'csv') {
      for(var i = 0; i < this.state.csvParseResult.length; ++i) {
        imports.push({
          source: 'web',
          name: this.state.csvParseResult[i].name,
          url: this.state.csvParseResult[i].url
        });
      }
    }
    var placeInView = this.props.modestore.isInObservationMode() || this.props.modestore.isInOrganisationMode();

    var creator = new SetCreator(setProps,imports, placeInView, keepInBasket, this.props.benchstore, this.props.viewstore);
    creator.run();

    // Hide modal
    window.setTimeout(ModalActions.showModal.bind(null, null), 10);
  }

  componentDidMount() {
    super.componentDidMount();
    this.props.basketstore.addBasketUpdateListener(this._onBasketUpdate);
  }

  componentWillUpdate(nextProps, nextState) {
    if(!this.state.active && nextState.active) {
      if(this.props.modalstore.getTargetData().parent) {
        nextState.parentId = this.props.modalstore.getTargetData().parent;
        var metadata = nextProps.metastore.getMetadataAbout(nextState.parentId);
        if(metadata) {
          nextState.displayName = metadata.name;
        }
        else {
          this.props.metastore.addMetadataUpdateListener(nextState.parentId, this._onMetadataAvailable);
        }
      }
      else {
        nextState.displayName = 'Mes sets';
      }
      window.setTimeout(BasketActions.reloadBasket, 10);
    }

    if(nextState.active) {
      if(!this.props.modalstore.getTargetData().parent) {
        nextState.destination = 'new';
      }
      if(nextState.stage === 1) {
        this.newSubSetInputFieldStyle.display = nextState.destination === 'new' ? '' : 'none';
        this.basketPaneStyle.display = nextState.source === 'basket' ? '' : 'none';
        this.selectCSVStyle.display = nextState.source === 'csv' ? '' : 'none';
        this.nextButtonStyle.display = nextState.csvFileInput == null? 'none' : '';
        this.launchRecolnatImportButtonStyle.display = nextState.source === 'basket' ? '': 'none';
        this.newSetStyle.display = nextState.source === 'none' ? '' : 'none';
      }
      else {
        this.newSubSetInputFieldStyle.display = 'none';
        this.basketPaneStyle.display = 'none';
        this.selectCSVStyle.display = 'none';
        this.launchRecolnatImportButtonStyle.display = 'none';
        this.newSetStyle.display = 'none';
      }
      if(nextState.stage === 2) {
        this.csvParseResultStyle.display = '';
        this.reloadButtonStyle.display = nextState.isCSVInvalid ? '' : 'none';
        this.launchWebImportButtonStyle.display = nextState.isCSVInvalid ? 'none' : '';
      }
      else {
        this.csvParseResultStyle.display = 'none';
        this.reloadButtonStyle.display = 'none';
        this.launchWebImportButtonStyle.display = 'none';
      }
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
        <div>Ajouter les images
          <div className='grouped fields'>
            <div className='field'>
              <div className='ui radio checkbox'>
                <input name='source'
                       type='radio'
                       value='basket'
                       onChange={this.sourceChanged.bind(this)}
                       checked={this.state.source === 'basket'} />
                <label>depuis le panier Recolnat (ci-dessous)</label>
              </div>
            </div>
            <div className='field'>
              <div className='ui radio checkbox'>
                <input name='source'
                       type='radio'
                       value='csv'
                       onChange={this.sourceChanged.bind(this)}
                       checked={this.state.source === 'csv'}/>
                <label>depuis un fichier CSV ou Excel CSV</label>
              </div>
            </div>
            <div className='field'>
              <div className='ui radio checkbox'>
                <input name='source'
                       type='radio'
                       value='none'
                       onChange={this.sourceChanged.bind(this)}
                       checked={this.state.source === 'none'}/>
                <label>Ne pas ajouter d'images (créer seulement un set vide)</label>
              </div>
            </div>
          </div>
          <div className='ui divider' />
          <div className='grouped fields'>
            <div className='field'>
              <div className={'ui radio checkbox' + (this.state.parentId ? '': ' disabled') + (this.state.source === 'none' ? ' disabled' : '')}>
                <input name='destination'
                       type='radio'
                       value='current'
                       onChange={this.destinationChanged.bind(this)}
                       checked={this.state.destination === 'current'}/>
                <label>dans le set {this.state.displayName}</label>
              </div>
            </div>
            <div className='field'>
              <div className='ui radio checkbox'>
                <input name='destination'
                       type='radio'
                       value='new'
                       onChange={this.destinationChanged.bind(this)}
                       checked={this.state.destination === 'new'}/>
                <label>dans un nouveau sous-set de {this.state.displayName} : </label>
              </div>
              <div className='ui input' style={this.newSubSetInputFieldStyle}>
                <input placeholder='Nom du nouveau sous-set' value={this.state.newSetNameInput} onChange={this.newSetNameInputChange.bind(this)} type='text' />
              </div>
            </div>
          </div>
        </div>

        <div className='content' style={this.newSetStyle}>
          <div className='ui divider' />
          <div className="actions" style={this.actionBarStyle}>
            <div className="ui black deny button" onClick={this.cancel.bind(this)}>
              Annuler
            </div>
            <div className={"ui positive right labeled icon button" + (this.state.destination === 'new' && this.state.newSetNameInput.length === 0 ? ' disabled' : '')}
                 onClick={this.launch.bind(this, true)}>
              <div className='ui text'>
                Créer set vide
              </div>
              <i className="checkmark icon"></i>
            </div>
          </div>
        </div>


        <div className='content' style={this.basketPaneStyle}>
          <div className='ui divider' />
          <div className='description'>
            <div className='header'>Ajouter les {this.props.basketstore.getBasketSelection().length} planches sélectionnées dans le panier au set {this.state.destination === 'current'? this.state.displayName : this.state.newSetNameInput}
            </div>
            <Basket basketstore={this.props.basketstore}/>
          </div>
          <div className="actions" style={this.actionBarStyle}>
            <div className="ui black deny button" onClick={this.cancel.bind(this)}>
              Annuler
            </div>
            <div className={"ui positive right labeled icon button" + (this.state.destination === 'new' && this.state.newSetNameInput.length === 0 ? ' disabled' : '')}
                 style={this.launchRecolnatImportButtonStyle}
                 onClick={this.launch.bind(this, true)}>
              <div className='ui text'>
                Ajouter au set
              </div>
              <div className='ui text' style={this.buttonSubTextStyle}>
                et conserver dans le panier
              </div>
              <i className="checkmark icon"></i>
            </div>
            <div className={"ui positive right labeled icon button" + (this.state.destination === 'new' && this.state.newSetNameInput.length === 0 ? ' disabled' : '')}
                 style={this.launchRecolnatImportButtonStyle}
                 onClick={this.launch.bind(this, false)}>
              <div className='ui text'>
                Ajouter au set
              </div>
              <div className='ui text' style={this.buttonSubTextStyle}>
                et supprimer du panier
              </div>
              <i className="checkmark icon"></i>
            </div>
          </div>
        </div>

        <div className='content' style={this.selectCSVStyle}>
          <div className='ui divider' />
          <h4 className='ui center aligned header'>
            Import d'images extérieures à Recolnat
          </h4>
          <div className='description'>
            <div className='ui text'>
              Vous pouvez importer dans le collaboratoire des images extérieures à la base d'images Recolnat (panier). Attention, ces images doivent obligatoirement être accessibles en ligne (lien http ou https).
            </div>
            <div className='ui text'>
              Pour ce faire vous devez d'abord créer avec Excel ou LibreOffice un fichier contenant la liste de ces images, l'exporter au format CSV puis choisir ce fichier ci-dessous.
            </div>
            <div className='content'>
              <div className='grouped fields'>
                <div className='field'>
                  <div className='ui radio checkbox'>
                    <input name='separator'
                           type='radio'
                           value=';'
                           onChange={this.separatorChanged.bind(this)}
                           checked={this.state.separator === ';'} />
                    <label>Format CSV français avec séparateur ; Télécharger exemple</label>
                  </div>
                </div>
                <div className='field'>
                  <div className='ui radio checkbox'>
                    <input name='separator'
                           type='radio'
                           value=','
                           onChange={this.separatorChanged.bind(this)}
                           checked={this.state.separator === ','} />
                    <label>Format CSV anglo-saxon avec séparateur , Télécharger exemple</label>
                  </div>
                </div>
                <div className='field'>
                  <div className='ui radio checkbox'>
                    <input name='separator'
                           type='radio'
                           value=''
                           onChange={this.separatorChanged.bind(this)}
                           checked={this.state.separator === 'other'} />
                    <label>Autre format dont je donne le séparateur ci-contre</label>
                  </div>
                  <div className='ui input'>
                    <input placeholder='Séparateur' type='text' value={this.state.inputSeparator} onChange={this.inputSeparatorChanged.bind(this)}/>
                  </div>
                </div>
              </div>
            </div>
            <input type="file" name='inputCsvFile' id='inputCsvFile' onChange={this.loadFile.bind(this)} style={this.hiddenStyle}/>
          </div>
          <div className="actions" style={this.actionBarStyle}>
            <div className="ui black deny button" onClick={this.cancel.bind(this)}>
              Annuler
            </div>

            <label htmlFor='inputCsvFile'><div className='ui button'>{this.state.csvFileInput === null ? 'Choisir fichier CSV' : this.state.csvFileInput.name}</div></label>

            <div className={"ui green approve button " + (this.state.csvFileInput?'':'disabled')}
                 style={this.nextButtonStyle}
                 onClick={this.showCsvParseResults.bind(this)}>
              Suivant
            </div>
          </div>
        </div>

        <div className='content' style={this.csvParseResultStyle}>
          <h4 className='ui center aligned header'>
            Import d'images extérieures à Recolnat
          </h4>
          <div className='description'>
            <div className='ui text'>
              Le fichier {this.state.csvFileInput === null ? '' : this.state.csvFileInput.name} a été traité.
            </div>
            {this.state.csvParseMessages.map(function(message) {
              return <div className='ui yellow message'>
                {message}
              </div>
            })}
            <div className='ui green message'>
              {this.state.csvParseResult.length} images trouvées
              <div className='ui list'>
                {this.state.csvParseResult.map(function(data) {
                  return <div className='item'>
                    <img className='ui image' src={data.url} height='20' />
                    <span className='content'>{data.name}</span>
                  </div>
                })}
              </div>
            </div>

            {this.state.csvParseErrors.map(function(data) {
              return <div className='ui red message'>Ligne {data.row} invalide : {data.data}</div>
            })}
          </div>
          <div className="actions" style={this.actionBarStyle}>
            <div className="ui black deny button" onClick={this.cancel.bind(this)}>
              Annuler
            </div>
            <div className="ui positive right labeled icon button"
                 style={this.reloadButtonStyle}
                 onClick={this.reloadCsv.bind(this)}>
              <div className='ui text'>
                Recharger
              </div>
            </div>
            <div className={"ui positive right labeled icon button" + (this.state.destination === 'new' && this.state.newSetNameInput.length === 0 ? ' disabled' : '')}
                 style={this.launchWebImportButtonStyle}
                 onClick={this.launch.bind(this, false)}>
              <div className='ui text'>
                Lancer l'import
              </div>
              <i className="checkmark icon"></i>
            </div>
          </div>
        </div>
      </div>

    </div>;
  }
}

export default AddToSet;
