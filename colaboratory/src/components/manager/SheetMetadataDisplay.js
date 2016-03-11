/**
 * Created by dmitri on 16/02/16.
 */
'use strict';

import React from 'react';
import request from 'superagent';

import AbstractMetadataDisplay from './AbstractManagerMetadataDisplay';

class SheetMetadataDisplay extends AbstractMetadataDisplay {
  constructor(props) {
    super(props);
  }

  initialState() {
    return {
      source: null,
      name: null,
      genus: null,
      family: null,
      scName: null,
      scNameAuthor: null,
      harvester: null,
      harvestLocation: null,
      collection: null,
      linkToExplore: null
    };
  }

  processCoLabMetadata(metadata) {
    if(metadata.type != 'Sheet') {
      return;
    }

    this.setState(this.initialState());

    if(metadata.originalSource) {
      this.getMetadataFromSource(metadata.originalSource.uid, metadata.originalSource.type, metadata.originalSource.origin);
    }

    this.setState({name: metadata.name});
  }

  getMetadataFromSource(id, type, source) {
    switch(source) {
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
    switch(type) {
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
          alert('Impossible de récupérer les données associées dans ReColNat');
        }
        else {
          var specimen = JSON.parse(res.text);
          //console.log('specimen=' + res.text);
          this.setState({
            type: 'specimen',
            source: 'recolnat',
            collection: specimen.institutioncode + ' ' + specimen.catalognumber
          });
        }
      });

    request.get('https://api.recolnat.org/erecolnat/v1/specimens/' + id + '/determinations')
      //.withCredentials()
      .end((err, res) => {
        if(err) {
          console.error('Error requesting determinations about ' + id);
          this.setState({
            genus: 'Erreur réseau',
            family: 'Erreur réseau',
            scName: 'Erreur réseau',
            scNameAuthor: 'Erreur réseau'
          });
        }
        else {
          var determinations = JSON.parse(res.text);
          //console.log('determinations=' + res.text);
          if(determinations.length > 0) {
            var determination = determinations[0];
            this.setState({
              genus: determination.taxon.genus,
                family: determination.taxon.family,
              scName: determination.taxon.scientificName,
              scNameAuthor: determination.taxon.scientificNameAuthorship
            });
          }
        }
      });

    request.get('https://api.recolnat.org/erecolnat/v1/specimens/' + id + '/recolte')
      //.withCredentials()
      .end((err, res) => {
        if(err) {
          console.error('Error requesting harvest data about ' + id);
          this.setState({
            harvester: 'Erreur réseau',
            harvestLocation: 'Erreur réseau'
          });
        }
        else {
          var harvest = JSON.parse(res.text);
          //console.log('harvest=' + res.text);

          if(harvest.recordedBy) {
            this.setState({harvester: harvest.recordedBy});
          }
          else {
            this.setState({harvester: 'Donnée manquante'});
          }

          if(harvest.localisation.country) {
            this.setState({harvestLocation: harvest.localisation.country});
          }
          else {
            this.setState({harvestLocation: 'Donnée manquante'});
          }



        }
      });


    this.setState({
      linkToExplore: 'https://explore.recolnat.org/#/specimen/botanique/' + id.split('-').join('')
    });
  }

  createMetadataTable() {
    if(!this.state.name) {
      return null;
    }
    if(this.state.source == 'recolnat') {
      // Name, Species, Harvester, Location, Collection, Link-to-Explore
      return (
        <table className='ui selectable striped structured very compact table'>
          <thead>
          <tr>
            <th colSpan='2' className='center aligned'>{this.state.name}</th>
          </tr>
          </thead>
          <tbody>
          <tr>
            <td className='right aligned'>Nom</td>
            <td className='left aligned' style={this.textStyle}>{this.state.name}</td>
          </tr>
          <tr>
            <td className='right aligned'>Famille</td>
            <td className='left aligned' style={this.textStyle}>{this.state.family}</td>
          </tr>
          <tr>
            <td className='right aligned'>Genus</td>
            <td className='left aligned' style={this.textStyle}>{this.state.genus}</td>
          </tr>
          <tr>
            <td className='right aligned'>Nom scientifique</td>
            <td className='left aligned' style={this.textStyle}>{this.state.scName}</td>
          </tr>
          <tr>
            <td className='right aligned'>Auteur</td>
            <td className='left aligned' style={this.textStyle}>{this.state.scNameAuthor}</td>
          </tr>
          <tr>
            <td className='right aligned'>Récolteur</td>
            <td className='left aligned' style={this.textStyle}>{this.state.harvester}</td>
          </tr>
          <tr>
            <td className='right aligned'>Lieu de récolte</td>
            <td className='left aligned' style={this.textStyle}>{this.state.harvestLocation}</td>
          </tr>
          <tr>
            <td className='right aligned'>Collection</td>
            <td className='left aligned' style={this.textStyle}>{this.state.collection}</td>
          </tr>
          <tr>
            <td className='center aligned' style={this.textStyle} colSpan='2'><a href={this.state.linkToExplore} target='_blank'>Page Explore du spécimen</a></td>
          </tr>
          </tbody>
        </table>
      );
    }
    else {
      // Name, Not R-Nat (for non-recolnat)
      return (
        <table className='ui selectable striped very compact table'>
          <thead>
          <tr>
            <th colSpan='2' className='center aligned'>{this.state.name}</th>
          </tr>
          </thead>
          <tbody>
          <tr>
            <td className='ui right aligned'>Nom</td>
            <td className='ui left aligned' style={this.textStyle}>{this.state.name}</td>
          </tr>
          </tbody>
        </table>
      );
    }
  }
}

export default SheetMetadataDisplay;