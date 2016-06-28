/**
 * Created by dmitri on 30/03/15.
 */
'use strict';

import React from "react";

import GraphNavigator from './../../tools/palettes/GraphNavigator';
import Minimap from '../../tools/palettes/Minimap';
import CollectionNavigator from '../../tools/palettes/CollectionNavigator';
import Toolbox from '../../tools/palettes/Toolbox';
import ViewController from '../../tools/palettes/ViewController';
import Organisation from '../../tools/palettes/Organisation';
import ModeSwitcher from '../../tools/palettes/ModeSwitcher';
import GroupSelector from '../../tools/palettes/GroupSelector';
import SetSelectorDisplay from '../../tools/palettes/SetSelectorDisplay';
import SetManagerMainButtons from '../../tools/palettes/SetManagerMainButtons';

import ModeConstants from '../../constants/ModeConstants'

import toolboxIcon from '../../images/tools.svg';

class LeftPane extends React.Component {

  constructor(params) {
    super(params);
    this.containerStyle = {
      border: 'none',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 0 0 0',
      overflow: 'none'
    };
  }

  render() {
    return(
      <div ref='self'
           style={this.containerStyle}
           className='ui container'>
        <div className='ui divider'></div>
        <ModeSwitcher modestore={this.props.modestore} />
        <SetManagerMainButtons
        managerstore={this.props.managerstore}
        modestore={this.props.modestore} />
        <SetSelectorDisplay modestore={this.props.modestore}
                      managerstore={this.props.managerstore} />
        <GroupSelector
                        modestore={this.props.modestore}
                        toolstore={this.props.toolstore}
                        benchstore={this.props.benchstore} />
        <Minimap ministore={this.props.ministore}
                 viewstore={this.props.viewstore}
                 modestore={this.props.modestore}
                 toolstore={this.props.toolstore}
                 benchstore={this.props.benchstore}/>
        <ViewController
          ministore={this.props.ministore}
          modestore={this.props.modestore}
          toolstore={this.props.toolstore}
          viewstore={this.props.viewstore} />
        <Toolbox ministore={this.props.ministore}
                 modestore={this.props.modestore}
                 viewstore={this.props.viewstore}
                 toolstore={this.props.toolstore}
                 benchstore={this.props.benchstore}/>
      </div>
    );
  }
}



export default LeftPane;
