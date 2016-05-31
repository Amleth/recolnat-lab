/**
 * Created by dmitri on 02/05/16.
 */
'use strict';

import React from 'react';

import MetadataActions from '../../actions/MetadataActions';

class ElementInspector extends React.Component {
  constructor(props) {
    super(props);

    this.containerStyle = {
      height: this.props.height,
      padding: '5px 5px 5px 5px',
      margin: '1%'
    };

    this.fixedHeightStyle = {
      height: '100%'
    };

    this.menuStyle = {
      margin: 0
    };

    this.metadataStyle = {
      overflowY: 'auto',
      height: '80%'
    };

    this.tagsStyle = {
      display: 'none',
      overflowY: 'auto',
      height: 0
    };

    this._onSelectionChange = () => {
      const setElementsUnderCursor = () => this.setInspectorContent();
      return setElementsUnderCursor.apply(this);
    };

    this._onModeChange = () => {
      const setModeVisibility = () => this.setState({
        isVisibleInCurrentMode: this.props.modestore.isInOrganisationMode() || this.props.modestore.isInObservationMode() || this.props.modestore.isInSetMode()
      });
      return setModeVisibility.apply(this);
    };

    this._onMetadataChange = () => {
      const displayMetadata = () => this.displayMetadata();
      return displayMetadata.apply(this);
    };

    this.state = {
      isVisibleInCurrentMode: true,
      imageUrl: 'https://upload.wikimedia.org/wikipedia/en/8/89/Construction_Icon_small.png',
      name: 'Nom bidon',
      currentIndex: -1,
      elementIds: [],
      metadata: [
        {key: 'Distance', value: '20 bornes'},
        {key: 'Nom', value: 'Pigeon temporaire'},
        {key: 'KPI', value: '21.3'},
        {key: "Les sanglots longs des violons de l'automne", value: "Blessent mon coeur d'une langueur monotone"},
        {key: 'Rien', value: ''}
      ],
      tags: [
        {name: 'Velue'},
        {name: 'Glanuleuse'},
        {name: 'Spinescent'},
        {name: 'Infundibuliforme'},
        {name: "C'est quoi ?"},
        {name: "!!!!"},
        {name: "12/03/2002"}
      ]
    };
  }

  setInspectorContent() {
    if(this.state.currentIndex > -1) {
      this.props.metastore.removeMetadataUpdateListener(this.state.elementIds[this.state.currentIndex], this._onMetadataChange);
    }
    var elements = this.props.inspecstore.getInspectorContent();
    this.setState({elementIds: elements});
    if(elements.length > 0) {
      this.setState({currentIndex: 0});
      this.props.metastore.addMetadataUpdateListener(elements[0], this._onMetadataChange);
      window.setTimeout(MetadataActions.updateMetadata.bind(null, elements), 10);
    }
    else {
      this.setState({currentIndex: -1});
    }
  }

  displayMetadata() {
    if(this.state.currentIndex < 0) {
      return;
    }
    var metadata = this.props.metastore.getMetadataAbout(this.state.elementIds[this.state.currentIndex]);
    if(!metadata) {
      console.error('No metadata');
      return;
    }
    var keyValueArray = [];
    var keys = Object.keys(metadata);
    for(var i = 0; i < keys.length; ++i) {
      var key = keys[i];
      switch(typeof metadata[key]) {
        case 'number':
        case 'string':
        case 'boolean':
        case 'symbol':
          keyValueArray.push({key: key, value: metadata[key]});
          break;
        case 'function':
          break;
        case 'object':
          if(!Array.isArray(metadata[key])) {
            keyValueArray.push({key: key, value: metadata[key]});
          }
          break;
        default:
          console.error('No processor for type ' + typeof metadata[key] + ' / ' + metadata[key] + ' / ' + key);
      }
    }

    this.setState({metadata: keyValueArray, name: metadata.name, tags: []});
  }

  componentDidMount() {
    this.props.modestore.addModeChangeListener(this._onModeChange);
    this.props.inspecstore.addContentChangeListener(this._onSelectionChange);
  }

  componentWillUpdate(nextProps, nextState) {
    if(nextState.isVisibleInCurrentMode) {
      this.containerStyle.display = '';
    }
    else {
      this.containerStyle.display = 'none';
    }
  }

  componentWillUnmount() {
    if(this.state.currentIndex > -1) {
      this.props.metastore.removeMetadataUpdateListener(this.state.elementIds[this.state.currentIndex], this._onMetadataChange);
    }
    this.props.modestore.removeModeChangeListener(this._onModeChange);
    this.props.inspecstore.removeContentChangeListener(this._onSelectionChange);
  }

  render() {
    return <div className='ui segment container' style={this.containerStyle}>
      <div className='ui fluid borderless menu' style={this.menuStyle}>
        <a className='fitted item'>
          <div className='ui mini image'>
            <img src={this.state.imageUrl}
                 height='50px'
                 width='50px'
                 alt='Image'/>
          </div>
        </a>
        <a className='fitted item'>
          {this.state.name}
        </a>
        <div className='ui icon right menu'>
          <a className='fitted item'>
            <i className='left arrow icon' />
          </a>
          <a className='fitted item'>
            <i className='right arrow icon' />
          </a>
        </div>
      </div>

      <div className='meta' style={this.metadataStyle}>
        <table className='ui small celled striped very compact table'>
          <tbody>
          {
            this.state.metadata.map(function(meta, index) {
              return <tr key={index}>
                <td className='right aligned six wide'><b>{meta.key}</b></td>
                <td className='left aligned ten wide'>{meta.value}</td>
              </tr>
            })
          }
          </tbody>
        </table>
      </div>
      <div className='extra' style={this.tagsStyle}>
        <div className='ui tag labels'>
          {this.state.tags.map(function(tag, index) {
            return <a key={index}
                      className='ui label'>{tag.name}</a>
          })}
        </div>
      </div>
    </div>
  }
}

export default ElementInspector;