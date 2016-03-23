/**
 * Created by dmitri on 30/09/15.
 */
"use strict";
import React from "react";

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

  addExifScale(scales, store) {
    //console.log(JSON.stringify(store.getSelectedImage()));
    if(store.getSelectedMetadata()) {
      if(store.getSelectedMetadata().metadata) {
        if (store.getSelectedMetadata().metadata["X Resolution"]) {
          var xResolution = store.getSelectedMetadata().metadata["X Resolution"].split(" ");
          var dotsPerUnit = _.parseInt(xResolution[0]);
          var mmPerPixel = null;
          var unit = store.getSelectedMetadata().metadata["Resolution Units"];
          if(unit.toUpperCase() == "INCH" || unit.toUpperCase() == "INCHES") {
            mmPerPixel = 25.4/dotsPerUnit;
          }
            else if(unit.toUpperCase() == "CM") {
            mmPerPixel = 10/dotsPerUnit;
          }
          else if(unit.toUpperCase() == "MM") {
            mmPerPixel = 1/dotsPerUnit;
          }
          else {
            console.error("Unprocessed unit " + unit);
          }
          if(mmPerPixel) {
            scales.push({id: 'exif', name: 'Données EXIF', mmPerPixel: mmPerPixel});
          }
        }
      }
    }
  }

  componentDidMount() {
    if(this.props.entitystore.getSelectedImage()) {
      //console.log(JSON.stringify(this.props.entitystore.getSelectedMetadata()));
      var scales = this.props.entitystore.getSelectedMetadata().scales;
      this.addExifScale(scales, this.props.entitystore);
      this.setState({scales: scales});
    }
  }

  componentWillUpdate(nextProps, nextState) {
    if(this.props.entitystore.getSelectedImage() && nextProps.entitystore.getSelectedImage()) {
    if(nextProps.entitystore.getSelectedImage().id != this.props.entitystore.getSelectedImage().id) {
      nextState.scales = nextProps.entitystore.getSelectedMetadata().scales;
      this.addExifScale(nextState.scales, nextProps.entitystore);
    }
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if(this.state.scale != prevState.scale) {
      if(this.state.scale == "null") {
        this.props.setScaleCallback(null);
      }
      else {
        for(var i = 0; i < this.state.scales.length; ++i) {
          if(this.state.scales[i].id == this.state.scale)
          {
            this.props.setScaleCallback(this.state.scales[i].mmPerPixel);
            break;
          }
        }
      }
    }
  }

  render() {
    var self = this;
    return(
      <div style={this.containerStyle}>
        <select className='ui compact inline scrolling dropdown' value={this.state.scale} style={this.optionStyle} onChange={this.setScale.bind(this)}>
          <option value="null">Valeur en pixels</option>
          {this.state.scales.map(function(scale) {
            return <option value={scale.id} key={scale.id}>{scale.name}</option>;
          })}
        </select>
      </div>
    );
  }
}

export default LineMeasurePopup;