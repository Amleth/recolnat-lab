/**
 * Created by dmitri on 30/03/15.
 */
'use strict';

import React from 'react';

import BenchLabFreeSpace from './FreeSpace';

import ContextMenu from './context-menu/ContextMenu';
import OrbalContextMenu from './context-menu/OrbalContextMenu';
import Tooltip from "./ActiveToolTooltip";
import Inbox from './Inbox';
import BenchLabBorders from './BenchLabBorders';

import DragNDropStore from '../stores/DragNDropStore';

import ViewActions from "../actions/ViewActions";
import ToolActions from '../actions/ToolActions';
import MetadataActions from '../actions/MetadataActions';

import ViewConstants from '../constants/ViewConstants';

const drag = new DragNDropStore();

class VirtualBenchLab extends React.Component {

  constructor(props) {
    super(props);

    this.componentContainerStyle = {
      display: 'block',
      height: '100%',
      width: '100%'
    };

    this.state = {
      loader: null,
      loading: ''
    };

    this._onLoaderUpdate = () => {
      const updateLoader = () => this.setState({loader: this.props.viewstore.getLoader().text});
      return updateLoader.apply(this);
    };
  }

  componentDidMount() {
    this.props.viewstore.addLoaderListener(this._onLoaderUpdate);
  }

  componentWillUpdate(nextProps, nextState) {
    if(nextState.loader) {
      nextState.loading = 'active'
    }
    else {
      nextState.loading = '';
    }
  }

  componentWillUnmount() {
    this.props.viewstore.removeLoaderListener(this._onLoaderUpdate);
  }

  render() {
    return(
      <div style={this.componentContainerStyle}>
        <div className={"ui " + this.state.loading + " dimmer"}>
          <div className='ui large header'>Chargement en cours</div>
          <div className="ui large text loader">{this.state.loader}</div>
        </div>
        <Tooltip />
        <Inbox
          benchstore={this.props.benchstore}
          metastore={this.props.metastore}
          drag={drag}/>
        <OrbalContextMenu
          menustore={this.props.menustore}
          ministore={this.props.ministore}
          metastore={this.props.metastore}
          benchstore={this.props.benchstore}
          viewstore={this.props.viewstore}
          toolstore={this.props.toolstore}
        />
        <BenchLabBorders viewstore={this.props.viewstore} />
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