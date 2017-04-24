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

import ViewActions from '../../actions/ViewActions';

import ServiceMethods from '../../utils/ServiceMethods';
import Globals from '../../utils/Globals';

class Tag extends React.Component {
  constructor(props) {
    super(props);

    this.tagStyle = JSON.parse(JSON.stringify(Styles.tag));

    this.deleteIconStyle = {
      marginLeft: '4px',
      marginRight: 0
    };

    this._onFiltersChange = () => {
      const update = () => this.updateTagColor();
      return update.apply(this);
    };

    this.state = {
      name: this.getName(props.tag),
      color: props.viewstore.getColor(props.tag.definition)
    };
  }

  updateTagColor() {
    let color = this.props.viewstore.getColor(this.props.tag.definition);
    this.setState({color: color});
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

  hilightTaggedEntities() {
    window.setTimeout(ViewActions.updateDisplayFilters.bind(null, {all: true}), 10);
    if(this.props.modestore.isInObservationMode() || this.props.modestore.isInOrganisationMode()) {
      window.setTimeout(this.hilightTaggedEntitiesInLabBench.bind(this), 100);
    }
  }

  hilightTaggedEntitiesInLabBench() {
    if(this.state.color) {
      this.removeHilights();
      return;
    }
    let color = Globals.getRandomColor();
    window.setTimeout(ViewActions.setDisplayColor.bind(null, this.props.tag.definition, color, true), 10);
    if(this.props.tag.entities) {
      for(let i = 0; i < this.props.tag.entities.length; ++i) {
        let tagAssocId = this.props.tag.entities[i];
        let tagAssocData = this.props.metastore.getMetadataAbout(tagAssocId);
        window.setTimeout(ViewActions.setDisplayColor.bind(null, tagAssocData.resource, color, true), 10);

        // Get Image of Entity and color it in the same color
        let images = [];
        Globals.getImagesOfEntity(tagAssocData.resource, this.props.metastore, images);
        for(let j = 0; j < images.length; ++j) {
          window.setTimeout(ViewActions.setDisplayColor.bind(null, images[j], color, true), 10);
        }
      }
    }
  }

  removeHilights() {
    if(this.props.tag.entities && this.state.color) {
      for(let i = 0; i < this.props.tag.entities.length; ++i) {
        let tagAssocId = this.props.tag.entities[i];
        let tagAssocData = this.props.metastore.getMetadataAbout(tagAssocId);
        window.setTimeout(ViewActions.setDisplayColor.bind(null, tagAssocData.resource, this.state.color, false), 10);

        let images = [];
        Globals.getImagesOfEntity(tagAssocData.resource, this.props.metastore, images);
        for(let j = 0; j < images.length; ++j) {
          window.setTimeout(ViewActions.setDisplayColor.bind(null, images[j], this.state.color, false), 10);
        }
      }

      window.setTimeout(ViewActions.setDisplayColor.bind(null, this.props.tag.definition, this.state.color, false), 10);
    }
  }

  componentDidMount() {
    this.props.viewstore.addFilterUpdateListener(this._onFiltersChange);
  }

  componentWillReceiveProps(props) {
    this.setState({name: this.getName(props.tag)});
  }

  componentWillUpdate(nextProps, nextState) {
      this.tagStyle.backgroundColor = nextState.color;
  }

  componentWillUnmount() {
    this.props.viewstore.removeFilterUpdateListener(this._onFiltersChange);
  }

  render() {
    let deleteIcon = null;
    if(this.props.showDelete && this.props.tag.deletable && (this.props.tag.count === 1 || !this.props.tag.count)) {
      deleteIcon = <i className='ui icon remove'
                      style={this.deleteIconStyle}
                      onClick={ServiceMethods.remove.bind(null, this.props.tag.uid, null)} />;
    }
    return <a style={this.tagStyle}
              onClick={this.hilightTaggedEntities.bind(this)}
              className={'ui tiny tag label'}>
      {this.state.name}
      {deleteIcon}
    </a>;
  }
}

export default Tag;