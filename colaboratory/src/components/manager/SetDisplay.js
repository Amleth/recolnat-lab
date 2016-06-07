/**
 * Created by dmitri on 13/01/16.
 */
'use strict';

import React from 'react';

import ViewActions from '../../actions/ViewActions';
import MetadataActions from '../../actions/MetadataActions';
import ManagerActions from '../../actions/ManagerActions';
import ModalActions from '../../actions/ModalActions';
import ModeActions from '../../actions/ModeActions';
import InspectorActions from '../../actions/InspectorActions';
import MenuActions from '../../actions/MenuActions';

import ModalConstants from '../../constants/ModalConstants';
import ModeConstants from '../../constants/ModeConstants';

import Globals from '../../utils/Globals';

class SetDisplay extends React.Component {
  constructor(props) {
    super(props);

    this.containerStyle = {
      margin: 0,
      padding: 0,
      height: '100%',
      maxWidth: '150px',
      minWidth: '150px'
    };

    // Override automatic position:absolute
    this.labelStyle = {
      position: 'fixed',
      top: 0,
      left: 0,
      margin: 0
    };

    this.titleStyle = {
      height: '30px',
      padding: '4px 0px',
      width: '100%',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    };

    this.listContainerStyle = {
      height: '90%',
      overflowY: 'auto',
      overflowX: 'hidden',
      margin: 0,
      padding: 0
    };

    this.noMarginPaddingStyle = {
      margin: 0,
      padding: 0
    };

    this.textStyle = {
      WebkitUserSelect: 'none',
      MozUserSelect: 'none',
      MsUserSelect: 'none',
      userSelect: 'none'
    };

    this._onSelectionChange = () => {
      const changeSelected = () => this.setState({});
      return changeSelected.apply(this);
    };

    this._onMetadataUpdate = () => {
      const updateMetadata = () => this.updateMetadata();
      return updateMetadata.apply(this);
    };

    this.state = {
      subSets: [],
      items: []
      //selectedId: null
    };

    //console.log(JSON.stringify(props.set));


  }

  setActive(idx, node) {
    //console.log(JSON.stringify(this.props.set));
    window.setTimeout(ManagerActions.select.bind(null,node.uid, node.type, node.name, this.props.set.uid, node.linkToParent),10);
    window.setTimeout(ManagerActions.selectEntityInSetById.bind(null, this.props.set.uid, node.uid), 10);
    window.setTimeout(InspectorActions.setInspectorData.bind(null, [node.uid]), 10);
  }

  selectAndLoadSet(idx, item) {
    window.setTimeout(ViewActions.setActiveSet.bind(null, item.uid), 10);
    window.setTimeout(ManagerActions.selectEntityInSet.bind(null, this.props.index, idx), 10);
    window.setTimeout(ManagerActions.toggleSetManagerVisibility.bind(null,false),20);
    window.setTimeout(ModeActions.changeMode.bind(null,ModeConstants.Modes.ORGANISATION),30);
  }

  updateMetadata() {
    var items = [];
    var subSets = [];
    if(this.props.set) {
      if(this.props.set.subsets) {
        for (var i = 0; i < this.props.set.subsets.length; ++i) {
          var metadata = this.props.metastore.getMetadataAbout(this.props.set.subsets[i].uid);
          if (metadata) {
            //console.log('pushing subset ' +metadata.uid);
            metadata.linkToParent = this.props.set.subsets[i].link;
            subSets.push(metadata);
          }
        }

        subSets = _.sortBy(subSets, Globals.getName);
      }

      if(this.props.set.items) {
        for (i = 0; i < this.props.set.items.length; ++i) {
          var metadata = this.props.metastore.getMetadataAbout(this.props.set.items[i].uid);
          if (metadata) {
            metadata.linkToParent = this.props.set.items[i].link;
            //console.log('pushing item ' +metadata.uid);
            items.push(metadata);
          }
        }

        items = _.sortBy(items, Globals.getName);
      }
    }

    this.setState({items: items, subSets: subSets});
  }

  getChildrenData(props) {
    if(props.set) {
      var idsOfElementsToUpdate = [];
      if(props.set.subsets.length > 0) {
        //console.log(JSON.stringify(props.set.subsets));
        for(var i = 0; i < props.set.subsets.length; ++i) {
          idsOfElementsToUpdate.push(props.set.subsets[i].uid);
        }
      }
      if(props.set.items.length > 0) {
        //console.log(JSON.stringify(props.set.items));
        for(var j = 0; j < props.set.items.length; ++j) {
          idsOfElementsToUpdate.push(props.set.items[j].uid);
        }
      }
      window.setTimeout(MetadataActions.updateMetadata.bind(null, idsOfElementsToUpdate), 10);
    }
  }

