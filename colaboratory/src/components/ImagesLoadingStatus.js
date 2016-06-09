'use strict';

import React from 'react';

class ImagesLoadingStatus extends React.Component {
  constructor(props) {
    super(props);

    this.componentStyle = {
      display: 'none',
      position: 'absolute',
      right: '5px',
      top: '50px',
      maxHeight: '60px',
      maxWidth: '150px',
      margin: 0,
      padding: '5px 5px 5px 5px',
      backgroundColor: 'rgba(255,255,255,0.4)'
    };

    this._onImageLoadingStatusChange = () => {
      const updateStatusDisplay = () => this.setComponentVisibility();
      return updateStatusDisplay.apply(this);
    };

    this.state = {
      countLoadingImages: 0
    };
  }

  setComponentVisibility() {
    this.setState({countLoadingImages: this.props.imagestore.countLoadingImages()});
  }

  componentDidMount() {
    this.props.imagestore.addLoadingStateChangeListener(this._onImageLoadingStatusChange);
  }

  componentWillUpdate(nextProps, nextState) {
    if(nextState.countLoadingImages > 0) {
      this.componentStyle.display = '';
    }
    else {
      this.componentStyle.display = 'none';
    }
  }

  componentWillUnmount() {
    this.props.imagestore.removeLoadingStateChangeListener(this._onImageLoadingStatusChange);
  }

  render() {
    return <div style={this.componentStyle} className='ui text segment'>
    <div className="ui active small inline loader"></div>Chargement {this.state.countLoadingImages} images
    </div>
  }
}

export default ImagesLoadingStatus;
