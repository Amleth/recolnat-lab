/**
 * Created by dmitri on 18/02/16.
 */
'use react';

import React from 'react';

import MetadataTable from './MetadataTable';

class HarvestMetadataTable extends MetadataTable {
  constructor(props) {
    super(props);
  }

  buildDisplayTableBody() {
    if(this.props.loading) {
      return <tbody>
      <tr><td colSpan='2' className='ui center aligned'>Chargement en cours...</td></tr>
      </tbody>
    }

    return <tbody>
    <tr>
      <td className='ui right aligned' >Date originale de l'événement</td><td style={this.textStyle} className='ui left aligned'>{new Date(this.state.metadata.verbatimEventDate).toLocaleString()}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >Notes de terrain</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.fieldnotes}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >Date de l'événement</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.eventDate}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >Remarques sur l'événement</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.eventRemarks}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >Jour</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.eday} {this.state.metadata.sday}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >Mois</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.smonth} {this.state.metadata.emonth}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >Année</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.syear} {this.state.metadata.eyear}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >Décennie</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.decade}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >Numéro de terrain</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.fieldnumber}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >Habitat</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.habitat}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >Enregistré par</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.recordedBy}</td>
    </tr>
    </tbody>
  }
}

export default HarvestMetadataTable;