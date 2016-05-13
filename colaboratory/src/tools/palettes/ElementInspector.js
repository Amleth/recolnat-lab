/**
 * Created by dmitri on 02/05/16.
 */
'use strict';

import React from 'react';

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
      height: '40%'
    };

    this.tagsStyle = {
      overflowY: 'auto',
      height: '40%'
    };

    this._onSelectionChange = () => {
      const setElementsUnderCursor = () => this.setElementsUnderCursor();
      return setElementsUnderCursor.apply(this);
    };

    this.state = {
      imageUrl: 'https://upload.wikimedia.org/wikipedia/en/8/89/Construction_Icon_small.png',
      name: 'Nom bidon',
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

  setElementsUnderCursor() {

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