"use strict";
import React from 'react';

import ToolActions from "../actions/ToolActions";

import ToolConf from "../conf/Tools-conf";

/**
 * Abstract class providing the API for a tool which
 */
class AbstractTool extends React.Component {
  constructor(props) {
    super(props);
    this.buttonName = "Rien";

    this.buttonStyle = {
      padding: '5px 0px 10px 10px'
    };
    
    this.state = {active: false};
  }
  /**
   * Optional
   * @param self
   * @param x
   * @param y
   */
  click(self, x, y, data) {

  }

  /**
   * Optional
   * @param self
   * @param x
   * @param y
   */
  doubleclick(self, x, y) {

  }

  canDoubleClick() {
    return false;
  }

  /**
   * Optional
   *
   * Returns stuff to save
   */
  save(){

  }

  canSave() {
    return false;
  }

  /**
   * Mandatory.
   * Called every time the tool is set as the active tool.
   */
  begin() {
    this.setState({active: true});

  }

  /**
   * Mandatory.
   * Called every time the tool is unselected. Perform display and state cleanup here.
   */
  finish() {
    this.setState({active: false});
  }

  /**
   * Mandatory.
   * Used to reset the tool to its initial state while keeping it as the active tool..
   */
  reset() {

  }

  /**
   * Mandatory.
   * It is strongly suggested for tools to also send tooltip data up the processing chain in this function.
   */
  setMode(){
    ToolActions.setTool(ToolConf.nothing.uid);
    // ToolActions.updateTooltipData(ToolConf.nothing.tooltip);
  }

  componentDidMount() {
    this.props.userstore.addLanguageChangeListener(this.setState.bind(this, {}));
    $(this.refs.button.getDOMNode()).popup();
  }
  
  componentWillUpdate(nextProps, nextState) {
    if(nextState.active) {
      this.buttonStyle.backgroundColor = 'rgba(200,200,200,1.0)';
    }
    else {
      this.buttonStyle.backgroundColor = null;
    }
  }

  componentDidUpdate(prevProps, prevState) {

  }

  componentWillUnmount() {
    this.props.userstore.removeLanguageChangeListener(this.setState.bind(this, {}));
  }

  render() {
    return (
      <button style={this.buttonStyle}
              ref='button'
              className='ui button compact'
              onClick={this.setMode}
              data-content={this.props.userstore.getText('nothing')}>
        <i className='ui large cancel icon'></i>
      </button>
    )
  }
}

export default AbstractTool;