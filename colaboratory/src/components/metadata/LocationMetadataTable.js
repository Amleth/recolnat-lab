/**
 * Created by dmitri on 18/02/16.
 */
'use react';

import React from 'react';

import MetadataTable from './MetadataTable';

class LocationMetadataTable extends MetadataTable {
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
      <td className='ui right aligned' >Longitude</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.decimallongitude}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >Localité originale</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.verbatimlocality}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >Code pays</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.countrycode}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >Profondeur minimale (m)</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.minimumdepthinmeters}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >Système géodésique</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.geodeticdatum}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >Municipalité</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.municipality}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >Remarques sur le lieu</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.locationremarks}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >ID du lieu</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.locationID}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >Références de géolocalisation</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.georeferencesources}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >Altitude originale</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.verbatimelevation}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >Pays</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.country}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >Altitude maximale (m)</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.maximumelevationInmeters}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >Altitude moyenne</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.averagealtituderounded}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >Département</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.county}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >Continent</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.continent}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >Localité</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.locality}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >Etat/Province</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.stateprovince}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >Profondeur maximale (m)</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.maximumdepthinmeters}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >Altitude minimale (m)</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.minimumelevationinmeters}</td>
    </tr>
    </tbody>
  }
}

export default LocationMetadataTable;