  callContextMenu(entity, index, event) {
    event.preventDefault();
    var objectsAtEvent = {
      sets:[],
      specimens: [],
      images: []
    };
    switch(entity.type) {
      case 'Set':
        objectsAtEvent.sets.push({
          parent: this.props.set.uid,
          link: entity.linkToParent,
          data: entity
        });
        break;
      case 'Specimen':
        objectsAtEvent.specimens.push({
          parent: this.props.set.uid,
          link: entity.linkToParent,
          data: entity
        });
        break;
      case 'Image':
        objectsAtEvent.images.push({
          parent: this.props.set.uid,
          link: entity.linkToParent,
          data: entity
        });
        break;
      default:
        console.error('No processor for ' + entity.type);
    }
    MenuActions.displayContextMenu(event.clientX, event.clientY, objectsAtEvent);
  }

  componentDidMount() {
    this.props.managerstore.addSelectionChangeListener(this._onSelectionChange);
    this.props.metastore.addMetadataUpdateListener(null, this._onMetadataUpdate);
    if(this.props.set.hash) {
      //this.props.metastore.addMetadataUpdateListener(null, this._onMetadataUpdate);

      this.getChildrenData(this.props);
    }
  }

  componentWillReceiveProps(props) {

    if(props.set.loading) {
      this.setState({subSets: [], items: []});
    }
    else if(props.set.hash != this.props.set.hash) {
      //this.props.metastore.addMetadataUpdateListener(null, this._onMetadataUpdate);

      this.getChildrenData(props);
    }
  }

  componentWillUnmount() {
    this.props.metastore.removeMetadataUpdateListener(null, this._onMetadataUpdate);
    this.props.managerstore.removeSelectionChangeListener(this._onSelectionChange);
  }

  render() {
    var self = this;
    // No content yet, show a loader
    if(this.props.set.loading) {
      return <div className='ui segment' style={this.containerStyle}>
        <div className='ui active inverted dimmer'>
          <div className='ui text loader'></div>
        </div>
      </div>
    }

    // Content received but set is empty at the moment.
    if(this.props.set.subsets.length == 0 && this.props.set.items.length == 0) {
      return <div className='ui segments' style={this.containerStyle}>
        <div className='ui tertiary center aligned segment' style={this.titleStyle}>{this.props.set.name}</div>
        <div style={this.noMarginPaddingStyle} className='ui center aligned basic segment'>
          <i className='large add circle green icon'
             onClick={ModalActions.showModal.bind(null, ModalConstants.Modals.addEntitiesToSet, {parent: self.props.set.uid, index: self.props.index})}/>
        </div>
      </div>;
    }

    // Display children. List has attached style to prevent that stupid label from padding
    return <div style={this.containerStyle} className='ui segments'>
      <div className='ui tertiary center aligned segment' style={this.titleStyle}>{this.props.set.name}</div>
      <div className='ui segment' style={this.listContainerStyle}>
        <div className='ui selection list' style={this.noMarginPaddingStyle}>
          {this.state.subSets.map(function(s, idx) {
            var icon = 'ui icon help';
            var linkStyle = {
              margin: 0
            };

            if(self.props.set.selectedId == s.uid) {
              linkStyle.backgroundColor = 'rgba(0,0,0,0.1)';
            }
            if(s.uid == self.props.managerstore.getSelected().id) {
              linkStyle.color = 'blue';
            }

            return (
              <a className={'item '}
                 style={linkStyle}
                 key={'SET-OPTION-' + s.uid}
                 onClick={self.setActive.bind(self, idx, s)}
                 onContextMenu={self.callContextMenu.bind(self, s, idx)}
                 onDoubleClick={self.selectAndLoadSet.bind(self, idx, s)}>
                <div>
                  <i className='ui icon folder' style={self.textStyle} />{s.name}
                </div>
              </a>);
          })
          }
          {this.state.items.map(function(item, idx) {
            //console.log(JSON.stringify(item));
            var icon = 'ui icon file';
            var linkStyle = {
              margin: 0
            };

            if(self.props.set.selectedId == item.uid) {
              linkStyle.backgroundColor = 'rgba(0,0,0,0.1)';
            }
            if(item.uid == self.props.managerstore.getSelected().id) {
              linkStyle.color = 'blue';
            }
            switch(item.type) {
              case 'Specimen':
                icon = 'ui icon barcode';
                break;
              case 'Image':
                icon = 'ui icon file image outline';
                break;
              default:

            }

            return <a className={'item '}
                      style={linkStyle}
                      key={'SET-OPTION-' + item.uid}
                      onContextMenu={self.callContextMenu.bind(self, item, idx)}
                      onClick={self.setActive.bind(self, idx, item)}
            >
              <div >
                <i className={icon} style={self.textStyle} />{item.name}
              </div>
            </a>
          })
          }
        </div>
        <div style={this.noMarginPaddingStyle} className='ui center aligned basic segment'>
          <i className='large add circle green icon'
             onClick={ModalActions.showModal.bind(null, ModalConstants.Modals.addEntitiesToSet, {parent: self.props.set.uid, index: self.props.index})}/>
        </div>
      </div>
    </div>
  }
}

export default SetDisplay;