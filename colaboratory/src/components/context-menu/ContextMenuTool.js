/**
 * Created by dmitri on 06/01/16.
 */
'use strict';

import React from 'react';

import ToolActions from '../../actions/ToolActions';

class ContextMenuTool extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      active: null
    };
  }

  componentWillMount() {
    if(this.props.toolstore.getToolName() == this.props.tool.id) {
      this.setState({active: <i className="checkmark icon"></i>});
    }
  }

  componentWillUpdate(nextProps, nextState) {
    if(this.props.toolstore.getToolName() == this.props.tool.id) {
      nextState.active = <i className="checkmark icon"></i>;
    }
    else {
      nextState.active = null;
    }
  }

  setActiveTool() {
    ToolActions.setTool(this.props.tool.id);
    ToolActions.updateTooltipData(this.props.tool.tooltip);
    this.setState({active: <i className="checkmark icon"></i>});
  }

  render() {
    return <a className='item'
              onClick={this.setActiveTool.bind(this)}>
      {this.state.active}{this.props.displayText}</a>;
  }
}

export default ContextMenuTool;