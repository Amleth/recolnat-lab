/**
 * Abstract component to be implemented by all tools.
 *
 * When extending React lifecycle functions (ex componentDidMount), don't forget to call super.function (ex super.componentDidMount).
 */
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

    this._forceUpdate = () => {
      const update = () => this.setState({});
      return update.apply(this);
    };
    
    this.state = {active: false};
  }
  /**
   * Optional. Specifies what happens when the user clicks somewhere.
   * Tools which do not implement this method should manage SVG interaction in their begin(), reset(), finish() functions.
   * @param self Object this component (deprecated, this is automatically bound in ToolStore)
   * @param x Integer x-coordinate of the click
   * @param y Integer y-coordinate of the click
   * @param data Object any data the tool may need
   */
  click(self, x, y, data) {

  }

  /**
   * Optional. Specifies what happens when the user double-clicks somehwere and the double-click is transmitted through the ToolStore. By default does nothing.
   * @param self
   * @param x
   * @param y
   */
  doubleclick(self, x, y) {

  }

  /**
   * Return true if this component's implementation should support double-clicking from the ToolStore. Function doubleclick() must be implemented for this to produce results.
   * @returns {boolean}
   */
  canDoubleClick() {
    return false;
  }

  /**
   * Optional.
   *
   * Returns stuff to save. Content of the data returned depends on server expectations.
   */
  save(){

  }

  /**
   * Return true if this component's implementation should support saving from the ToolStore. Function save() must be implemented.
   * @returns {boolean}
   */
  canSave() {
    return false;
  }

  /**
   * Mandatory.
   *
   * Called every time the tool is set as the active tool. Initialize your component, its popups, listeners, state and SVG operations.
   */
  begin() {
    this.setState({active: true});

  }

  /**
   * Mandatory.
   *
   * Used to reset the tool to its initial state while keeping it as the active tool.
   */
  reset() {

  }

  /**
   * Mandatory.
   *
   * Called every time the tool is unselected. Perform display and state cleanup here.
   */
  finish() {
    this.setState({active: false});
  }



  /**
   * Mandatory.
   *
   * It is strongly suggested for tools to also send tooltip data up the processing chain in this function.
   */
  setMode(){
    ToolActions.setTool(ToolConf.nothing.uid);
    // ToolActions.updateTooltipData(ToolConf.nothing.tooltip);
  }

  /**
   * Don't forget to register your component with the ToolStore in this function's extension.
   */
  componentDidMount() {
    this.props.userstore.addLanguageChangeListener(this._forceUpdate);
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
    this.finish();
    this.props.userstore.removeLanguageChangeListener(this._forceUpdate);
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