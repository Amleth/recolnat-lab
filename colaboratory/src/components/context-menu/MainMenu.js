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

    //this.state = {itemsAtCursor: [], active: false};

    this.menuStyle = {
      //zIndex: 99999
    };

    //this.fixedHeightMenuStyle = {
    //  maxHeight: '100px',
    //  overflowY: 'auto',
    //  overflowX: 'hidden'
    //};

    //this._onContextMenuChange = () => {
    //  const fetchData = () => this.setContextMenuData(this.props.menustore.getElements());
    //  return fetchData.apply(this);
    //};

    this.closeDelay = null;
  }

  //setContextMenuData(elements) {
    //this.setState({itemsAtCursor: elements, active: true});
  //}

  setActiveTool(tool) {
    ToolActions.setTool(tool.uid);
    ToolActions.updateTooltipData(tool.tooltip);
    //this.setState({active: false});
  }

  //buildContextMenuItem(item) {
  //  switch(item.type) {
  //    case TypeConstants.point:
  //      var metadata = this.props.entitystore.getMetadataAbout(item.uid);
  //      if(!metadata.name) {
  //        item.name = "Point sans nom";
  //      }
  //      else {
  //        item.name = metadata.name;
  //      }
  //      return <Point item={item} key={'CTX-POINT-' + item.uid} metadata={metadata} entitystore={this.props.entitystore}/>;
  //      break;
  //    case TypeConstants.path:
  //      var metadata = this.props.entitystore.getMetadataAbout(item.uid);
  //      if(!metadata.name) {
  //        item.name = "Chemin sans nom";
  //      }
  //      else {
  //        item.name = metadata.name;
  //      }
  //      return <Path item={item} key={'CTX-PATH-' + item.uid} metadata={metadata} entitystore={this.props.entitystore}/>;
  //      break;
  //    case TypeConstants.region:
  //      var metadata = this.props.entitystore.getMetadataAbout(item.uid);
  //      if(!metadata.name) {
  //        item.name = "Zone sans nom";
  //      }
  //      else {
  //        item.name = metadata.name;
  //      }
  //      return <Region item={item} key={'CTX-REGION-' + item.uid} metadata={metadata} entitystore={this.props.entitystore}/>;
  //      break;
  //    case TypeConstants.sheet:
  //      var metadata = this.props.entitystore.getMetadataAbout(item.uid);
  //      if(!metadata.name) {
  //        item.name = "Planche sans nom";
  //      }
  //      else {
  //        item.name = metadata.name;
  //      }
  //      return <Sheet item={item} key={'CTX-SHEET-' + item.uid} metadata={metadata} entitystore={this.props.entitystore}/>;
  //      break;
  //    default:
  //      return null;
  //  }
  //}

  //closeMenu(delay) {
  //  this.closeDelay = window.setTimeout(this.setState.bind(this, {active: false}), delay);
  //}
  //
  //cancelCloseMenu() {
  //  if(this.closeDelay) {
  //    window.clearTimeout(this.closeDelay);
  //    this.closeDelay = null;
  //  }
  //}


  componentDidMount() {
    //this.props.menustore.addContextMenuListener(this._onContextMenuChange);
  }

  componentWillUpdate(nextProps, nextState) {
    //if(nextState.active) {
    //  var x = this.props.menustore.getClickLocation().x;
    //  var y = this.props.menustore.getClickLocation().y;
    //  var vHeight = window.innerHeight;
    //  var vWidth = window.innerWidth;
    //  if(y < vHeight / 2) {
    //    this.menuStyle.top = y-10;
    //    this.menuStyle.bottom = 'auto';
    //  }
    //  else {
    //    this.menuStyle.bottom = vHeight-y-10;
    //    this.menuStyle.top = 'auto';
    //  }
    //  if(x < vWidth / 2) {
    //    this.menuStyle.left = x-10;
    //    this.menuStyle.right = 'auto';
    //  }
    //  else {
    //    this.menuStyle.right = vWidth-x-10;
    //    this.menuStyle.left = 'auto';
    //  }
    //}
  }

  componentDidUpdate(prevProps, prevState) {
    //if(this.state.active) {
    //  $('.ui.dropdown', $(this.refs.self.getDOMNode())).dropdown();
    //}
  }

  componentWillUnmount() {
    //this.props.menustore.removeContextMenuListener(this._onContextMenuChange);
  }

  render() {
    var self = this;
    //if(this.state.active) {
      // Add some stuff like "New" menu
      return(
        <div className='ui vertical inverted menu fixed'
             ref='self'
             style={this.menuStyle}>
          <div className='vertically fitted item'>
            <div className='menu'>
              <a className='down item'>Version beta 0.9.2</a>
            </div>
          </div>
        </div>
      );
    //}
    //else {
    //  return null;
    //}
  }
}

export default ContextMenu;