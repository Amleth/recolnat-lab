/**
 * Created by dmitri on 17/05/16.
 */
'use strict';

import React from 'react';

import StudyManager from '../SetManager';
import VirtualBenchLab from '../VirtualBenchLab';



import Tooltip from '../bench/ActiveToolTooltip';

import ModeConstants from '../../constants/ModeConstants';

class CenterPane extends React.Component {

  constructor(props) {
    super(props);

    this.componentContainerStyle = {
      display: 'block',
      height: '100%',
      width: '100%'
    };

    this.dimmerStyle = {
      opacity: '0.5 !important'
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
    this.props.modestore.addModeChangeListener(this.setState.bind(this, {}));
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
    this.props.modestore.removeModeChangeListener(this.setState.bind(this, {}));
  }

  render() {
    if(this.props.modestore.isInSetMode()) {
      return (
        <div style={this.componentContainerStyle}>
          <div className={"ui " + this.state.loading + " dimmer"} style={this.dimmerStyle}>
            <div className="ui large text loader">{this.state.loader}</div>
          </div>
          <StudyManager
            key='StudyManager'
            userstore={this.props.userstore}
            toolstore={this.props.toolstore}
            modestore={this.props.modestore}
            metastore={this.props.metastore}
            dragstore={this.props.dragstore}
            managerstore={this.props.managerstore} />
        </div>
      );
    } else if(this.props.modestore.isInObservationMode() || this.props.modestore.isInOrganisationMode()) {
      return (
        <div style={this.componentContainerStyle}>
          <div className={"ui " + this.state.loading + " dimmer"} style={this.dimmerStyle}>
            <div className="ui large text loader">{this.state.loader}</div>
          </div>
          <VirtualBenchLab
            key='VirtualBenchLab'
            imagestore={this.props.imagestore}
            userstore={this.props.userstore}
            viewstore={this.props.viewstore}
            toolstore={this.props.toolstore}
            menustore={this.props.menustore}
            metastore={this.props.metastore}
            modalstore={this.props.modalstore}
            modestore={this.props.modestore}
            ministore={this.props.ministore}
            benchstore={this.props.benchstore}
            managerstore={this.props.managerstore}
            dragstore={this.props.dragstore}
          />
        </div>
      );
    } else {
      console.error('No rendering handler for center pane in mode ' + this.props.modestore.getMode());
      return null;
    }

  }
}



export default CenterPane;
