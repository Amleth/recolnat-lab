/**
 * Created by dmitri on 30/03/15.
 */
'use strict';

import React from 'react';

import WorkbenchFreeSpace from './FreeSpace';

import ContextMenu from './context-menu/ContextMenu';
import OrbalContextMenu from './context-menu/OrbalContextMenu';
import Tooltip from "./ActiveToolTooltip";
import Inbox from './Inbox';
import WorkbenchBorders from './WorkbenchBorders';

import DragNDropStore from '../stores/DragNDropStore';

import ViewActions from "../actions/ViewActions";
import ToolActions from '../actions/ToolActions';

const drag = new DragNDropStore();

class VirtualWorkbench extends React.Component {

  constructor(props) {
    super(props);

    this.componentContainerStyle = {
      display: 'block',
      height: '100%',
      width: '100%'
    };

    this.loadingModalStyle = {
      zIndex: 99999
    };

    this.state = {
      workbenchEntities : [],
      workbench: "",
      selection : null,
      metadata: null,
      loader: null,
      loading: ''
    };

    this._onChangeWorkbench = () => {
      const fetchWorkbench = () =>
        this.props.wsconnector.fetchData(this.props.entitystore.getWorkbenchId());
      return fetchWorkbench.apply(this);
    };
    this._onChangeEntities = () => {
      const fetchContent = () => this.setState({workbenchEntities: this.props.entitystore.getItems(), workbench: this.props.entitystore.getWorkbenchId()});
      return fetchContent.apply(this);
    };
    this._onChangeSelection = () => {
      const toggleButtons = () => this.setState({selection:  this.props.entitystore.getSelectedEntity()});
      return toggleButtons.apply(this);
    };
    this._onLoaderUpdate = () => {
      const updateLoader = () => this.setState({loader: this.props.viewstore.getLoader().text});
      return updateLoader.apply(this);
    }
  }



  componentDidMount() {
    this.props.entitystore.addChangeEntitiesListener(this._onChangeEntities);
    this.props.entitystore.addChangeWorkbenchListener(this._onChangeWorkbench);
    this.props.entitystore.addChangeSelectionListener(this._onChangeSelection);
    this.props.viewstore.addLoaderListener(this._onLoaderUpdate);
    this.props.wsconnector.fetchData(this.props.entitystore.getWorkbenchId());
    this.setState({workbench: this.props.entitystore.getWorkbenchId()});
  }

  componentWillUpdate(nextProps, nextState) {
    if(nextState.workbench !== this.state.workbench) {
      console.log("VirtualWorkbench: Loading workbench " + nextState.workbench);
    }
    if(nextState.loader) {
      nextState.loading = 'active'
    }
    else {
      nextState.loading = '';
    }
  }

  componentWillUnmount() {
    this.props.entitystore.removeChangeEntitiesListener(this._onChangeEntities);
    this.props.entitystore.removeChangeWorkbenchListener(this._onChangeWorkbench);
    this.props.entitystore.removeChangeSelectionListener(this._onChangeSelection);
    this.props.viewstore.removeLoaderListener(this._onLoaderUpdate);
  }

  render() {
    var metadata = {selected : this.state.selection};
    return(
      <div style={this.componentContainerStyle}>
            <div className={"ui " + this.state.loading + " dimmer"}>
              <div className='ui large header'>Chargement en cours</div>
              <div className="ui large text loader">{this.state.loader}</div>
            </div>
        <Tooltip />
        <Inbox entitystore={this.props.entitystore}
               content={this.state.workbenchEntities}
               drag={drag}/>
        <OrbalContextMenu
          menustore={this.props.menustore}
          ministore={this.props.ministore}
          viewstore={this.props.viewstore}
          toolstore={this.props.toolstore}
          entitystore={this.props.entitystore}
        />
        <WorkbenchBorders viewstore={this.props.viewstore} />
        <WorkbenchFreeSpace width="100%" height="100%"
                            childEntities={this.state.workbenchEntities}
                            workbench={this.state.workbench}
                            metadata={metadata}
                            entitystore={this.props.entitystore}
                            viewstore={this.props.viewstore}
                            drag={drag}
        />
      </div>
    );
  }
}



export default VirtualWorkbench;