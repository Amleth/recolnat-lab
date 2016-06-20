/**
 * Created by dmitri on 27/08/15.
 */
"use strict";

import React from "react";

class PopupToolComponent extends React.Component {
  constructor(props) {
    super(props);

    this.componentStyle = {
      position: "absolute",
      top: "10%",
      right: "10%",
      display: "none"
    };

    this.state = {
      popup: null
    };

    this._onActiveToolChange = () => {
      const fetchData = () => this.updatePopup(this.props.toolstore.getActiveToolPopup());
      return fetchData.apply(this);
    };
  }

  updatePopup(popup) {
    this.setState({popup: popup});
  }

  componentDidMount() {
    this.props.toolstore.addActiveToolPopupChangeListener(this._onActiveToolChange);
  }

  componentWillUnmount() {
    this.props.toolstore.removeActiveToolPopupChangeListener(this._onActiveToolChange);
  }

  componentWillUpdate(nextProps, nextState) {
    if(nextState.popup == null) {
      this.componentStyle.display = "none";
    }
    else {
      this.componentStyle.display = "";
    }
  }

  render() {
    return(
      <div style={this.componentStyle}>{this.state.popup}</div>
    );
  }
}

export default PopupToolComponent;