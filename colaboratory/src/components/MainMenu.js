/**
 * Created by dmitri on 11/03/16.
 */
'use strict';

import React from 'react';

import ContextMenu from './context-menu/MainMenu';

import ModalActions from '../actions/ModalActions';

import ModalConstants from '../constants/ModalConstants';

class MainMenu extends React.Component {
  constructor(props) {
    super(props);

    this.componentStyle = {
      //position: 'fixed',
      zIndex: 99999,
      left: 0,
      top: this.props.top + 'px',
      width: this.props.width + 'px',
      minWidth: this.props.width + 'px',
      maxWidth: this.props.width + 'px',
      cursor: 'default',
      pointerEvents: 'none'

      //margin: '3px 3px 3px 3px',
      //padding: '5px 5px 5px 5px'
      //margin: 0,
      //padding: 0
    };

    this.headerStyle = {
      padding: '5px 5px 5px 5px',
      margin: 0,
      textAlign: 'center'
    };

    this.enableEventsStyle = {
      pointerEvents: 'auto'
    };

    this.optionStyle = {
      width: this.props.width + 'px',
      padding: '2px 5px 2px 5px !important'
    };

    this.textStyle = {
      color: '#0C0400',
      fontVariant: 'small-caps',
      fontSize: '16pt'
    };
  }

  componentDidMount() {
    $(this.refs.dropdown.getDOMNode()).dropdown({
      action: 'hide',
      direction: 'downward',
      onShow: this.setState.bind(this, {})
    });
  }

  // componentDidUpdate(prevProps, prevState) {
  //   $(this.refs.dropdown.getDOMNode()).dropdown({
  //     action: 'hide',
  //     direction: 'downward'
  //   });
  // }

  render() {
    return <div ref='dropdown' style={this.componentStyle} className='ui dropdown'>
      <i className='circular inverted blue sidebar icon' style={this.enableEventsStyle}/>
      <div className='menu'  style={this.enableEventsStyle}>
        <div className='header' style={this.headerStyle}>Le Collaboratoire</div>
        <div className='item' style={this.optionStyle}>
          <span className='text'>Version 0.9.1</span>
        </div>
        <div className='item' onClick={ModalActions.showModal.bind(null, ModalConstants.Modals.feedback, null, null, null)} style={this.optionStyle}>
          <span className='text'>Formulaire de contact</span>
        </div>
        <div className={'item'} onClick={ModalActions.showModal.bind(null, ModalConstants.Modals.downloadSet, null, null, null)} style={this.optionStyle}>
          <span className='text'>Téléchargements</span>
        </div>
      </div>
    </div>
  }
}

export default MainMenu;
