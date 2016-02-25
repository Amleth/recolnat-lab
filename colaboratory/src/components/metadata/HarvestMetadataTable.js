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
    return <tbody>
    <tr>
      <td className='ui right aligned' >Identifié par</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.identifiedby}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >identificationqualifier</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.identificationqualifier}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >Date de création</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.created}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >typestatus</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.typestatus}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >identificationid</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.identificationid}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >identificationverificationStatus</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.identificationverificationStatus}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >dateidentified</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.dateidentified}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >identificationremarks</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.identificationremarks}</td>
    </tr>
    <tr>
      <td className='ui right aligned' >Dernière modification</td><td style={this.textStyle} className='ui left aligned'>{this.state.metadata.modified}</td>
    </tr>
    </tbody>
  }
}

export default DeterminationMetadataTable;