/**
 * Created by dmitri on 13/01/16.
 */
'use strict';

import React from 'react';
import _ from 'lodash';

import ViewActions from '../../actions/ViewActions';
import ManagerActions from '../../actions/ManagerActions';
import ModalActions from '../../actions/ModalActions';
import ModeActions from '../../actions/ModeActions';

import ModalConstants from '../../constants/ModalConstants';
import ModeConstants from '../../constants/ModeConstants';

import Globals from '../../utils/Globals';

class StudyDisplay extends React.Component {
  constructor(props) {
    super(props);

    this.containerStyle = {
      padding: '5px 5px 5px 5px',
      //margin: 0,
      //padding: 0,
      height: '100%',
      width: '100%'
      //maxWidth: '150px',
      //minWidth: '150px'
    };

    this.labelStyle = {
      position: 'relative',
      top: '-15px',
      left: '10px'
    };

    this.titleStyle = {
      height: '25px',
      padding: '4px 0px'
    };

    this.listContainerStyle = {
      height: '250px',
      overflowY: 'auto',
      overflowX: 'hidden',
      margin: 0,
      padding: 0
    };

    this.noMarginPaddingStyle = {
      margin: 0,
      padding: 0
    };

    this.textStyle = {
      WebkitUserSelect: 'none',
      MozUserSelect: 'none',
      MsUserSelect: 'none',
      userSelect: 'none'
    };

    this._onModeChange = () => {
      const setModeVisibility = () => this.setState({
        isVisibleInCurrentMode: this.props.modestore.isInSetMode()
      });
      return setModeVisibility.apply(this);
    };

    this._onUpdate = () => {
      const updateDisplay = () => this.setStudies(this.props.managerstore.getStudies());
      return updateDisplay.apply(this);
    };

    this._onSelectionChange = () => {
      const changeSelected = () => this.setState({});
      return changeSelected.apply(this);
    };

    this.state = {
      isVisibleInCurrentMode: true,
      selectedId: null,
      studiesContainer: null
    };
  }

  setStudies(studyContainer) {
    var container = JSON.parse(JSON.stringify(studyContainer));
    if(container) {

      var studies = JSON.parse(JSON.stringify(container.studies));
      //console.log(JSON.stringify(studies));
      var sortedStudies = _.sortBy(studies, Globals.getName);
      //console.log(JSON.stringify(sortedStudies));
      container.studies = sortedStudies;
    }

    //console.log('setting state with container');
    this.setState({studiesContainer: container});
  }

  selectAndLoadSet(setId) {
    window.setTimeout(ViewActions.setActiveSet.bind(null, setId), 10);
    window.setTimeout(ModeActions.changeMode.bind(null,ModeConstants.Modes.ORGANISATION),20);
    window.setTimeout(ManagerActions.toggleSetManagerVisibility.bind(null,false),30);
  }

  setActive(study) {
    window.setTimeout(ManagerActions.select.bind(null,study.core.uid, study.core.type, study.name, null, null),10);

    //window.setTimeout(this.props.managerstore.requestGraphAround.bind(this.props.managerstore, study.core.uid, 'bag', 0, undefined, undefined, true)
    //  , 10);

    this.setState({selectedId: study.uid});
  }

  componentDidMount() {
    this.props.managerstore.addManagerUpdateListener(this._onUpdate);
    this.props.managerstore.addSelectionChangeListener(this._onSelectionChange);
    this.props.modestore.addModeChangeListener(this._onModeChange);
  }

  componentWillUpdate(nextProps, nextState) {
    if(nextState.isVisibleInCurrentMode) {
      this.containerStyle.display = '';
    }
    else {
      this.containerStyle.display = 'none';
    }
  }

  componentWillUnmount() {
    this.props.managerstore.removeManagerUpdateListener(this._onUpdate);
    this.props.managerstore.removeSelectionChangeListener(this._onSelectionChange);
    this.props.modestore.removeModeChangeListener(this._onModeChange);
  }

  render() {
    var self = this;
    // No content yet, show a loader
    if(!this.state.studiesContainer) {
      return <div className='ui container segment' style={this.containerStyle}>
        <div className='ui blue tiny basic label'
             style={this.labelStyle}>
          Mes études
        </div>
        <div className='ui active inverted dimmer'>
          <div className='ui text loader'></div>
        </div>
      </div>
    }

    if(this.state.studiesContainer.error) {
      return <div className='ui container segments' style={this.containerStyle}>
        <div className='ui blue tiny basic label'
             style={this.labelStyle}>
          Mes études
        </div>

        <div className='ui compact error message segment'>
          <div className='ui center aligned justified header'>
            <i className='large warning sign icon' />
          </div>
          <div className='content'>
            <p>Problème de chargement de vos études. Vérifiez votre connection et rechargez la page.</p>
          </div>
        </div>
      </div>;
    }

    // Content received but set is empty at the moment.
    if(this.state.studiesContainer.studies.length == 0) {
      return <div className='ui container segments' style={this.containerStyle}>
        <div className='ui blue tiny basic label'
             style={this.labelStyle}>
          Mes études
        </div>

        <div className='ui compact info message segment'>
          <div className='ui center aligned justified header'>
            <i className='large inbox icon' />
          </div>
          <div className='content'>
            <p>Vous n'avez aucune étude. Vous pouvez créer une nouvelle étude en cliquant sur le + ci-dessous.</p>
          </div>
        </div>
        <div style={this.noMarginPaddingStyle} className='ui center aligned basic segment'>
          <i className='large add circle green icon' />
        </div>
      </div>;
    }

    // Display children. List has attached style to prevent that stupid label from padding
    return <div style={this.containerStyle} className='ui container segments'>
      <div className='ui blue tiny basic label'
           style={this.labelStyle}>
        Mes études
      </div>

      <div className='ui segment'
           style={this.listContainerStyle}>
        <div className='ui selection list'
             style={this.noMarginPaddingStyle}>
          {this.state.studiesContainer.studies.map(function(study, idx) {
            //console.log(JSON.stringify(study));
            var linkStyle = {
              margin: 0
            };

            if(study.uid == self.state.selectedId) {
              linkStyle.backgroundColor = 'rgba(0,0,0,0.1)';
            }
            if(study.core.uid == self.props.managerstore.getSelected().id) {
              linkStyle.color = 'blue';
            }

            return (
              <a className={'item '}
                 style={linkStyle}
                 key={'STUDY-OPTION-' + study.uid}
                 onClick={self.setActive.bind(self, study)}
                 onDoubleClick={self.selectAndLoadSet.bind(self, study.core.uid)}>
                <div>
                  <i className='ui icon lab' style={self.textStyle} />{study.name}
                </div>
              </a>);
          })
          }
        </div>
        <div style={this.noMarginPaddingStyle}
             onClick={ModalActions.showModal.bind(null, ModalConstants.Modals.createStudy, null)}
             className='ui center aligned basic segment'>
          <i className='large add circle green icon' />
        </div>
      </div>
    </div>
  }
}

//<div className='ui tertiary center aligned segment'
//     style={this.titleStyle}>{this.state.studiesContainer.name}</div>

export default StudyDisplay;