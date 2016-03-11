/**
 * Created by dmitri on 04/12/15.
 */
'use strict';

import React from 'react';
import request from 'superagent';
import uuid from 'node-uuid';

import LabBook from './LabBook';

import conf from '../../conf/ApplicationConfiguration';

class SheetLabBook extends LabBook {
  constructor(props) {
    super(props);

    this.title = "Cahier de laboratoire de la planche active";

    this._onSelectEntity = () => {
      const getLog = () => this.setState({selectedId: this.props.entitystore.getSelectedImageId()});
      return getLog.apply(this);
    };

    this.state.selectedId = null;
  }

  loadLog() {
    //if(this.state.selectedId) {
    //  request.post(conf.actions.databaseActions.getLog)
    //    .send({object: this.state.selectedId})
    //    .withCredentials()
    //    .end((err, res) => {
    //      if (err) {
    //        console.error("Could not get data about object " + err);
    //      } else {
    //        var response = JSON.parse(res.text);
    //        response.actions.forEach(function (value, index, array) {
    //          value.key = "KEY-" + uuid.v4();
    //        });
    //        this.setState({
    //          actions: _.sortBy(response.actions, function (action) {
    //            return -action.date
    //          })
    //        });
    //      }
    //    });
    //}
  }

  componentDidMount() {
    super.componentDidMount();
    this.props.entitystore.addChangeSelectionListener(this._onSelectEntity);
    this._onSelectEntity();
  }

  componentWillUpdate(nextProps, nextState) {
    if(nextState.selectedId && nextState.selectedId != this.state.selectedId) {
      this.loadLog();
    }
    else {
      nextState.actions = [];
    }
  }

  componentWillUnmount() {
    super.componentWillUnmount();
    this.props.entitystore.removeChangeSelectionListener(this._onSelectEntity);
  }
}

export default SheetLabBook;