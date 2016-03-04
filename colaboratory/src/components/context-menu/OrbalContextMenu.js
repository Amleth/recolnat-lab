/**
 * Created by dmitri on 26/02/16.
 */
'use strict';

import React from 'react';

import OrbPoint from './options/OrbOptions';

import ViewActions from '../../actions/ViewActions';

import TypeConstants from '../../constants/TypeConstants';

class OrbalContextMenu extends React.Component {
  constructor(props) {
    super(props);

    this.menuSize = 200;
    this.orbSize = 50;
    this.long = (this.menuSize - this.orbSize)/2;
    this.short = this.long*(1-1/Math.sqrt(2));
    this.animDuration = '0.2s';

    this.orbCurve = this.orbSize/2;

    this.menuContainerStyle = {
      zIndex: 9999,
      position: 'fixed',
      display: 'block',
      visibility: 'hidden',
      height: this.menuSize + 'px',
      width: this.menuSize + 'px',
      borderRadius: this.menuSize/2 + 'px'
      //backgroundColor: 'rgba(127,127,127,0.3)'
    };

    this.resetOrbs();

    this.displayText = null;

    this.state = {
      itemsAtCursor: [],
      activeItemIndex: -1,
      active: false
    };

    this._onContextMenuChange = () => {
      const fetchData = () => this.setContextMenuData(this.props.menustore.getElements());
      return fetchData.apply(this);
    };

    this.closeDelay = null;
  }

