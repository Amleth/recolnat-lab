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
      <tr><td colSpan='2' className='ui center aligned'>{this.props.userstore.getText('loading')}</td></tr>
      </tbody>
    }
    return <tbody>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >
        {this.props.userstore.getOntologyField('identifiedBy')}
        </td>
      <td style={this.textStyle} className='ui left aligned'>
        {this.state.metadata.uidentifiedby}
        </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >
        {this.props.userstore.getOntologyField('identificationQualifier')}
        </td>
      <td style={this.textStyle} className='ui left aligned'>
        {this.state.metadata.uidentificationqualifier}
        </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >Date de création</td><td style={this.textStyle} className='ui left aligned'>{new Date(this.state.metadata.created).toLocaleString()}</td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >
        {this.props.userstore.getOntologyField('typeStatus')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {this.state.metadata.typestatus}
        </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >
        {this.props.userstore.getOntologyField('identificationVerificationStatus')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {this.state.metadata.identificationverificationStatus}
        </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >
        {this.props.userstore.getOntologyField('dateIdentified')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {new Date(this.state.metadata.dateidentified).toLocaleString()}
        </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >
        {this.props.userstore.getOntologyField('identificationRemarks')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {this.state.metadata.uidentificationremarks}
        </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >
        {this.props.userstore.getText('lastModified')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {new Date(this.state.metadata.modified).toLocaleString()}
        </td>
    </tr>





    <tr>
      <td className='ui right aligned' style={this.labelStyle} >
        {this.props.userstore.getOntologyField('taxonomicStatus')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
      {this.state.metadata.taxon.taxonomicStatus}
      </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >
        {this.props.userstore.getOntologyField('taxonOrder')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {this.state.metadata.taxon.order_}
        </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >
        {this.props.userstore.getOntologyField('acceptedNameUsage')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {this.state.metadata.taxon.acceptedNameUsage}
        </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >
        {this.props.userstore.getOntologyField('taxonPhylum')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {this.state.metadata.taxon.phylum}
        </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >
        {this.props.userstore.getOntologyField('namePublishedInYear')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>{this.state.metadata.taxon.namePublishedInYear}
      </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >
        {this.props.userstore.getOntologyField('kingdom')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {this.state.metadata.taxon.kingdom}
        </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >
        {this.props.userstore.getText('creationDate')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {new Date(this.state.metadata.taxon.created).toLocaleString()}
        </td>
    </tr>

    <tr>
      <td className='ui right aligned' style={this.labelStyle} >
        {this.props.userstore.getOntologyField('namePublishedIn')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {this.state.metadata.taxon.namePublishedIn}
        </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >
        {this.props.userstore.getOntologyField('taxonRank')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {this.state.metadata.taxon.taxonRank}
        </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >
        {this.props.userstore.getOntologyField('specificEpithet')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {this.state.metadata.taxon.specificEpithet}
        </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >
        {this.props.userstore.getOntologyField('taxonRemarks')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {this.state.metadata.taxon.taxonRemarks}
        </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >
        {this.props.userstore.getOntologyField('scientificName')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {this.state.metadata.taxon.scientificName}
        </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >
        {this.props.userstore.getOntologyField('class')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {this.state.metadata.taxon.class_}
        </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >
        {this.props.userstore.getOntologyField('genus')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {this.state.metadata.taxon.genus}
        </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >
        {this.props.userstore.getOntologyField('subGenus')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {this.state.metadata.taxon.subgenus}
        </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >
        {this.props.userstore.getOntologyField('family')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {this.state.metadata.taxon.family}
        </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >
        {this.props.userstore.getOntologyField('parentNameUsage')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {this.state.metadata.taxon.parentnameusage}
        </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >
        {this.props.userstore.getOntologyField('vernacularName')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {this.state.metadata.taxon.vernacularname}
        </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >
        {this.props.userstore.getOntologyField('originalNameUsage')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {this.state.metadata.taxon.originalnameusage}
        </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >
        {this.props.userstore.getOntologyField('nomenclaturalCode')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {this.state.metadata.taxon.nomenclaturalCode}
        </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >
        {this.props.userstore.getOntologyField('higherClassification')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {this.state.metadata.taxon.higherClassification}
        </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >
        {this.props.userstore.getOntologyField('nomenclaturalStatus')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {this.state.metadata.taxon.nomenclaturalStatus}
        </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >
        {this.props.userstore.getOntologyField('nameAccordingTo')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {this.state.metadata.taxon.nameAccordingTo}
        </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >
        {this.props.userstore.getOntologyField('scientificNameAuthorship')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {this.state.metadata.taxon.scientificNameAuthorship}
        </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >
        {this.props.userstore.getOntologyField('infraspecificEpithet')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {this.state.metadata.taxon.infraspecificEpithet}
        </td>
    </tr>
    <tr>
      <td className='ui right aligned' style={this.labelStyle} >
        {this.props.userstore.getText('lastModified')}
      </td>
      <td style={this.textStyle} className='ui left aligned'>
        {new Date(this.state.metadata.taxon.modified).toLocaleString()}
        </td>
    </tr>

    </tbody>
  }
}

export default DeterminationMetadataTable;