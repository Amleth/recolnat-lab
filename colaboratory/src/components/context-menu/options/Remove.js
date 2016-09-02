/**
 * Created by dmitri on 27/01/16.
 */
'use strict';

import React from 'react';

import ServiceMethods from '../../../utils/ServiceMethods';

import conf from '../../../conf/ApplicationConfiguration';

class Remove extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      label: null,
      active: false
    };

    if(this.props.label) {
      this.state.label = this.props.label;
    }
    else {
      this.state.label = 'Supprimer';
    }

    if(this.props.metadata) {
      if(this.props.metadata.deletable) {
        this.state.active = true;
      }
    }
  }

  removeSelf() {
    var self = this;
    ServiceMethods.remove(this.props.uid, this.props.successCallback);
  }

  render() {
    if(!this.state.active) {
      return null;
    }
    return <a className='vertically fitted item' onClick={this.removeSelf.bind(this)}>{this.state.label}</a>
  }
}

export default Remove;
