/**
 * Created by dmitri on 16/02/16.
 */
'use strict';

import React from 'react';
import request from 'superagent';

import AbstractMetadataDisplay from '../../components/manager/AbstractManagerMetadataDisplay';

import MetadataActions from '../../actions/MetadataActions';
import SocketActions from '../../actions/SocketActions';

import conf from '../../conf/ApplicationConfiguration';

class SpecimenMetadataDisplay extends React.Component {
  constructor(props) {
    super(props);

    this.containerStyle = {
      //overflowY: 'auto',
      height: this.props.height-10,
      padding: '5px 5px 5px 5px',
      borderColor: '#2185d0!important'
    };

    this.labelContainerStyle = {
      position: 'relative',
      width: 0,
      height: '10px'
    };

    this.labelStyle = {
      position: 'relative',
      top: '-15px',
      left: '10px',
      whiteSpace: 'nowrap'
    };

    this.scrollerStyle = {
      height: this.props.height-35,
      overflowY: 'auto'
    };

    this.textStyle = {
      wordBreak: 'break-all'
    };

    this._onOriginalSourceMetadataAvailable = (id) => {
      const getDataFromSource = (id) => this.getMetadataFromSource(this.props.metastore.getMetadataAbout(id));
      return getDataFromSource.apply(this, [id]);
    };

    this._onSelectionChange = () => {
      const updateMetadataDisplay = () => this.downloadMetadata(this.props.managerstore.getSelected().id);
      updateMetadataDisplay.apply(this);
    };

    this._forceUpdate = () => {
      const update = () => this.setState({});
      return update.apply(this);
    };

    this.state = this.initialState();
  }

  initialState() {
    return {
      id: null,
      metadata: null,
      source: null,
      scientificName: null,
      scientificNameAuthorship: null,
      determinationStatusWarning: null,
      harvestRecordedBy: null,
      harvestFieldNumber: null,
      harvestVerbatimLocality: null,
      institutionCode: null,
      catalogNumber: null,
      linkToExplore: null
    };
  }

  downloadMetadata(id) {
    if(this.state.id) {
      this.props.metastore.removeMetadataUpdateListener(this.state.id, this.receiveMetadata.bind(this));
    }
    this.props.metastore.addMetadataUpdateListener(id, this.receiveMetadata.bind(this));
    this.setState({id: id});
    //window.setTimeout(this.receiveMetadata.bind(this), 50);
  }

  receiveMetadata() {
    var data = this.props.metastore.getMetadataAbout(this.state.id);
    if(data) {
      this.processCoLabMetadata(data);
    }
  }

  processCoLabMetadata(metadata) {
    if(metadata.type == 'Specimen') {
      this.setState(this.initialState());
      //console.log(JSON.stringify(metadata));
      if(metadata.originalSource) {
        if(this.state.metadata) {
          this.props.metastore.removeMetadataUpdateListener(this.state.metadata.originalSource, this._onOriginalSourceMetadataAvailable);
        }
        this.props.metastore.addMetadataUpdateListener(metadata.originalSource, this._onOriginalSourceMetadataAvailable);
      }

      this.setState({metadata: metadata});
      //window.setTimeout(this._onOriginalSourceMetadataAvailable.bind(this, metadata.originalSource), 50);
    }
  }

  getMetadataFromSource(colabMetadata) {
    if(!colabMetadata) {
      return;
    }

    let id = colabMetadata.idInOriginSource;
    let type = colabMetadata.typeInOriginSource;
    let source = colabMetadata.origin;
    switch(source.toLowerCase()) {
      case 'recolnat':
        this.getRecolnatMetadata(id, type);
        break;
      default:
        console.error('Unknown data source ' + source);
        break;
    }
    this.setState({source: source});
  }

  getRecolnatMetadata(id, type) {
    switch(type.toLowerCase()) {
      case 'specimen':
        this.getRecolnatSpecimenMetadata(id);
        break;
      default:
        console.error('No handler for ReColNat object type ' + type);
        break;
    }
  }

