'use strict';

import React from 'react';

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

    this._onTooltipContentUpdate = () => {
      const setTooltipContent = () => this.setState({text: this.props.toolstore.getTooltipContent()});
      return setTooltipContent.apply(this);
    }
  }

  componentDidMount() {
    this.props.toolstore.addTooltipChangeListener(this._onTooltipContentUpdate);
  }

  componentWillUpdate(nextProps, nextState) {
    if(nextState.text) {
      if (nextState.text.length > 0) {
        this.componentStyle.display = "block";
      }
      else {
        this.componentStyle.display = "none";
      }
    }
      else {
        this.componentStyle.display = "none";
      }

  }

  componentWillUnmount() {
    this.props.toolstore.removeTooltipChangeListener(this._onTooltipContentUpdate);
  }

  render() {
    return (<div style={this.componentStyle}>
      <span style={this.textStyle}>{this.state.text}</span></div>);
  }
}

export default ActiveToolTooltip;
