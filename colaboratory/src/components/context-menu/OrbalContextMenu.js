/**
 * Created by dmitri on 26/02/16.
 */
'use strict';

import React from 'react';

import OrbOptions from './options/OrbOptions';

import ViewActions from '../../actions/ViewActions';
import MetadataActions from '../../actions/MetadataActions';
import ManagerActions from '../../actions/ManagerActions';

import TypeConstants from '../../constants/TypeConstants';
import ViewConstants from '../../constants/ViewConstants';

import EditPoI from '../../tools/editors/EditPoI';

import D3ViewUtils from '../../utils/D3ViewUtils';

class OrbalContextMenu extends React.Component {
  constructor(props) {
    super(props);

    this.menuSize = 120;
    this.orbSize = 30;
    this.long = (this.menuSize - this.orbSize)/2;
    this.short = this.long*(1-1/Math.sqrt(2));
    this.animDuration = '0.2s';

    this.orbCurve = this.orbSize/2;

    this.menuContainerStyle = {
      zIndex: ViewConstants.zIndices.contextMenu,
      position: 'fixed',
      display: 'block',
      visibility: 'hidden',
      height: this.menuSize + 'px',
      width: this.menuSize + 'px',
      borderRadius: this.menuSize/2 + 'px'
      //backgroundColor: 'rgba(127,127,127,0.3)'
    };

    this.resetOrbs();

    this.displayText = '';

    this.state = OrbalContextMenu.getInitialState();

    this._onContextMenuChange = () => {
      const fetchData = () => this.setContextMenuData(this.props.menustore.getElements());
      return fetchData.apply(this);
    };

    this._onActiveItemMetadataUpdated = () => {
      const activateMenu = () => this.setState({active: true});
      return activateMenu.apply(this);
    };

    this.closeDelay = null;
  }

  static getInitialState() {
    return {
      itemsAtCursor: [],
      activeItemIndex: -1,
      activeItemId: null,
      activeItemLinkId: null,
      active: false
    };
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
      backgroundColor: '#C3FF68'
      //background: 'radial-gradient(circle at 20px 20px, #00FF22, #000)'
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
      backgroundColor: 'grey'
      //background: 'radial-gradient(circle at 20px 20px, #FAEBD7, #000)'
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
      backgroundColor: '#FF9999'
      //background: 'radial-gradient(circle at 20px 20px, #DEB887, #000)'
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
      backgroundColor: '#A0D4A4'
      //background: 'radial-gradient(circle at 20px 20px, #6495ED, #000)'
    };
    this.orbCStyle = {
      position: 'absolute',
      top: -30,
      left: -20,
      //height: this.orbSize + 'px',
      maxHeight: '20px',
      width: this.menuSize + 40,
      maxWidth: this.menuSize + 40,
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
      backgroundColor: '#A0D4A4'
      //background: 'radial-gradient(circle at 20px 20px, #FFD700, #000)'
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
      backgroundColor: '#C0ADDB'
      //background: 'radial-gradient(circle at 20px 20px, #FFA500, #000)'
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
      backgroundColor: '#F14D4C'
      //background: 'radial-gradient(circle at 20px 20px, #8B0000, #000)'
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
      backgroundColor: '#A1BEE6'
      //background: 'radial-gradient(circle at 20px 20px, #EE82EE, #000)'
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
    // console.log(JSON.stringify(elements));
    //elements.unshift({type: 'workbench', id: this.props.entitystore.getSetId()});
    var arrElements = [];
    if(elements.images) {
      for (var i = 0; i < elements.images.length; ++i) {
        arrElements.push(elements.images[i]);
      }
    }
    //arrElements.push(elements.images);
    if(elements.pois) {
      for (i = 0; i < elements.pois.length; ++i) {
        arrElements.push(elements.pois[i]);
      }
    }
    if(elements.tois) {
      for (i = 0; i < elements.tois.length; ++i) {
        arrElements.push(elements.tois[i]);
      }
    }
    if(elements.rois) {
      for (i = 0; i < elements.rois.length; ++i) {
        arrElements.push(elements.rois[i]);
      }
    }
    if(elements.sets) {
      for (i = 0; i < elements.sets.length; ++i) {
        arrElements.push(elements.sets[i]);
      }
    }
    if(elements.specimens) {
      for (i = 0; i < elements.specimens.length; ++i) {
        arrElements.push(elements.specimens[i]);
      }
    }
    //console.log(JSON.stringify(arrElements));
    if(arrElements.length > 0) {
      this.setState({itemsAtCursor: arrElements});
      this.setActiveItem(arrElements.length-1, arrElements, false);
    }
    else {
      this.setState(OrbalContextMenu.getInitialState());
    }
  }

