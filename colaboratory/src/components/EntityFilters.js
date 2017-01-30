/**
 * Created by dmitri on 17/01/17.
 */
'use strict';

import React from 'react';

import ViewActions from '../actions/ViewActions';

import ProgressBar from './ProgressBar';

import angle from '../images/angle.svg';
import area from '../images/perimeter.svg';
import point from '../images/poi.svg';
import trail from '../images/polyline.png';
import border from '../images/border.svg';

class EntityFilters extends React.Component {
  constructor(props) {
    super(props);

    this.componentStyle = {
      position: 'absolute',
      left: '5px',
      top: '27px',
      maxHeight: '230px !important',
      maxWidth: '50px !important',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'rgba(0,0,0,0.3)',
      padding: '2px 2px',
      opacity: 0.3
    };

    this.buttonStyle = {
      margin: '3px 0px 0px 0px',
      padding: '3px 3px',
      display: 'flex',
      alignItems: 'center',
      alignContent: 'center'
    };

    this.buttonProgressStyle = {
      position: 'relative'
    };

    this._forceRender = () => {
      const update = () => this.setState({});
      return update.apply(this);
    };
  }

  show() {
    this.componentStyle.opacity = 1.0;
    this.setState({});
  }

  hide() {
    this.componentStyle.opacity = 0.3;
    this.setState({});
  }

  componentDidMount() {
    this.props.viewstore.addFilterUpdateListener(this._forceRender);
  }

  componentWillUnmount() {
    this.props.viewstore.removeFilterUpdateListener(this._forceRender);
  }

  render() {
    let displays = this.props.viewstore.getDisplayedTypes();
    return(
      <div className='ui segment' style={this.componentStyle} onMouseEnter={this.show.bind(this)} onMouseLeave={this.hide.bind(this)}>
        <div className={'ui button ' + (displays.borders?'green':'grey')}
             onClick={ViewActions.updateDisplayFilters.bind(null, {borders: !displays.borders})}
             style={this.buttonStyle}>
          <img height='20px' width='20px' src={border} />
        </div>
        <div style={this.buttonProgressStyle}>
          <div className={'ui button ' + (displays.points?'green':'grey')}
               onClick={ViewActions.updateDisplayFilters.bind(null, {points: !displays.points})}
               style={this.buttonStyle}>
            <img  height='20px' width='20px' src={point} />
          </div>
          <ProgressBar property='poi' benchstore={this.props.benchstore}/>
        </div>
        <div style={this.buttonProgressStyle}>
          <div className={'ui button ' + (displays.trails?'green':'grey')}
               onClick={ViewActions.updateDisplayFilters.bind(null, {trails: !displays.trails})}
               style={this.buttonStyle}>
            <img  height='20px' width='20px' src={trail} />
          </div>
          <ProgressBar property='toi' benchstore={this.props.benchstore}/>
        </div>
        <div style={this.buttonProgressStyle}>
          <div className={'ui button ' + (displays.regions?'green':'grey')}
               onClick={ViewActions.updateDisplayFilters.bind(null, {regions: !displays.regions})}
               style={this.buttonStyle}>
            <img  height='20px' width='20px' src={area} />
          </div>
          <ProgressBar property='roi' benchstore={this.props.benchstore}/>
        </div>
        <div style={this.buttonProgressStyle}>
          <div className={'ui button ' + (displays.angles?'green':'grey')}
               onClick={ViewActions.updateDisplayFilters.bind(null, {angles: !displays.angles})}
               style={this.buttonStyle}>
            <img  height='20px' width='20px' src={angle} />
          </div>
          <ProgressBar property='aoi' benchstore={this.props.benchstore}/>
        </div>
      </div>
    )
  }
}

export default EntityFilters;