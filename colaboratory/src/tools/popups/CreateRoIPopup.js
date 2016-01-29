/**
 * Created by hector on 31/07/15.
 */
"use strict";

import React from "react";
import d3 from "d3";

import EditorActions from "../../actions/ManagerActions";
import ToolActions from "../../actions/ToolActions";

class CreateRoIPopup extends React.Component {
  constructor(props) {
    super(props);

    this.componentStyle = {
      display: "flex",
      flexDirection: "column",
      borderStyle: "solid",
      borderWidth: "1px",
      borderColor: "black",
      padding: "5px",
      color: 'black',
      marginTop: '5px'
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

    this.letterInputStyle = {
      width: '30px'
    };

    this.tagInputStyle = {
      width: '130px'
    };

    this.state = CreateRoIPopup.initialState();

    this.textStyle = {
      fontFamily: 'Roboto Condensed',
      fontWeight: '300'
    };
  }

  static initialState() {
    return {
      name: ''
    };
  }

  cancel() {
    window.setTimeout(ToolActions.reset, 100);
    this.setState({name: '', letters: ''});
  }

  save() {
    ToolActions.save();
  }

  onNameChange(event) {
    this.setState({name: event.target.value});
  }

  componentDidUpdate(prevProps, prevState) {
    this.props.setDataCallback(this.state.name);
  }

  render() {
    return (
      <div style={this.componentStyle}>
        <div style={this.barContainerStyle}>
          <div style={this.horizontalContainerStyle} className='ui inverted field'>
            <textarea placeholder="Nom"
                      onChange={this.onNameChange.bind(this)}
                      value={this.state.name} autofocus="true" wrap="hard"/>
          </div>
          <div style={this.horizontalContainerStyle} className='ui left corner labeled input'>
            <div className='ui left corner label'>
              <i className='ui tags icon' />
            </div>
            <input placeholder="Tags (facultatif)" autofocus="true" wrap="hard"/>
          </div>
        </div>
        <div style={this.buttonContainerStyle} className='ui buttons'>
          <button className='ui red button' style={this.textStyle} onClick={this.cancel.bind(this)}>Annuler</button>
          <button className='ui green button' style={this.textStyle} onClick={this.save.bind(this)}>Valider</button>
        </div>
      </div>
    );
  }
}

export default CreateRoIPopup;