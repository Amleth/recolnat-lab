/**
 * Created by dmitri on 11/07/16.
 */
'use strict';

import React from 'react';
import request from 'superagent';
import request_no_cache from 'superagent-no-cache';

import AbstractModal from './AbstractModal';

import ModalConstants from '../../constants/ModalConstants';

import conf from '../../conf/ApplicationConfiguration';

class TestRunnerModal extends AbstractModal {
  constructor(props) {
    super(props);
    this.modalName = ModalConstants.Modals.testRunnerModal;
  }

  runReadLoadTest() {
    for(var i = 0; i < 100; ++i) {
      request
        .use(request_no_cache)
        .get(conf.actions.setServiceActions.getSet)
        .query({id: null})
        .set('Accept', 'application/json')
        .withCredentials()
        .end((err, res)=> {

        });
    }
  }

  render() {
    return <div className="ui small modal" ref='modal'>
      <i className="close icon"></i>
      <div className="header">
        Tests
      </div>
      <div className="content">
        <div className="description">
          <div className='ui button' onClick={this.runReadLoadTest.bind(this)}>
            Montée en charge (lecture)
          </div>
        </div>
      </div>
      <div className="actions">
        <div className="ui black deny button" onClick={this.cancel.bind(this)}>
          Fermer
        </div>
      </div>
    </div>;
  }
}

export default TestRunnerModal;
