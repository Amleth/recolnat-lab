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
      <tr><td colSpan='2' className='ui center aligned'>{this.props.userstore.getText('loading')}</td></tr>
      </tbody>
    }

    return <tbody>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >
        {this.props.userstore.getOntologyField('verbatimEventDate')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {new Date(this.state.metadata.verbatimEventDate).toLocaleString()}
        </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >
        {this.props.userstore.getOntologyField('fieldNotes')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {this.state.metadata.fieldnotes}
        </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >
        {this.props.userstore.getOntologyField('eventDate')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {this.state.metadata.eventDate}
        </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >
        {this.props.userstore.getOntologyField('eventRemarks')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {this.state.metadata.eventRemarks}
        </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >
        {this.props.userstore.getText('day')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {this.state.metadata.eday} {this.state.metadata.sday}
        </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >
        {this.props.userstore.getText('month')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {this.state.metadata.smonth} {this.state.metadata.emonth}
        </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >
        {this.props.userstore.getText('year')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {this.state.metadata.syear} {this.state.metadata.eyear}
        </td>
    </tr>
    <tr>
      <td className='ui right aligned'  style={this.labelStyle}>
        {this.props.userstore.getText('decade')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {this.state.metadata.decade}
        </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >
        {this.props.userstore.getOntologyField('fieldNumber')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {this.state.metadata.fieldnumber}
        </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >
        {this.props.userstore.getOntologyField('habitat')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {this.state.metadata.habitat}
        </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >
        {this.props.userstore.getOntologyField('recordedBy')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {this.state.metadata.recordedBy}
        </td>
    </tr>
    </tbody>
  }
}

export default HarvestMetadataTable;