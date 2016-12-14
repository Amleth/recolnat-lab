/**
 * Created by dmitri on 11/03/16.
 */
'use strict';

import React from 'react';

import ModalActions from '../actions/ModalActions';
import UserActions from '../actions/UserActions';

import ModalConstants from '../constants/ModalConstants';

import conf from '../conf/ApplicationConfiguration';

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
    this.props.userstore.addLanguageChangeListener(this.setState.bind(this, {}));
    $(this.refs.dropdown.getDOMNode()).dropdown({
      action: 'hide',
      direction: 'downward',
      onShow: this.setState.bind(this, {})
    });
  }

  componentWillUnmount() {
    this.props.userstore.removeLanguageChangeListener(this.setState.bind(this, {}));
  }

  render() {
    let self = this;
    return <div ref='dropdown' style={this.componentStyle} className='ui dropdown'>
      <i className='circular inverted blue sidebar icon' style={this.enableEventsStyle}/>
      <div className='menu'  style={this.enableEventsStyle}>
        <div className='header' style={this.headerStyle}>
          {this.props.userstore.getText('collaboratory')}
        </div>
        <div className='item' style={this.optionStyle}>
          <span className='text'>
            {this.props.userstore.getText('version')} 0.9.3 (beta)
          </span>
        </div>
        <div className='item' onClick={ModalActions.showModal.bind(null, ModalConstants.Modals.feedback, null, null, null)} style={this.optionStyle}>
          <span className='text'>
            {this.props.userstore.getText('contactForm')}
            </span>
        </div>
        <div className={'item'} onClick={ModalActions.showModal.bind(null, ModalConstants.Modals.downloadSet, null, null, null)} style={this.optionStyle}>
          <span className='text'>
            {this.props.userstore.getText('downloads')}
            </span>
        </div>
        <div className='dropdown item' style={this.optionStyle}>
          {this.props.userstore.getText('languages')}
          <i className='dropdown icon' />
          <div className='menu'>
            {conf.app.languages.map(function(language) {
              return <a className='item' key={language.code} style={self.optionStyle} onClick={UserActions.setLanguage.bind(null, language.code)}><i className={language.flag + ' flag'} />{language.localized}</a>
            })}
          </div>
        </div>
      </div>
    </div>
  }
}

export default MainMenu;
