/**
 * Left pane of the application
 *
 * Created by dmitri on 30/03/15.
 */
'use strict';

import React from "react";

import Minimap from '../../tools/palettes/Minimap';
import Toolbox from '../../tools/palettes/Toolbox';
import ViewController from '../../tools/palettes/ViewController';
import ModeSwitcher from '../../tools/palettes/ModeSwitcher';
import GroupSelector from '../../tools/palettes/GroupSelector';
import SetSelectorDisplay from '../../tools/palettes/SetSelectorDisplay';
import SetManagerMainButtons from '../../tools/palettes/SetManagerMainButtons';

class LeftPane extends React.Component {

  constructor(params) {
    super(params);
    this.containerStyle = {
      backgroundColor: '#F2F2F2',
      height: '100%',
      width: '100%',
      marginTop: '10px'
      //border: 'none',
      //display: 'flex',
      //flexDirection: 'column',
      //boxShadow: '0 0 0 0'
      //overflow: 'none'
    };

    this._onModeChange = () => {
      const update = () => this.setState({});
      return update.apply(this);
    }
  }

  componentDidMount() {
    this.props.modestore.addModeChangeListener(this._onModeChange);
  }

  componentWillUnmount() {
    this.props.modestore.removeModeChangeListener(this._onModeChange);
  }

  render() {
    if(this.props.modestore.isInSetMode()) {
      return(
        <div ref='self'
             style={this.containerStyle}
             className='ui container'>
          <div className='ui divider'></div>
          <ModeSwitcher
            key='ModeSwitcher'
            modestore={this.props.modestore}
            userstore={this.props.userstore}/>
          <SetManagerMainButtons
            key='SetManagerMainButtons'
            userstore={this.props.userstore}
            managerstore={this.props.managerstore}
            modestore={this.props.modestore} />
          <SetSelectorDisplay
            key='SetSelectorDisplay'
            modestore={this.props.modestore}
            userstore={this.props.userstore}
            managerstore={this.props.managerstore} />
        </div>
      );
    }
    else if(this.props.modestore.isInObservationMode()) {
      return(
        <div ref='self'
             style={this.containerStyle}
             className='ui container'>
          <div className='ui divider'></div>
          <ModeSwitcher
            key='ModeSwitcher'
            modestore={this.props.modestore}
            userstore={this.props.userstore}/>
          <GroupSelector
            key='GroupSelector'
            modestore={this.props.modestore}
            userstore={this.props.userstore}
            toolstore={this.props.toolstore}
            benchstore={this.props.benchstore} />
          <Minimap
            key='Minimap'
            ministore={this.props.ministore}
            userstore={this.props.userstore}
            viewstore={this.props.viewstore}
            modestore={this.props.modestore}
            toolstore={this.props.toolstore}
            benchstore={this.props.benchstore}/>
          <ViewController
            key='ViewController'
            ministore={this.props.ministore}
            userstore={this.props.userstore}
            modestore={this.props.modestore}
            toolstore={this.props.toolstore}
            viewstore={this.props.viewstore} />
          <Toolbox
            key='Toolbox'
            ministore={this.props.ministore}
            userstore={this.props.userstore}
            modestore={this.props.modestore}
            viewstore={this.props.viewstore}
            toolstore={this.props.toolstore}
            metastore={this.props.metastore}
            benchstore={this.props.benchstore}/>
        </div>
      );
    }
    else if(this.props.modestore.isInOrganisationMode()) {
      return(
        <div ref='self'
             style={this.containerStyle}
             className='ui container'>
          <div className='ui divider'></div>
          <ModeSwitcher
            key='ModeSwitcher'
            modestore={this.props.modestore}
            userstore={this.props.userstore}/>
          <GroupSelector
            key='GroupSelector'
            modestore={this.props.modestore}
            userstore={this.props.userstore}
            toolstore={this.props.toolstore}
            benchstore={this.props.benchstore} />
          <ViewController
            key='ViewController'
            ministore={this.props.ministore}
            userstore={this.props.userstore}
            modestore={this.props.modestore}
            toolstore={this.props.toolstore}
            viewstore={this.props.viewstore} />
        </div>
      );
    }
    else {
      console.error('No render handler in mode ' + this.props.modestore.getMode());
      return null;
    }
  }
}



export default LeftPane;
