/**
 * Created by dmitri on 11/01/16.
 */
'use strict';

import React from 'react';
import fastcsv from 'fast-csv';
import fs from 'filereader-stream';
import request from 'superagent';

import ManagerActions from '../../actions/ManagerActions';
import ViewActions from '../../actions/ViewActions';

import conf from '../../conf/ApplicationConfiguration';

class SetActions extends React.Component {
  constructor(props) {
    super(props);

    this.containerStyle = {
      margin: 0,
      padding: 0
    };

    this.inputFileStyle = {
      position: 'relative',
      height: '1px',
      width: '1px',
      top: "-100em",
      zIndex: "2",
      opacity: "0",
      overflow: 'hidden'
    };

    this.state = {
      optionsModal: null,
      nameInputText: ''
    };
  }

  showOptions(modalReference) {
    switch(modalReference) {
      case 'createNewSetModal':
        if(this.props.managerstore.getSelected().type != 'bag') {
          alert('Un set ne peut être créée que dans un set ou une étude.');
          return;
        }
        this.setState({optionsModal: modalReference});
        break;
      case 'basketSelectionToSetModal':
        if(this.props.managerstore.getSelected().type != 'bag') {
          alert('Vous devez sélectionner un set.');
          return;
        }
        this.setState({optionsModal: modalReference});
        break;
      case 'importCSVModal':
        if(this.props.managerstore.getSelected().type != 'bag') {
          alert('Vous devez sélectionner un set.');
          return;
        }
        this.setState({optionsModal: modalReference});
        break;
      case 'pasteModal':
        if(this.props.managerstore.getSelected().type != 'bag') {
          alert('Vous devez sélectionner un set.');
          return;
        }
        this.setState({optionsModal: modalReference});
        break;
      case 'deleteModal':
        if(this.props.managerstore.getSelected().uid == null) {
          alert('Vous devez sélectionner un élement à supprimer');
          return;
        }
        if(this.props.managerstore.getSelected().parent == 'zero') {
          alert('Vous ne pouvez pas supprimer les sets à la racine');
          return;
        }
        this.setState({optionsModal: modalReference});
        break;
      default:
        console.error('Unknown reference: ' + modalReference);
        break;
    }
  }

  hideOptions() {
    this.setState({optionsModal: null, nameInputText: ''});
  }

  onNameChange(event) {
    this.setState({nameInputText: event.target.value});
  }

  loadSetInView() {
    window.setTimeout(ViewActions.setActiveSet.bind(null, this.props.managerstore.getSelected().uid), 1);
    window.setTimeout(ManagerActions.toggleSetManagerVisibility.bind(null,false),1);
  }

  createNewSet() {
    var self = this;
    var name = this.state.nameInputText;
    var parentSetId = this.props.managerstore.getSelected().uid;
    if(name.length < 1) {
      alert("Un nom est obligatoire");
    }

    request.post(conf.actions.setServiceActions.createSet)
      .set('Content-Type', 'application/json')
      .send({parent: parentSetId})
      .send({name: name})
      .withCredentials()
      .end((err, res)=> {
        if(err) {
          console.error("Error occurred when creating new Set. Server returned: " + err);
          alert('La création a échoué. Veuillez recommencer');
        }
        else {
          //console.log("Received response " + res.text);
          var response = JSON.parse(res.text);
          ManagerActions.select(response.subSet, 'bag', name, parentSetId,  response.link);
          ManagerActions.selectEntityInSetById(parentSetId, response.subSet);
          self.props.managerstore.requestGraphAround(response.subSet, 'bag', undefined);
          ManagerActions.reloadDisplayedSets();
        }
      });

    this.hideOptions();
  }

  addBasketSelectionToSet(keepSelectionInBasket) {
    var basketSelection = this.props.managerstore.getBasketSelection();
    var selectedSet = this.props.managerstore.getSelected().uid;
    //console.log('parent= ' + selectedSet);

    ManagerActions.addBasketItemsToSet(basketSelection, selectedSet, keepSelectionInBasket);

    this.hideOptions();
  }

