/**
 * Created by dmitri on 25/01/16.
 */
'use strict';

import React from 'react';
import request from 'superagent';

import conf from '../../conf/ApplicationConfiguration';

class WorkbenchManagerMetadataDisplay extends React.Component {
  constructor(props) {
    super(props);

    this._onWorkbenchSelectionChange = () => {
      const updateMetadataDisplay = () => this.downloadMetadata(this.props.managerstore.getSelected().id);
      updateMetadataDisplay.apply(this);
    };

    this.textStyle = {
      wordBreak: 'break-all'
    };

    this.containerStyle = {
      overflowY: 'auto'
    };

    this.state = WorkbenchManagerMetadataDisplay.initialState();
  }

  static initialState() {
    return {
      type: null,
      source: null,
      name: null,
      species: null,
      harvester: null,
      harvestLocation: null,
      collection: null,
      linkToExplore: null
    };
  }

  downloadMetadata(id) {
    var self = this;
    request.get(conf.actions.databaseActions.getData)
      .query({id: id})
      .withCredentials()
      .end((err, res) => {
          if(err) {
            console.error("Could not get data about object " + err);
            self.setState({metadata: null});
          }
          else {
            var metadata = JSON.parse(res.text);
            if(!metadata.type) {
              console.log('Server did not return type in metadata about id=' + id);
              self.setState(WorkbenchManagerMetadataDisplay.initialState);
            }
            else if(metadata.type == 'Sheet') {
              if (metadata.linkToSource) {
                self.getMetadataFromSource(linkToSource);
              }
            }
            else if(metadata.type == 'Workbench') {
              self.setState({
                type: metadata.type,
                name: metadata.name
              })
            }
            else {
              console.error('Unknown object type ' + metadata.type);
              self.setState(WorkbenchManagerMetadataDisplay.initialState);
            }
          }
        }
      );
  }

  getMetadataFromSource(linkToSource) {
    switch(linkToSource.source) {
      case 'recolnat':
        this.getRecolnatMetadata(linkToSource);
        break;
      default:
        console.error('Unknown data source ' + linkToSource.toSource);
        break;
    }
  }

  getRecolnatMetadata(linkToSource) {
    switch(linkToSource.type) {
      case 'specimen':
        this.getRecolnatSpecimenMetadata(linkToSource.id);
        break;
      default:
        console.error('No handler for ReColNat object type ' + linkToSource.type);
        break;
    }
  }

  getRecolnatSpecimenMetadata(id) {
    // Example id 3A160E6F-8ED3-4ED3-A46A-D6737893E844
    // https://api.recolnat.org/erecolnat/v1/specimens/3a160e6f-8ed3-4ed3-a46a-d6737893e844
    // Then go to determination(s)
    request.get('https://api.recolnat.org/erecolnat/v1/specimens/' + id)
      .withCredentials()
      .end((err, res) => {
        if(err) {
          console.error('Could not retrieve resource data from recolnat about ' + id);
          alert('Impossible de récupérer les données associées dans ReColNat');
        }
        else {
          var specimen = JSON.parse(res.text);
          this.setState({
            type: 'specimen',
            source: 'recolnat',
            collection: specimen.institutioncode + ' ' + specimen.catalognumber
          });
        }
      });

    request.get('https://api.recolnat.org/erecolnat/v1/specimens/' + id + '/determinations')
      .withCredentials()
      .end((err, res) => {
        if(err) {
          console.error('Error requesting determinations about ' + id);
        }
        else {
          var determinations = JSON.parse(res.text);
          if(determinations.length > 0) {
            var determination = determinations[0];
            this.setState({
              name: determination.taxon.genus + ' / ' + determination.taxon.family + ' / ' + determination.taxon.scientificName,
              species: determination.taxon.scientificName,
              harvester: determination.taxon.scientificNameAuthorship,
              harvestLocation: null
            });
          }
        }
      });

    this.setState({
      linkToExplore: 'https://explore.recolnat.org/#/specimen/botanique/' + id.replace('-', '')
    })
  }

  createMetadataTable() {
    var self = this;
    // Name, Species, Harvester, Location, Collection, Link-to-Explore (for ReColNatSheet)
    // Name, Not R-Nat (for non-recolnat)
    // Name, Creation Date (for Workbench)
    return (
      <table className='ui selectable striped very compact table'>
        <thead>
        <tr>
          <td>{this.state.metadata.name}</td>
        </tr>
        </thead>
        <tbody>
          <tr><td className='ui right aligned' >{key}</td><td className='ui left aligned' style={self.textStyle}>{self.state.metadata[key]}</td></tr>
        </tbody>
      </table>
    );
  }

  componentDidMount() {
    this.props.managerstore.addSelectionChangeListener(this._onWorkbenchSelectionChange);
  }

  componentWillUnmount() {
    this.props.managerstore.removeSelectionChangeListener(this._onWorkbenchSelectionChange);
  }

  render() {
    return(<div style={this.containerStyle}>
      {this.createMetadataTable()}
    </div>)
  }
}

export default WorkbenchManagerMetadataDisplay;