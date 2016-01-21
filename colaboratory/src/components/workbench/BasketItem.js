/**
 * Created by dmitri on 19/01/16.
 */
'use strict';

import React from 'react';

import ManagerActions from '../../actions/ManagerActions';

import notFound from '../../images/image-not-found.png';

class BasketItem extends React.Component {
  constructor(props) {
    super(props);

    this.cardStyle = {
      position: 'relative',
      height: '150px',
      width: '100px',
      margin: '10px'
    };

    this.floatDownLeftStyle = {
      position: 'absolute',
      left: 0,
      bottom: 0
    };

    this.floatDownRightStyle = {
      position: 'absolute',
      right: 0,
      bottom: 0
    };

    this.imageStyle = {
      height: '150px',
      width: '100px'
    };

    this.checkboxStyle = {
      position: 'absolute',
      top: '5px',
      left: '5px'
    };

    this.labelStyle = {
      paddingLeft: '20px'
    };

    this.state = {
      isSelected: props.managerstore.isInBasketSelection(props.content.id)
    };
  }

  static itemSourceImage(item) {
    if(item.image && item.image.length > 0) {
      if (item.image[0].thumburl) {
        return item.image[0].thumburl;
      }
      else {
        return item.image[0].url;
      }
    }
    else {
      return notFound;
    }
  }

  changeSelected() {
    ManagerActions.changeBasketSelectionState(this.props.content.id, !this.state.isSelected);
  }

  componentWillUpdate(nextProps, nextState) {
    nextState.isSelected = nextProps.managerstore.isInBasketSelection(nextProps.content.id);
  }

  render() {
    return <div className='basketItem'  key={'BASKET-THUMB-' + this.props.content.id} style={this.cardStyle}>
      <div className='dimmable image'>
        <div className='ui inverted dimmer'>
          <div className='ui content' >
            <div className='ui top attached blue label' style={this.labelStyle}>
              <input className='ui checkbox' style={this.checkboxStyle} type='checkbox' checked={this.state.isSelected} onChange={this.changeSelected.bind(this)}/>
              {this.props.content.scientificname}
            </div>

            <div className='ui green compact icon circular button' style={this.floatDownLeftStyle}>
              <i className='icons'>
                <i className='folder icon' />
                <i className='corner add icon' />
              </i>
            </div>
            <div className='ui red compact icon circular button' style={this.floatDownRightStyle}>
              <i className='trash icon' />
            </div>
          </div>
        </div>
        <input className='ui checkbox' style={this.checkboxStyle} type='checkbox' checked={this.state.isSelected} onChange={this.changeSelected.bind(this)}/>
        <img src={BasketItem.itemSourceImage(this.props.content)} style={this.imageStyle}/>
      </div>
    </div>;
  }
}

export default BasketItem;