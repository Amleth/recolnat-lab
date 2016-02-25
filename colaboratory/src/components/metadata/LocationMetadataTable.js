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
    return <tbody>
    <tr>
      <td className='ui right aligned' >verbatimEventDate</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.verbatimEventDate}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >fieldnotes</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.fieldnotes}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >eventDate</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.eventDate}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >eventRemarks</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.eventRemarks}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >eday</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.eday}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >eyear</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.eyear}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >decade</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.decade}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >smonth</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.smonth}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >eventid</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.eventid}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >fieldnumber</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.fieldnumber}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >syear</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.syear}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >habitat</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.habitat}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >emonth</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.emonth}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >sday</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.sday}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >recordedBy</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.recordedBy}</td>
    </tr>
    <tr><td colSpan='2'>Données géographiques de récolte</td></tr>
    <tr>
      <td className='ui right aligned' >decimallongitude</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.localisation.decimallongitude}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >verbatimlocality</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.localisation.verbatimlocality}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >countrycode</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.localisation.countrycode}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >minimumdepthinmeters</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.localisation.minimumdepthinmeters}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >geodeticdatum</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.localisation.geodeticdatum}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >municipality</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.localisation.municipality}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >locationremarks</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.localisation.locationremarks}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >locationID</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.localisation.locationID}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >georeferencesources</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.localisation.georeferencesources}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >verbatimelevation</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.localisation.verbatimelevation}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >country</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.localisation.country}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >maximumelevationInmeters</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.localisation.maximumelevationInmeters}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >averagealtituderounded</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.localisation.averagealtituderounded}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >county</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.localisation.county}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >continent</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.localisation.continent}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >county</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.localisation.county}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >locality</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.localisation.locality}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >stateprovince</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.localisation.stateprovince}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >maximumdepthinmeters</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.localisation.maximumdepthinmeters}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >minimumelevationinmeters</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.localisation.minimumelevationinmeters}</td>
    </tr>


    </tbody>
  }
}

export default HarvestMetadataTable;