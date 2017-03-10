/**
 * Intermediary storage for entities in a Set which are not displayed in the current active View.
 *
 * Created by dmitri on 03/02/16.
 */
'use strict';

import React from 'react';

import MetadataActions from '../../actions/MetadataActions';
import ViewActions from '../../actions/ViewActions';

import ServiceMethods from '../../utils/ServiceMethods';

class Inbox extends React.Component {
  constructor(props) {
    super(props);

    this.componentStyle = {
      position: 'absolute',
      left: '50px',
      bottom: '5px',
      maxHeight: '300px',
      maxWidth: '160px'
    };

    this._onLabBenchLoaded = () => {
      const subscribeToView = () => this.subscribeToView();
      return subscribeToView.apply(this);
    };

    this._onViewUpdated = () => {
      const calculateUnplacedEntities = () => this.calculateUnplacedEntities();
      return calculateUnplacedEntities.apply(this);
    };

    this._onUnplacedEntityMetadataUpdate = (id) => {
      const addEntityMetadata = (id) => this.addEntityMetadata(id);
      return addEntityMetadata.apply(this, [id]);
    };

    this.state = {
      viewId: null,
      entityIds: [],
      open: false,
      active: false,
      selected: 0,
      content: []
    };
  }

  removeListeners(removeViewListener, removeEntityListeners) {
    if(this.state.viewId && removeViewListener) {
      this.props.metastore.removeMetadataUpdateListener(this.state.viewId, this._onLabBenchLoaded);
    }

    if(removeEntityListeners) {
      for (let i = 0; i < this.state.entityIds.length; ++i) {
        this.props.metastore.removeMetadataUpdateListener(this.state.entityIds[i], this._onUnplacedEntityMetadataUpdate);
      }
    }
  }

  subscribeToView() {
    let viewId = this.props.benchstore.getActiveViewId();
    if(!viewId) {
      this.removeListeners(true, true);
      this.setState({viewId: null, entityIds: [], open: false, active: false, content: []});
      return;
    }
    if(viewId === this.state.viewId) {
      return;
    }
    this.props.metastore.addMetadataUpdateListener(viewId, this._onViewUpdated);

    this.setState({viewId: viewId, entityIds: [], open: false, active: false, content: []});
  }

  calculateUnplacedEntities() {
    let labBench = this.props.benchstore.getLabBench();
    let viewData = this.props.metastore.getMetadataAbout(this.state.viewId);
    if(!this.state.viewId) {
      return;
    }
    if(!labBench.images) {
      return;
    }
    if(!viewData) {
      return;
    }
    this.removeListeners(false, true);

    let imageIds = Object.keys(labBench.images);
    let displayedImageIds = viewData.displays.map(function(display) {
      return display.entity;
    });
    let undisplayedImageIds = _.difference(imageIds, displayedImageIds);

    this.setState({active: false, open: false, content: [], entityIds: undisplayedImageIds});

    // Download metadata for unplaced entities
    for(let i = 0; i < undisplayedImageIds.length; ++i) {
      this.props.metastore.addMetadataUpdateListener(undisplayedImageIds[i], this._onUnplacedEntityMetadataUpdate);
      //window.setTimeout(this._onUnplacedEntityMetadataUpdate.bind(this, undisplayedImageIds[i]), 10);
    }
  }

  addEntityMetadata(id) {
    let metadata = this.props.metastore.getMetadataAbout(id);
    let content = JSON.parse(JSON.stringify(this.state.content));
    content.push(metadata);
    this.setState({content: content});
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
  }

  placeAllImagesInLine() {
    window.setTimeout(ViewActions.changeLoaderState.bind(null, this.props.userstore.getText('placing')), 10);

    let view = this.props.viewstore.getView();

    let x = (-view.left + view.width / 2)/view.scale;
    let y = (-view.top + view.height / 2)/view.scale;
    let viewId = this.state.viewId;
    this.imagesToPlace = this.state.content.length;
    this.imagesPlaced = 0;
    for(let i = 0; i < this.state.content.length; ++i) {
      ServiceMethods.place(viewId, this.state.content[i].uid, x, y, this.imagePlaced.bind(this, viewId));

      x = x + this.state.content[i].width + 100;
    }


  }

  placeAllImagesInColumn() {
    window.setTimeout(ViewActions.changeLoaderState.bind(null, this.props.userstore.getText('placing')), 10);

    let data = [];
    let x = this.props.viewstore.getView().left;
    let y = this.props.viewstore.getView().top;
    let viewId = this.state.viewId;
    this.imagesToPlace = this.state.content.length;
    this.imagesPlaced = 0;
    for(let i = 0; i < this.state.content.length; ++i) {
      ServiceMethods.place(viewId, this.state.content[i].uid, x, y, this.imagePlaced.bind(this, viewId));
      y = y + this.state.content[i].height + 200;
    }
  }

