/**
 * Created by hector on 03/08/15.
 */
"use strict";

import React from "react";
import d3 from "d3";

class Shape extends React.Component {
  constructor(props) {
    super(props);

    this.componentStyle = {
      width: "25px",
      height: "25px",
      padding: "0",
      margin: "0",
      backgroundColor: "black"
    };
  }

  changeImage() {
    this.props.callback(this.props.shape);
  }

  render() {
    return(
      <button onClick={this.changeImage.bind(this)} style={this.componentStyle}>
      <img src={this.props.shape.img} width="20px" height="20px"/>
      </button>
    );
  }
}

export default Shape;