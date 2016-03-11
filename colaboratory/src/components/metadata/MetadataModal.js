/**
 * Created by dmitri on 07/03/16.
 */
'use strict';

import React from 'react';

import Globals from '../../utils/Globals';

import MetadataTable from './MetadataTable';

class MetadataModal extends React.Component {
  constructor(props) {
    super(props);

    this._onMetadataDisplayRequest = () => {
      const displayMetadata = () => this.setEntityMetadata(this.props.viewstore.getMetadataModalEntity());
      return displayMetadata.apply(this);
    };

    this.state = {
      metadata: []
    };
  }

  setEntityMetadata(id) {
    var metadata = this.props.entitystore.getMetadataAbout(id);
    //console.log(JSON.stringify(metadata));
    if(metadata) {
      var imageId = this.props.entitystore.getContainingImageId(id);
      //console.log(imageId);
      var mmPerPixel = Globals.getEXIFScalingData(imageId, this.props.entitystore);
      //console.log(mmPerPixel);
      var displayMetadata = [];
      displayMetadata.push({key: 'Nom', value: metadata.name});
      if(metadata.date) {
        displayMetadata.push({key: 'Date de création', value: new Date(metadata.date).toLocaleString()});
      }
      if(metadata.creator) {
        displayMetadata.push({key: 'Créateur', value: metadata.creator});
      }

      if(metadata.annotations) {
        metadata.annotations.forEach(function(annotation, index) {
          //console.log(JSON.stringify(annotation));
          if(annotation.type == 'measure') {
            if(mmPerPixel) {
              var text = annotation.text.split('p');
              if(text[1].lastIndexOf('²') > -1) {
                // This is an area
                displayMetadata.push({
                  key: 'Aire',
                  value: parseFloat(text[0])*mmPerPixel*mmPerPixel + ' mm²'
                });
              }
              else {
                // This is a length or perimeter
                displayMetadata.push({
                  key: 'Longueur ou perimètre',
                  value: parseFloat(text[0])*mmPerPixel + ' mm'
                });
              }
            }
          }
        });
      }
      this.setState({
        metadata: displayMetadata
      });
      return;
    }

    this.setState({metadata: []});

  }

  componentDidMount() {
    this.props.viewstore.addMetadataListener(this._onMetadataDisplayRequest);
  }

  componentDidUpdate(prevProps, prevState) {
    if(this.state.metadata.length > 0) {
      var self = this;
      $(this.refs.self.getDOMNode()).modal({
          onHidden: function() {
            self.setState({metadata: []});
          }
        }
      ).modal('show');
    }
    else {
      $(this.refs.self.getDOMNode()).modal('hide');
    }
  }

  componentWillUnmount() {
    this.props.viewstore.removeMetadataListener(this._onMetadataDisplayRequest);
  }

  render() {
    return (
      <div ref='self' className='ui modal'>
        <MetadataTable metadata={this.state.metadata} />
      </div>
    );
  }
}

export default MetadataModal;