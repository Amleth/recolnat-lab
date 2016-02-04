/**
 * Created by dmitri on 03/02/16.
 */
'use strict';

import React from 'react';

class Inbox extends React.Component {
  constructor(props) {
    super(props);

    this.componentStyle = {
      position: 'absolute',
      left: '50px',
      bottom: '50px',
      maxHeight: '300px',
      maxWidth: '160px'
    };

    var content = [];
    if(this.props.content) {
      for (var i = 0; i < this.props.content.length; ++i) {
        if (!this.props.content[i].x) {
          content.push(this.props.content[i]);
        }
      }
    }

    this.state = {
      open: false,
      active: content.length > 0,
      selected: 0,
      content: content
    };
  }

  open() {
    this.setState({open: true});
  }

  next() {
    if(this.state.selected < this.state.content.length-1) {
      this.setState({selected: this.state.selected + 1});
    }
    else {
      this.setState({selected: 0});
    }
  }

  previous() {
    if(this.state.selected > 0) {
      this.setState({selected: this.state.selected-1});
    }
    else {
      this.setState({selected: this.state.content.length-1})
    }
  }

  startDragImage(event) {
    this.props.drag.setAction('inboxMove', this.state.content[this.state.selected]);

    //event.dataTransfer.setData('inboxMove', data);

    //data = event.dataTransfer.getData('inboxMove');

    //console.log("transferring check " + data);
    //event.dataTransfer.effectAllowed = 'move';
  }

  componentWillReceiveProps(props) {
    var content = [];
    if(this.props.content) {
      for (var i = 0; i < this.props.content.length; ++i) {
        if (!this.props.content[i].x) {
          content.push(this.props.content[i]);
        }
      }
    }
    this.setState({active: content.length > 0, content: content});
  }

  componentWillUpdate(nextProps, nextState) {
    if(nextState.content.length == 0) {
      nextState.active = false;
      nextState.open = false;
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if(this.state.active && this.state.open) {
      $(this.refs.image.getDOMNode()).popup();
    }
  }

  render() {
    if(!this.state.active) {
      return null;
    }
    if(!this.state.open) {
      return <div style={this.componentStyle}>
        <div className='ui button teal' onClick={this.open.bind(this)}>Vous avez {this.state.content.length} images à placer</div>
        </div>
    }
    return <div className='ui segment' style={this.componentStyle}>
      <img className='ui image'
           ref='image'
           data-content="Faites glisser l'image vers le bureau pour la placer"
           src={this.state.content[this.state.selected].url}
           alt='Chargement en cours'
           draggable='true'
          onDragStart={this.startDragImage.bind(this)}/>
      <div className='ui tiny compact buttons'>
      <div className='ui button' onClick={this.previous.bind(this)}><i className='ui left chevron icon' /></div>
      <div className='ui button disabled'>{this.state.selected+1}/{this.state.content.length}</div>
      <div className='ui button' onClick={this.next.bind(this)}><i className='ui right chevron icon' /></div>
        </div>
    </div>
  }
}

export default Inbox;