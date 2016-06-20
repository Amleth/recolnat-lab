/**
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
    if(this.props.loading) {
      return <tbody>
      <tr><td colSpan='2' className='ui center aligned'>Chargement en cours...</td></tr>
      </tbody>
    }
    return <tbody>

    <tr>
      <td className='ui right aligned' style={this.labelStyle}>Base de registre</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.basisofrecord}</td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >Stade de développement</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.lifestage}</td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >Sexe</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.sex}</td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >Taxons associés</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.associatedTaxa}</td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >Remarques sur l'occurrence</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.occurrenceremarks}</td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >Code de l'institution</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.institutioncode}</td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >Code de l'institution propriétaire</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.ownerinstitutionCode}</td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >Code de la collection</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.collectioncode}</td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >N° de catalogue</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.catalognumber}</td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >N° d'enregistrement</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.recordnumber}</td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >Référence bibliographique</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.bibliographiccitation}</td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >Références associées</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.associatedReferences}</td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >Détenteur des droits</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.rightsholder}</td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >Date de création</td><td style={this.textStyle} className='ui left aligned'>{new Date(this.state.metadata.created).toLocaleString()}</td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >Dernière modification</td><td style={this.textStyle} className='ui left aligned'>{new Date(this.state.metadata.modified).toLocaleString()}</td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >Droits</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.rights}</td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >Droits d'accès</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.accessrights}</td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >Médias associés</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.associatedmedia}</td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >Disposition</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.disposition}</td>
    </tr>
    </tbody>
  }
}

export default SpecimenMetadataTable;