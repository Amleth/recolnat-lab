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

import EditorActions from "../../actions/EditorActions";
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

    this.letterInputStyle = {
      width: '30px'
    };
    
    this.tagInputStyle = {
      width: '130px'
    };

    this.state = {
      text: '',
      letters: ''
    };
    
    this.textStyle = {
      fontFamily: 'Roboto Condensed',
      fontWeight: '300'
    };
  }

  cancel() {
    window.setTimeout(ToolActions.reset, 100);
    this.setState({text: '', letters: ''});
  }

  save() {
    ToolActions.save();
  }

  onTextChange(event) {
    d3.select('.' + this.props.vertexClass).select('title').text(event.target.value);
    this.setState({text: event.target.value});
  }

  onLettersChange(event) {
    if(event.target.value.length < 3) {
      d3.select('.' + this.props.vertexClass).select('text').text(event.target.value);
      this.setState({letters: event.target.value});
    }
  }

  setColor(color) {
      this.props.setColorCallback(color);
  }

  update(text, letters) {
    this.setState({text: text, letters: letters});
  }

  componentWillUpdate(nextProps, nextState) {
    console.log(JSON.stringify(nextProps));
  }

  componentDidUpdate(prevProps, prevState) {
    console.log("save " + this.state.text+ " " + this.state.letters);
    this.props.setDataCallback(this.state.text, this.state.letters);
  }

  render() {
    var self = this;
    return (
      <div style={this.componentStyle}>
        <div style={this.barContainerStyle}>
          <div style={this.horizontalContainerStyle}>
            {
            ColorsConf.colors.map(
              function(color) {
                return(<Color color={color.color} key={color.key} callback={self.setColor.bind(self)} vertexClass={self.props.vertexClass} />);
              }
            )
          }
          </div>
          <div style={this.horizontalContainerStyle} className='ui left corner labeled input'>
          <div className='ui left corner label'>
	    <i className='ui tags icon' />
	    </div>
            <input placeholder="Tags (facultatif)" autofocus="true" wrap="hard"/>
          </div>
          <div style={this.horizontalContainerStyle} className='ui labeled input'>
          <div className='ui label' style={this.textStyle}>
            Code 2 lettres
            </div>
            <input type='text'
                   style={this.letterInputStyle}
                   maxLength='2'
                      onChange={this.onLettersChange.bind(this)}
                      value={this.state.letters} autofocus="true"/>
          </div>
          <div style={this.horizontalContainerStyle} className='ui inverted field'>
            <textarea placeholder="Description (facultatif)"
                      onChange={this.onTextChange.bind(this)}
                      value={this.state.text} autofocus="true" wrap="hard"/>
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