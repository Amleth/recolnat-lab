/**
 * Created by dmitri on 11/01/16.
 */
'use strict';

import React from 'react';

import BasketItem from './BasketItem';

import BasketActions from '../../actions/BasketActions';

class Basket extends React.Component {
  constructor(props) {
    super(props);

    this.basketContainerStyle = {
      minHeight: '50%',
      maxHeight: '50%',
      width: '100%',
      overflowY: 'auto',
      overflowX: 'hidden'
    };

    this.cardRowStyle = {
      display: 'flex',
      flexDirection: 'row',
      maxHeight: '250px',
      margin: '5px 0 5px 0',
      overflowY: 'auto',
      overflowX: 'auto'
    };

    this.state = {
      basketItems: []
    };

    this._onBasketUpdate = () => {
      const setBasket = () => this.setState({basketItems: this.props.basketstore.getBasket()});
      setBasket.apply(this);
    }
  }

  reloadBasket() {
    window.setTimeout(BasketActions.reloadBasket, 10);
  }

  getBasketStateText() {
    if(this.state.basketItems.length == 0) {
      return this.props.userstore.getText('basketEmpty');
    }
    else {
      return this.props.userstore.getText('countImagesInBasket') + ' ' + this.state.basketItems.length;
    }
  }

  toggleSelectionAll() {
    if(this.props.basketstore.getBasketSelection().length === this.props.basketstore.getBasket().length) {
      // Unselect all
      window.setTimeout(BasketActions.changeBasketSelectionState.bind(null, null, false), 10);
    }
    else {
      // Select all
      window.setTimeout(BasketActions.changeBasketSelectionState.bind(null, null, true), 10);
    }
  }

  scrollHorizontal(event) {
    event.preventDefault();
    var node = this.refs.cards.getDOMNode();
    node.scrollLeft = node.scrollLeft + event.deltaY;
  }

  componentDidMount() {
    this.props.basketstore.addBasketUpdateListener(this._onBasketUpdate);
    this.props.userstore.addLanguageChangeListener(this.setState.bind(this, {}));
  }

  componentWillUpdate(nextProps, nextState) {
    if(this.props.basketstore.getBasketSelection().length == this.props.basketstore.getBasket().length) {
      nextState.checkbox = 'checkmark box';
    }
    else {
      nextState.checkbox = 'square outline';
    }
  }

  componentDidUpdate(prevProps, prevState) {
      if (this.state.basketItems.length > 0) {
        $('.basketItem .image', this.refs.cards.getDOMNode()).dimmer({
          on: 'hover',
          opacity: 0.2
        });
        $('.ui.button', this.refs.buttons.getDOMNode()).popup({delay: {show: 1000, hide: 0}});
      }
  }

  componentWillUnmount() {
    this.props.basketstore.removeBasketUpdateListener(this._onBasketUpdate);
    this.props.userstore.removeLanguageChangeListener(this.setState.bind(this, {}));
  }

  render() {
    var self = this;
    return <div style={this.basketContainerStyle}>
      <div className='ui buttons' ref='buttons'>
        <div className='ui button'
             onClick={this.reloadBasket.bind(this)}
             data-content={this.props.userstore.getText('updateBasket')}>
          <i className='refresh icon' />
        </div>
        <div className='ui button'
             onClick={this.toggleSelectionAll.bind(this)}
             data-content={this.props.userstore.getText('selectUnselectAll')}>
          <i className={this.state.checkbox + ' icon'} />
        </div>
        <div className={'ui disabled button'}>
          {this.getBasketStateText()}
        </div>
      </div>
      <div ref='cards' style={this.cardRowStyle} onWheel={this.scrollHorizontal.bind(this)}>
        {this.state.basketItems.map(function(item, idx) {
          return <BasketItem content={item} key={'EXPLORE-BASKET-ITEM-' + item.id} basketstore={self.props.basketstore} />
        })}
      </div>
    </div>
  }
}

