/**
 * Created by dmitri on 17/05/16.
 */
'use strict';

import React from 'react';

import ViewConstants from '../constants/ViewConstants';

export default class ActiveSetNameDisplay extends React.Component {
  constructor(props) {
    super(props);

    this.topButtonStyle = {
      position: 'fixed',
      left: '20vw',
      top: (window.innerHeight -this.closeTopPaneButtonHeight) + 'px',
      zIndex: ViewConstants.zIndices.topPaneCloseButton,
      height: '30px',
      maxHeight: '60px',
      width: '200px',
      maxWidth: '200px',
      fontSize: '12',
      WebkitTransition: 'top 1.1s',
      transition: 'top 1.1s'
    };

    this._onSetIdChange = () => {
      const changeDisplayedName = () => this.setActiveSetName();
      return changeDisplayedName.apply(this);
    };

    this.state = {
      name: 'Aucun set actif'
    };
  }

  setActiveSetName() {
    if(this.props.managerstore.getSelected().name) {
      this.setState({name: this.props.managerstore.getSelected().name});
    }
    else {
      this.setState({name: this.props.userstore.getText('noActiveSet')});
    }
  }

  componentDidMount() {
    this.props.userstore.addLanguageChangeListener(this.setState.bind(this, {}));
    this.props.managerstore.addSelectionChangeListener(this._onSetIdChange);
  }

  componentWillUnmount() {
    this.props.userstore.removeLanguageChangeListener(this.setState.bind(this, {}));
    this.props.managerstore.removeSelectionChangeListener(this._onSetIdChange);
  }


  render() {
    return(
      <div className="ui bottom attached button mini compact"
           style={this.topButtonStyle} >
        <i className={'ui icon sidebar'} />
        {this.state.name}
      </div>
    );
  }
}