  closeMenu(delay, event) {
    //console.log('closeMenu(' + event + ','  + delay + ')');
    // if(event.isPropagationStopped()) {
    //   return;
    // }
    if(delay) {
      // console.log('closeMenu with delay');
      this.closeDelay = window.setTimeout(this.setState.bind(this, OrbalContextMenu.getInitialState()), delay);
    }
    else {
      this.setState(OrbalContextMenu.getInitialState());
    }
  }

  cancelCloseMenu() {
    // console.log('cancelCloseMenu');
    if(this.closeDelay) {
      window.clearTimeout(this.closeDelay);
      this.closeDelay = null;
    }
  }

  setActiveItem(index, itemIds, keepActive=true) {
    var entity = itemIds[index];
    var id = entity.data.uid;
    var link = entity.link;
    this.props.metastore.addMetadataUpdateListener(id, this._onActiveItemMetadataUpdated);

    this.setState({active: this.state.active && keepActive, activeItemId: id, activeItemLinkId: link, activeItemIndex: index});

    window.setTimeout(this._onActiveItemMetadataUpdated, 50);
  }

  previousItem(event) {
    event.stopPropagation();
    if(this.state.activeItemIndex == 0) {
      this.setActiveItem(this.state.itemsAtCursor.length-1, this.state.itemsAtCursor);
    }
    else {
      this.setActiveItem(this.state.activeItemIndex-1, this.state.itemsAtCursor);
    }
  }