  launchCSVImport() {
    var selectedFiles = this.refs.fileInput.getDOMNode().files;
    if(selectedFiles.length < 1) {
      alert('Vous devez sélectionner un fichier');
      //console.log("No file selected");
      return;
    }

    var file = selectedFiles[0];
    var parentSet = this.props.managerstore.getSelected().uid;
    var stream = fs(file);
    var parser = fastcsv({objectMode: true, headers: true, ignoreEmpty: true, discardUnmappedColumns: true, trim: true})
      .on("data", function(data) {
        if(data.url && data.name) {
          //console.log("data=" + JSON.stringify(data));
          request.post(conf.actions.setServiceActions.importExternalImage)
            .set('Content-Type', "application/json")
            .send({set: parentSet})
            .send({url: data.url})
            .send({name: data.name})
            .withCredentials()
            .end((err, res) => {
              if (err) {
                console.error(err);
              }
              else {
                ManagerActions.reloadDisplayedSets();
              }
            });
        }
        else {
          console.error("CSV has no url and name fields");
          alert("Le CSV n'est pas valide. Pour être valide il doit contenir des colonnes correspondant aux labels 'url' et 'name'");
        }
      })
      .on("end", function() {
        ManagerActions.reloadDisplayedSets();
      });
    stream.pipe(parser);
    this.hideOptions();
  }

  beginCopy() {
    this.setState({copy: JSON.parse(JSON.stringify(this.props.managerstore.getSelected()))});
  }

  beginCut() {
    this.setState({cut: JSON.parse(JSON.stringify(this.props.managerstore.getSelected()))});
  }

  getPasteText() {
    if(this.state.copy) {
      return this.state.copy.name + ' sera ajouté à ' + this.props.managerstore.getSelected().name;
    }
    else if(this.state.cut) {
      return this.state.cut.name + ' sera ajouté à ' + this.props.managerstore.getSelected().name + ' et sera enlevé de ' + this.props.managerstore.getSet(this.state.cut.parent).name;
    }
  }

  getDeleteText() {
    if(this.props.managerstore.getSelected().parent == 'zero') {
      return "Vous ne pouvez pas supprimer cette étude";
    }
    if(this.props.managerstore.getSelected().uid) {
      return this.props.managerstore.getSelected().name + ' de ' + this.props.managerstore.getSet(this.props.managerstore.getSelected().parent).name;
    }
    return null;
  }

  paste() {
    if(this.state.copy) {
      request.post(conf.actions.setServiceActions.copy)
        .set('Content-Type', 'application/json')
        .send({target: this.state.copy.uid})
        .send({destination: this.props.managerstore.getSelected().uid})
        .withCredentials()
        .end((err, res) => {
          if(err) {
            console.log(err);
            alert(err);
          }
          else {
            console.log("Copy/paste successful");
          }
          this.setState({copy: null, cut: null});
          ManagerActions.reloadDisplayedSets();
        });
    }
    else if(this.state.cut) {
      request.post(conf.actions.setServiceActions.cutpaste)
        .set('Content-Type', 'application/json')
        .send({target: this.state.cut.uid})
        .send({source: this.state.cut.parent})
        .send({linkId: this.state.cut.linkToParent})
        .send({destination: this.props.managerstore.getSelected().uid})
        .withCredentials()
        .end((err, res)=> {
          if(err) {
            console.log(err);
            alert(err);
          }
          else {
            console.log("Cut/paste successful");
          }
          this.setState({copy: null, cut: null});
          ManagerActions.reloadDisplayedSets();
        })
    }
    else {
      alert("Rien à coller !");
    }
    this.hideOptions();
  }

