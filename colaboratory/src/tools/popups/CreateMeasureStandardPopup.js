/**
 * Created by dmitri on 06/01/17.
 */
'use strict';

import React from 'react';

import ToolActions from '../../actions/ToolActions';

import Tooltip from '../../components/ActiveToolTooltip';

import Globals from '../../utils/Globals';

class CreateMeasureStandardPopup extends React.Component {
  constructor(props) {
    super(props);

    this.containerStyle = {
      width: '200px',
      display: "flex",
      flexDirection: "column",
      borderStyle: "solid",
      borderWidth: "1px",
      borderColor: "black",
      padding: "5px",
      color: 'black',
      marginTop: '5px'
    };

    this.titleBarStyle = {
      display: 'flex',
      width: '198px',
      flexDirection: 'row',
      justifyContent: 'space-between',
      backgroundColor: 'whitesmoke',
      borderStyle: "solid",
      borderWidth: "0 0 1px 0",
      borderColor: "black",
      padding: 0,
      margin: 0,
      position: 'relative',
      top: '-5px',
      left: '-5px'
    };

    this.titleStyle = {
      marginLeft: '5px',
      WebkitUserSelect: 'none',
      MozUserSelect: 'none',
      MsUserSelect: 'none',
      userSelect: 'none',
      cursor: 'default'
    };

    this.windowBodyStyle = {
      display: ''
    };

    this._toolDataChanged = () => {
      const updatePath = () => this.pathDefinitionUpdate();
      return updatePath.apply(this);
    };

    this.state = {
      name: null,
      value: null,
      mmPerPixel: 0,
      lengthInPx: null
    };
  }

  minimize() {
    this.windowBodyStyle.display = this.windowBodyStyle.display == 'none' ? '' : 'none';
    this.setState({});
  }

  onNameChange(e) {
    this.setState({name: e.target.value});
  }

  onValueChange(e) {
    this.setState({value: e.target.value});
  }

  pathDefinitionUpdate() {
    let length = this.props.toolstore.getToolData();
    this.setState({lengthInPx: length});
  }

  save() {
    ToolActions.save();
  }

  componentDidMount() {
    this.props.toolstore.addToolDataChangeListener(this._toolDataChanged);
  }

  componentWillUpdate(nextProps, nextState) {
    if(nextState.value && nextState.lengthInPx) {
      nextState.mmPerPixel = nextState.value / nextState.lengthInPx;
    }
    else {
      nextState.mmPerPixel = 0;
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if(prevState.mmPerPixel != this.state.mmPerPixel) {
      this.props.setDataCallback(this.state.name, this.state.value);
    }
  }

  componentWillUnmount() {
    this.props.toolstore.removeToolDataChangeListener(this._toolDataChanged);
  }

  render() {
    return (
      <div style={this.containerStyle} ref='container' className='ui segment'>
        <div className='ui segment' style={this.titleBarStyle} >
          <div style={this.titleStyle}>{this.props.userstore.getText('measureStandard')}</div>
          <div style={this.buttonsStyle}>
            <i className='ui minus icon'
               style={this.iconStyle}
               onClick={this.minimize.bind(this)} />
            <i className='ui remove icon'
               style={this.iconStyle}
               onClick={Globals.noActiveTool} />
          </div>
        </div>
        <div style={this.windowBodyStyle}>
          <Tooltip userstore={this.props.userstore}
                   toolstore={this.props.toolstore} />
          <div style={this.horizontalContainerStyle}>
            <input placeholder={this.props.userstore.getText('name')}
                   type='text'
                   autoComplete='on'
                   style={this.textAreaStyle}
                   onChange={this.onNameChange.bind(this)}
                   value={this.state.name}
                   autofocus="true"
                   wrap="hard"/>
          </div>
          <div style={this.horizontalContainerStyle}>
            <input placeholder={this.props.userstore.getText('lengthInMm')}
                   type='text'
                   autoComplete='on'
                   style={this.textAreaStyle}
                   onChange={this.onValueChange.bind(this)}
                   value={this.state.value}
                   autofocus="true"
                   wrap="hard"/>
          </div>
          <div>mm/pixel : {this.state.mmPerPixel?this.state.mmPerPixel.toFixed(4):this.props.userstore.getText('completeFormFieldsAbove')}</div>
          <div>
            <button className='ui mini compact button' style={this.textStyle} onClick={Globals.noActiveTool}>{this.props.userstore.getText('cancel')}</button>
            <button className='ui compact green button' style={this.textStyle} onClick={this.save.bind(this)}>{this.props.userstore.getText('save')}</button>
          </div>
        </div>
      </div>
    );
  }
}

export default CreateMeasureStandardPopup;