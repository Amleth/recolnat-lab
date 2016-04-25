/**
 * Created by dmitri on 22/04/16.
 */
'use strict';

import React from 'react';

import MetadataActions from '../../actions/MetadataActions';
import MinimapActions from '../../actions/MinimapActions';

import Globals from '../../utils/Globals';

class GroupSelector extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      listOfImages: [],
      selectedImageIdx: -1,
      selectedImageName: 'Choisissez une image'
    };

    this.buttonStyle = {
      paddingLeft: '.1em',
      paddingRight: '.4em'
    };

    this.dropdownStyle = {
      minWidth: 'initial',
      maxWidth: '100%'
    };

    this.labelStyle = {
      position: 'relative',
      top: '-25px',
      left: '-10px'
    };

    this._onLabBenchLoaded = () => {
      const getViewImages = () => this.getViewImages();
      return getViewImages.apply(this);
    };
  }

  getViewImages() {
    var viewData = this.props.benchstore.getActiveViewData();
    var images = [];
    if(viewData) {
      for(var i = 0; i < viewData.displays.length; ++i) {
        var displayedEntity = JSON.parse(JSON.stringify(viewData.displays[i]));
        var imageId = displayedEntity.entity;
        var data = this.props.benchstore.getData(imageId);
        var keys = Object.keys(data);
        for(var j = 0; j < keys.length; ++j) {
          var key = keys[j];
          displayedEntity[key] = data[key];
        }
        images.push(displayedEntity);
      }
    }
    this.setState({listOfImages: images, selectedImageIdx: -1, selectedImageName: 'Choisissez une image'});
  }

  previous() {
    if(this.state.selectedImageIdx == 0) {
      this.setState({selectedImageIdx: this.state.listOfImages.length-1});
    }
    else {
      this.setState({selectedImageIdx: this.state.selectedImageIdx-1});
    }
  }

  next() {
    if(this.state.selectedImageIdx+1 == this.state.listOfImages.length) {
      this.setState({selectedImageIdx: 0});
    }
    else {
      this.setState({selectedImageIdx: this.state.selectedImageIdx+1});
    }
  }

  componentDidMount() {
    $(this.refs.imageDropdown.getDOMNode()).dropdown({
      onChange: (value) => {
        this.setState({selectedImageIdx: value});
      }
    });
    this.props.benchstore.addLabBenchLoadListener(this._onLabBenchLoaded);
  }

  componentWillUpdate(nextProps, nextState) {
    // Update name display, send minimap init
    if(nextState.selectedImageIdx != this.state.selectedImageIdx) {
      if(nextState.selectedImageIdx < 0) {
        nextState.selectedImageName = 'Choisissez une image';
        MinimapActions.initMinimap(null, null, null, null, null);
      }
      else {
        var imageData = nextState.listOfImages[nextState.selectedImageIdx];
        nextState.selectedImageName = imageData.name;
        MinimapActions.initMinimap(imageData.thumbnail, imageData.width, imageData.height, imageData.x, imageData.y);
      }
    }
  }

  componentDidUpdate(prevProps, prevState) {
    $(this.refs.imageDropdown.getDOMNode()).dropdown('refresh');
  }

  componentWillUnmount() {
    this.props.benchstore.removeLabBenchLoadListener(this._onLabBenchLoaded);
  }

  render() {
    return <div className='ui container segment'>
      <div className='ui blue tiny basic label'
           style={this.labelStyle}>
        Groupes & Images
      </div>
      <div>
        <div ref='imageDropdown'
             style={this.dropdownStyle}
             className='ui search selection dropdown'>
          <input name='imageName' type='hidden'/>
          <i className='ui floating dropdown icon'></i>
          <div className='default text'>{this.state.selectedImageName} </div>
          <div className='scrolling menu'>
            <div className='item'
                 data-value={-1}>Image</div>
            {this.state.listOfImages.map(function(image, index) {
              return <div className='item' data-value={index}>{image.name}</div>;
            })}
          </div>
        </div>
      </div>
      <div className='ui tiny compact buttons'>
        <div className='ui icon button'
             style={this.buttonStyle}
             onClick={this.setState.bind(this, {selectedImageIdx: 0})}>
          <i className='angle double left icon'/>
        </div>
        <div className='ui icon button'
             style={this.buttonStyle}
             onClick={this.previous.bind(this)}>
          <i className='angle left icon'/>
        </div>
        <div className='ui button disabled'>
          {this.state.selectedImageIdx+1}/{this.state.listOfImages.length}
        </div>
        <div className='ui icon button'
             style={this.buttonStyle}
             onClick={this.next.bind(this)}>
          <i className='angle right icon'/>
        </div>
        <div className='ui icon button'
             style={this.buttonStyle}
             onClick={this.setState.bind(this, {selectedImageIdx: this.state.listOfImages.length})}>
          <i className='angle double right icon'/>
        </div>
      </div>
    </div>
  }
}

export default GroupSelector;