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
      <tr>
        <td colSpan='2' className='ui center aligned'>
          {this.props.userstore.getText('loading')}
          </td>
      </tr>
        </tbody>
    }
    return <tbody>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >
        {this.props.userstore.getText('longitude')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {this.state.metadata.decimallongitude}
        </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >
        {this.props.userstore.getOntologyField('verbatimLocality')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {this.state.metadata.verbatimlocality}
        </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >
        {this.props.userstore.getText('countryCode')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {this.state.metadata.countrycode}
        </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >
        {this.props.userstore.getOntologyField('minDepthInM')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {this.state.metadata.minimumdepthinmeters}
        </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >
        {this.props.userstore.getOntologyField('geodeticDatum')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {this.state.metadata.geodeticdatum}
        </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >
        {this.props.userstore.getText('municipality')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {this.state.metadata.municipality}
        </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >
        {this.props.userstore.getOntologyField('locationRemarks')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {this.state.metadata.locationremarks}
        </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >
        {this.props.userstore.getOntologyField('locationId')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {this.state.metadata.locationID}
        </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >
        {this.props.userstore.getOntologyField('georeferenceSources')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {this.state.metadata.georeferencesources}
        </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >
        {this.props.userstore.getOntologyField('verbatimElevation')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {this.state.metadata.verbatimelevation}
        </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >
        {this.props.userstore.getText('country')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {this.state.metadata.country}
        </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >
        {this.props.userstore.getOntologyField('maxElevationInM')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {this.state.metadata.maximumelevationInmeters}
        </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >
        {this.props.userstore.getOntologyField('averageAltitudeRounded')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {this.state.metadata.averagealtituderounded}
        </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >
        {this.props.userstore.getText('county')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {this.state.metadata.county}
        </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >
        {this.props.userstore.getText('continent')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {this.state.metadata.continent}
        </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >
        {this.props.userstore.getText('locality')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {this.state.metadata.locality}
        </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >
        {this.props.userstore.getText('stateOrProvince')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {this.state.metadata.stateprovince}
        </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >
        {this.props.userstore.getOntologyField('maxDepthInM')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {this.state.metadata.maximumdepthinmeters}
        </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >
        {this.props.userstore.getOntologyField('minElevationInM')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {this.state.metadata.minimumelevationinmeters}
        </td>
    </tr>
    </tbody>
  }
}

export default LocationMetadataTable;