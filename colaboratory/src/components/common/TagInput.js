/**
 * Created by dmitri on 21/02/17.
 */
'use strict';

import React from 'react';
import request from 'superagent';
import noCache from 'superagent-no-cache';

import ServiceMethods from '../../utils/ServiceMethods';

import conf from '../../conf/ApplicationConfiguration';

class TagInput extends React.Component {
  constructor(props) {
    super(props);

    let top = this.props.top-60;
    if(top < 100) {
      top = top+60;
    }

    let position = 'fixed';
    if(this.props.embedded) {
      position = '';
    }

    this.componentStyle = {
      display: 'flex',
      position: position,
      maxHeight: '60px',
      top: top + 'px',
      left: this.props.right + 'px'
    };

    this.labelStyle = {
      display: 'flex',
      backgroundColor: 'powderblue'
    };

    this.compactStyle = {
      margin: 0,
      padding: '2px 2px'
    };

    this.shortInputStyle = {
      maxWidth: '70px'
    };

    this.actionColumnStyle = {
      display: 'flex',
      flexDirection: 'column'
    };

    this.state = {
      tagKey: '',
      tagValue: '',
      invalid: '',
      focus: 0,
      keyProposals: [],
      valueProposals: []
    };
  }

  stopEvent(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  startDrag(e) {
    if(e.isDefaultPrevented() || e.isPropagationStopped() || this.props.embedded) {
      return;
    }
    this.setState({dragging: true});
  }

  dragging(e) {
    if(this.state.dragging) {
      if(e.clientX ===0 || e.clientY === 0) {
        return;
      }
      this.componentStyle.top = e.clientY-10;
      this.componentStyle.left = e.clientX-10;
      this.setState({});
    }
  }

  endDrag() {
    this.setState({dragging: false});
  }

  setFocus(focus) {
    this.setState({focus: focus});
  }

  selectProposal(index, proposal, newFocus) {
    let state = JSON.parse(JSON.stringify(this.state));
    if(index) {
      state[index] = proposal;
    }
    if(newFocus===0 || newFocus) {
      state.focus = newFocus;
    }

    this.setState(state);
  }

  input(index, e) {
    if(index === 'tagKey') {
      if(e.target.value.lastIndexOf(':') != -1) {
        // Move to value mode
        this.setState({
          focus: 1
        });
      }
      else {
        this.setState({
          tagKey: e.target.value
        });
      }
    } else {
      this.setState({
        tagValue: e.target.value
      });
    }
  }

  detectEnter(e) {
    if(e.target.code === 13) {
      this.saveTag(this.props.entity, this.state.tagKey, this.state.tagValue);
      e.preventDefault();
      e.stopPropagation();
    }
  }

  close() {
    if(this.props.onClose) {
      this.props.onClose();
      return;
    }
    alert('Dev error: no closeCallback provided in TagInput properties.\nThis must be provided in parent component.');
  }

  saveTag(entity, key, value) {
    if(this.props.onTagSave) {
      this.props.onTagSave(entity, key, value);
      return;
    }
    if(key === '') {
      this.setState({invalid: 'error'});
      return;
    }
    ServiceMethods.createTagDefinition(key, value, this.tagDefReceived.bind(this, entity));
  }

  tagDefReceived(entity, msg) {
    if(msg.clientProcessError) {
      alert('Count not create new tag');
      return;
    }
    ServiceMethods.tagEntityWithTagId(msg.data.id, entity);
  }

  queryKeyProposals(keyBegin) {
    request.get(conf.actions.tags.queryKey)
      .query({begin: keyBegin})
      .use(noCache)
      .end((err, res) => {
        if(err) {
          console.warn('Could not retrive key proposals ' + err);
        }
        else {
          let response = JSON.parse(res.text);
          console.log(res.text);
          if(response.success) {
            this.setState({keyProposals: response.results});
          }
        }
      });
  }

  queryValueProposals(key, valueBegin) {
    request.get(conf.actions.tags.queryTag)
      .query({begin: valueBegin, key: key})
      .use(noCache)
      .end((err, res) => {
        if(err) {
          console.warn('Could not retrive value proposals ' + err);
        }
        else {
          let response = JSON.parse(res.text);
          if(response.success) {
            this.setState({valueProposals: response.results});
          }
        }
      });
  }

  componentDidMount() {
  }

  componentWillUpdate(nextProps, nextState) {
    if(nextState.focus != this.state.focus || nextState.tagKey != this.state.tagKey || nextState.tagValue != this.state.tagValue) {
      nextState.keyProposals = [];
      nextState.valueProposals = [];
    }

    if(nextState.tagKey.length > 0) {
      nextState.invalid = '';
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if(this.state.focus === 0) {
      if(this.state.tagKey !== prevState.tagKey && this.state.tagKey.length > 0) {
        // query API for proposals only if at least 1 character entered
        this.queryKeyProposals(this.state.tagKey);
      }
    } else if (this.state.focus === 1) {
      if(this.state.tagValue !== prevState.tagValue || prevState.focus === 0) {
        // query API for proposals
        this.queryValueProposals(this.state.tagKey, this.state.tagValue);
      }
    }
  }

  render() {
    let self = this;
    return (
      <div style={this.componentStyle}>
        <a className='ui tiny tag label'
           draggable={true}
           onDragStart={this.startDrag.bind(this)}
           onDrag={this.dragging.bind(this)}
           onDragEnd={this.endDrag.bind(this)}
           style={this.labelStyle}
           onKeyDown={this.detectEnter.bind(this)}>
          <div className='ui search'
               style={this.shortInputStyle}
               key='searchKey'
               draggable={true}
               onDragStart={this.stopEvent.bind(this)}>
            <div className={'ui input ' + this.state.invalid}>
              <input type='text'
                     className='prompt'
                     style={this.shortInputStyle}
                     placeholder="descriptor"
                     value={this.state.tagKey}
                     onFocus={this.setFocus.bind(this, 0)}
                     onChange={this.input.bind(this, 'tagKey')}/>
            </div>
            <div className={'results ' + (this.state.focus===0?'transition visible':'')}>
              {this.state.keyProposals.map(function(p,idx) {
                return <a className='result'
                          style={self.compactStyle}
                          key={idx}
                          value={p.name}
                          onClick={self.setState.bind(self, {tagKey: p.name, focus: 1}, null)}>
                  <div className='content'
                       style={self.compactStyle}>
                    <div className='title'
                         style={self.compactStyle}>{p.name}</div>
                  </div>
                </a>
              })}
            </div>
          </div>
          <div className='ui search'
               style={this.shortInputStyle}
               draggable={true}
               onDragStart={this.stopEvent.bind(this)}
               key='searchValue'>
            <div className='ui input'>
              <input type='text'
                     className='prompt'
                     style={this.shortInputStyle}
                     placeholder="value (optional)"
                     value={this.state.tagValue}
                     onFocus={this.setFocus.bind(this, 1)}
                     onChange={this.input.bind(this, 'tagValue')}/>
            </div>
            <div className={'results ' + (this.state.focus===1?'transition visible':'')}>
              {this.state.valueProposals.map(function(p,idx) {
                return <a className='result'
                          style={self.compactStyle}
                          key={idx}
                          value={p.name}
                          onClick={self.setState.bind(self, {tagValue: p.name, focus: -1}, null)}>
                  <div className='content' style={self.compactStyle}>
                    <div className='title' style={self.compactStyle}>{p.name}</div>
                  </div>
                </a>
              })}
            </div>
          </div>
          <div style={this.actionColumnStyle}>
            <i className='ui large green icon checkmark'
               draggable={true}
               onDragStart={this.stopEvent.bind(this)}
               onClick={this.saveTag.bind(this, this.props.entity, this.state.tagKey, this.state.tagValue)} />
            {this.props.onClose?
              <i className='ui large red icon remove'
                 draggable={true}
                 onDragStart={this.stopEvent.bind(this)}
                 onClick={this.close.bind(this)} />:null}
          </div>
        </a>
      </div>
    );
  }
}

export default TagInput;