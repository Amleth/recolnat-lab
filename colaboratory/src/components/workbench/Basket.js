/**
 * Created by dmitri on 11/01/16.
 */
'use strict';

import React from 'react';

import BasketItem from './BasketItem';

import ManagerActions from '../../actions/ManagerActions';

class Basket extends React.Component {
  constructor(props) {
    super(props);

    this.cardRowStyle = {
      display: 'flex',
      flexDirection: 'row',
      maxHeight: '250px',
      margin: '5px 0 5px 0',
      overflowY: 'auto',
      overflowX: 'auto'
    };

    this.state = {
      basketItems: [],
      basketReady: false
      //offset: 0,
      //displaySize: 6,
      //previousPageActive: 'disabled',
      //nextPageActive: 'disabled'
    };

    this._onBasketUpdate = () => {
      const setBasket = () => this.setState({basketItems: this.props.managerstore.getBasket()});
      setBasket.apply(this);
    }
  }

  reloadBasket() {
    if(!this.state.basketReady) {
      alert('Le panier est indisponible, réessayez dans quelques secondes');
      return;
    }

    //var self = this;
    xdLocalStorage.getItem('panier_erecolnat', function(data) {
      console.log(data);
      var basket;
      if (data.value == null) {
        basket = [];
      }
      else {
        basket = JSON.parse(data.value);
      }
      ManagerActions.setBasket(basket);
      //self.setState({basketItems: basket});
    })
  }

  getBasketStateText() {
    if(this.state.basketItems.length == 0) {
      return 'Votre panier Recherche est vide. Allez sur explore.recolnat.org pour le remplir.';
    }
    else {
      return this.state.basketItems.length + ' images dans le panier Recherche';
    }
  }

  setOffset(offset) {
    this.setState({offset: offset});
  }

  toggleSelectionAll() {
    if(this.props.managerstore.getBasketSelection().length == this.props.managerstore.getBasket().length) {
      // Unselect all
      ManagerActions.changeBasketSelectionState(null, false);
    }
    else {
      // Select all
      ManagerActions.changeBasketSelectionState(null, true);
    }
  }

  componentDidMount() {
    var self = this;
    xdLocalStorage.init({
      iframeUrl:'https://wp5test.recolnat.org/basket',
      initCallback: function() {
        console.log('Got iframe ready');
        self.setState({basketReady: true});
      }
    });

    this.props.managerstore.addBasketUpdateListener(this._onBasketUpdate);
  }

  componentWillUpdate(nextProps, nextState) {
    if(this.props.managerstore.getBasketSelection().length == this.props.managerstore.getBasket().length) {
      nextState.checkbox = 'checkmark box';
    }
    else {
      nextState.checkbox = 'square outline';
    }
    //if(nextState.basketItems.length == 0) {
    //  nextState.offset = 0;
    //}
    //if(nextState.offset == 0) {
    //  nextState.previousPageActive = 'disabled';
    //}
    //else {
    //  nextState.previousPageActive = '';
    //}
    //if(nextState.offset+this.state.displaySize < nextState.basketItems.length) {
    //  nextState.nextPageActive = '';
    //}
    //else {
    //  nextState.nextPageActive = 'disabled';
    //}
  }

  componentDidUpdate(prevProps, prevState) {
    if(!prevState.basketReady && this.state.basketReady) {
      this.reloadBasket();
    }
    if(this.state.basketItems.length > 0) {
      $('.basketItem .image', this.refs.cards.getDOMNode()).dimmer({
        on: 'hover',
        opacity: 0.2
      });
    }
  }

  componentWillUnmount() {
    this.props.managerstore.removeBasketUpdateListener(this._onBasketUpdate);
  }

  render() {
    if(!this.state.basketReady) {
      return <div>
        Connexion au panier
      </div>;
    }
    var self = this;
    return <div>
      <div className='ui buttons'>
        <div className='ui button' onClick={this.reloadBasket.bind(this)}>
          <i className='refresh icon' />
        </div>
        <div className='ui button' onClick={this.toggleSelectionAll.bind(this)}>
          <i className={this.state.checkbox + ' icon'} />
        </div>
        <div className={'ui disabled button'}>
          {this.getBasketStateText()}
        </div>
      </div>
      <div ref='cards' style={this.cardRowStyle}>
        {this.state.basketItems.map(function(item, idx) {
          //if(idx < self.state.offset || idx > self.state.offset+self.state.displaySize-1) {
          //  return null;
          //}
          return <BasketItem content={item} key={'EXPLORE-BASKET-ITEM-' + item.id} managerstore={self.props.managerstore} />
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