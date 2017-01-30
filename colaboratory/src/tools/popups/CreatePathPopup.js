/**
 * Created by hector on 31/07/15.
 */
"use strict";

import React from "react";
import d3 from "d3";

import EditorActions from "../../actions/ManagerActions";
import ToolActions from "../../actions/ToolActions";
import Tooltip from '../../components/ActiveToolTooltip';

import Globals from '../../utils/Globals';

class CreatePathPopup extends React.Component {
  constructor(props) {
    super(props);

    this.componentStyle = {
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
      backgroundColor: 'whitesmoke',
      justifyContent: 'space-between',
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

    this.iconStyle = {
      cursor: 'pointer'
    };

    this.textAreaStyle = {
      width: '100%'
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

    this.state = CreatePathPopup.initialState();

    this.textStyle = {
      fontFamily: 'Roboto Condensed',
      fontWeight: '300'
    };
  }

  static initialState() {
    return {
      name: ''
    };
  }

  clear() {
    window.setTimeout(ToolActions.reset, 10);
    this.setState({name: ''});
  }

  minimize() {
    this.barContainerStyle.display = this.barContainerStyle.display === 'none' ? '': 'none';
    this.setState({});
  }

  save() {
    ToolActions.save();
  }

  onNameChange(event) {
    this.setState({name: event.target.value});
  }

  componentDidMount() {
    this.props.userstore.addLanguageChangeListener(this.setState.bind(this, {}));
  }

  componentWillReceiveProps(nextProps) {
    this.setState({name: ''});
  }

  componentDidUpdate(prevProps, prevState) {
    this.props.setDataCallback(this.state.name);
  }

  componentWillUnmount(){
    this.props.userstore.removeLanguageChangeListener(this.setState.bind(this, {}));
  }

  render() {
    return (
      <div style={this.componentStyle} className='ui segment'>
        <div className='ui segment' style={this.titleBarStyle} >
          <div style={this.titleStyle}>{this.props.userstore.getText('newTrail')}</div>
          <div>
            <i className='ui minus icon'
               style={this.iconStyle}
               onClick={this.minimize.bind(this)} />
            <i className='ui remove icon' style={this.iconStyle} onClick={Globals.noActiveTool} />
          </div>
        </div>
        <div style={this.barContainerStyle}>
          <Tooltip userstore={this.props.userstore}
                   toolstore={this.props.toolstore} />
          <div style={this.horizontalContainerStyle} className='ui inverted field'>
            <textarea placeholder={this.props.userstore.getText('name')}
                      style={this.textAreaStyle}
                      onChange={this.onNameChange.bind(this)}
                      value={this.state.name} autofocus="true" wrap="hard"/>
          </div>
          <div style={this.buttonContainerStyle} className='ui buttons'>
            <button className='ui green button' style={this.textStyle} onClick={this.save.bind(this)}>{this.props.userstore.getText('save')}</button>
          </div>
        </div>
      </div>
    );
  }
}

export default CreatePathPopup;