  /**
   * Removes parenthood link between state.current and state.selected. If state.selected is left without parents, it will be deleted and its content unlinked, and recursively until no orphaned Sets are left (all of this is done server-side, not client-side).
   */
  runDelete() {
    var elementToRemove = this.props.managerstore.getSelected().uid;
    var removeFrom = this.props.managerstore.getSelected().parent;
    var parentChildLink = this.props.managerstore.getSelected().linkToParent;

    request.post(conf.actions.setServiceActions.deleteFromSet)
      .set('Content-Type', 'application/json')
      .send({container: removeFrom})
      .send({target: elementToRemove})
      .send({linkId: parentChildLink})
      .withCredentials()
      .end((err, res) => {
        if (err) {
          console.log(err);
          alert(err);
        }
        else {
          //console.log("Delete received response " + res.text);
        }
        ManagerActions.select(null, null, null, null, null);
        ManagerActions.reloadDisplayedSets();
      });

    this.hideOptions();
  }

  callFileInput() {
    React.findDOMNode(this.refs.fileInput).click();
  }

  componentDidMount() {
    $('.item', this.refs.options.getDOMNode()).popup({
      position: 'right center',
      prefer: 'adjacent',
      lastResort: 'bottom right'
    });
  }

  componentWillUpdate(nextProps, nextState) {
    if(this.state.optionsModal) {
      if(this.state.optionsModal != nextState.optionsModal) {
        $(this.refs[this.state.optionsModal].getDOMNode()).modal('hide');
      }
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if(this.state.optionsModal != prevState.optionsModal && this.state.optionsModal) {
      $(this.refs[this.state.optionsModal].getDOMNode()).modal('show');
    }
  }



  render() {
    return <div style={this.containerStyle}>

      <div className='ui small modal' ref='createNewSetModal'>
        <div className='header'>Nouvelle Etude</div>
        <div className='content'>
          <div className='description'>
            <div className='header'>La nouvelle étude sera créée dans {this.props.managerstore.getSelected().name}</div>
            <p>Veuillez entrer le nom de l'étude à créer : </p>
            <div className='ui input'>
              <input type='text'
                     autofocus='true'
                     value={this.state.nameInputText}
                     onChange={this.onNameChange.bind(this)}/>
            </div>
          </div>
        </div>
        <div className='actions'>
          <div className='two fluid ui buttons'>
            <div className="ui red button" onClick={this.hideOptions.bind(this)}>
              <i className="remove icon" />
              Annuler
            </div>
            <div className="ui green button"
                 onClick={this.createNewSet.bind(this)}>
              <i className="checkmark icon" />
              Créer
            </div>
          </div>
        </div>
      </div>

      <div className='ui small modal' ref='basketSelectionToSetModal'>
        <div className='header'>Panier vers étude</div>
        <div className='content'>
          <div className='description'>
            <div className='header'>Ajouter les {this.props.managerstore.getBasketSelection().length} planches sélectionnées dans le panier à l'étude {this.props.managerstore.getSelected().name}</div>
          </div>
        </div>
        <div className='actions'>
          <div className='three fluid ui buttons'>
            <div className="ui tiny button" onClick={this.hideOptions.bind(this)}>
              <i className="remove icon" />
              Annuler l'ajout
            </div>
            <div className="ui tiny button" onClick={this.addBasketSelectionToSet.bind(this, false)}>
              <i className="trash icon" />
              Ajouter les objets à l'étude et les retirer du panier.
            </div>
            <div className="ui medium button"
                 onClick={this.addBasketSelectionToSet.bind(this, true)}>
              <i className="checkmark icon" />
              Ajouter les objets à l'étude et les conserver dans le panier
            </div>
          </div>
        </div>
      </div>

      <div className='ui small modal' ref='importCSVModal'>
        <div className='header'>Import</div>
        <div className='content'>
          <div className='description'>
            <div className='header'>Les images du fichier choisi seront importées en tant que planches dans l'étude {this.props.managerstore.getSelected().name}</div>
            <input type="file" accept="text/csv" ref="fileInput"/>
          </div>
        </div>
        <div className='actions'>
          <div className='two fluid ui buttons'>
            <div className="ui button" onClick={this.hideOptions.bind(this)}>
              <i className="remove icon" />
              Annuler
            </div>
            <div className="ui button"
                 onClick={this.launchCSVImport.bind(this)}>
              <i className="checkmark icon" />
              Lancer l'import
            </div>
          </div>
        </div>
      </div>

      <div className='ui small modal' ref='pasteModal'>
        <div className='header'>Coller</div>
        <div className='content'>
          <div className='description'>
            <div className='header'>{this.getPasteText()}</div>
          </div>
        </div>
        <div className='actions'>
          <div className='two fluid ui buttons'>
            <div className="ui button" onClick={this.hideOptions.bind(this)}>
              <i className="remove icon" />
              Annuler
            </div>
            <div className="ui button"
                 onClick={this.paste.bind(this)}>
              <i className="checkmark icon" />
              Confirmer
            </div>
          </div>
        </div>
      </div>

      <div className='ui small modal' ref='deleteModal'>
        <div className='header'>Supprimer</div>
        <div className='content'>
          <div className='description'>
            <div className='header'>Les éléments suivants seront supprimés des études indiquées. Les études qui se retrouveront orphelines seront définitivement supprimées. Les planches seront enlevées des études mais seront conservées dans le système.</div>
            <div className='content'>
              <div className='ui list'>
                <div className='item'>
                  {this.getDeleteText()}
                  </div>
                </div>
              </div>
          </div>
        </div>
        <div className='actions'>
          <div className='two fluid ui buttons'>
            <div className="ui button" onClick={this.hideOptions.bind(this)}>
              <i className="remove icon" />
              Annuler
            </div>
            <div className="ui button"
                 onClick={this.runDelete.bind(this)}>
              <i className="checkmark icon" />
              Confirmer
            </div>
          </div>
        </div>
      </div>

      <div className='ui selection list' ref='options'>
        <a className='item'
           onClick={this.loadSetInView.bind(this)}
           data-content="Ouvre l'étude sélectionnée dans l'espace de travail.">
          <div>
            <i className='folder open icon' />
            Ouvrir l'étude
          </div>
        </a>
        <a className='item'
           onClick={this.showOptions.bind(this, 'createNewSetModal')}
        data-content="Crée une nouvelle étude dans l'étude sélectionnée">
          <div>
            <i className='icons'>
              <i className='folder icon' />
              <i className='corner add icon' />
            </i>
            Nouvelle étude
          </div>
        </a>
        <a className='item'
           onClick={this.showOptions.bind(this, 'basketSelectionToSetModal')}
        data-content="Ajoute les éléments choisis dans le panier (en bas) à l'étude sélectionnée">
          <div>
            <i className='linkify icon' />
            Ajouter la sélection à l'étude
          </div>
        </a>
        <a className='item'
           onClick={this.showOptions.bind(this, 'importCSVModal')}
        data-content="Ajoute des images extérieures à ReColNat dans l'étude sélectionnée">
          <div>
            <i className='upload icon' />
            Importer une liste
          </div>
        </a>
        <a className='item'
           onClick={this.beginCopy.bind(this)}
        data-content="Envoie l'étude sélectionnée vers le presse-papier du collaboratoire pour copie vers une autre étude. Pour terminer la copie, sélectionnez l'étude de destination et appuyez sur 'Coller'">
          <div>
            <i className='copy icon' />
            Copier l'élement
          </div>
        </a>
        <a className='item'
           onClick={this.beginCut.bind(this)}
        data-content="Envoie l'étude sélectionnée vers le presse-papier du collaboratoire pour coller dans une autre étude. Pour terminer l'opération, sélectionnez l'étude de destination et appuyez sur 'Coller'">
          <div>
            <i className='cut icon' />
            Couper
          </div>
        </a>
        <a className='item'
           onClick={this.showOptions.bind(this, 'pasteModal')}
        data-content="Copie/colle l'étude dans le presse-papier du collaboratoire dans l'étude sélectionnée">
          <div>
            <i className='paste icon' />
            Coller
          </div>
        </a>
        <a className='item' onClick={this.showOptions.bind(this, 'deleteModal')}
        data-content="Supprime l'étude/planche sélectionnée de l'étude la contenant.">
          <div>
            <i className='trash icon' />
            Supprimer
          </div>
        </a>
      </div>
    </div>
  }
}

export default SetActions;