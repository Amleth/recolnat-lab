/**
* Created by Dmitri Voitsekhovitch on 12/08/15.
*/
"use strict";
import React from "react";

import ToolActions from "../../actions/ToolActions";

import ObjectTypes from '../../constants/TypeConstants';

import ToolConf from '../../conf/Tools-conf';

class ContextMenu extends React.Component {
constructor(props) {
  super(props);

  this.state = {itemsAtCursor: [], active: false};

  this._onContextMenuChange = () => {
    const fetchData = () => this.setContextMenuData(this.props.menustore.getElements());
    return fetchData.apply(this);
  };
}

setContextMenuData(elements) {
  this.setState({itemsAtCursor: elements, active: true});
}

setActiveTool(tool) {
  ToolActions.setTool(tool.id);
  ToolActions.updateTooltipData(tool.tooltip);
  this.setState({active: false});
}

static buildContextMenuItem(item) {
  switch(item.type) {
    case TypeConstants.point:
      return <Point item={item} />
      break;
      case TypeConstants.path:
      break;
      case TypeConstants.region:
      break;
  }
}

componentDidMount() {
  this.props.menustore.addContextMenuListener(this._onContextMenuChange);
}

componentWillUnmount() {
  this.props.menustore.removeContextMenuListener(this._onContextMenuChange);
}

render() {
  if(this.state.active) {
  // Add some stuff like "New" menu
  return(
    <div className='ui vertical inverted menu'>
    <div className='item'>
    <div className='menu'>
      <a className='item' onClick={this.setActiveTool.bind(this, ToolConf.selectObject)}>Sélectionner un objet</a>
      <a className='item' onClick={this.setActiveTool.bind(this, ToolConf.moveView)}>Déplacer la vue</a>
      <a className='item' onClick={this.setActiveTool.bind(this, ToolConf.moveObject)}>Déplacer les objets du bureau</a>
      </div>
      </div>
    <div className='item'>
    <div className='menu'>
      <a className='item' onClick={this.setActiveTool.bind(this, ToolConf.newPointOfInterest)}>Créer un point</a>
      <a className='item' onClick={this.setActiveTool.bind(this, ToolConf.newPath)}>Créer un chemin</a>
      <a className='item' onClick={this.setActiveTool.bind(this, ToolConf.newRegionOfInterest)}>Créer une zone</a>
    </div>
    </div>
      <a className='item' onClick={this.setActiveTool.bind(this, ToolConf.lineMeasure)}>Mesurer une longueur</a>
      
      <div className='ui dropdown item'>
      Objets sous curseur <i className='ui dropdown icon'/>
    <div className='menu'>
    {this.itemsAtCursor.mep(function(item) {
      return ContextMenu.buildContextMenuItem(item);
    })}
      <a className='item'>Créer un point</a>
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