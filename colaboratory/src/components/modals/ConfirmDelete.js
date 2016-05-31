/**
 * Created by dmitri on 30/05/16.
 */
'use strict';

import React from 'react';
import request from 'superagent';

import AbstractModal from './AbstractModal';

import Globals from '../../utils/Globals';
import REST from '../../utils/REST';

import ModalConstants from '../../constants/ModalConstants';

import ManagerActions from '../../actions/ManagerActions';

import conf from '../../conf/ApplicationConfiguration';

class ConfirmDelete extends AbstractModal {
  constructor(props) {
    super(props);

    this.modalName = ModalConstants.Modals.confirmDelete;
  }

  clearState(state) {
  }

  checkKey(event) {
    switch(event.keyCode) {
      case 13:
        this.createNewStudy();
        break;
      case 27:
        this.cancel();
        break;
    }
  }

  unlink() {
    var data = this.props.modalstore.getTargetData();
    request.post(conf.actions.setServiceActions.deleteFromSet)
      .set('Content-Type', "application/json")
      .send({
        linkId: data.link
      })
      .withCredentials()
      .end((err, res) => {
        if(err) {
          this.props.modalstore.runErrorCallback(err);
        }
        else {
          this.props.modalstore.runSuccessCallback(res);
        }
      });
  }


  render() {
    //console.log('rendering confirm delete');
    return <div className="ui small modal" ref='modal'>
      <i className="close icon"></i>
      <div className="header">
        Retirer du set
      </div>
      <div className="content" onKeyUp={this.checkKey.bind(this)}>
        <div className="description">
          <p>L'entité sélectionnée sera retirée de son set parent. Elle restera accessible depuis tout autre parent.</p>
        </div>
      </div>
      <div className="actions">
        <div className="ui black deny button" onClick={this.cancel.bind(this)}>
          Annuler
        </div>
        <div className="ui positive right labeled icon button"
             onClick={this.unlink.bind(this)}>
          Confirmer
          <i className="unlink icon"></i>
        </div>
      </div>
    </div>;
  }
}

export default ConfirmDelete;