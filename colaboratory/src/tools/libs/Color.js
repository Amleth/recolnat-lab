/**
 * Created by hector on 03/08/15.
 */
'use strict';

import React from 'react';
import d3 from 'd3';

class Color extends React.Component {
  constructor(props) {
    super(props);

    this.componentStyle = {
      width: "25px",
      //minWidth: '25px',
      //maxWidth: '25px',
      height: "25px",
      //minHeight: '25px',
      //maxHeight: '25px',
      backgroundColor: "rgb(" + this.props.color.red + "," + this.props.color.green + "," + this.props.color.blue + ")",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      backgroundSize: "20px 20px"
    };
  }

  changeColor() {
    this.props.callback({key: this.props.key, color: this.props.color});
  }

  render() {
    return(
      <button onClick={this.changeColor.bind(this)} style={this.componentStyle}></button>
    );
  }
}

export default Color;