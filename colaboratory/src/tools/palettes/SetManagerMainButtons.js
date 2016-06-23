/**
 * Created by dmitri on 23/06/16.
 */
'use strict';

import React from 'react';

import ModalActions from '../../actions/ModalActions';

import ModalConstants from '../../constants/ModalConstants';

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

    this.buttonSubTextStyle = {
      fontSize: '10px'
    };
  }

  showModal() {
    window.setTimeout(ModalActions.showModal.bind(null, ModalConstants.Modals.createAndFillSet), 10);
  }

  render() {
    return(
      <div className='ui container segment' style={this.containerStyle}>
        <div className='ui blue tiny basic label'
             style={this.labelStyle}>
          Actions
        </div>
        <div className='ui fluid buttons'>
          <div className='ui green compact button' onClick={this.showModal.bind(this)}>
            <div className='ui text'>
              Nouveau set
            </div>
            <div className='ui text' style={this.buttonSubTextStyle}>
              à partir de votre panier Explore
            </div>
          </div>
        </div>
      </div>);
  }
}

export default SetManagerMainButtons;