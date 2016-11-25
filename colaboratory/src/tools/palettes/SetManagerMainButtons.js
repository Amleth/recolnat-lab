/**
 * Created by dmitri on 23/06/16.
 */
'use strict';

import React from 'react';

import ModalActions from '../../actions/ModalActions';
import ViewActions from '../../actions/ViewActions';
import ModeActions from '../../actions/ModeActions';

import ModalConstants from '../../constants/ModalConstants';
import ModeConstants from '../../constants/ModeConstants';

class SetManagerMainButtons extends React.Component {
  constructor(props) {
    super(props);

    this.containerStyle = {
      padding: '5px 5px 5px 5px',
      borderColor: '#2185d0!important'
    };

    this.labelStyle = {
      position: 'relative',
      top: '-15px',
      left: '10px'
    };

    this.buttonColumnStyle = {
      display: 'flex',
      flexDirection: 'column'
    };

    this.buttonSubTextStyle = {
      fontSize: '10px'
    };

    this._onModeChange = () => {
      const setModeVisibility = () => this.setState({isVisibleInCurrentMode: this.props.modestore.isInSetMode()});
      return setModeVisibility.apply(this);
    };

    this._onSetSelectionChange = () => {
      const setIsSelected = () => this.enableOrDisableActions();
      return setIsSelected.apply(this);
    };

    this.state = {
      isVisibleInCurrentMode: true,
      openButton: 'disabled'
    };
  }

  enableOrDisableActions() {
    if(this.props.managerstore.getSelected().type == 'Set') {
      this.setState({openButton: ''});
    }
    else {
      this.setState({openButton: 'disabled'});
    }
  }

  showModal() {
    //var setId = this.props.managerstore.getSelected().id;
    window.setTimeout(ModalActions.showModal.bind(null, ModalConstants.Modals.addToSet, {parent: null}), 10);
  }

  loadActiveSet() {
    var setId = this.props.managerstore.getSelected().id;
    if(!setId) {
      alert("Vous devez sélectionner un set avant");
      return;
    }
    //console.log('request view to set active set ' + setId);
    window.setTimeout(ViewActions.setActiveSet.bind(null, setId), 10);
    window.setTimeout(ModeActions.changeMode.bind(null,ModeConstants.Modes.OBSERVATION),30);
  }

  componentDidMount() {
    this.props.modestore.addModeChangeListener(this._onModeChange);
    this.props.managerstore.addSelectionChangeListener(this._onSetSelectionChange);
  }

  componentWillUpdate(nextProps, nextState) {
    if(nextState.isVisibleInCurrentMode) {
      this.containerStyle.display = '';
    }
    else {
      this.containerStyle.display = 'none';
    }
  }

  componentWillUnmount() {
    this.props.modestore.removeModeChangeListener(this._onModeChange);
    this.props.managerstore.removeSelectionChangeListener(this._onSetSelectionChange);
  }

  render() {
    return(
      <div className='ui container segment' style={this.containerStyle}>
        <div className='ui blue tiny basic label'
             style={this.labelStyle}>
          Actions
        </div>
        <div className='ui fluid buttons'
        style={this.buttonColumnStyle}>
          <div className='ui green compact button' onClick={this.showModal.bind(this)}>
            <div className='ui text'>
              Nouveau set
            </div>
            <div className='ui text' style={this.buttonSubTextStyle}>
              à partir de votre panier Explore
            </div>
          </div>
          <div className={'ui compact button ' + this.state.openButton} onClick={this.loadActiveSet.bind(this)}>
            <div className='ui text'>
              Ouvrir
            </div>
            <div className='ui text' style={this.buttonSubTextStyle}>
              set sélectionné sur paillasse
            </div>
          </div>
        </div>
      </div>);
  }
}

export default SetManagerMainButtons;
