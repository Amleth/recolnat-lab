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

import SetDisplayItem from './SetDisplayItem';
import SetDisplaySubSet from './SetDisplaySubSet';

import Globals from '../../utils/Globals';
import ServiceMethods from '../../utils/ServiceMethods';

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

    this.topBarStyle = {
      display: 'flex',
      flexDirection: 'row',
      height: '30px',
      padding: '4px 0px',
      width: '100%'
    };

    this.titleStyle = {
      height: '100%',
      padding: 0,
      width: '120px',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    };

    this.addItemStyle = {
      height: '100%',
      padding: 0,
      width: '30px',
      cursor: 'pointer'
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

    this.dragDropSegmentStyle = {
      height: '5px'
    };

    let subSets = [];
    let items = [];
    if(this.props.set.subsets) {
      subSets = JSON.parse(JSON.stringify(this.props.set.subsets));
    }
    if(this.props.set.items) {
      items = JSON.parse(JSON.stringify(this.props.set.items));
    }

    this.state = {
      displayName: this.props.index === 0 ? this.props.userstore.getText('mySets') : this.props.set.name,
      subSets: subSets,
      items: items,
      validEntityDraggedOverSelf: false
      //selectedId: null
    };

    //console.log(JSON.stringify(props.set));
  }

  itemOrSubSetUpdated() {
    let subSets = [];
    let items = [];

    if(this.props.set.subsets) {
      for (let i = 0; i < this.props.set.subsets.length; ++i) {
        let metadata = this.props.metastore.getMetadataAbout(this.props.set.subsets[i].uid);
        if (metadata) {
          //console.log('pushing subset ' +metadata.uid);
          metadata.link = this.props.set.subsets[i].link;
          subSets.push(metadata);
        }
        else {
          subSets.push({
            uid: this.props.set.subsets[i].uid,
            link: this.props.set.subsets[i].link,
            name: this.props.set.subsets[i].uid
          });
        }
      }
      subSets = _.sortBy(subSets, Globals.getName);
    }

    if(this.props.set.items) {
      for (let i = 0; i < this.props.set.items.length; ++i) {
        let metadata = this.props.metastore.getMetadataAbout(this.props.set.items[i].uid);

        if (metadata) {
          metadata.link = this.props.set.items[i].link;
          //console.log('pushing item ' +metadata.uid);
          items.push(metadata);
        }
        else {
          items.push({
            uid: this.props.set.items[i].uid,
            link: this.props.set.items[i].link,
            name: this.props.set.items[i].uid
          });
        }
      }
      items = _.sortBy(items, Globals.getName);
    }

    //console.log('call from ' + this.props.set.uid);
    //console.log('call from ' + this.state.displayName);
    this.setState({items: items, subSets: subSets});
  }

  preventDefault(event) {
    if(this.state.validEntityDraggedOverSelf) {
      event.preventDefault();
    }
  }

  displayDraggedEntity(event) {
    // console.log('entering drop area');
    switch(this.props.dragstore.getType()) {
      case 'managerDragSet':
        let data = this.props.dragstore.getData();
        for(let i = 0; i < this.props.set.subsets.length; ++i) {
          if(this.props.set.subsets[i].link == data.linkToParent) {
            return;
          }
        }
      case 'managerDragItem':
        data = this.props.dragstore.getData();
        for(let i = 0; i < this.props.set.items.length; ++i) {
          if(this.props.set.items[i].link == data.linkToParent) {
            return;
          }
        }
        this.setState({validEntityDraggedOverSelf: true});
        event.preventDefault();
        break;
      default:
        this.setState({validEntityDraggedOverSelf: false});
        break;
    }
  }

  removeDraggedEntity(event) {
    this.setState({validEntityDraggedOverSelf: false});
  }

  addDraggedEntity(event) {
    if(this.state.validEntityDraggedOverSelf) {
      let data = this.props.dragstore.getData();

      ServiceMethods.cutPaste(data.linkToParent, this.props.set.uid, undefined);
    }
    this.setState({validEntityDraggedOverSelf: false});
  }

  clearDrag() {
    this.props.dragstore.setAction(null, null);
  }

  showAddToSetModal() {
    window.setTimeout(
      ModalActions.showModal.bind(null, ModalConstants.Modals.addToSet, {
        parent: this.props.set.uid,
        index: this.props.index
      })
      , 10
    );
  }

  addMetadataUpdateListeners(s) {
    if(s.subsets) {
      for (let i = 0; i < s.subsets.length; ++i) {
        this.props.metastore.addMetadataUpdateListener(s.subsets[i].uid, this.itemOrSubSetUpdated.bind(this));
      }
    }

    if(s.items) {
      for (let i = 0; i < s.items.length; ++i) {
        this.props.metastore.addMetadataUpdateListener(s.items[i].uid, this.itemOrSubSetUpdated.bind(this));
      }
    }
  }

  removeMetadataUpdateListeners(s) {
    if(s.subsets) {
      for (let i = 0; i < s.subsets.length; ++i) {
        this.props.metastore.removeMetadataUpdateListener(s.subsets[i].uid, this.itemOrSubSetUpdated.bind(this));
      }
    }

    if(s.items) {
      for (let i = 0; i < s.items.length; ++i) {
        this.props.metastore.removeMetadataUpdateListener(s.items[i].uid, this.itemOrSubSetUpdated.bind(this));
      }
    }
  }

  componentDidMount() {
    //this.props.managerstore.addSelectionChangeListener(this._onSelectionChange);
    this.props.userstore.addLanguageChangeListener(this.setState.bind(this, {}));
  }

  componentWillUpdate(nextProps, nextState) {
    if(nextState.validEntityDraggedOverSelf) {
      this.containerStyle.backgroundColor = 'rgba(20,20,20,0.6)';
      this.noMarginPaddingStyle.pointerEvents = 'none';
      this.textStyle.pointerEvents = 'none';
    }
    else {
      this.containerStyle.backgroundColor = null;
      this.noMarginPaddingStyle.pointerEvents = null;
      this.textStyle.pointerEvents = null;
    }

    if(nextProps.set.loading) {
      nextState.displayName = this.props.userstore.getText('loading');
    }

    if(nextProps.index === 0) {
      nextState.displayName = this.props.userstore.getText('mySets');
    }
    else {
      nextState.displayName = nextProps.set.name;
    }

    if(nextProps.set.hash != this.props.set.hash) {
      nextState.subSets = nextProps.set.subsets;
      nextState.items = nextProps.set.items;
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if(prevProps.set.hash != this.props.set.hash) {
      this.removeMetadataUpdateListeners(prevProps.set);
      this.addMetadataUpdateListeners(this.props.set);
    }
  }

  componentWillUnmount() {
    this.removeMetadataUpdateListeners(this.props.set);
    this.props.userstore.removeLanguageChangeListener(this.setState.bind(this, {}));
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
      return <div className='ui segments' style={this.containerStyle}
                  onDragEnter={this.displayDraggedEntity.bind(this)}
                  onDragOver={this.preventDefault.bind(this)}
                  onDragLeave={this.removeDraggedEntity.bind(this)}
                  onDrop={this.addDraggedEntity.bind(this)}>
        <div className='ui tertiary center aligned segment'
             style={this.topBarStyle}>
          <div className='ui center aligned container'
               style={this.titleStyle}>
            {this.state.displayName}
          </div>
          <i className='large add circle green icon'
             style={this.addItemStyle}
             onClick={this.showAddToSetModal.bind(this)}/>
        </div>
      </div>;
    }

    // Display children. List has attached style to prevent that stupid label from padding
    return <div style={this.containerStyle}
                className='ui segments'>
      <div className='ui tertiary center aligned segment' style={this.topBarStyle}>
        <div className='ui center aligned container' style={this.titleStyle}>
          {this.state.displayName}
        </div>
        <i className='large add circle green icon' style={this.addItemStyle}
           onClick={this.showAddToSetModal.bind(this)}
        />
      </div>
      <div
        className='ui segment'
        onDragEnter={this.displayDraggedEntity.bind(this)}
        onDragOver={this.preventDefault.bind(this)}
        onDragLeave={this.removeDraggedEntity.bind(this)}
        onDrop={this.addDraggedEntity.bind(this)}
        style={this.listContainerStyle}>
        <div className='ui selection list' style={this.noMarginPaddingStyle}>
          {this.state.subSets.map(function(subSet, idx) {
            return <SetDisplaySubSet key={'S-' + subSet.link}
                                     managerstore={self.props.managerstore}
                                     metastore={self.props.metastore}
                                     dragstore={self.props.dragstore}
                                     index={self.props.index}
                                     userstore={self.props.userstore}
                                     parentSetId={self.props.set.uid}
                                     set={subSet}
                                     />
          })}
          {this.state.items.map(function(item, idx) {
            return <SetDisplayItem
              key={'K-' + item.link}
              managerstore={self.props.managerstore}
              metastore={self.props.metastore}
              dragstore={self.props.dragstore}
              index={self.props.index}
              userstore={self.props.userstore}
              parentSetId={self.props.set.uid}
              item={item} />;
          })}
        </div>
        <div style={this.noMarginPaddingStyle} className='ui center aligned basic segment'>
        </div>
      </div>
    </div>
  }
}

export default SetDisplay;
