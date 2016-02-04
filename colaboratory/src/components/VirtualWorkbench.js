/**
 * Created by dmitri on 30/03/15.
 */
'use strict';

import React from 'react';

import WorkbenchFreeSpace from './FreeSpace';

import ContextMenu from './context-menu/ContextMenu';
import Tooltip from "./ActiveToolTooltip";
import Inbox from './Inbox';

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

    this.state = {workbenchEntities : [], workbench: "", selection : null, metadata: null};

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
  }



  componentDidMount() {
    this.props.entitystore.addChangeEntitiesListener(this._onChangeEntities);
    this.props.entitystore.addChangeWorkbenchListener(this._onChangeWorkbench);
    this.props.entitystore.addChangeSelectionListener(this._onChangeSelection);
    this.props.wsconnector.fetchData(this.props.entitystore.getWorkbenchId());
    this.setState({workbench: this.props.entitystore.getWorkbenchId()});
  }

  componentWillUnmount() {
    this.props.entitystore.removeChangeEntitiesListener(this._onChangeEntities);
    this.props.entitystore.removeChangeWorkbenchListener(this._onChangeWorkbench);
    this.props.entitystore.removeChangeSelectionListener(this._onChangeSelection);
  }

  componentWillUpdate(nextProps, nextState) {
    if(nextState.workbench !== this.state.workbench) {
      console.log("VirtualWorkbench: Loading workbench " + nextState.workbench);
    }
  }

  render() {
    var metadata = {selected : this.state.selection};
    return(
      <div style={this.componentContainerStyle}>
        <Tooltip />
        <Inbox entitystore={this.props.entitystore}
               content={this.state.workbenchEntities}
               drag={drag}/>
        <ContextMenu
          menustore={this.props.menustore}
          ministore={this.props.ministore}
          viewstore={this.props.viewstore}
          toolstore={this.props.toolstore}
          entitystore={this.props.entitystore}
        />
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