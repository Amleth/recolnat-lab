/**
 * Created by dmitri on 27/01/16.
 */
'use strict';

import React from 'react';
import request from 'superagent';

import conf from '../../../conf/ApplicationConfiguration';

class Remove extends React.Component {
  constructor(props) {
    super(props);

    if(this.props.label) {
      this.state.label = this.props.label;
    }
    else {
      this.state.label = 'Supprimer';
    }
  }

  removeSelf() {
    //var self = this;
    //request.post(conf.actions.databaseActions.remove)
    //  .set('Content-Type', "application/json")
    //  .send({id: this.props.id})
    //  .withCredentials()
    //  .end((err, res) => {
    //    if(err) {
    //      self.props.errorCallback(err)
    //    }
    //    else {
    //      self.props.successCallback(res);
    //    }
    //  })
  }

  render() {
    return <a className='vertically fitted item' onClick={this.removeSelf.bind(this)}>{this.state.label}</a>
  }
}

export default Remove;