/**
 * Generic thin horizontal progress bar component for LabBenchStore entities.
 *
 * Properties:
 *  - property: name of the property to watch progress
 *
 * Created by dmitri on 18/01/17.
 */
'use strict';

import React from 'react';

class ProgressBar extends React.Component {
  constructor(props) {
    super(props);

    this.componentStyle = {
      width: '100%',
      margin: 0,
      padding: 0,
      display: 'flex',
      justifyContent: 'center',
      position: 'relative'
    };

    this.redBackgroundStyle = {
      width: '100%',
      backgroundColor: 'red',
      height: '2px'
    };

    this.greenProgressStyle = {
      position: 'absolute',
      bottom: 0,
      left: 0,
      width: '0%',
      backgroundColor: 'yellow',
      height: '2px'
    };

    this._updateLoadProgress = () => {
      const update = () => this.setProgress();
      return update.apply(this);
    };
  }

  setProgress() {
    let prog = this.props.benchstore.getProgress(this.props.property);
    if(!prog.max) {
      this.greenProgressStyle.width = "100%";
      this.greenProgressStyle.backgroundColor = 'blue';
    }
    else {
      this.greenProgressStyle.width = (prog.current * 100 / prog.max) + "%";

      if(prog.current === prog.max) {
        this.greenProgressStyle.backgroundColor = 'green';
      }
      else {
        this.greenProgressStyle.backgroundColor = 'yellow';
      }
    }
    this.setState({});
  }

  componentDidMount() {
    this.props.benchstore.addLoadProgressListener(this._updateLoadProgress);
  }

  componentWillUnmount() {
    this.props.benchstore.removeLoadProgressListener(this._updateLoadProgress);
  }

  render() {
    return(
      <div style={this.componentStyle}>
        <div style={this.redBackgroundStyle}></div>
        <div style={this.greenProgressStyle}></div>
      </div>
    );
  }
}

export default ProgressBar;