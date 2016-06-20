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
      <td className='ui right aligned' style={this.labelStyle} >Longitude</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.decimallongitude}</td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >Localité originale</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.verbatimlocality}</td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >Code pays</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.countrycode}</td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >Profondeur minimale (m)</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.minimumdepthinmeters}</td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >Système géodésique</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.geodeticdatum}</td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >Municipalité</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.municipality}</td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >Remarques sur le lieu</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.locationremarks}</td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >ID du lieu</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.locationID}</td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >Références de géolocalisation</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.georeferencesources}</td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >Altitude originale</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.verbatimelevation}</td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >Pays</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.country}</td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >Altitude maximale (m)</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.maximumelevationInmeters}</td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >Altitude moyenne</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.averagealtituderounded}</td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >Département</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.county}</td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >Continent</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.continent}</td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >Localité</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.locality}</td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >Etat/Province</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.stateprovince}</td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >Profondeur maximale (m)</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.maximumdepthinmeters}</td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >Altitude minimale (m)</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.minimumelevationinmeters}</td>
    </tr>
    </tbody>
  }
}

export default LocationMetadataTable;