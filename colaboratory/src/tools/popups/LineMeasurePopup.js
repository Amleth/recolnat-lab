/**
 * Created by dmitri on 30/09/15.
 */
"use strict";
import React from "react";
import d3 from 'd3';

import LineMeasure from '../impl/LineMeasure';

import Tooltip from '../../components/ActiveToolTooltip';

import Globals from '../../utils/Globals';

class LineMeasurePopup extends React.Component {
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

    this.closeIconStyle = {
      position: 'absolute',
      right: 0,
      top: 0,
      cursor: 'pointer'
    };

    this.optionStyle = {
      color: '#2f4f4f'
    };

    this.state = {
      scales: [],
      scale: "null"
    };
  }

  setScale(event) {
    //console.log("Set scale " + event.target.value);
    this.setState({scale: event.target.value});
  }

  getScales() {
    let scales = {};
    d3.selectAll('.' + LineMeasure.classes().selfGroupSvgClass).each(function(d) {
      //console.log('item ' + JSON.stringify(d));
      let scaleIds = Object.keys(d.scales);
      //console.log(JSON.stringify(scaleIds));
      for(let i = 0; i < scaleIds.length; ++i) {
        scales[scaleIds[i]] = (d.scales[scaleIds[i]]);
      }
    });
    //console.log(JSON.stringify(scales));
    return _.values(scales);
  }

  updateScales() {
    this.setState({scales: this.getScales()});
  }

  componentDidMount() {
    this.props.userstore.addLanguageChangeListener(this.setState.bind(this, {}));
    this.setState({scales: this.getScales()});
  }

  componentWillUpdate(nextProps, nextState) {
    var newScales = this.getScales();
    if(_.difference(newScales, this.state.scales).length != 0 || _.difference(this.state.scales, newScales).length != 0) {
      nextState.scales = newScales;
      if(_.findIndex(newScales, function(item) {return item.uid === 'exif'}) > -1) {
        nextState.scale = 'exif';
      }
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if(this.state.scale != prevState.scale) {
      if(this.state.scale == "null") {
        this.props.setScaleCallback(null);
      }
      else {
        this.props.setScaleCallback(this.state.scale);
      }
    }
  }

  componentWillUnmount() {
    this.props.userstore.removeLanguageChangeListener(this.setState.bind(this, {}));
  }

  render() {
    return(
      <div style={this.containerStyle} className='ui segment'>
        <div className='ui segment' style={this.titleBarStyle} >
          <div style={this.titleStyle}>{this.props.userstore.getText('newMeasure')}</div>
          <i className='ui remove icon'
             style={this.closeIconStyle}
             onClick={Globals.noActiveTool} />
        </div>
        <Tooltip toolstore={this.props.toolstore} />
        <div className='title'>
          {this.props.userstore.getText('measureStandard')}
        </div>
        <select className='ui compact inline scrolling dropdown'
                value={this.state.scale}
                style={this.optionStyle}
                onChange={this.setScale.bind(this)}>
          <option value="null">
            {this.props.userstore.getText('nothing')}
          </option>
          {this.state.scales.map(function(scale) {
            return <option value={scale.uid} key={scale.uid}>{scale.name}</option>;
          })}
        </select>
      </div>
    );
  }
}

export default LineMeasurePopup;