/**
 * Created by dmitri on 19/01/16.
 */
'use strict';

import React from 'react';

import BasketActions from '../../actions/BasketActions';
import ViewActions from '../../actions/ViewActions';

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

    this.floatDownMiddleStyle = {
      position: 'absolute',
      left: '35px',
      bottom: 0
    };

    this.floatDownRightStyle = {
      position: 'absolute',
      left: '67px',
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
      isSelected: props.basketstore.isInBasketSelection(props.content.id),
      modalSrc: null
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

  viewFullSizeModal() {
    //if(this.props.content && this.props.content.image.length > 0) {
    //  this.setState({modalSrc: this.props.content.image[0].url});
    //}
    //else {
    //  this.setState({modalSrc: notFound});
    //}
  }

  changeSelected() {
    BasketActions.changeBasketSelectionState(this.props.content.id, !this.state.isSelected);
  }

  removeSelfFromBasket() {
    BasketActions.removeItemFromBasket(this.props.content.id);
  }

  componentWillUpdate(nextProps, nextState) {
    nextState.isSelected = nextProps.basketstore.isInBasketSelection(nextProps.content.id);
  }

  componentDidUpdate(prevProps, prevState) {
    //var self = this;
    if(this.state.modalSrc && !prevState.modalSrc) {
      // Show modal only after image has loaded successfully. Otherwise the modal will not be scrollable and the bottom of the image will not be visible.
      if(!this.refs.image.getDOMNode().src) {
        $(this.refs.loadingModal.getDOMNode()).modal({
          onHidden: function () {
            //self.setState({modalSrc: null});
          }
        }).modal('show');
      }

      var showImageCallback = function(image) {
        //if(this.state.modalSrc) {
          var self = this;
        //this.refs.image.getDOMNode().height = image.naturalHeight;
        //this.refs.image.getDOMNode().width = image.naturalWidth;
          this.refs.image.getDOMNode().src = image.src;
          $(this.refs.loadingModal.getDOMNode()).modal('hide');
          $(this.refs.imageModal.getDOMNode()).modal({
            onHidden: function () {
              self.refs.image.getDOMNode().src = null;
              self.setState({modalSrc: null});
            }
          }).modal('show');
        //}
      };

      window.setTimeout(
        ViewActions.loadImage.bind(null, this.state.modalSrc, showImageCallback.bind(this)),
        10);
      //$(this.refs.loadingModal.getDOMNode()).modal({
      //  onHidden: function() {
      //    self.refs.image.getDOMNode().onload = null;
      //  }
      //}).modal('show');
      //this.refs.image.getDOMNode().src = this.state.modalSrc;
      //this.refs.image.getDOMNode().onload = function() {
      //  $(self.refs.loadingModal.getDOMNode()).modal('hide');
      //  $(self.refs.imageModal.getDOMNode()).modal({
      //    onHidden: function () {
      //      self.setState({modalSrc: null});
      //    }
      //  }).modal('show');
      //};
    }
  }

  render() {
    return <div className='basketItem'  key={'BASKET-THUMB-' + this.props.content.id} style={this.cardStyle}>

      <div className='ui small modal' ref='loadingModal'>
        <div className='header'>{this.props.content.scientificname}</div>
        <div className='content'>
          <div className='description'>
            <div className='ui segment'>
              <div className='ui active inverted dimmer'>
              <div className='ui text loader'>Chargement en cours...</div>
                </div>
            </div>
          </div>
        </div>
      </div>

      <div className='ui modal' ref='imageModal'>
        <div className='header'>{this.props.content.scientificname}</div>
        <div className='content'>
          <div className='description'>
            <img className='ui image' ref='image' src={null} alt='Image indisponible'/>
          </div>
        </div>
      </div>

      <div className='dimmable image'>
        <div className='ui inverted dimmer'>
          <div className='ui content' >
            <div className='ui top attached blue label' style={this.labelStyle}>
              <input className='ui checkbox' style={this.checkboxStyle} type='checkbox' checked={this.state.isSelected} onChange={this.changeSelected.bind(this)}/>
              {this.props.content.scientificname}
            </div>


            <div className='ui red compact icon circular button'
                 style={this.floatDownRightStyle}
                 onClick={this.removeSelfFromBasket.bind(this)}>
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

//<div className='ui blue compact icon circular button' style={this.floatDownMiddleStyle} onClick={this.viewFullSizeModal.bind(this)}>
//  <i className='eye icon' />
//</div>

export default BasketItem;