  resetOrbs() {
    this.orbNWStyle = {
      position: 'absolute',
      top: this.long,
      left: this.long,
      height: this.orbSize + 'px',
      width: this.orbSize + 'px',
      //margin: '0px 25px 25px 0px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      alignContent: 'center',
      borderRadius: this.orbCurve + 'px',
      WebkitTransition: 'top ' + this.animDuration + ' linear 0s, left ' + this.animDuration + ' linear 0s',
      transition: 'top ' + this.animDuration + ' linear 0s, left ' + this.animDuration + ' linear 0s',
      background: 'radial-gradient(circle at 20px 20px, #00FF22, #000)'
    };
    this.orbNStyle = {
      position: 'absolute',
      top: this.long,
      left: this.long,
      height: this.orbSize + 'px',
      width: this.orbSize + 'px',
      //margin: '0px 25px 25px 25px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      alignContent: 'center',
      borderRadius: this.orbCurve + 'px',
      WebkitTransition: 'top ' + this.animDuration + ' linear 0s, left ' + this.animDuration + ' linear 0s',
      transition: 'top ' + this.animDuration + ' linear 0s, left ' + this.animDuration + ' linear 0s',
      background: 'radial-gradient(circle at 20px 20px, #FAEBD7, #000)'
    };
    this.orbNEStyle = {
      position: 'absolute',
      top: this.long,
      right: this.long,
      height: this.orbSize + 'px',
      width: this.orbSize + 'px',
      //margin: '0px 0px 25px 25px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      alignContent: 'center',
      borderRadius: this.orbCurve + 'px',
      WebkitTransition: 'top ' + this.animDuration + ' linear 0s, right ' + this.animDuration + ' linear 0s',
      transition: 'top ' + this.animDuration + ' linear 0s, right ' + this.animDuration + ' linear 0s',
      background: 'radial-gradient(circle at 20px 20px, #DEB887, #000)'
    };

    this.orbWStyle = {
      position: 'absolute',
      top: this.long,
      left: this.long,
      height: this.orbSize + 'px',
      width: this.orbSize + 'px',
      //margin: '25px 25px 25px 0px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      alignContent: 'center',
      borderRadius: this.orbCurve + 'px',
      WebkitTransition: 'top ' + this.animDuration + ' linear 0s, left ' + this.animDuration + ' linear 0s',
      transition: 'top ' + this.animDuration + ' linear 0s, left ' + this.animDuration + ' linear 0s',
      background: 'radial-gradient(circle at 20px 20px, #6495ED, #000)'
    };
    this.orbCStyle = {
      position: 'absolute',
      top: -30,
      left: 0,
      //height: this.orbSize + 'px',
      maxHeight: '20px',
      width: this.menuSize,
      maxWidth: this.menuSize,
      //width: this.orbSize + 'px',
      //margin: '25px 25px 25px 25px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      alignContent: 'center',
      //borderRadius: this.orbCurve + 'px',
      //WebkitTransition: 'top 1s linear 0s, left 1s linear 0s',
      //transition: 'top 1s linear 0s, left 1s linear 0s',
      backgroundColor: 'rgba(100,100,100, 0.7)',
      color: 'white'
    };
    this.orbEStyle = {
      position: 'absolute',
      top: this.long,
      right: this.long,
      height: this.orbSize + 'px',
      width: this.orbSize + 'px',
      //margin: '25px 0px 25px 25px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      alignContent: 'center',
      borderRadius: this.orbCurve + 'px',
      WebkitTransition: 'top ' + this.animDuration + ' linear 0s, right ' + this.animDuration + ' linear 0s',
      transition: 'top ' + this.animDuration + ' linear 0s, right ' + this.animDuration + ' linear 0s',
      background: 'radial-gradient(circle at 20px 20px, #FFD700, #000)'
    };

    this.orbSWStyle = {
      position: 'absolute',
      bottom: this.long,
      left: this.long,
      height: this.orbSize + 'px',
      width: this.orbSize + 'px',
      //margin: '25px 25px 0px 0px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      alignContent: 'center',
      borderRadius: this.orbCurve + 'px',
      WebkitTransition: 'bottom ' + this.animDuration + ' linear 0s, left ' + this.animDuration + ' linear 0s',
      transition: 'bottom ' + this.animDuration + ' linear 0s, left ' + this.animDuration + ' linear 0s',
      background: 'radial-gradient(circle at 20px 20px, #FFA500, #000)'
    };
    this.orbSStyle = {
      position: 'absolute',
      bottom: this.long,
      left: this.long,
      height: this.orbSize + 'px',
      width: this.orbSize + 'px',
      //margin: '25px 25px 0px 25px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      alignContent: 'center',
      borderRadius: this.orbCurve + 'px',
      WebkitTransition: 'bottom ' + this.animDuration + ' linear 0s, left ' + this.animDuration + ' linear 0s',
      transition: 'bottom ' + this.animDuration + ' linear 0s, left ' + this.animDuration + ' linear 0s',
      background: 'radial-gradient(circle at 20px 20px, #EE82EE, #000)'
    };
    this.orbSEStyle = {
      position: 'absolute',
      bottom: this.long,
      right: this.long,
      height: this.orbSize + 'px',
      width: this.orbSize + 'px',
      //margin: '25px 0px 0px 25px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      alignContent: 'center',
      borderRadius: this.orbCurve + 'px',
      WebkitTransition: 'bottom ' + this.animDuration + ' linear 0s, right ' + this.animDuration + ' linear 0s',
      transition: 'bottom ' + this.animDuration + ' linear 0s, right ' + this.animDuration + ' linear 0s',
      background: 'radial-gradient(circle at 20px 20px, #8B0000, #000)'
    };

    this.northWestAction = null;
    this.northAction = null;
    this.northEastAction = null;
    this.southWestAction = null;
    this.southAction = null;
    this.southEastAction = null;

    this.northWestIcon = '';
    this.northIcon = '';
    this.northEastIcon = '';
    this.southWestIcon = '';
    this.southIcon = '';
    this.southEastIcon = '';
  }

  setContextMenuData(elements) {
    this.setState({itemsAtCursor: elements, active: true, activeItemIndex: 0});
  }

  closeMenu(event) {
    if(event.isPropagationStopped) {
      return;
    }
    this.closeDelay = window.setTimeout(this.setState.bind(this, {active: false}), 10);
  }

  cancelCloseMenu() {
    if(this.closeDelay) {
      window.clearTimeout(this.closeDelay);
      this.closeDelay = null;
    }
  }

  previousItem(event) {
    event.stopPropagation();
    if(this.state.activeItemIndex == 0) {
      this.setState({activeItemIndex: this.state.itemsAtCursor.length-1});
    }
    else {
      this.setState({activeItemIndex: this.state.activeItemIndex-1});
    }
  }

  nextItem(event) {
    event.stopPropagation();
    if(this.state.activeItemIndex == this.state.itemsAtCursor.length-1) {
      this.setState({activeItemIndex: 0});
    }
    else {
      this.setState({activeItemIndex: this.state.activeItemIndex+1});
    }
  }

