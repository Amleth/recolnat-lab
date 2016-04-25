/**
 * Created by dmitri on 11/03/16.
 */
'use strict';

import React from 'react';

import ContextMenu from './context-menu/MainMenu';

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

    this.enableEventsStyle = {
      pointerEvents: 'auto'
    };

    this.optionStyle = {
      width: this.props.width + 'px'
    };

    this.textStyle = {
      color: '#0C0400',
      fontVariant: 'small-caps',
      fontSize: '16pt'
    }
  }

  componentDidUpdate(prevProps, prevState) {
    $(this.refs.dropdown.getDOMNode()).dropdown({
      action: 'hide',
      direction: 'downward'
    });
  }

  render() {
    return <div ref='dropdown' style={this.componentStyle} className='ui dropdown'>
      <i className='circular inverted blue sidebar icon' style={this.enableEventsStyle}/>

      <div className='menu'  style={this.enableEventsStyle}>
        <div className='header'>Le Collaboratoire</div>
        <div className='item' style={this.optionStyle}>
          <span className='text'>Vue</span>
          <div className='right menu'>
            <div className='item'>Voir toutes les images</div>
            <div className='item'>1:1</div>
          </div>
        </div>
        <div className='item' style={this.optionStyle}>
          <span className='text'>Outils</span>
          <div className='right menu'>
            <div className='item'>Mesurer une ligne</div>
            <div className='item'>Marquer un point d'intérêt</div>
            <div className='item'>Tracer un chemin</div>
            <div className='item'>Créer un polygone</div>
          </div>
        </div>
        <div className='item' style={this.optionStyle}>
          <span className='text'>Modes</span>
          <div className='right menu'>
            <div className='item'>Gestionnaire d'études</div>
            <div className='item'>Agencement</div>
            <div className='item'>Observation/Annotation</div>
          </div>
        </div>
        <div className='item' style={this.optionStyle}>
          <span className='text'>Etudes</span>
          <div className='right menu'>
            <div className='item'>Ouvrir étude</div>
            <div className='item'>Nouvelle étude</div>
            <div className='item'>Ajouter la sélection à l'étude</div>
            <div className='item'>Importer du contenu extérieur</div>
            <div className='item'>Copier</div>
            <div className='item'>Couper</div>
            <div className='item'>Coller</div>
            <div className='item'>Supprimer</div>
          </div>
        </div>
      </div>
    </div>
  }
}

export default MainMenu;