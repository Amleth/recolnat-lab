/**
 * Created by Dmitri Voitsekhovitch on 12/08/15.
 */
"use strict";
import React from "react";

import Point from './Point';
import Path from './Path';
import Region from './Region';
import Sheet from './Sheet';
import ContextMenuTool from './ContextMenuTool';

import ToolActions from "../../actions/ToolActions";
import ViewActions from '../../actions/ViewActions';

import TypeConstants from '../../constants/TypeConstants';

import ToolConf from '../../conf/Tools-conf';

class ContextMenu extends React.Component {
  constructor(props) {
    super(props);

    this.state = {itemsAtCursor: [], active: false};

    this.menuStyle = {
      zIndex: 99999
    };

    this.fixedHeightMenuStyle = {
      maxHeight: '100px',
      overflowY: 'auto',
      overflowX: 'hidden'
    };

    this._onContextMenuChange = () => {
      const fetchData = () => this.setContextMenuData(this.props.menustore.getElements());
      return fetchData.apply(this);
    };

    this.closeDelay = null;
  }

  setContextMenuData(elements) {
    this.setState({itemsAtCursor: elements, active: true});
  }

  setActiveTool(tool) {
    ToolActions.setTool(tool.uid);
    ToolActions.updateTooltipData(tool.tooltip);
    this.setState({active: false});
  }

  buildContextMenuItem(item) {
    switch(item.type) {
      case TypeConstants.point:
        var metadata = this.props.metastore.getMetadataAbout(item.uid);
        if(!metadata.name) {
          item.name = "Point sans nom";
        }
        else {
          item.name = metadata.name;
        }
        return <Point item={item} key={'CTX-POINT-' + item.uid} metadata={metadata} metastore={this.props.metastore}/>;
        break;
      case TypeConstants.path:
        var metadata = this.props.metastore.getMetadataAbout(item.uid);
        if(!metadata.name) {
          item.name = "Chemin sans nom";
        }
        else {
          item.name = metadata.name;
        }
        return <Path
          item={item}
          key={'CTX-PATH-' + item.uid}
          metadata={metadata}
          metastore={this.props.metastore}/>;
        break;
      case TypeConstants.region:
        var metadata = this.props.metastore.getMetadataAbout(item.uid);
        if(!metadata.name) {
          item.name = "Zone sans nom";
        }
        else {
          item.name = metadata.name;
        }
        return <Region
          item={item}
          key={'CTX-REGION-' + item.uid}
          metadata={metadata}
          metastore={this.props.metastore}/>;
        break;
      case TypeConstants.sheet:
        var metadata = this.props.metastore.getMetadataAbout(item.uid);
        if(!metadata.name) {
          item.name = "Planche sans nom";
        }
        else {
          item.name = metadata.name;
        }
        return <Sheet item={item} key={'CTX-SHEET-' + item.uid} metadata={metadata} metastore={this.props.metastore}/>;
        break;
      default:
        return null;
    }
  }

  closeMenu(delay) {
    this.closeDelay = window.setTimeout(this.setState.bind(this, {active: false}), delay);
  }

  cancelCloseMenu() {
    if(this.closeDelay) {
      window.clearTimeout(this.closeDelay);
      this.closeDelay = null;
    }
  }

  fitViewToImage() {
    var image = this.props.ministore.getImage();
    var viewport = this.props.viewstore.getView();
    var scale = 1.0;

    if(image.height > image.width) {
      scale = (viewport.height) / image.height;
    }
    else {
      scale = viewport.width / image.width;
    }

    ViewActions.updateViewport(
      -((image.xZero)*scale),
      -((image.yZero)*scale),
      null,
      null,
      scale
    );
  }

  resetZoom() {
    var view = this.props.viewstore.getView();
    if(view.scale == 1.0) {
      return;
    }
    ViewActions.updateViewport(
      (view.left-view.width/2)/view.scale,
      (view.top-view.height/2)/view.scale,
      null,
      null,
      1.0
    );
  }

  componentDidMount() {
    this.props.menustore.addContextMenuListener(this._onContextMenuChange);
  }

  componentWillUpdate(nextProps, nextState) {
    if(nextState.active) {
      var x = this.props.menustore.getClickLocation().x;
      var y = this.props.menustore.getClickLocation().y;
      var vHeight = window.innerHeight;
      var vWidth = window.innerWidth;
      if(y < vHeight / 2) {
        this.menuStyle.top = y-10;
        this.menuStyle.bottom = 'auto';
      }
      else {
        this.menuStyle.bottom = vHeight-y-10;
        this.menuStyle.top = 'auto';
      }
      if(x < vWidth / 2) {
        this.menuStyle.left = x-10;
        this.menuStyle.right = 'auto';
      }
      else {
        this.menuStyle.right = vWidth-x-10;
        this.menuStyle.left = 'auto';
      }
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if(this.state.active) {
      $('.ui.dropdown', $(this.refs.self.getDOMNode())).dropdown();
    }
  }

  componentWillUnmount() {
    this.props.menustore.removeContextMenuListener(this._onContextMenuChange);
  }

  render() {
    var self = this;
    if(this.state.active) {
      // Add some stuff like "New" menu
      return(
        <div className='ui vertical inverted menu fixed'
             ref='self'
             style={this.menuStyle}
             onMouseEnter={this.cancelCloseMenu.bind(this)}
             onMouseLeave={this.closeMenu.bind(this, 500)}
             onClick={this.closeMenu.bind(this, 1)}>
          <div className='vertically fitted item'>
            <div className='menu'>
              <ContextMenuTool toolstore={this.props.toolstore}
                               tool={ToolConf.moveView}
                               displayText='Déplacer la vue' />
              <ContextMenuTool toolstore={this.props.toolstore}
                               tool={ToolConf.moveObject}
                               displayText='Déplacer une planche' />
              <ContextMenuTool toolstore={this.props.toolstore}
                               tool={ToolConf.selectObject}
                               displayText='Sélectionner une planche' />
            </div>
          </div>
          <div className='vertically fitted item'>
            <div className='menu'>
              <a className='item' onClick={ViewActions.fitView}>Tout</a>
              <a className='item' onClick={this.fitViewToImage.bind(this)}>Planche</a>
              <a className='item' onClick={this.resetZoom.bind(this)}>1:1</a>
            </div>
          </div>
          <div className='vertically fitted item'>
            <div className='menu'>
              <a className='down item'>Exporter la planche</a>
            </div>
          </div>
          <div className='vertically fitted item'>
            <div className='menu'>
              <ContextMenuTool toolstore={this.props.toolstore}
                               tool={ToolConf.newPointOfInterest}
                               displayText='Créer un point' />
              <ContextMenuTool toolstore={this.props.toolstore}
                               tool={ToolConf.newPath}
                               displayText='Créer un chemin' />
              <ContextMenuTool toolstore={this.props.toolstore}
                               tool={ToolConf.newRegionOfInterest}
                               displayText='Créer une zone' />
              <ContextMenuTool toolstore={this.props.toolstore}
                               tool={ToolConf.lineMeasure}
                               displayText='Règle' />
            </div>
          </div>
          <div className='vertically fitted item'>
            <div className='menu' style={this.fixedHeightMenuStyle}>
              {this.state.itemsAtCursor.map(function(item) {
                return self.buildContextMenuItem.call(self, item);
              })}
            </div>
          </div>
        </div>
      );
    }
    else {
      return null;
    }
  }
}

export default ContextMenu;