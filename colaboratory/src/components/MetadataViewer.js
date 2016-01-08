/**
 * Created by dmitri on 30/03/15.
 */
'use strict';
import React from 'react';

class MetadataViewer extends React.Component {

  constructor(props) {
    super(props);

    this.placeholderStyle = {
      backgroundColor: '#F2F2F2',
      height: '100%',
      width: '100%'
    };
    
    this.accordionTitleStyle = {
      backgroundColor: '#a39d76'
    };

    this.tableStyle = {
      //maxWidth: '90%'
      //overfow: 'auto'
    };

    this.textStyle = {
      wordBreak: 'break-all'
    };

    this._onChangeSelection = () => {
      const displayMetadata = () => this.displayMetadata(this.props.entitystore.getSelectedEntity());
      return displayMetadata.apply(this);
    };

    this.state = {
      global: [],
      exif: []
    };
  }



  displayMetadata(id) {
    //console.log(id);
    if(!id) {
      return;
    }
    var metadata = this.props.entitystore.getSelectedMetadata();
    if(!metadata) {
      window.setTimeout(this._onChangeSelection, 1000);
      return;
    }
    //console.log(JSON.stringify(metadata));
    var global = [];
    var exif = [];
    global.push({name: "Nom", value: metadata.name});
    global.push({name: "Identifiant technique", value: metadata.id});
    global.push({name: "URL", value: metadata.url});
    //global.push({name: "Date de création", value: metadata.date});
    //global.push({name: "Coordonnées dans le bureau affiché", value: metadata.x + "," + metadata.y});

    var exifKeys = Object.keys(metadata.metadata);
    for(var i = 0; i < exifKeys.length; ++i) {
      var key = exifKeys[i];
      var value = metadata.metadata[key];
      exif.push({name: key, value: value});
    }

    this.setState({global: global, exif: exif});
  }

  componentDidMount() {
    $(this.refs.accordion.getDOMNode()).accordion({exclusive: false});
    this.props.entitystore.addChangeSelectionListener(this._onChangeSelection);
  }

  componentWillUnmount() {
    this.props.entitystore.removeChangeSelectionListener(this._onChangeSelection);
  }

  render() {
    var self = this;
    return(
      <div style={this.placeholderStyle}>
        <div ref='accordion' className="ui styled fluid accordion" style={this.tableStyle}>
          <p className='ui title' style={this.accordionTitleStyle}>Métadonnées Générales</p>
          <div className='ui content'>
            <table className='ui selectable striped very compact table'>
            {this.state.global.map(function(elt) {
              return <tr><td className='ui right aligned' >{elt.name}</td><td style={self.textStyle} className='ui left aligned'>{elt.value}</td></tr>;
            })}
              </table>
          </div>
          <p className='ui title' style={this.accordionTitleStyle}>Métadonnées EXIF</p>
          <div className='ui content'>
            <table className='ui selectable striped very compact table'>
              <tbody>
              {this.state.exif.map(function(elt) {
                return <tr><td className='ui right aligned'>{elt.name}</td><td style={self.textStyle} className='ui left aligned'>{elt.value}</td></tr>;
              })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
}

export default MetadataViewer;