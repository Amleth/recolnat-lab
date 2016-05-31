/**
 * Created by dmitri on 03/05/16.
 */
'use strict';

import React from 'react';

import Globals from '../../utils/Globals';

class TagCloud extends React.Component {
  constructor(props) {
    super(props);

    this.containerStyle = {
      height: this.props.height,
      padding: '5px 5px 5px 5px',
      margin: '1%',
      overflowY: 'auto'
    };

    this._onModeChange = () => {
      const setModeVisibility = () => this.setState({
        isVisibleInCurrentMode: this.props.modestore.isInOrganisationMode() || this.props.modestore.isInObservationMode()
      });
      return setModeVisibility.apply(this);
    };

    this.state = {
      isVisibleInCurrentMode: false,
      tags: _.sortBy([
        {name: 'Anthère', size: 'mini'},
        {name: 'Aranéeux', size: 'tiny'},
        {name: 'Bacciforme', size: ''},
        {name: 'Bilabié', size: 'small'},
        {name: 'Fimbrié', size: ''},
        {name: 'Extra-axiliaire', size: ''},
        {name: 'Choses à faire', size: 'mini'},
        {name: 'Périanthe', size: 'mini'},
        {name: 'Demander à Marc', size: 'small'},
        {name: 'Problème ?', size: 'small'},
        {name: '!!!', size: ''}
      ], Globals.getName),
      mode: 'tags',
      scope: 'all'
    }
  }

  isModeActive(mode) {
    if(mode == this.state.mode) {
      return 'active';
    }
      return '';
  }

  isScopeActive(scope) {
    if(scope == this.state.scope) {
      return 'active';
    }
    return '';
  }

  setMode(mode) {
    this.setState({mode: mode});
  }

  setScope(scope) {
    this.setState({scope: scope});
  }

  componentDidMount() {
    this.props.modestore.addModeChangeListener(this._onModeChange);
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
  }

  render() {
    return <div className='ui segment container' style={this.containerStyle}>
      <div className='ui secondary pointing compact icon left menu'>
        <a className={'fitted item ' + this.isModeActive('tags')}
        onClick={this.setMode.bind(this, 'tags')}>
          <i className='tags icon'/>
        </a>
        <a className={'fitted item ' + this.isModeActive('annotations')}
           onClick={this.setMode.bind(this, 'annotations')}>
          <i className='browser icon'/>
        </a>
        </div>
      <div className='ui secondary pointing compact icon floated right menu'>
        <a className={'fitted item ' + this.isScopeActive('all')}
        onClick={this.setScope.bind(this, 'all')}>
          <i className='cloud icon'/>
        </a>
        <a className={'fitted item ' + this.isScopeActive('set')}
           onClick={this.setScope.bind(this, 'set')}>
          <i className='folder open icon'/>
        </a>
        <a className={'fitted item ' + this.isScopeActive('selection')}
           onClick={this.setScope.bind(this, 'selection')}>
          <i className='file icon'/>
        </a>
      </div>
      <div>
        {this.state.tags.map(function(tag, index) {
          return <a key={index}
                    className={'ui tag label ' + tag.size}>{tag.name}</a>;
        })}
      </div>
    </div>
  }
}

export default TagCloud;