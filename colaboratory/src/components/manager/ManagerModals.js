/**
 * Created by dmitri on 07/04/16.
 */
'use strict';

import React from 'react';
import request from 'superagent';

import ManagerActions from '../../actions/ManagerActions';

import ModalConstants from '../../constants/ModalConstants';

import conf from '../../conf/ApplicationConfiguration';

class ManagerModals extends React.Component {
  constructor(props) {
    super(props);

    this.containerStyle = {
      display: 'none',
      position: 'fixed',
      zIndex: 99999,
      top: 0,
      left: 0
    };

    this._onModalChange = () => {
      const updateDisplay = () => this.setState({showModal: this.props.modalstore.getModalId()});
      return updateDisplay.apply(this);
    };

    this.state = {
      nameInput: '',
      showModal: null
    };
  }

  runModal() {
    switch(this.state.showModal) {
      case ModalConstants.Modals.createStudy:
        this.createStudy();
        break;
      default:
        console.error('Unknown modal ' + this.state.showModal);
    }

    this.hideOptions();
  }

  checkKey(event) {
    switch(event.keyCode) {
      case 13:
        this.runModal();
        break;
      case 27:
        this.hideOptions();
        break;
    }
  }

  hideOptions() {
    this.setState({showModal: null, nameInput: ''});
  }

  onNameChange(event) {
    this.setState({nameInput: event.target.value});
  }

  createStudy() {
    if(this.state.nameInput.length < 1) {
      alert('Une étude doit avoir un nom');
      return;
    }

    request.post(conf.actions.studyServiceActions.createStudy)
      .send({name: this.state.nameInput})
      .withCredentials()
      .end((err, res) => {
        if(err) {
          console.error(err);
          alert('La création a échoué : ' + err);
        }
        else {
          // Reload studies
          ManagerActions.loadStudiesAndSets();
        }
      });
  }

  componentDidMount() {
    this.props.modalstore.addModalChangeListener(this._onModalChange);

    $('.menu .item', $(this.refs[ModalConstants.Modals.addEntitiesToSet].getDOMNode())).tab();
  }

  componentWillUpdate(nextProps, nextState) {
    if(this.state.showModal && !nextState.showModal) {
      this.containerStyle.display = 'none';
    }
    if(!this.state.showModal && nextState.showModal) {
      this.containerStyle.display = '';
    }
    if(nextState.showModal != this.state.showModal) {
      if(this.state.showModal) {
        $(this.refs[this.state.showModal].getDOMNode()).modal('hide');
      }
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if(this.state.showModal) {
      console.log(this.state.showModal);
      $(this.refs[this.state.showModal].getDOMNode()).modal('show');
    }
  }

  componentWillUnmount() {
    this.props.modalstore.removeModalChangeListener(this._onModalChange);
  }

  render() {
    return <div style={this.containerStyle}>

      <div className="ui small modal" ref={ModalConstants.Modals.createStudy}>
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
                     value={this.state.nameInput}
                     onChange={this.onNameChange.bind(this)}/>
            </div>
          </div>
        </div>
        <div className="actions">
          <div className="ui black deny button" onClick={this.hideOptions.bind(this)}>
            Annuler

          </div>
          <div className="ui positive right labeled icon button"
               onClick={this.runModal.bind(this)}>
            Créer étude
            <i className="checkmark icon"></i>
          </div>
        </div>
      </div>

      <div className="ui modal" ref={ModalConstants.Modals.addEntitiesToSet}>
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
          <div className="ui black deny button" onClick={this.hideOptions.bind(this)}>
            Annuler
          </div>
          <div className="ui positive right labeled icon button"
               onClick={this.runModal.bind(this)}>
            Ajouter
            <i className="checkmark icon"></i>
          </div>
        </div>
      </div>
    </div>
  }
}

export default ManagerModals;