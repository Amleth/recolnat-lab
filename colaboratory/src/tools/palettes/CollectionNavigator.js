/**
 * Created by dmitri on 07/10/15.
 */
'use strict';

import React from 'react';

import ViewActions from '../../actions/ViewActions';

class CollectionNavigator extends React.Component {
  constructor(props) {
    super(props);

    this.containerStyle = {
      display: 'flex',
      flexDirection: "column",
      justifyContent: "center"
    };

    this.imageRouletteStyle = {
      display: 'flex',
      justifyContent: "center",
      flexDirection: 'row',
      marginTop: '10px',
      marginBottom: '5px'
    };

    this.imageStyle = {
      display: 'flex',
      maxHeight: '110px',
      minWidth: '40%',
      maxWidth: '40%',
      zIndex: '2',
      borderStyle: "solid",
      borderColor: "black",
      borderWidth: "1px"
    };

    this.imageBeforeStyle = {
      height: '110px',
      width: '30%',
      transform: 'perspective(500px)rotateY(60deg)',
      WebkitTransform: 'perspective(500px)rotateY(60deg)',
      borderStyle: "solid",
      borderColor: "black",
      borderWidth: "1px"
    };

    this.imageAfterStyle = {
      height: '110px',
      width: '30%',
      transform: 'perspective(500px)rotateY(-60deg)',
      WebkitTransform: 'perspective(500px)rotateY(-60deg)',
      borderStyle: "solid",
      borderColor: "black",
      borderWidth: "1px"
    };

    this.imageSelectorStyle = {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: "center"
    };

    this.optionsStyle = {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: "center"
    };

    this.textStyle = {
      color: '#2f4f4f'
    };

    this.navigationBarsStyle = {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: "center"
    };

    this.imageCounterStyle = {
      padding: '5px 5px 5px 5px'
    };

    this.buttonStyle = {
      padding: '0px 6px 0px 6px'
    };

    this._onChangeEntities = () => {
      const changeItems = () => this.setWorkbenchItems(this.props.getItems());
      return changeItems.apply(this);
    };

    this._onChangeSelection = () => {
      const changeSelection = () => this.setSelectedItem(this.props.getSelectedEntity());
      return changeSelection.apply(this);
    };

    this._forceUpdate = () => {
      const update = () => this.setState({});
      return update.apply(this);
    };

    this.state = {
      workbenchItems: [{id: null, url: null}],
      activeItemIdx: null,
      displayedItemIdx: null,
      sortBy: "name"
    };
  }

  componentDidMount() {
    // Add listeners
    this.props.userstore.addLanguageChangeListener(this.setState.bind(this, {}));
    this.props.addChangeEntitiesListener(this._onChangeEntities);
    this.props.addChangeSelectionListener(this._onChangeSelection);
  }

  componentWillUnmount() {
    this.props.userstore.removeLanguageChangeListener(this.setState.bind(this, {}));
    this.props.removeChangeEntitiesListener(this._onChangeEntities);
    this.props.removeChangeSelectionListener(this._onChangeSelection);
  }

  componentWillUpdate(nextProps, nextState) {
    if(nextState.activeItemIdx == null) {
      this.containerStyle.display = "none";
    }
    else {
      this.containerStyle.display = "flex";
    }
  }

  setWorkbenchItems(items) {
    this.setState({activeItemIdx: 0, displayedItemIdx: 1, workbenchItems: _.sortBy(items, "name"), sortBy: "name"});
  }

  setSelectedItem(selectedItem) {
    console.error('not implemented');
    return;
  //  //console.log(JSON.stringify(selectedItem));
  //  if(selectedItem) {
  //    var workbenchItems = _.sortBy(this.props.getItems(), this.state.sortBy);
  //    var index = this.getIndexOfItem(selectedItem.uid, workbenchItems);
  //    //console.log(index);
  //    this.setState({activeItemIdx: index, displayedItemIdx: index+1, workbenchItems: workbenchItems});
  //  }
  //  else {
  //    this.setState({activeItemIdx: null, displayedItemIdx: null});
  //  }
  }

  setActiveItem(index) {
    console.error('not implemented');
    return;
    //if(index < 0 || index >= this.state.workbenchItems.length) {
    //  return;
    //}
    //var workbenchItems = _.sortBy(this.props.getItems(), this.state.sortBy);
    //
    //window.setTimeout((function(id, data) {
    //  return function() {
    //    ViewActions.changeSelection(id, data);
    //  }
    //})(workbenchItems[index].uid, workbenchItems[index]), 15);
  }

