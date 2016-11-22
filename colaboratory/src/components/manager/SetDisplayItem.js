/**
 * Created by dmitri on 31/08/16.
 */
import React from 'react';

import MenuActions from '../../actions/MenuActions';
import ManagerActions from '../../actions/ManagerActions';
import InspectorActions from '../../actions/InspectorActions';
import MetadataActions from '../../actions/MetadataActions';

class SetDisplayItem extends React.Component {
  constructor(props) {
    super(props);

    this.linkStyle = {
      margin: 0
    };

    this.textStyle = {
      WebkitUserSelect: 'none',
      MozUserSelect: 'none',
      MsUserSelect: 'none',
      userSelect: 'none'
    };

    this._onSelectionChange = () => {
      const changeSelected = () => this.setState({
        isActive: this.props.managerstore.getActiveId(this.props.index) === this.props.item.uid,
        isSelected: this.props.managerstore.getSelected().id === this.props.item.uid
      });
      return changeSelected.apply(this);
    };

    this.state = {
      item: null,
      disablePointerEvents: false,
      icon: 'ui icon wait',
      isActive: false,
      isSelected: false
    };
  }

  //itemMetadataUpdated() {
  //  var metadata = this.props.metastore.getMetadataAbout(this.props.item.uid);
  //  if(metadata) {
  //    var icon = null;
  //    switch (metadata.type) {
  //      case 'Specimen':
  //        icon = 'ui icon barcode';
  //        break;
  //      case 'Image':
  //        icon = 'ui icon file image outline';
  //        break;
  //      default:
  //    }
  //    console.log('call from ' + this.props.item.uid);
  //    console.log('call from ' + metadata.name);
  //    this.setState({item: metadata, icon: icon});
  //  }
  //}

  callContextMenu(event) {
    event.preventDefault();
    var entity = JSON.parse(JSON.stringify(this.state.item));
    var index = this.props.index;
    var objectsAtEvent = {
      sets:[],
      specimens: [],
      images: []
    };
    switch(entity.type) {
      case 'Specimen':
        objectsAtEvent.specimens.push({
          parent: this.props.parentSetId,
          link: entity.link,
          data: entity
        });
        break;
      case 'Image':
        objectsAtEvent.images.push({
          parent: this.props.parentSetId,
          link: entity.link,
          data: entity
        });
        break;
      default:
        console.error('No processor for ' + entity.type);
    }
    MenuActions.displayContextMenu(event.clientX, event.clientY, objectsAtEvent);
  }

  startDragItem(event) {
    this.props.dragstore.setAction('managerDragItem', JSON.parse(JSON.stringify(this.state.item)));
    event.dataTransfer.setData('text/plain', this.state.item.uid);
    event.dataTransfer.dropEffect = 'move';
  }

  clearDrag() {
    this.props.dragstore.setAction(null, null);
  }

  setActive() {
    var node = this.state.item;
    //console.log(JSON.stringify(this.props.set));
    window.setTimeout(ManagerActions.select.bind(null,node.uid, node.type, node.name, this.props.parentSetId, this.props.item.link),10);
    window.setTimeout(ManagerActions.selectEntityInSetById.bind(null, this.props.parentSetId, node.uid), 10);
    window.setTimeout(InspectorActions.setInspectorData.bind(null, [node.uid]), 10);
    if(node.type === 'Set') {
      window.setTimeout(MetadataActions.setLabBenchId.bind(null, node.uid), 10);
    }
    window.setTimeout(InspectorActions.setImageInAnnotationList.bind(null, node.uid), 10);
  }

  componentDidMount() {
    //this.props.metastore.addMetadataUpdateListener(this.props.item.uid, this.itemMetadataUpdated.bind(this));
    this.props.managerstore.addSelectionChangeListener(this._onSelectionChange);
  }

  componentWillReceiveProps(props) {
    if(props.item.name) {
      this.setState({item: props.item});
      switch (props.item.type) {
        case 'Specimen':
          this.setState({icon :'ui icon barcode'});
          break;
        case 'Image':
          this.setState({icon: 'ui icon file image outline'});
          break;
        default:
      }
    }
  }

  componentWillUpdate(nextProps, nextState) {
    if(nextState.disablePointerEvents) {
      this.linkStyle.pointerEvents = 'none';
    }

    if(nextState.isActive) {
      this.linkStyle.backgroundColor = 'rgba(0,0,0,0.1)';
    }
    else {
      this.linkStyle.backgroundColor = null;
    }
    if(nextState.isSelected) {
      this.linkStyle.color = 'blue';
    }
    else {
      this.linkStyle.color = null;
    }

  }

  componentWillUnmount() {
    //console.log('unmount ' + this.state.item.name);
    //this.props.metastore.removeMetadataUpdateListener(this.props.item.uid, this.itemMetadataUpdated.bind(this));
    this.props.managerstore.removeSelectionChangeListener(this._onSelectionChange);
  }

  render() {
    if(!this.state.item) {
      return <a className={'item '}
                style={this.linkStyle}
                key={'SET-OPTION-' + this.props.item.uid}
                >
        <div>
          <i className={this.state.icon} style={this.textStyle} />{this.props.item.uid}
        </div>
      </a>
    }
    return <a className={'item '}
              style={this.linkStyle}
              key={'SET-OPTION-' + this.props.item.uid}
              onContextMenu={this.callContextMenu.bind(this)}
              draggable={true}
              onDragStart={this.startDragItem.bind(this)}
              onDragEnd={this.clearDrag.bind(this)}
              onClick={this.setActive.bind(this)}>
    <div>
      <i className={this.state.icon} style={this.textStyle} />{this.state.item.name}
    </div>
  </a>
  }
}

export default SetDisplayItem;