/**
 * Created by dmitri on 27/01/16.
 */
'use strict';

import React from 'react';
import request from 'superagent';
import request_no_cache from 'superagent-no-cache';

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
    request.post(conf.actions.databaseActions.remove)
      .use(request_no_cache)
      .set('Content-Type', "application/json")
      .send({id: this.props.uid})
      .withCredentials()
      .end((err, res) => {
        if(err) {
          self.props.errorCallback(err)
        }
        else {
          self.props.successCallback(res);
        }
      })
  }

  render() {
    if(!this.state.active) {
      return null;
    }
    return <a className='vertically fitted item' onClick={this.removeSelf.bind(this)}>{this.state.label}</a>
  }
}

export default Remove;