  placeAllImagesInGrid() {
    window.setTimeout(
      ViewActions.changeLoaderState.bind(null, this.props.userstore.getText('placing')), 10);

    let x = this.props.viewstore.getView().left;
    let y = this.props.viewstore.getView().top;
    let maxHeight = Math.max(
      this.state.content[0]? this.state.content[0].height : 0,
      this.state.content[1]? this.state.content[1].height : 0,
      this.state.content[2]? this.state.content[2].height : 0,
      this.state.content[3]? this.state.content[3].height : 0,
      this.state.content[4]? this.state.content[4].height : 0
    );
    let maxWidth = Math.max(
      this.state.content[0]? this.state.content[0].width : 0,
      this.state.content[1]? this.state.content[1].width : 0,
      this.state.content[2]? this.state.content[2].width : 0,
      this.state.content[3]? this.state.content[3].width : 0,
      this.state.content[4]? this.state.content[4].width : 0
    );
    let viewId = this.state.viewId;
    this.imagesToPlace = this.state.content.length;
    this.imagesPlaced = 0;
    for(let i = 0; i < this.state.content.length; ++i) {
      ServiceMethods.place(viewId, this.state.content[i].uid, x, y, this.imagePlaced.bind(this, viewId));

      x = x + maxWidth + 200;
      if((i+1) % 5 == 0) {
        y = y + maxHeight + 200;
        x = this.props.viewstore.getView().left;
        maxHeight = Math.max(
          this.state.content[i+1]? this.state.content[i+1].height : 0,
          this.state.content[i+2]? this.state.content[i+2].height : 0,
          this.state.content[i+3]? this.state.content[i+3].height : 0,
          this.state.content[i+4]? this.state.content[i+4].height : 0,
          this.state.content[i+5]? this.state.content[i+5].height : 0
        );
        maxWidth = Math.max(
          this.state.content[i+1]? this.state.content[i+1].width : 0,
          this.state.content[i+2]? this.state.content[i+2].width : 0,
          this.state.content[i+3]? this.state.content[i+3].width : 0,
          this.state.content[i+4]? this.state.content[i+4].width : 0,
          this.state.content[i+5]? this.state.content[i+5].width : 0
        );
      }
    }
  }

  imagePlaced() {
    this.imagesPlaced++;
    if(this.imagesPlaced === this.imagesToPlace) {
      window.setTimeout(ViewActions.fitView, 750);
      window.setTimeout(ViewActions.changeLoaderState.bind(null, null), 10);
    }
  }

  componentDidMount() {
    this.props.userstore.addLanguageChangeListener(this.setState.bind(this, {}));
    this.props.benchstore.addLabBenchLoadListener(this._onLabBenchLoaded);
  }

  componentWillUpdate(nextProps, nextState) {
    if(nextState.content.length == 0) {
      nextState.active = false;
      nextState.open = false;
    }
    if(nextState.content.length > 0) {
      nextState.active = true;
    }
    if(this.state.active && !this.state.open) {
      if(nextState.open || !nextState.active) {
        $(this.refs.component.getDOMNode())
        .transition('remove looping');
      }
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if(this.state.active && !this.state.open) {
      $(this.refs.component.getDOMNode())
      .transition('set looping')
      .transition('pulse', '2000ms');
    }
    if(this.state.active && this.state.open) {
      $('.menu .item', $(this.refs.tabs.getDOMNode())).tab();
      $(this.refs.image.getDOMNode()).popup();
      $('.ui.button', $(this.refs.buttons.getDOMNode())).popup();
    }
  }

  componentWillUnmount() {
    this.props.userstore.removeLanguageChangeListener(this.setState.bind(this, {}));
    this.props.benchstore.removeLabBenchLoadListener(this._onLabBenchLoaded);
    if(this.state.viewId) {
      this.props.metastore.removeMetadataUpdateListener(this.state.viewId, this._onViewUpdated);
    }
  }

  render() {
    if(!this.state.active) {
      return null;
    }
    if(!this.state.open) {
      return <div ref='component' style={this.componentStyle}>
        <div className='ui teal button'
        onClick={this.open.bind(this)}>
          {this.props.userstore.getInterpolatedText('setHasUnplacedImages', [this.state.content.length])}
          </div>
      </div>
    }
    return <div className='ui segment' style={this.componentStyle} ref='tabs'>
      <div className="ui top attached fitted tabular menu">
        <div
          className="active item"
          data-tab="automatic">
          {this.props.userstore.getText('auto')}
        </div>
        <div className="item" data-tab="manual">
          {this.props.userstore.getText('manual')}
        </div>
      </div>
      <div className="ui bottom attached active tab segment" data-tab="automatic">
        <div className='ui button disabled'>{this.props.userstore.getInterpolatedText('countImages', [this.state.content.length])}</div>
        <div className='ui tiny two buttons'
             ref='buttons'
        >
          <div className='ui button'
               onClick={this.placeAllImagesInLine.bind(this)}
               data-content={this.props.userstore.getText('placeInLine')}>
            <i className='ui ellipsis horizontal icon' />
          </div>
          <div className='ui button'
               onClick={this.placeAllImagesInColumn.bind(this)}
               data-content={this.props.userstore.getText('placeInColumn')}>
            <i className='ui ellipsis vertical icon' />
          </div>
        </div>
        <div className='ui tiny two buttons'
             ref='buttons'>
          <div className='ui button'
               onClick={this.placeAllImagesInGrid.bind(this)}
               data-content={this.props.userstore.getText('placeInMatrix')}>
            <i className='ui grid layout icon' />
          </div>
        </div>
      </div>
      <div className="ui bottom attached tab segment" data-tab="manual">
        <img className='ui image'
             ref='image'
             data-content={this.props.userstore.getText('dragDropImage')}
             src={this.state.content[this.state.selected].thumbnail}
             alt={this.props.userstore.getText('loading')}
             draggable='true'
             onDragStart={this.startDragImage.bind(this)}/>
        <div className='ui mini three buttons'>
          <div className='ui button' onClick={this.previous.bind(this)}><i className='ui left chevron icon' /></div>
          <div className='ui button disabled'>{this.state.selected+1}/{this.state.content.length}</div>
          <div className='ui button' onClick={this.next.bind(this)}><i className='ui right chevron icon' /></div>
        </div>
      </div>
    </div>
  }
}

export default Inbox;
