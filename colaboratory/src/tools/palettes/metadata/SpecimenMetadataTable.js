/**
 * MetadataTable extension to display Specimen data received from Recolnat API.
 *
 * Created by dmitri on 18/02/16.
 */
'use strict';

import React from 'react';

import MetadataTable from './MetadataTable';

class SpecimenMetadataTable extends MetadataTable {
  constructor(props) {
    super(props);
  }

  buildDisplayTableBody() {
    if (this.props.loading) {
      return <tbody>
      <tr>
        <td colSpan='2' className='ui center aligned'>{this.props.userstore.getText('loading')}</td>
      </tr>
      </tbody>
    }
    return <tbody>
    <tr>
      <td className='ui right aligned' style={this.labelStyle}>
        {this.props.userstore.getOntologyField('basisOfRecord')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {this.state.metadata.basisofrecord}
      </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle}>
        {this.props.userstore.getOntologyField('lifeStage')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {this.state.metadata.lifestage}
      </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle}>
        {this.props.userstore.getOntologyField('sex')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {this.state.metadata.sex}
      </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle}>
        {this.props.userstore.getOntologyField('associatedTaxa')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {this.state.metadata.associatedTaxa}
      </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle}>
        {this.props.userstore.getOntologyField('occurrenceRemarks')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {this.state.metadata.occurrenceremarks}
      </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle}>
        {this.props.userstore.getOntologyField('institutionCode')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {this.state.metadata.institutioncode}
      </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle}>
        {this.props.userstore.getOntologyField('ownerInstitutionCode')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {this.state.metadata.ownerinstitutionCode}
      </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle}>
        {this.props.userstore.getOntologyField('collectionCode')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {this.state.metadata.collectioncode}
      </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle}>
        {this.props.userstore.getText('catalogNumber')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {this.state.metadata.catalognumber}
      </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle}>
        {this.props.userstore.getOntologyField('recordNumber')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {this.state.metadata.recordnumber}
      </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle}>
        {this.props.userstore.getOntologyField('bibliographicCitation')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {this.state.metadata.bibliographiccitation}
      </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle}>
        {this.props.userstore.getOntologyField('associatedReferences')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {this.state.metadata.associatedReferences}
      </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle}>
        {this.props.userstore.getOntologyField('rightsHolder')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {this.state.metadata.rightsholder}
      </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle}>
        {this.props.userstore.getText('creationDate')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {new Date(this.state.metadata.created).toLocaleString()}
      </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle}>
        {this.props.userstore.getText('lastModified')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {new Date(this.state.metadata.modified).toLocaleString()}
      </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle}>
        {this.props.userstore.getOntologyField('rights')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {this.state.metadata.rights}
      </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle}>
        {this.props.userstore.getOntologyField('accessRights')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {this.state.metadata.accessrights}
      </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle}>
        {this.props.userstore.getOntologyField('associatedMedia')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {this.state.metadata.associatedmedia}
      </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle}>
        {this.props.userstore.getOntologyField('disposition')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {this.state.metadata.disposition}
      </td>
    </tr>
    </tbody>
  }
}

export default SpecimenMetadataTable;