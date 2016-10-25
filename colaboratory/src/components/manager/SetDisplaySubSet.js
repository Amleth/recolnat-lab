/**
 * Created by dmitri on 31/08/16.
 */
import React from 'react';

import MenuActions from '../../actions/MenuActions';
import ManagerActions from '../../actions/ManagerActions';
import InspectorActions from '../../actions/InspectorActions';
import MetadataActions from '../../actions/MetadataActions';
import ModeActions from '../../actions/ModeActions';

import ModeConstants from '../../constants/ModeConstants';

class SetDisplaySubSet extends React.Component {
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
        isActive: this.props.managerstore.getActiveId(this.props.index) === this.props.set.uid,
        isSelected: this.props.managerstore.getSelected().id === this.props.set.uid
      });
      return changeSelected.apply(this);
    };

    this.state = {
      set: null,
      disablePointerEvents: false,
      icon: 'ui icon wait',
      isActive: false,
      isSelected: false
    };
  }

  //itemMetadataUpdated() {
  //  var metadata = this.props.metastore.getMetadataAbout(this.props.set.uid);
  //  var icon = 'ui icon folder';
  //  this.setState({set: metadata, icon: icon});
  //}

  callContextMenu(event) {
    event.preventDefault();
    var entity = JSON.parse(JSON.stringify(this.state.set));
    var index = this.props.index;
    var objectsAtEvent = {
      sets:[],
      specimens: [],
      images: []
    };

    objectsAtEvent.sets.push({
      parent: this.props.parentSetId,
      link: entity.link,
      data: entity
    });

    MenuActions.displayContextMenu(event.clientX, event.clientY, objectsAtEvent);
  }

  startDragSet(event) {
    this.props.dragstore.setAction('managerDragSet', JSON.parse(JSON.stringify(this.state.set)));
    event.dataTransfer.setData('text/plain', this.state.set.uid);
    event.dataTransfer.dropEffect = 'move';
  }

  clearDrag() {
    this.props.dragstore.setAction(null, null);
  }

  setActive() {
    var node = this.state.set;
    //console.log(JSON.stringify(this.props.set));
    window.setTimeout(ManagerActions.select.bind(null,node.uid, node.type, node.name, this.props.parentSetId, this.props.set.link),10);
    window.setTimeout(ManagerActions.selectEntityInSetById.bind(null, this.props.parentSetId, node.uid), 10);
    window.setTimeout(InspectorActions.setInspectorData.bind(null, [node.uid]), 10);
    if(node.type === 'Set') {
      window.setTimeout(MetadataActions.setLabBenchId.bind(null, node.uid), 10);
    }

    window.setTimeout(InspectorActions.setSetInAnnotationList.bind(null, node.uid), 10);
  }

  selectAndLoadSet() {
    window.setTimeout(MetadataActions.setLabBenchId.bind(null, this.state.set.uid), 10);
    window.setTimeout(ManagerActions.selectEntityInSetById.bind(null, this.props.parentSetId, this.state.set.uid), 10);
    window.setTimeout(ModeActions.changeMode.bind(null,ModeConstants.Modes.OBSERVATION),30);
  }

  componentDidMount() {
    //this.props.metastore.addMetadataUpdateListener(this.props.set.uid, this.itemMetadataUpdated.bind(this));
    this.props.managerstore.addSelectionChangeListener(this._onSelectionChange);
  }

  componentWillReceiveProps(props) {
    if(props.set.name) {
      this.setState({set: props.set, icon: 'ui icon folder'});
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
    //this.props.metastore.removeMetadataUpdateListener(this.props.set.uid, this.itemMetadataUpdated.bind(this));
    this.props.managerstore.removeSelectionChangeListener(this._onSelectionChange);
  }

  render() {
    if(!this.state.set) {
      return <a className={'item '}
                style={this.linkStyle}
                key={'SET-OPTION-' + this.props.set.uid}
      >
        <div>
          <i className={this.state.icon} style={this.textStyle} />{this.props.set.uid}
        </div>
      </a>
    }
    return <a className={'item '}
              style={this.linkStyle}
              key={'SET-OPTION-' + this.props.set.uid}
              onContextMenu={this.callContextMenu.bind(this)}
              draggable={true}
              onDragStart={this.startDragSet.bind(this)}
              onDragEnd={this.clearDrag.bind(this)}
              onClick={this.setActive.bind(this)}
              onDoubleClick={this.selectAndLoadSet.bind(this)}>
      <div>
        <i className={this.state.icon} style={this.textStyle} />{this.state.set.name}
      </div>
    </a>
  }
}

export default SetDisplaySubSet;