  menuIsActivated() {
    var x = this.props.menustore.getClickLocation().x;
    var y = this.props.menustore.getClickLocation().y;
    this.menuContainerStyle.top = y-this.menuSize/2;
    this.menuContainerStyle.left = x-this.menuSize/2;
    this.menuContainerStyle.visibility = '';

    this.orbNWStyle.top = this.short;
    this.orbNWStyle.left = this.short;

    this.orbNStyle.top = 0;
    this.orbNStyle.left = this.long;

    this.orbNEStyle.top = this.short;
    this.orbNEStyle.right = this.short;

    this.orbWStyle.top = this.long;
    this.orbWStyle.left = 0;

    this.orbEStyle.top = this.long;
    this.orbEStyle.right = 0;

    this.orbSWStyle.bottom = this.short;
    this.orbSWStyle.left = this.short;

    this.orbSStyle.bottom = 0;
    this.orbSStyle.left = this.long;

    this.orbSEStyle.bottom = this.short;
    this.orbSEStyle.right = this.short;
  }

  menuIsDeactivated() {
    this.menuContainerStyle.visibility = 'hidden';
    this.resetOrbs();

    //this.orbNWStyle.top = this.long;
    //this.orbNWStyle.left = this.long;
    //
    //this.orbNStyle.top = this.long;
    //this.orbNStyle.left = this.long;
    //
    //this.orbNEStyle.top = this.long;
    //this.orbNEStyle.right = this.long;
    //
    //this.orbWStyle.top = this.long;
    //this.orbWStyle.left = this.long;
    //
    //this.orbEStyle.top = this.long;
    //this.orbEStyle.right = this.long;
    //
    //this.orbSWStyle.bottom = this.long;
    //this.orbSWStyle.left = this.long;
    //
    //this.orbSStyle.bottom = this.long;
    //this.orbSStyle.left = this.long;
    //
    //this.orbSEStyle.bottom = this.long;
    //this.orbSEStyle.right = this.long;
  }

  setMenuDataByContext(item) {
    var metadata = this.props.entitystore.getMetadataAbout(item.id);
    this.displayText = metadata.name;
    if(!this.displayText) {
      this.displayText = "Objet sans nom";
    }
    //console.log('Setting name to ' + this.displayText);
    switch(item.type) {
      case TypeConstants.point:
        this.displayText = '(Point) ' + this.displayText;
        this.northWestAction = OrbPoint.annotate.bind(null, item);
        this.northAction = OrbPoint.zoomToObject.bind(null, '#POI-' + item.id, this.props.viewstore.getView());
        this.northEastAction;
        this.southWestAction;
        if(metadata.deletable) {
          this.southAction = OrbPoint.remove.bind(null, item,
            function (err) {
              console.error(err);
            },
            function (res) {
              ViewActions.updateMetadata(null);
            }
          );

          this.southEastAction = OrbPoint.edit.bind(null, item);
        }

        this.northWestIcon = 'edit';
        this.northIcon = 'eye';
        this.northEastIcon = 'users';
        this.southWestIcon = 'info';
        if(metadata.deletable) {
          this.southIcon = 'trash';
          this.southEastIcon = 'setting';
        }
        else {
          this.orbSStyle.visibility = 'hidden';
          this.orbSEStyle.visibility = 'hidden';
        }

        break;
      case TypeConstants.path:
        this.displayText = '(Chemin) ' + this.displayText;
        this.northWestAction = OrbPoint.annotate.bind(null, item);
        this.northAction = OrbPoint.zoomToObject.bind(null, '#PATH-' + item.id, this.props.viewstore.getView());
        this.northEastAction;
        this.southWestAction;
        if(metadata.deletable) {
          this.southAction = OrbPoint.remove.bind(null, item,
            function (err) {
              console.error(err);
            },
            function (res) {
              ViewActions.updateMetadata(null);
            }
          );

          this.southEastAction = OrbPoint.edit.bind(null, item);
        }

        this.northWestIcon = 'edit';
        this.northIcon = 'eye';
        this.northEastIcon = 'users';
        this.southWestIcon = 'info';
        if(metadata.deletable) {
          this.southIcon = 'trash';
          this.southEastIcon = 'setting';
        }
        else {
          this.orbSStyle.visibility = 'hidden';
          this.orbSEStyle.visibility = 'hidden';
        }
        break;
      case TypeConstants.region:
        this.displayText = '(Zone) ' + this.displayText;
        this.northWestAction = OrbPoint.annotate.bind(null, item);
        this.northAction = OrbPoint.zoomToObject.bind(null, '#ROI-' + item.id, this.props.viewstore.getView());
        this.northEastAction;
        this.southWestAction;
        if(metadata.deletable) {
          this.southAction = OrbPoint.remove.bind(null, item,
            function (err) {
              console.error(err);
            },
            function (res) {
              ViewActions.updateMetadata(null);
            }
          );

          this.southEastAction = OrbPoint.edit.bind(null, item);
        }

        this.northWestIcon = 'edit';
        this.northIcon = 'eye';
        this.northEastIcon = 'users';
        this.southWestIcon = 'info';
        if(metadata.deletable) {
          this.southIcon = 'trash';
          this.southEastIcon = 'setting';
        }
        else {
          this.orbSStyle.visibility = 'hidden';
          this.orbSEStyle.visibility = 'hidden';
        }
        break;
      case TypeConstants.sheet:
        this.displayText = '(Planche) ' + this.displayText;
        this.northWestAction = OrbPoint.annotate.bind(null, item);
        this.northAction = OrbPoint.zoomToObject.bind(null, '#GROUP-' + item.id, this.props.viewstore.getView());
        this.northEastAction;
        this.southWestAction;
        if(metadata.deletable) {
          this.southAction = OrbPoint.remove.bind(null, item,
            function (err) {
              console.error(err);
            },
            function (res) {
              ViewActions.updateMetadata(null);
            }
          );

          this.southEastAction = OrbPoint.edit.bind(null, item);
        }

        this.northWestIcon = 'edit';
        this.northIcon = 'eye';
        this.northEastIcon = 'users';
        this.southWestIcon = 'info';
        if(metadata.deletable) {
          this.southIcon = 'trash';
          this.southEastIcon = 'setting';
        }
        else {
          this.orbSStyle.visibility = 'hidden';
          this.orbSEStyle.visibility = 'hidden';
        }
        break;
      default:
        log.warning('No specific orbal context menu for type ' + item.type);
        break;
    }

  }

