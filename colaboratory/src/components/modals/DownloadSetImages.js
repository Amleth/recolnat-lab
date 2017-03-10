/**
 * Lists image exports available for download to the user and enables the user to add the current selected set to exports.
 *
 * This modal does not require data to be passed to it through ModalStore.
 *
 * Created by dmitri on 02/12/16.
 */
'use strict';

import React from 'react';

import AbstractModal from './AbstractModal';

import ServiceMethods from '../../utils/ServiceMethods';

import ModalConstants from '../../constants/ModalConstants';

import conf from '../../conf/ApplicationConfiguration';

class DownloadSetImages extends AbstractModal {
  constructor(props) {
    super(props);

    this.modalName = ModalConstants.Modals.downloadSet;

    this.downloadsStyle = {
      display: 'none'
    };

    this.scrollerStyle = {
      height: '130px',
      overflow: 'auto'
    };

    this.launchButtonStyle = {
      display: 'none'
    };

    this.nothingToDownloadStyle = {
      display: ''
    };

    this.clearState(this.state);
  }

  clearState(state) {
    state.setId = null;
    state.setData = null;
    state.downloadableFiles = [];
  }

  checkKey(event) {
    switch(event.keyCode) {
      case 13:
        this.run();
        break;
      case 27:
        this.cancel();
        break;
    }
  }

  userDownloadsReceived(msg) {
    if(msg.clientProcessError) {
      alert(this.props.userstore.getText('errorGettingDownloadList'));
      return;
    }
    let files = [];
    console.log(JSON.stringify((msg.data)));
    for(let i = 0; i < msg.data.files.length; ++i) {
      files.push({
        fileName: msg.data.files[i],
        url: conf.services.downloadsBaseURL + msg.data.files[i]
      });
    }

    this.setState({downloadableFiles: files});
  }

  run() {
    ServiceMethods.prepareSetDownload(this.state.setId);
    this.cancel();
  }

  componentWillUpdate(nextProps, nextState) {
    super.componentWillUpdate(nextProps, nextState);
    if(!this.state.active && nextState.active) {
      nextState.setId = nextProps.benchstore.getActiveSetId();
      // Get set data
      nextState.setData = nextProps.metastore.getMetadataAbout(nextState.setId);
      nextProps.metastore.listUserDownloads(this.userDownloadsReceived.bind(this));
    }

    if(nextProps.benchstore.getActiveSetId()) {
      this.downloadsStyle.display = '';
      this.launchButtonStyle.display = '';
      this.nothingToDownloadStyle.display = 'none';
    }
    else {
      this.downloadsStyle.display = 'none';
      this.launchButtonStyle.display = 'none';
      this.nothingToDownloadStyle.display = '';
    }
  }

  render() {
    //console.log('rendering confirm delete');
    return <div className="ui small modal" ref='modal'>
      <i className="close icon"></i>
      <div className="header">
        {this.props.userstore.getText('downloadSetImages')}
      </div>
      <div className="content" onKeyUp={this.checkKey.bind(this)}>
        <div className="ui message">
          <p>{this.props.userstore.getText('downloadSetImagesHelp0')}</p>
          <div className='ui divided list' style={this.scrollerStyle}>
          {this.state.downloadableFiles.map(function(file, index) {
            return <div className='item'
                      key={index}>
              <a href={conf.actions.downloads.exports + '?file=' + file.fileName}
                 download>
                {file.fileName}
                </a>
            </div>
          })}
          </div>
        </div>
      </div>
      <div className="content" onKeyUp={this.checkKey.bind(this)}>
        <div className="ui info message"  style={this.nothingToDownloadStyle}>
          <p>
            {this.props.userstore.getText('downloadSetImagesHelp1')}
          </p>
        </div>
        <div className="ui positive message" style={this.downloadsStyle}>
          <p>
            {this.props.userstore.getInterpolatedText('downloadSetImagesHelp2', [this.state.setData? this.state.setData.items.length : '*', this.state.setData? this.state.setData.name : this.state.setId])}
          </p>
        </div>
      </div>
      <div className="actions">
        <div className="ui black deny button" onClick={this.cancel.bind(this)}>
          {this.props.userstore.getText('cancel')}
        </div>
        <div className="ui positive right labeled icon button"
             style={this.launchButtonStyle}
             onClick={this.run.bind(this)}>
          {this.props.userstore.getText('confirm')}
          <i className="unlink icon"></i>
        </div>
      </div>
    </div>;
  }
}

export default DownloadSetImages;