/**
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
      alert('Impossible de récupérer la liste des téléchargements');
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
        Télécharger les images du set
      </div>
      <div className="content" onKeyUp={this.checkKey.bind(this)}>
        <div className="ui message">
          <p>Les fichiers suivants issus de vos demandes d'export précédentes sont disponibles pour téléchargement :</p>
          <div clssName='ui divided list'>
          {this.state.downloadableFiles.map(function(file, index) {
            return <p key={index}><a href={file.url} download>{file.fileName}</a></p>
          })}
          </div>
        </div>
      </div>
      <div className="content" onKeyUp={this.checkKey.bind(this)}>
        <div className="ui info message"  style={this.nothingToDownloadStyle}>
          <p>
            Si vous souhaitez créer un export, veuillez ouvrir cette fenêtre après avoir sélectionné un set dans le gestionnaire de sets ou avoir chargé un set dans la paillasse.
          </p>
        </div>
        <div className="ui positive message" style={this.downloadsStyle}>
          <p>
            Les {this.state.setData? this.state.setData.items.length : '*'} images du set {this.state.setData? this.state.setData.name : this.state.setId} seront compressées et mises à votre disposition pour téléchargement. Vous recevrez le lien de téléchargement à l'adresse e-mail associée à votre compte ReColNat. Le lien sera aussi affiché dans la liste ci-dessus. Tous les fichiers sont supprimés une fois par semaine (généralement le samedi).
          </p>
        </div>
      </div>
      <div className="actions">
        <div className="ui black deny button" onClick={this.cancel.bind(this)}>
          Annuler
        </div>
        <div className="ui positive right labeled icon button"
             style={this.launchButtonStyle}
             onClick={this.run.bind(this)}>
          Confirmer
          <i className="unlink icon"></i>
        </div>
      </div>
    </div>;
  }
}

export default DownloadSetImages;