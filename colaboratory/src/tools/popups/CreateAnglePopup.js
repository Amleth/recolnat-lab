/**
 * Created by dmitri on 13/07/16.
 */
"use strict";

import React from "react";
import d3 from "d3";

import EditorActions from "../../actions/ManagerActions";
import ToolActions from "../../actions/ToolActions";
import Tooltip from '../../components/ActiveToolTooltip';

import Globals from '../../utils/Globals';

class CreateAnglePopup extends React.Component {
  constructor(props) {
    super(props);

    this.componentStyle = {
      width: '200px',
      display: "flex",
      flexDirection: "column",
      borderStyle: "solid",
      borderWidth: "1px",
      borderColor: "black",
      padding: "5px",
      color: 'black',
      marginTop: '5px'
    };

    this.titleBarStyle = {
      display: 'flex',
      width: '198px',
      flexDirection: 'row',
      backgroundColor: 'whitesmoke',
      borderStyle: "solid",
      borderWidth: "0 0 1px 0",
      borderColor: "black",
      padding: 0,
      margin: 0,
      position: 'relative',
      top: '-5px',
      left: '-5px'
    };

    this.titleStyle = {
      marginLeft: '5px',
      WebkitUserSelect: 'none',
      MozUserSelect: 'none',
      MsUserSelect: 'none',
      userSelect: 'none',
      cursor: 'default'
    };

    this.closeIconStyle = {
      position: 'absolute',
      right: 0,
      top: 0,
      cursor: 'pointer'
    };

    this.textAreaStyle = {
      width: '100%'
    };

    this.buttonContainerStyle = {
      display: "flex",
      flexDirection: "row"
    };

    this.barContainerStyle = {
      display: "flex",
      flexDirection: "column"
    };

    this.horizontalContainerStyle = {
      display: "flex",
      flexDirection: "row",
      maxWidth: '100%',
      paddingBottom: '3px'
    };

    this.state = CreateAnglePopup.initialState();

    this.textStyle = {
      fontFamily: 'Roboto Condensed',
      fontWeight: '300'
    };
  }

  static initialState() {
    return {
      name: '',
      saveButtonActive: ''
    };
  }

  clear() {
    window.setTimeout(ToolActions.reset, 10);
    this.setState({name: ''});
  }

  save() {
    ToolActions.save();
  }

  onNameChange(event) {
    this.setState({name: event.target.value});
  }

  enableSave() {
    this.setState({saveButtonActive: ''});
  }

  disableSave() {
    this.setState({saveButtonActive: 'disabled'});
  }

  componentWillUpdate(nextProps, nextState) {
    //if(nextProps.enableSave) {
    //  nextState.saveButtonActive = '';
    //}
    //else {
    //  nextState.saveButtonActive = 'disabled';
    //}
  }

  componentDidUpdate(prevProps, prevState) {
    this.props.setDataCallback(this.state.name);
  }

  render() {
    return (
      <div style={this.componentStyle} className='ui segment'>
        <div className='ui segment' style={this.titleBarStyle} >
          <div style={this.titleStyle}>Nouvel angle</div>
          <i className='ui remove icon' style={this.closeIconStyle} onClick={Globals.noActiveTool} />
        </div>
        <div style={this.barContainerStyle}>
          <Tooltip toolstore={this.props.toolstore} />
          <div style={this.horizontalContainerStyle} className='ui inverted field'>
            <textarea placeholder="Intitulé"
                      style={this.textAreaStyle}
                      onChange={this.onNameChange.bind(this)}
                      value={this.state.name} autofocus="true" wrap="hard"/>
          </div>
        </div>
        <div style={this.buttonContainerStyle} className='ui buttons'>
          <button className={'ui green button ' + this.state.saveButtonActive} style={this.textStyle} onClick={this.save.bind(this)}>Valider</button>
        </div>
      </div>
    );
  }
}

export default CreateAnglePopup;