export default Basket;

//<div
//  className={'ui button ' + this.state.previousPageActive}
//  onClick={this.setOffset.bind(this, this.state.offset-this.state.displaySize)}>
//  <i className='angle left icon' />
//</div>
//<div
//className={'ui button' + this.state.nextPageActive}
//onClick={this.setOffset.bind(this, this.state.offset+this.state.displaySize)}>
//<i className='angle right icon' />
//  </div>


//
//[
//  {
//    "id":"398A219F9AFE4E07BE658D263A56A7D3",
//    "domaine":"botanique",
//    "image":
//      [{
//        "id":"1FC409720DD744E3A7BC1A1281D7FF42",
//        "url":"http://sonneratphoto.mnhn.fr/2012/11/05/4/P06844472.jpg",
//        "thumburl":"http://imager.mnhn.fr/imager2/v25/2012/11/05/4/P06844472.jpg",
//        "copyright":{}
//      }],
//    "scientificname":"Ficus fistulosa",
//    "catalognumber":"P06844472",
//    "recordedby":null,
//    "fieldnumber":null
//  },
//  {
//    "id":"BC535B7B6A4541D296F133C2F4746DD1",
//    "domaine":"botanique",
//    "image":
//      [{
//        "id":"67B5B26D2AA34E12A507642C0C90A67C",
//        "url":"http://sonneratphoto.mnhn.fr/2012/11/12/6/P06879228.jpg",
//        "thumburl":"http://imager.mnhn.fr/imager2/v25/2012/11/12/6/P06879228.jpg",
//        "copyright":{}
//      },
//        {
//          "id":"A919BC56738048D7A1E1407AA551A1F1",
//          "url":"http://dsiphoto.mnhn.fr/sonnera2/LAPI/leafS/S20130627/P06879228.jpg",
//          "thumburl":"http://imager.mnhn.fr/imager/v25/sonnera2/LAPI/leafS/S20130627/P06879228.jpg",
//          "copyright":
//          {
//            "creator":"Paris, Museum National d'Histoire Naturelle, VDa"
//          }
//        }],
//    "scientificname":"Ficus nervosa",
//    "catalognumber":"P06879228",
//    "recordedby":"Poilane, E.",
//    "fieldnumber":"7905"},
//  {
//    "id":"529C978C5DEF428D867DC10512751CE7",
//    "domaine":"botanique",
//    "image":
//      [{
//        "id":"884D1A5A3FE048FD93B0AB4C3B0B211A",
//        "url":"http://sonneratphoto.mnhn.fr/2012/11/09/11/P06875744.jpg",
//        "thumburl":"http://imager.mnhn.fr/imager2/v25/2012/11/09/11/P06875744.jpg",
//        "copyright":{}},
//        {
//          "id":"58BC916895FB4167914A30074E214412",
//          "url":"http://dsiphoto.mnhn.fr/sonnera2/LAPI/leafS/S20130627/P06875744.jpg",
//          "thumburl":"http://imager.mnhn.fr/imager/v25/sonnera2/LAPI/leafS/S20130627/P06875744.jpg",
//          "copyright":
//          {
//            "creator":"Paris, Museum National d'Histoire Naturelle, VDa"
//          }
//        },
//        {
//          "id":"2F6E1DE763B64057ABD297179A8B6414",
//          "url":"http://dsiphoto.mnhn.fr/sonnera2/LAPI/scanR/R20130424/P06875744.jpg",
//          "thumburl":"http://imager.mnhn.fr/imager/v25/sonnera2/LAPI/scanR/R20130424/P06875744.jpg",
//          "copyright":
//          {
//            "creator":"Paris, Muséum National d'Histoire Naturelle, EL"
//          }
//        }],
//    "scientificname":"Ficus nervosa",
//    "catalognumber":"P06875744",
//    "recordedby":"Poilane, E.",
//    "fieldnumber":"7849"}
//]
