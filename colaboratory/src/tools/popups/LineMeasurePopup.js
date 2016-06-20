/**
 * Created by dmitri on 30/09/15.
 */
"use strict";
import React from "react";
import d3 from 'd3';

import LineMeasure from '../impl/LineMeasure';

class LineMeasurePopup extends React.Component {
  constructor(props) {
    super(props);

    this.containerStyle = {
      display: 'flex',
      flexDirection: "row",
      alignItems: 'center',
      justifyContent: 'center',
      padding: "5px"
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
    var scales = {};
    d3.selectAll('.' + LineMeasure.classes().selfGroupSvgClass).each(function(d) {
      //console.log('item ' + JSON.stringify(d));
      var scaleIds = Object.keys(d.scales);
      //console.log(JSON.stringify(scaleIds));
      for(var i = 0; i < scaleIds.length; ++i) {
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

  render() {
    var self = this;
    return(
      <div style={this.containerStyle} className='ui segment'>
        <div className='title'>Etalon</div>
        <select className='ui compact inline scrolling dropdown' value={this.state.scale} style={this.optionStyle} onChange={this.setScale.bind(this)}>
          <option value="null">Aucun</option>
          {this.state.scales.map(function(scale) {
            return <option value={scale.uid} key={scale.uid}>{scale.name}</option>;
          })}
        </select>
      </div>
    );
  }
}

export default LineMeasurePopup;