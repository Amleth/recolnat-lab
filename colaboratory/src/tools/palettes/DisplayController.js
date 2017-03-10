/**
 * Created by dmitri on 02/11/15.
 */
'use strict';

import React from 'react';
import d3 from 'd3';

import ViewActions from '../../actions/ViewActions';
import Classes from '../../constants/CommonSVGClasses.js';

import colors from '../../conf/colors.js';

import poi from '../../images/marker.svg';

class DisplayController extends React.Component {
  constructor(props) {
    super(props);

    this.sliderStyle = {
      width: '100%'
    };

    this.viewButtonStyle = {
      fontFamily: 'Roboto Condensed'
    };

    this.titleTextStyle = {
      paddingTop: '15px',
      textAlign: 'right'
    };

    this.poiImageStyle = {
      position: 'relative',
      top: '0px',
      left: '0px',
      zIndex: '20'
    };

    this.buttonGroupStyle = {
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      paddingTop: '1px'
    };

    this.state = {
      size: 1.0,
      colors: colors.colors,
      hiddenColors: []
    };

    for(let i = 0; i < this.state.colors.length; ++i) {
      let color = this.state.colors[i].color;
      this.state.colors[i].poiButtonStyle = {
        opacity: 1.0,
        height: '45px',
        padding: '0px 0px 5px 1px'
      };
      this.state.colors[i].poiColorStyle = {
        backgroundColor: 'rgb(' + color.red + ',' + color.green + ',' + color.blue + ')',
        position: 'relative',
        top: '-43px',
        left: '2px',
        height: '23px !important',
        width: '33px !important',
        zIndex: '19'
      };
      this.state.colors[i].hidden = false;
    }

    this._onViewPropertiesUpdate = () => {
      const viewPropsChange = () => this.changeViewProperties(this.props.viewstore.getViewProperties());
      return viewPropsChange.apply(this);
    }
  }

  changeSize(event) {
    //this.setState({size: event.target.value});
    ViewActions.updateViewProperties({sizeOfTextAndObjects: event.target.value});
  }

  defaultSize() {
    //this.setState({size: 1.0});
    ViewActions.updateViewProperties({sizeOfTextAndObjects: 1.0});
  }

  changeViewProperties(props) {
    this.setState({size: props.sizeOfTextAndObjects});
  }

  toggleColor(color, key) {
    let selection = d3.selectAll('.' + Classes.POI_CLASS).filter(function(d, i) {
      return d.color == '[' + color.red + ',' + color.green + ',' + color.blue + ']';
    });

    let colors = this.state.colors;
    for(let i = 0; i < colors.length; ++i) {
      let iColor = colors[i];
      if(iColor.key == key) {
        if(iColor.hidden) {
          iColor.hidden = false;
          selection.style('opacity', 1.0);
        }
        else {
          iColor.hidden = true;
          selection.style('opacity', 0);
        }

      }
    }
    this.setState({colors: colors});
  }

  componentDidMount() {
    this.props.viewstore.addViewPropertiesUpdateListener(this._onViewPropertiesUpdate);
  }

  componentWillUpdate(nextProps, nextState) {
    for(let i = 0; i < nextState.colors.length; ++i) {
      let color = nextState.colors[i];
      if(color.hidden) {
        color.poiButtonStyle.opacity = 0.4;
      }
      else {
        color.poiButtonStyle.opacity = 1.0;
      }
    }
  }

  componentDidUpdate(prevProps, prevState) {
    //var poiGroup = d3.selectAll('.' + Classes.POI_CLASS)
    //  .attr('transform', d => 'translate(' + d.x + ',' + d.y + ')scale(' + this.state.size + ')');
  }

  componentWillUnmount() {
    this.props.viewstore.removeViewPropertiesUpdateListener(this._onViewPropertiesUpdate);
  }

  render() {
    let self = this;
    return(
      <div style={this.componentStyle}>
        <div style={this.titleTextStyle}>Taille textes &amp; symboles</div>
        <input type='range'
               style={this.sliderStyle}
               max='10.0'
               min='0.1'
               step='0.01'
               value={this.state.size}
               onChange={this.changeSize.bind(this)} />
        <div style={this.titleTextStyle}>Filtrer les points d'intérêt</div>
        <div style={this.buttonGroupStyle}>
          {colors.colors.map(function(color) {
            return(
              <div style={color.poiButtonStyle}
                   key={color.key}
                   onClick={self.toggleColor.bind(self, color.color, color.key)}>
                <img src={poi} height='40px' width='40px' style={self.poiImageStyle}/>
                <div style={color.poiColorStyle}/>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
}

export default DisplayController;