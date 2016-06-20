/**
 * Created by hector on 31/07/15.
 */
"use strict";

import React from "react";
import d3 from "d3";

import Color from "./../libs/Color";
import Shape from "./../libs/Shape";

import ShapesConf from "../../conf/shapes";
import ColorsConf from "../../conf/colors";

import EditorActions from "../../actions/ManagerActions";
import ToolActions from "../../actions/ToolActions";

class CreatePoIPopup extends React.Component {
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

    this.tagInputStyle = {
      width: '130px'
    };

    this.state = {
      name: ''
    };

    this.textStyle = {
      fontFamily: 'Roboto Condensed',
      fontWeight: '300'
    };
  }

  cancel() {
    window.setTimeout(ToolActions.reset, 100);
    this.setState({name: ''});
  }

  save() {
    ToolActions.save();
  }

  onNameChange(event) {
    d3.select('.' + this.props.vertexClass).select('title').text(event.target.value);
    this.setState({name: event.target.value});
  }

  update(name) {
    this.setState({name: name});
  }

  componentWillUpdate(nextProps, nextState) {
    //console.log(JSON.stringify(nextProps));
  }

  componentDidUpdate(prevProps, prevState) {
    //console.log("save " + this.state.text+ " " + this.state.letters);
    this.props.setNameCallback(this.state.name);
  }

  render() {
    var self = this;
    return (
      <div style={this.componentStyle} className='ui segment'>
        <div style={this.barContainerStyle}>
          <div style={this.horizontalContainerStyle} className='ui inverted field'>
            <textarea placeholder="Intitulé"
                      onChange={this.onNameChange.bind(this)}
                      value={this.state.name} autofocus="true" wrap="hard"/>
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

export default CreatePoIPopup;