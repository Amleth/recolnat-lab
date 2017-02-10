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

    this.mounted = false;

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

    this._onSetSelectionChange = () => {
      const setIsSelected = () => this.enableOrDisableActions();
      return setIsSelected.apply(this);
    };

    this._forceUpdate = () => {
      const update = () => {if(!this.mounted) return; this.setState({});};
      return update.apply(this);
    };

    this.state = {
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
    let setId = this.props.managerstore.getSelected().id;
    if(!setId) {
      alert("Internal error: no set selected");
      return;
    }
    //console.log('request view to set active set ' + setId);
    window.setTimeout(ViewActions.setActiveSet.bind(null, setId), 10);
    window.setTimeout(ModeActions.changeMode.bind(null,ModeConstants.Modes.OBSERVATION),30);
  }

  splitSet() {
    let setId = this.props.managerstore.getSelected().id;
    if(!setId) {
      alert("Internal error: no set selected");
      return;
    }
    window.setTimeout(ModalActions.showModal.bind(null, ModalConstants.Modals.organiseSet, {id: setId}), 10);
  }

  componentDidMount() {
    this.mounted = true;
    this.props.userstore.addLanguageChangeListener(this._forceUpdate);
    this.props.modestore.addModeChangeListener(this._forceUpdate);
    this.props.managerstore.addSelectionChangeListener(this._onSetSelectionChange);
    this.enableOrDisableActions();
  }

  componentWillUpdate(nextProps, nextState) {

  }

  componentWillUnmount() {
    this.mounted = false;
    this.props.userstore.removeLanguageChangeListener(this._forceUpdate);
    this.props.modestore.removeModeChangeListener(this._forceUpdate);
    this.props.managerstore.removeSelectionChangeListener(this._onSetSelectionChange);
  }

  render() {
    return(
      <div className='ui container segment' style={this.containerStyle}>
        <div className='ui blue tiny basic label'
             style={this.labelStyle}>
          {this.props.userstore.getText('actions')}
        </div>
        <div className='ui fluid buttons'
        style={this.buttonColumnStyle}>
          <div className='ui green compact button' onClick={this.showModal.bind(this)}>
            <div className='ui text'>
              {this.props.userstore.getText('newSet')}
            </div>
            <div className='ui text' style={this.buttonSubTextStyle}>
              {this.props.userstore.getText('fromBasketSubtitle')}
            </div>
          </div>
          <div className={'ui compact button ' + this.state.openButton} onClick={this.loadActiveSet.bind(this)}>
            <div className='ui text'>
              {this.props.userstore.getText('open')}
            </div>
            <div className='ui text' style={this.buttonSubTextStyle}>
              {this.props.userstore.getText('selectedSet')}
            </div>
          </div>
          <div className={'ui compact button ' + this.state.openButton} onClick={this.splitSet.bind(this)}>
          <div className='ui text'>
              {this.props.userstore.getText('organise')}
            </div>
            <div className='ui text' style={this.buttonSubTextStyle}>
              {this.props.userstore.getText('selectedSetContent')}
            </div>
          </div>
        </div>
      </div>);
  }
}

export default SetManagerMainButtons;
