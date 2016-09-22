/**
 * Created by dmitri on 03/02/16.
 */
'use strict';

import React from 'react';

import MetadataActions from '../actions/MetadataActions';
import ViewActions from '../actions/ViewActions';

import ServiceMethods from '../utils/ServiceMethods';

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
      const calculateUnplacedEntities = () => this.calculateUnplacedEntities();
      return calculateUnplacedEntities.apply(this);
    };

    this._onUnplacedEntityMetadataUpdate = (id) => {
      const addEntityMetadata = (id) => this.addEntityMetadata(id);
      return addEntityMetadata.apply(this, [id]);
    };

    this.state = {
      viewId: null,
      open: false,
      active: false,
      selected: 0,
      content: []
    };
  }

  calculateUnplacedEntities() {
    var labBench = this.props.benchstore.getLabBench();
    var viewId = this.props.benchstore.getActiveViewId();
    if(!viewId) {
      return;
    }
    if(!labBench.images) {
      return;
    }
    var imageIds = Object.keys(labBench.images);
    var viewData = this.props.benchstore.getActiveViewData();
    var displayedImageIds = viewData.displays.map(function(display) {
      return display.entity;
    });
    var undisplayedImageIds = _.difference(imageIds, displayedImageIds);

    this.setState({viewId: viewId, active: false, open: false, content: []});

    // Download metadata for unplaced entities
    for(var i = 0; i < undisplayedImageIds.length; ++i) {
      this.props.metastore.addMetadataUpdateListener(undisplayedImageIds[i], this._onUnplacedEntityMetadataUpdate);
      window.setTimeout(this._onUnplacedEntityMetadataUpdate.bind(this, undisplayedImageIds[i]), 50);
    }
  }

  addEntityMetadata(id) {
    //console.log('addEntityMetadata');
    this.props.metastore.removeMetadataUpdateListener(id, this._onUnplacedEntityMetadataUpdate);
    var metadata = this.props.metastore.getMetadataAbout(id);
    var content = this.state.content;
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
    window.setTimeout(function() {
      ViewActions.changeLoaderState("Placement en cours.")}, 10);

    var x = this.props.viewstore.getView().left;
    var y = this.props.viewstore.getView().top;
    var viewId = this.state.viewId;
    for(var i = 0; i < this.state.content.length; ++i) {
      ServiceMethods.place(viewId, this.state.content[i].uid, x, y, Inbox.imagePlaced.bind(null, viewId));

      x = x + this.state.content[i].width + 100;
    }


  }

  placeAllImagesInColumn() {
    window.setTimeout(function() {
      ViewActions.changeLoaderState("Placement en cours.")}, 10);

    var data = [];
    var x = this.props.viewstore.getView().left;
    var y = this.props.viewstore.getView().top;
    var viewId = this.state.viewId;
    for(var i = 0; i < this.state.content.length; ++i) {
      ServiceMethods.place(viewId, this.state.content[i].uid, x, y, Inbox.imagePlaced.bind(null, viewId));
      y = y + this.state.content[i].height + 200;
    }
  }

  placeAllImagesInGrid() {
    window.setTimeout(
      ViewActions.changeLoaderState.bind(null, "Placement en cours."), 10);

    var x = this.props.viewstore.getView().left;
    var y = this.props.viewstore.getView().top;
    var maxHeight = Math.max(
      this.state.content[0]? this.state.content[0].height : 0,
      this.state.content[1]? this.state.content[1].height : 0,
      this.state.content[2]? this.state.content[2].height : 0,
      this.state.content[3]? this.state.content[3].height : 0,
      this.state.content[4]? this.state.content[4].height : 0
    );
    var maxWidth = Math.max(
      this.state.content[0]? this.state.content[0].width : 0,
      this.state.content[1]? this.state.content[1].width : 0,
      this.state.content[2]? this.state.content[2].width : 0,
      this.state.content[3]? this.state.content[3].width : 0,
      this.state.content[4]? this.state.content[4].width : 0
    );
    var viewId = this.state.viewId;
    for(var i = 0; i < this.state.content.length; ++i) {
      ServiceMethods.place(viewId, this.state.content[i].uid, x, y, Inbox.imagePlaced.bind(null, viewId));

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

  static imagePlaced() {
    //window.setTimeout(MetadataActions.updateLabBenchFrom.bind(null, viewId), 10);
    window.setTimeout(ViewActions.fitView, 750);
  }

  componentDidMount() {
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
    this.props.benchstore.removeLabBenchLoadListener(this._onLabBenchLoaded);
    if(this.state.viewId) {
      this.props.metastore.removeMetadataUpdateListener(this.state.viewId, this._onViewMetadataReceived);
    }
  }

  render() {
    if(!this.state.active) {
      return null;
    }
    if(!this.state.open) {
      return <div ref='component' style={this.componentStyle}>
        <div className='ui teal button'
        onClick={this.open.bind(this)}>Il y a  {this.state.content.length} images dans ce set qui ne sont pas placées dans la vue actuelle. Cliquez ici si vous souhaitez les placer.</div>
      </div>
    }
    return <div className='ui segment' style={this.componentStyle} ref='tabs'>
      <div className="ui top attached fitted tabular menu">
        <div
          className="active item"
          data-tab="automatic">
          Auto
        </div>
        <div className="item" data-tab="manual">
          Manuel
        </div>
      </div>
      <div className="ui bottom attached active tab segment" data-tab="automatic">
        <div className='ui button disabled'>{this.state.content.length} images</div>
        <div className='ui tiny two buttons'
             ref='buttons'
        >
          <div className='ui button'
               onClick={this.placeAllImagesInLine.bind(this)}
               data-content='Placer toutes les images non-affichées en ligne. Le placement commence dans le coin supérieur gauche de la vue actuelle.'>
            <i className='ui ellipsis horizontal icon' />
          </div>
          <div className='ui button'
               onClick={this.placeAllImagesInColumn.bind(this)}
               data-content='Placer toutes les images non-affichées en colonne. Le placement commence dans le coin supérieur gauche de la vue actuelle.'>
            <i className='ui ellipsis vertical icon' />
          </div>
        </div>
        <div className='ui tiny two buttons'
             ref='buttons'>
          <div className='ui button'
               onClick={this.placeAllImagesInGrid.bind(this)}
               data-content='Placer toutes les images non-affichées en tableau de 5 colonnes. Le placement commence dans le coin supérieur gauche de la vue actuelle.'>
            <i className='ui grid layout icon' />
          </div>
        </div>
      </div>
      <div className="ui bottom attached tab segment" data-tab="manual">
        <img className='ui image'
             ref='image'
             data-content="Faites glisser l'image vers le bureau pour la placer"
             src={this.state.content[this.state.selected].thumbnail}
             alt='Chargement en cours'
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