  sort(event) {
    // Sort workbenchItems by the right value
    var selectionId = this.state.workbenchItems[this.state.activeItemIdx].uid;
    var items = _.sortBy(this.state.workbenchItems, event.target.value);
    this.setState({sortBy: event.target.value, workbenchItems: items, activeItemIdx: this.getIndexOfItem(selectionId, items), displayedItemIdx: this.getIndexOfItem(selectionId, items)+1});
  }

  getIndexOfItem(id, items) {
    for(var i = 0; i < items.length; ++i) {
      if(items[i].uid == id) {
        return i;
      }
    }
  }

  returnImageAtIndex(index) {
    if(index > this.state.workbenchItems.length-1 || index < 0) {
      return null;
    }
    if(index < this.state.activeItemIdx) {
      return <img src={this.state.workbenchItems[index].url}
                  style={this.imageBeforeStyle}
                  alt={this.props.userstore.getText('loading')}
                  onClick={this.setActiveItem.bind(this,index)}/>;
    }
    else if (index > this.state.activeItemIdx) {
      return <img
        src={this.state.workbenchItems[index].url}
        style={this.imageAfterStyle}
        alt={this.props.userstore.getText('loading')}
        onClick={this.setActiveItem.bind(this,index)}/>;
    }
    else {
      return <img src={this.state.workbenchItems[index].url}
                  onClick={this.showActiveImage.bind(this)}
                  alt={this.props.userstore.getText('loading')}
                  style={this.imageStyle}/>;
    }
  }

  jumpToImage(event) {
    if(event.target.value != this.state.displayedItemIdx) {
      this.setActiveItem(event.target.value - 1);
    }
  }

  showActiveImage() {
    let view = this.props.viewstore.getView();
    let image = this.props.ministore.getImage();
    let scale = 1.0;

    if(image.height > image.width) {
      scale = view.height / image.height;
    }
    else {
      scale = view.width / image.width;
    }

    ViewActions.updateViewport(
      -(image.xZero*scale),
      -(image.yZero*scale),
      null,
      null,
      scale,
      true
    );
  }

  render() {
    if(this.state.activeItemIdx == null) {
      return null;
    }
    var self = this;
    return(
      <div style={this.containerStyle}>
        <div style={this.imageRouletteStyle}>
          {this.returnImageAtIndex.call(this, this.state.activeItemIdx-1)}
          {this.returnImageAtIndex.call(this, this.state.activeItemIdx)}
          {this.returnImageAtIndex.call(this, this.state.activeItemIdx+1)}
        </div>
        <div style={this.navigationBarsStyle}>
          <div  style={this.imageSelectorStyle}>
            <button className='ui button tiny compact'
                    style={this.buttonStyle}
                    onClick={this.setActiveItem.bind(this, 0)}>&lt;&lt;</button>
            <button className='ui button tiny compact'
                    style={this.buttonStyle}
                    onClick={this.setActiveItem.bind(this, this.state.activeItemIdx-1)}>&lt;</button>
            <div className='ui input'>
              <input type="text" size="1" value={this.state.displayedItemIdx} onChange={this.jumpToImage.bind(this)}  style={this.imageCounterStyle} />
            </div>
            <div className='ui input'>
              <input type="text" size="1" value={'/' + this.state.workbenchItems.length} disabled='disabled' style={this.imageCounterStyle} />
            </div>
            <button className='ui button tiny compact'
                    style={this.buttonStyle}
                    onClick={this.setActiveItem.bind(this, this.state.activeItemIdx+1)}>&gt;</button>
            <button className='ui button tiny compact'
                    style={this.buttonStyle}
                    onClick={this.setActiveItem.bind(this, this.state.workbenchItems.length-1)}>&gt;&gt;</button>
          </div>
          <div style={this.optionsStyle}>
          <span className='ui text' style={this.textStyle}>{this.props.userstore.getText('sortBy')} <select className='ui compact inline scrolling dropdown' onChange={this.sort.bind(this)} value={this.state.sortBy}>
            <option value="name">{this.props.userstore.getText('name')}</option>
          </select></span>
          </div>
        </div>
      </div>
    );
  }
}

export default CollectionNavigator;