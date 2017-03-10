/**
 * Generic tag component.
 *
 * Properties:
 * - showDelete: Boolean display or not the option to delete this tag. This will not display if the tag tags more than one entity.
 * - tag: Object with the following parameters:
 *   - key: String left-hand value of the tag
 *   - value: String right-hand value of the tag (optional)
 *   - count: Integer (optional) Number of entities this tag tags
 *   - entities: Array<String> (optional) UIDs of entities tagged by this tag
 *   - deletable: Boolean indicates whether this tag can be deleted by this user
 *
 * Created by dmitri on 06/03/17.
 */
'use strict';

import React from 'react';

import Styles from '../../constants/Styles';

import ServiceMethods from '../../utils/ServiceMethods';

class Tag extends React.Component {
  constructor(props) {
    super(props);

    this.deleteIconStyle = {
      marginLeft: '4px',
      marginRight: 0
    };

    this.state = {
      name: this.getName(props.tag)
    };
  }

  getName(tag) {
    let displayName = tag.key;
    if(tag.value) {
      displayName = displayName + " : " + tag.value;
    }
    if(tag.count) {
      displayName = displayName + " (" + tag.count + ")";
    }
    else if(tag.entities) {
      displayName = displayName + " (" + tag.entities.length + ")";
    }
    return displayName;
  }

  componentWillReceiveProps(props) {
    this.setState({name: this.getName(props.tag)});
  }

  componentWillUpdate(nextProps, nextState) {

  }

  render() {
    let deleteIcon = null;
    if(this.props.showDelete && this.props.tag.deletable && (this.props.tag.count === 1 || !this.props.tag.count)) {
      deleteIcon = <i className='ui icon remove'
                      style={this.deleteIconStyle}
                      onClick={ServiceMethods.remove.bind(null, this.props.tag.uid, null)} />;
    }
    return <a style={Styles.tag}
              className={'ui tiny tag label'}>
      {this.state.name}
      {deleteIcon}
    </a>;
  }
}

export default Tag;