  getRecolnatSpecimenMetadata(id) {
    // Example id 3A160E6F-8ED3-4ED3-A46A-D6737893E844
    // https://api.recolnat.org/erecolnat/v1/specimens/3a160e6f-8ed3-4ed3-a46a-d6737893e844
    // Then go to determination(s)
    request.get('https://api.recolnat.org/erecolnat/v1/specimens/' + id)
      //.withCredentials()
      .end((err, res) => {
        if(err) {
          console.error('Could not retrieve resource data from recolnat about ' + id);
          this.setState({
            type: 'specimen',
            source: 'recolnat',
            institutionCode: this.props.userstore.getText('dataUnavailableDueToNetworkError'),
            catalogNumber: ''
          });
        }
        else {
          let specimen = JSON.parse(res.text);
          let institCode = this.props.userstore.getText('insitutionCodeUnavailable');
          let catalogNum = this.props.userstore.getText('catalogNumberUnavailable');
          if(specimen.institutioncode) {
            institCode = specimen.institutioncode
          }
          if(specimen.catalognumber) {
            catalogNum = specimen.catalognumber;
          }
          this.setState({
            type: 'specimen',
            source: 'recolnat',
            institutionCode: institCode,
            catalogNumber: catalogNum
          });
        }
      });

    request.get('https://api.recolnat.org/erecolnat/v1/specimens/' + id + '/determinations')
      //.withCredentials()
      .end((err, res) => {
        if(err) {
          console.error('Error requesting determinations about ' + id);
          this.setState({
            scientificName: this.props.userstore.getText('dataUnavailableDueToNetworkError'),
            scientificNameAuthorship: ''
          });
        }
        else {
          let determinations = JSON.parse(res.text);
          let scName = this.props.userstore.getText('dataUnavailable');
          let scNameAuth = this.props.userstore.getText('dataUnavailable');
          let determinationStatusWarning = 'warning';
          //console.log('determinations=' + res.text);
          for(let i = 0; i < determinations.length; ++i) {
            let determination = determinations[i];
            if(determination.taxon.scientificName) {
              scName = determination.taxon.scientificName;
            }
            if(determination.taxon.scientificNameAuthorship) {
              scNameAuth = determination.taxon.scientificNameAuthorship;
            }
            if(determination.identificationverificationstatus == 1) {
              //console.log('determination1=' + JSON.stringify(determination));
              determinationStatusWarning = null;
              break;
            }
          }
          this.setState({
            scientificName: scName,
            scientificNameAuthorship: scNameAuth,
            determinationStatusWarning: determinationStatusWarning
          });
        }
      });

    request.get('https://api.recolnat.org/erecolnat/v1/specimens/' + id + '/recolte')
      //.withCredentials()
      .end((err, res) => {
        if(err) {
          console.error('Error requesting harvest data about ' + id);
          this.setState({
            harvestVerbatimLocality: this.props.userstore.getText('dataUnavailableDueToNetworkError'),
            harvestRecordedBy: this.props.userstore.getText('dataUnavailableDueToNetworkError'),
            harvestFieldNumber: ''
          });
        }
        else {
          let harvest = JSON.parse(res.text);
          //console.log('harvest=' + res.text);
          let recBy = this.props.userstore.getText('dataUnavailable');
          let fieldNum = this.props.userstore.getText('dataUnavailable');
          let verbatimLoc = this.props.userstore.getText('dataUnavailable');

          if(harvest.recordedBy) {
            recBy = harvest.recordedBy;
          }
          if(harvest.localisation.verbatimlocality) {
            verbatimLoc = harvest.localisation.verbatimlocality;
          }
          if(harvest.fieldnumber) {
            fieldNum = harvest.fieldnumber;
          }
          this.setState({
            harvestVerbatimLocality: verbatimLoc,
            harvestRecordedBy: recBy,
            harvestFieldNumber: fieldNum
          });
        }
      });


    this.setState({
      linkToExplore: 'https://explore.recolnat.org/#/specimen/botanique/' + id.split('-').join('')
    });
  }

  createMetadataTable() {
    if(!this.state.linkToExplore) {
      return null;
    }

      // Name, Species, Harvester, Location, Collection, Link-to-Explore
      return (
        <table className='ui selectable striped structured very compact table'>
          <thead>
          <tr>
            <th colSpan='2' className='center aligned'><i className={'ui yellow ' + this.state.determinationStatusWarning + ' icon'} ref='warning' data-content={this.props.userstore.getText('noDeterminationAccepted')}/><i>{this.state.scientificName}</i> {this.state.scientificNameAuthorship}</th>
          </tr>
          </thead>
          <tbody>
          <tr>
            <td className='right aligned'>{this.props.userstore.getText('harvester')}</td>
            <td className='left aligned' style={this.textStyle}>{this.state.harvestRecordedBy} {this.state.harvestFieldNumber}</td>
          </tr>
          <tr>
            <td className='right aligned'>{this.props.userstore.getText('harvestLocation')}</td>
            <td className='left aligned' style={this.textStyle}>{this.state.harvestVerbatimLocality}</td>
          </tr>
          <tr>
            <td className='right aligned'>{this.props.userstore.getText('catalogNumber')}</td>
            <td className='left aligned' style={this.textStyle}>{this.state.institutionCode} {this.state.catalogNumber}</td>
          </tr>
          <tr>
            <td className='center aligned' style={this.textStyle} colSpan='2'><a href={this.state.linkToExplore} target='_blank'>{this.props.userstore.getText('specimenExplorePage')}</a></td>
          </tr>
          </tbody>
        </table>
      );

  }

  componentDidMount() {
    this.props.managerstore.addSelectionChangeListener(this._onSelectionChange);
    this.props.modestore.addModeChangeListener(this._forceUpdate);
    this.props.userstore.addLanguageChangeListener(this._forceUpdate);
  }

  componentWillReceiveProps(props) {
    if(props.height != this.props.height) {
      this.containerStyle.height = props.height-10;
      this.scrollerStyle.height = props.height-35;
    }
  }

  componentWillUpdate(nextProps, nextState) {
  }

  componentDidUpdate(prevProps, prevState) {
    if(this.state.determinationStatusWarning) {
      $(this.refs.warning.getDOMNode()).popup();
    }
  }

  componentWillUnmount() {
    if(this.state.id) {
      this.props.metastore.removeMetadataUpdateListener(this.state.id, this.receiveMetadata.bind(this));
    }
    if(this.state.metadata) {
      this.props.metastore.removeMetadataUpdateListener(this.state.metadata.originalSource, this._onOriginalSourceMetadataAvailable);
    }
    this.props.managerstore.removeSelectionChangeListener(this._onSelectionChange);
    this.props.modestore.removeModeChangeListener(this._forceUpdate);
    this.props.userstore.removeLanguageChangeListener(this._forceUpdate);
  }

  render() {
    return (<div style={this.containerStyle} className='ui segment container'>
      <div style={this.labelContainerStyle}>
      <div className='ui blue tiny basic label'
           style={this.labelStyle}>
        Specimen
      </div>
      </div>
      <div style={this.scrollerStyle}>
      {this.createMetadataTable()}
        </div>
    </div>)
  }
}

export default SpecimenMetadataDisplay;
