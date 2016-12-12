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

  render() {
    return <div className="ui small modal" ref='modal'>
      <i className="close icon"></i>
      <div className="header">
        Tests
      </div>
      <div className="content">
        <div className="description">
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
