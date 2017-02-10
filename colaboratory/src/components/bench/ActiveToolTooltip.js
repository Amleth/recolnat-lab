'use strict';

import React from 'react';

import Styles from '../../constants/Styles';

class ActiveToolTooltip extends React.Component {
  constructor(props) {
    super(props);

    this._onTooltipContentUpdate = () => {
      const setTooltipContent = () => this.setState({text: this.props.toolstore.getTooltipContent()});
      return setTooltipContent.apply(this);
    };

    this.state = {
      text: this.props.toolstore.getTooltipContent()
    };
  }

  componentDidMount() {
    this.props.toolstore.addTooltipChangeListener(this._onTooltipContentUpdate);
  }

  componentWillUpdate(nextProps, nextState) {

  }

  componentWillUnmount() {
    this.props.toolstore.removeTooltipChangeListener(this._onTooltipContentUpdate);
  }

  render() {
    return (
      <div style={Styles.compact}
           className={this.props.cClasses?this.props.cClasses:'ui segment'}>
        <span style={Styles.text}>
          {this.state.text}
          </span>
      </div>
    );
  }
}

export default ActiveToolTooltip;
