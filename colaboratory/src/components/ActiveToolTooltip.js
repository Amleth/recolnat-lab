'use strict';

import React from 'react';
import AppDispatcher from '../dispatcher/AppDispatcher';
import ToolConstants from '../constants/ToolConstants';

class ActiveToolTooltip extends React.Component {
  constructor(props) {
    super(props);
    this.state = {text: ""};
    this.componentStyle = {
      position: "absolute",
      backgroundColor: "rgba(0,0,0,0.5)",
      borderStyle: "solid",
      borderWidth: "1px",
      borderColor: "green",
      padding: "5px",
      left: "17vw",
      bottom: "5",
      display: "none",
      maxWidth: "200px"
    };

    this.textStyle = {
      color: "white",
      cursor: "default",
      fontSize: "14px",
      charSet: "utf8"
    };
  }

  componentDidMount() {
    AppDispatcher.register((action) => {
      switch (action.actionType) {
        case ToolConstants.ActionTypes.TOOL_UPDATE_DATA_DISPLAY:
          this.setState({text: action.content});
          break;
      }
    });
  }

  componentWillUpdate(nextProps, nextState) {
      if (nextState.text.length > 0) {
        this.componentStyle.display = "block";
      }
      else {
        this.componentStyle.display = "none";
      }

  }

  render() {
    return (<div style={this.componentStyle}>
      <span style={this.textStyle}>{this.state.text}</span></div>);
  }
}

export default ActiveToolTooltip;