  componentDidMount() {
    this.props.menustore.addContextMenuListener(this._onContextMenuChange);
  }

  componentWillUpdate(nextProps, nextState) {
    if(nextState.active && !this.state.active) {
      // Transition from closed to open
      this.menuIsActivated();
    }
    else if(!nextState.active && this.state.active) {
      // Transition from open to closed
      this.menuIsDeactivated();
    }

    if(nextState.active) {
      if(nextState.itemsAtCursor.length > 0) {
        // Set actions according to object type
        var item = nextState.itemsAtCursor[nextState.activeItemIndex];
        this.setMenuDataByContext(item);

        //console.log(JSON.stringify(item));
        //this.displayText = item.name;
      }
      else {
        // Right-click is on the workbench background
        this.orbEStyle.visibility = 'hidden';
        this.orbWStyle.visibility = 'hidden';
      }
    }
  }

  componentWillUnmount() {
    this.props.menustore.removeContextMenuListener(this._onContextMenuChange);
  }

  render() {
    return (
      <div style={this.menuContainerStyle}
           onMouseEnter={this.cancelCloseMenu.bind(this)}
           onMouseLeave={this.closeMenu.bind(this, 500)}
           onClick={this.closeMenu.bind(this)}>

        <div style={this.orbCStyle} className='ui segment'>
          {this.displayText}
        </div>

        <div style={this.orbNWStyle}
             onClick={this.northWestAction}>
          <i className={'ui ' + this.northWestIcon + ' big inverted icon'}/>
        </div>
        <div style={this.orbNStyle}
             onClick={this.northAction}>
          <i className={'ui ' + this.northIcon + ' big inverted icon'}/>
        </div>
        <div style={this.orbNEStyle}
             onClick={this.northEastAction}>
          <i className={'ui ' + this.northEastIcon + ' big inverted icon'}/>
        </div>

        <div style={this.orbWStyle}
             onClick={this.previousItem.bind(this)}>
          <i className='ui arrow left big inverted icon'/>
        </div>

        <div style={this.orbEStyle}
             onClick={this.nextItem.bind(this)}>
          <i className='ui arrow right big inverted icon'/>
        </div>

        <div style={this.orbSWStyle}
        onClick={this.southWestAction}>
          <i className={'ui ' + this.southWestIcon + ' big inverted icon'}/>
        </div>
        <div style={this.orbSStyle}
             onClick={this.southAction}>
          <i className={'ui ' + this.southIcon + ' big inverted icon'}/>
        </div>
        <div style={this.orbSEStyle}
             onClick={this.southEastAction}>
          <i className={'ui ' + this.southEastIcon + ' big inverted icon'}/>
        </div>
      </div>
    )
  }

}

export default OrbalContextMenu;