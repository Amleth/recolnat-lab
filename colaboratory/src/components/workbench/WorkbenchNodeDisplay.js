/**
 * Created by dmitri on 13/01/16.
 */
'use strict';

import React from 'react';

import ViewActions from '../../actions/ViewActions';
import ManagerActions from '../../actions/ManagerActions';

class WorkbenchNodeDisplay extends React.Component {
  constructor(props) {
    super(props);

    this.containerStyle = {
      margin: 0,
      padding: 0,
      height: '100%',
      maxWidth: '150px',
      minWidth: '150px',
      overflowY: 'auto',
      overflowX: 'hidden'
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
  }

  setActive(idx, node) {
    window.setTimeout(ManagerActions.setSelectedWorkbenchGraphNode.bind(null,node.id, node.type, node.name, this.props.workbench.id, node.linkId),1);
    window.setTimeout(this.props.managerstore.requestGraphAround(node.id, node.type, this.props.index+1, undefined, undefined, true), 1);
    ManagerActions.setActiveItemInWorkbench(this.props.index, idx);
  }

  selectAndLoadWorkbench(idx, item) {
    window.setTimeout(ManagerActions.toggleWorkbenchManagerVisibility.bind(null,false),1);
    window.setTimeout(ViewActions.setActiveWorkbench.bind(null, item.id), 1);
  }

  componentDidMount() {
    this.props.managerstore.addSelectionChangeListener(this._onSelectionChange);
  }

  componentWillUnmount() {
    this.props.managerstore.removeSelectionChangeListener(this._onSelectionChange);
  }

  render() {
    var self = this;
    return <div className='ui selection list' style={this.containerStyle}>
      {this.props.workbench.children.map(function(item, idx) {
        var icon = 'ui icon help';
        var linkStyle = {
        };
        var loadCallback = null;
        switch(item.type) {
          case 'item':
            icon = 'ui icon file';
            break;
          case 'bag':
            icon = 'ui icon folder';
            loadCallback = self.selectAndLoadWorkbench.bind(self, idx, item);
            break;
          default:
            break;
        }

        if(idx == self.props.workbench.activeIdx) {
          linkStyle.backgroundColor = 'rgba(0,0,0,0.1)';
        }

        if(self.props.managerstore.getSelected().id == item.id) {
          linkStyle.color = 'blue';
        }


        return <a className={'item '}
                  style={linkStyle}
                  key={'WB-OPTION-' + item.id}
                  onClick={self.setActive.bind(self, idx, item)}
                  onDoubleClick={loadCallback}
        >
          <div >
            <i className={icon} style={self.textStyle} />{item.name}
          </div>
        </a>
      })
      }
    </div>
  }
}

export default WorkbenchNodeDisplay;