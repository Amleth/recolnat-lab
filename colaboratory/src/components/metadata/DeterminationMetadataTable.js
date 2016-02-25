/**
 * Created by dmitri on 18/02/16.
 */
'use react';

import React from 'react';

import MetadataTable from './MetadataTable';

class DeterminationMetadataTable extends MetadataTable {
  constructor(props) {
    super(props);
  }

  buildDisplayTableBody() {
    //console.log('displaying=' + JSON.stringify(this.state.metadata));
    if(this.props.loading) {
      return <tbody>
      <tr><td colSpan='2' className='ui center aligned'>Chargement en cours...</td></tr>
      </tbody>
    }
    return <tbody>
    <tr>
      <td className='ui right aligned' >Identifié par</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.identifiedby}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >Identification qualifier</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.identificationqualifier}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >Date de création</td><td style={this.textStyle} className='ui left aligned'>{new Date(this.state.metadata.created).toLocaleString()}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >Type status</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.typestatus}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >Vérification de l'identification</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.identificationverificationStatus}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >Date d'identification</td><td style={this.textStyle} className='ui left aligned'>{new Date(this.state.metadata.dateidentified).toLocaleString()}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >Remarques d'identification</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.identificationremarks}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >Dernière modification</td><td style={this.textStyle} className='ui left aligned'>{new Date(this.state.metadata.modified).toLocaleString()}</td>
    </tr>





    <tr>
      <td className='ui right aligned' >Etat de la taxonomie</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.taxon.taxonomicStatus}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >Ordre</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.taxon.order_}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >Nom d'usage accepté</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.taxon.acceptedNameUsage}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >Phylum</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.taxon.phylum}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >Année de publication du nom</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.taxon.namePublishedInYear}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >Règne</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.taxon.kingdom}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >Date de création</td><td style={this.textStyle} className='ui left aligned'>{new Date(this.state.metadata.taxon.created).toLocaleString()}</td>
    </tr>

    <tr>
      <td className='ui right aligned' >Nom publié dans</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.taxon.namePublishedIn}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >Niveau du taxon</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.taxon.taxonRank}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >Epithète spécifique</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.taxon.specificEpithet}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >Remarques sur le taxon</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.taxon.taxonRemarks}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >Nom scientifique</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.taxon.scientificName}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >Classe</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.taxon.class_}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >Genre</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.taxon.genus}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >Sous-genre</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.taxon.subgenus}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >Famille</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.taxon.family}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >Nom d'usage du parent</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.taxon.parentnameusage}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >Nom vernaculaire</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.taxon.vernacularname}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >Nom d'usage originel</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.taxon.originalnameusage}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >Code de la nomenclature</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.taxon.nomenclaturalCode}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >Classification supérieure</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.taxon.higherClassification}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >Etat de la nomenclature</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.taxon.nomenclaturalStatus}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >Sensu</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.taxon.nameAccordingTo}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >Créateur du nom scientifique</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.taxon.scientificNameAuthorship}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >Épithète infraspécifique</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.taxon.infraspecificEpithet}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >Dernière modification</td><td style={this.textStyle} className='ui left aligned'>{new Date(this.state.metadata.taxon.modified).toLocaleString()}</td>
    </tr>

    </tbody>
  }
}

export default DeterminationMetadataTable;