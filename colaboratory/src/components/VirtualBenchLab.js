/**
 * Created by dmitri on 30/03/15.
 */
'use strict';

import React from 'react';

import BenchLabFreeSpace from './FreeSpace';

import ContextMenu from './context-menu/ContextMenu';
import OrbalContextMenu from './context-menu/OrbalContextMenu';
import Inbox from './Inbox';
import BenchLabBorders from './BenchLabBorders';
import ActiveSetNameDisplay from './ActiveSetNameDisplay';
import ImagesLoadingStatus from './ImagesLoadingStatus';

import DragNDropStore from '../stores/DragNDropStore';

import ViewActions from "../actions/ViewActions";
import ToolActions from '../actions/ToolActions';
import MetadataActions from '../actions/MetadataActions';
import ModalActions from '../actions/ModalActions';

import ViewConstants from '../constants/ViewConstants';
import ModeConstants from '../constants/ModeConstants';
import ModalConstants from '../constants/ModalConstants';

const drag = new DragNDropStore();

class VirtualBenchLab extends React.Component {

  constructor(props) {
    super(props);

    this.componentContainerStyle = {
      display: 'block',
      height: '100%',
      width: '100%'
    };

    this.dimmerStyle = {
      display: 'none',
      opacity: '0.5 !important'
    };

    this.importSheetButtonStyle = {
      position: 'absolute',
      right: '100px',
      bottom: '5px',
      width: '15px'
    };

    this.state = {
      isVisibleInCurrentMode: false,
      loader: null,
      loading: ''
    };

    this._onModeChange = () => {
      const setModeVisibility = () => this.setState({
        isVisibleInCurrentMode: this.props.modestore.isInOrganisationMode() || this.props.modestore.isInObservationMode()
      });
      return setModeVisibility.apply(this);
    };
  }

  componentDidMount() {
    this.props.modestore.addModeChangeListener(this._onModeChange);
  }

  componentWillUpdate(nextProps, nextState) {
    if(nextState.isVisibleInCurrentMode) {
      this.componentContainerStyle.display = 'block';
    }
    else {
      this.componentContainerStyle.display = 'none';
    }
    if(nextState.loader) {
      nextState.loading = 'active'
    }
    else {
      nextState.loading = '';
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if(this.state.isVisibleInCurrentMode && !prevState.isVisibleInCurrentMode) {
      $(this.refs.import.getDOMNode).popup({
        position: 'top center'
      });
    }
  }

  componentWillUnmount() {
    this.props.modestore.removeModeChangeListener(this._onModeChange);
  }

  render() {
    return(
      <div style={this.componentContainerStyle}>
        <ActiveSetNameDisplay managerstore={this.props.managerstore}/>
        <Inbox
          benchstore={this.props.benchstore}
          metastore={this.props.metastore}
          viewstore={this.props.viewstore}
          drag={drag}
        />
        <ImagesLoadingStatus imagestore={this.props.imagestore}/>
        <div style={this.importSheetButtonStyle} className='ui container'>
          <a onClick={ModalActions.showModal.bind(null, ModalConstants.Modals.addEntitiesToSet, {parent: this.props.benchstore.getActiveSetId()})}
          className='ui small green button' data-content='Importer des images' ref='import'>+</a>
        </div>
        <OrbalContextMenu
          menustore={this.props.menustore}
          ministore={this.props.ministore}
          metastore={this.props.metastore}
          benchstore={this.props.benchstore}
          viewstore={this.props.viewstore}
          toolstore={this.props.toolstore}
        />
        <BenchLabBorders
          viewstore={this.props.viewstore}
        />
        <BenchLabFreeSpace
          width='100%'
          height='100%'
          viewstore={this.props.viewstore}
          metastore={this.props.metastore}
          benchstore={this.props.benchstore}
          managerstore={this.props.managerstore}
          drag={drag}
        />
      </div>
    );
  }
}



export default VirtualBenchLab;