  nextItem(event) {
    event.stopPropagation();
    if(this.state.activeItemIndex == this.state.itemsAtCursor.length-1) {
      this.setActiveItem(0, this.state.itemsAtCursor);
    }
    else {
      this.setActiveItem(this.state.activeItemIndex+1, this.state.itemsAtCursor);
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
    console.log('menuIsDeactivated');
    this.menuContainerStyle.visibility = 'hidden';
    this.resetOrbs();
  }

  setMenuDataByContext() {
    if(!this.state.activeItemId) {
      console.error('No active item in menu');
      return;
    }
    var metadata = this.props.metastore.getMetadataAbout(this.state.activeItemId);
    this.displayText = metadata.name;
    if(!this.displayText) {
      this.displayText = "Objet sans nom";
    }
    switch(metadata.type) {
      case TypeConstants.point:
        this.displayText = '(Point) ' + this.displayText;
        this.northWestAction = EditPoI.startEdit.bind(null, metadata);
        this.northAction = D3ViewUtils.zoomToObject.bind(null, '#POI-' + metadata.uid, this.props.viewstore.getView());
        this.northEastAction = OrbOptions.notAvailable.bind(null);
        this.southWestAction = OrbOptions.showMetadata.bind(null, metadata);
        if(metadata.deletable) {
          this.southAction = OrbOptions.remove.bind(null, metadata,
            function (err) {
              console.error(err);
            },
            function (res) {
              //MetadataActions.updateLabBenchFrom();
            }
          );

          this.southEastAction = OrbOptions.notAvailable.bind(null);
        }

        this.northWestIcon = 'edit';
        this.northIcon = 'eye';
        this.northEastIcon = 'users';
        this.southWestIcon = 'info';
        this.orbNEStyle.visibility = 'hidden';
        this.orbSWStyle.visibility = 'hidden';
        this.orbSEStyle.visibility = 'hidden';
        if(metadata.deletable) {
          this.southIcon = 'trash';
          this.southEastIcon = 'setting';
        }
        else {
          this.orbSStyle.visibility = 'hidden';
        }

        break;
      case TypeConstants.trail:
        this.displayText = '(Chemin) ' + this.displayText;
        this.northWestAction = OrbOptions.notAvailable.bind(null);
        this.northAction = D3ViewUtils.zoomToObject.bind(null, '#PATH-' + metadata.uid, this.props.viewstore.getView());
        this.northEastAction = OrbOptions.notAvailable.bind(null);
        this.southWestAction = OrbOptions.showMetadata.bind(null, metadata);
        if(metadata.deletable) {
          this.southAction = OrbOptions.remove.bind(null, metadata,
            function (err) {
              console.error(err);
            },
            function (res) {
              //MetadataActions.updateLabBenchFrom();
            }
          );
          this.southEastAction = OrbOptions.notAvailable.bind(null);
        }

        this.northWestIcon = 'edit';
        this.northIcon = 'eye';
        this.northEastIcon = 'users';
        this.southWestIcon = 'info';
        this.orbNEStyle.visibility = 'hidden';
        this.orbSWStyle.visibility = 'hidden';
        this.orbSEStyle.visibility = 'hidden';
        if(metadata.deletable) {
          this.southIcon = 'trash';
          this.southEastIcon = 'setting';
        }
        else {
          this.orbSStyle.visibility = 'hidden';
        }
        break;
      case TypeConstants.region:
        this.displayText = '(Zone) ' + this.displayText;
        this.northWestAction = OrbOptions.notAvailable.bind(null);
        this.northAction = D3ViewUtils.zoomToObject.bind(null, '#ROI-' + metadata.uid, this.props.viewstore.getView());
        this.northEastAction = OrbOptions.notAvailable.bind(null);
        this.southWestAction = OrbOptions.showMetadata.bind(null, metadata);
        if(metadata.deletable) {
          this.southAction = OrbOptions.remove.bind(null, metadata,
            function (err) {
              console.error(err);
            },
            function (res) {
              //MetadataActions.updateLabBenchFrom();
            }
          );

          this.southEastAction = OrbOptions.notAvailable.bind(null);
        }

        this.northWestIcon = 'edit';
        this.northIcon = 'eye';
        this.northEastIcon = 'users';
        this.southWestIcon = 'info';
        this.orbNEStyle.visibility = 'hidden';
        this.orbSWStyle.visibility = 'hidden';
        this.orbSEStyle.visibility = 'hidden';
        if(metadata.deletable) {
          this.southIcon = 'trash';
          this.southEastIcon = 'setting';
        }
        else {
          this.orbSStyle.visibility = 'hidden';
        }
        break;
      case TypeConstants.image:
        this.displayText = '(Image) ' + this.displayText;
        this.northWestAction = OrbOptions.notAvailable.bind(null);
        this.northAction = D3ViewUtils.zoomToObject.bind(null, '#GROUP-' + this.state.activeItemLinkId, this.props.viewstore.getView());
        this.northEastAction = OrbOptions.notAvailable.bind(null);
        this.southWestAction = OrbOptions.notAvailable.bind(null);
        if(metadata.deletable) {
          this.southAction = OrbOptions.remove.bind(null, metadata,
            function (err) {
              console.error(err);
            },
            function (res) {
              //MetadataActions.updateLabBenchFrom();
            }
          );

          this.southEastAction = OrbOptions.notAvailable.bind(null);
        }

        this.northWestIcon = 'edit';
        this.northIcon = 'eye';
        this.northEastIcon = 'users';
        this.orbNEStyle.visibility = 'hidden';
        this.orbNWStyle.visibility = 'hidden';
        this.orbSWStyle.visibility = 'hidden';
        this.orbSEStyle.visibility = 'hidden';
        //this.southWestIcon = 'info';
        if(metadata.deletable) {
          this.southIcon = 'trash';
          this.southEastIcon = 'setting';
        }
        else {
          this.orbSStyle.visibility = 'hidden';
        }

        this.orbSWStyle.visibility = 'hidden';
        break;
      case 'Set':
        this.northWestAction = OrbOptions.notAvailable.bind(null);
        this.northAction = OrbOptions.notAvailable.bind(null);
        this.northEastAction = OrbOptions.notAvailable.bind(null);
        this.southWestAction = OrbOptions.notAvailable.bind(null);
        if(metadata.deletable) {
          var data = {
            link: this.state.activeItemLinkId
          };
          this.southAction = OrbOptions.unlinkFromSet.bind(null, data,
            function (err) {
              console.error(err);
            },
            function (res) {
              //MetadataActions.updateLabBenchFrom(metadata.uid);
              //ManagerActions.reloadDisplayedSets();
            }
          );

          this.southEastAction = OrbOptions.notAvailable.bind(null);
        }

        this.northWestIcon = 'edit';
        this.northIcon = 'eye';
        this.northEastIcon = 'users';
        this.southWestIcon = 'info';
        this.southIcon = 'unlink';
        this.southEastIcon = 'setting';

        this.orbNWStyle.visibility = 'hidden';
        this.orbNStyle.visibility = 'hidden';
        this.orbNEStyle.visibility = 'hidden';
        this.orbSWStyle.visibility = 'hidden';
        if(metadata.deletable) {
          this.orbSStyle.visibility = '';
        }
        else {
          this.orbSStyle.visibility = 'hidden';
        }
        this.orbSEStyle.visibility = 'hidden';
        break;
      case 'Specimen':
        this.northWestAction = OrbOptions.notAvailable.bind(null);
        this.northAction = OrbOptions.notAvailable.bind(null);
        this.northEastAction = OrbOptions.notAvailable.bind(null);
        this.southWestAction = OrbOptions.notAvailable.bind(null);
        if(metadata.deletable) {
          this.southAction = OrbOptions.unlinkFromSet.bind(null, {
              link: this.state.activeItemLinkId
            },
            function (err) {
              console.error(err);
            },
            function (res) {
              //MetadataActions.updateLabBenchFrom(metadata.uid);
              //ManagerActions.reloadDisplayedSets();
            }
          );

          this.southEastAction = OrbOptions.notAvailable.bind(null);
        }

        this.northWestIcon = 'edit';
        this.northIcon = 'eye';
        this.northEastIcon = 'users';
        this.southWestIcon = 'info';
        this.southIcon = 'unlink';
        this.southEastIcon = 'setting';

        this.orbNWStyle.visibility = 'hidden';
        this.orbNStyle.visibility = 'hidden';
        this.orbNEStyle.visibility = 'hidden';
        this.orbSWStyle.visibility = 'hidden';
        if(metadata.deletable) {
          this.orbSStyle.visibility = '';
        }
        else {
          this.orbSStyle.visibility = 'hidden';
        }
        this.orbSEStyle.visibility = 'hidden';
        break;
      //case 'workbench':
      //  this.orbNWStyle.visibility = 'hidden';
      //  this.orbNEStyle.visibility = 'hidden';
      //  this.orbSWStyle.visibility = 'hidden';
      //  this.orbSStyle.visibility = 'hidden';
      //  this.orbSEStyle.visibility = 'hidden';
      //
      //  this.northIcon = 'eye';
      //
      //  this.northAction = ViewActions.fitView.bind(null);"
      //
      //  break;
      default:
        console.warn('No specific orbal context menu for type ' + metadata.type);
        break;
    }

  }

  componentDidMount() {
    this.props.menustore.addContextMenuListener(this._onContextMenuChange);
  }

  componentWillUpdate(nextProps, nextState) {
    this.orbNWStyle.visibility = '';
    this.orbNStyle.visibility = '';
    this.orbNEStyle.visibility = '';
    this.orbWStyle.visibility = '';
    this.orbEStyle.visibility = '';
    this.orbSWStyle.visibility = '';
    this.orbSStyle.visibility = '';
    this.orbSEStyle.visibility = '';

    // console.log('this state active='+this.state.active);
    // console.log('next state active='+nextState.active);
    if(nextState.active && !this.state.active) {
      // Transition from closed to open
      this.menuIsActivated();
    }
    else if(!nextState.active && this.state.active) {
      // Transition from open to closed
      this.menuIsDeactivated();
    }

    if(this.state.animationData) {
      OrbOptions.stopAnimation(this.state.animationData);
      nextState.animationData = null;
    }

    if(nextState.active) {
      if(nextState.itemsAtCursor.length == 1) {
        this.orbEStyle.visibility = 'hidden';
        this.orbWStyle.visibility = 'hidden';
      }

      if(nextState.itemsAtCursor.length > 0) {
        // Set actions according to object type
        //var item = nextState.itemsAtCursor[nextState.activeItemIndex];
        this.setMenuDataByContext();
        if(nextState.activeItemLinkId) {
          nextState.animationData = OrbOptions.beginAnimation(this.state.activeItemLinkId);
        }
        else {
          nextState.animationData = OrbOptions.beginAnimation(this.state.activeItemId);
        }
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

  componentDidUpdate(prevProps, prevState) {
    if(prevState.activeItemId != this.state.activeItemId && prevState.activeItemId) {
      this.props.metastore.removeMetadataUpdateListener(prevState.activeItemId, this._onActiveItemMetadataUpdated);
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
           onClick={this.closeMenu.bind(this, 0)}>

        <div style={this.orbCStyle} className='ui segment'>
          {this.displayText.slice(0, 30)}
        </div>

        <div style={this.orbNWStyle}
             onClick={this.northWestAction}>
          <i className={'ui ' + this.northWestIcon + '  icon'}/>
        </div>
        <div style={this.orbNStyle}
             onClick={this.northAction}>
          <i className={'ui ' + this.northIcon + '  icon'}/>
        </div>
        <div style={this.orbNEStyle}
             onClick={this.northEastAction}>
          <i className={'ui ' + this.northEastIcon + '  icon'}/>
        </div>

        <div style={this.orbWStyle}
             onClick={this.previousItem.bind(this)}>
          <i className='ui arrow left  icon'/>
        </div>

        <div style={this.orbEStyle}
             onClick={this.nextItem.bind(this)}>
          <i className='ui arrow right  icon'/>
        </div>

        <div style={this.orbSWStyle}
             onClick={this.southWestAction}>
          <i className={'ui ' + this.southWestIcon + '  icon'}/>
        </div>
        <div style={this.orbSStyle}
             onClick={this.southAction}>
          <i className={'ui ' + this.southIcon + '  icon'}/>
        </div>
        <div style={this.orbSEStyle}
             onClick={this.southEastAction}>
          <i className={'ui ' + this.southEastIcon + '  icon'}/>
        </div>
      </div>
    )
  }

}

export default OrbalContextMenu;
