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
      //borderStyle: 'solid',
      //borderColor: '#777777',
      //borderWidth: '1px',
      height: '100%',
      maxWidth: '150px',
      minWidth: '150px'
      //overflowY: 'hidden'
      //overflowX: 'hidden'
    };

    // Override automatic position:absolute
    this.labelStyle = {
      position: 'fixed',
      top: 0,
      left: 0,
      margin: 0
    };

    this.titleStyle = {
      height: '10%',
      padding: '4px 0px'
    };

    this.listContainerStyle = {
      height: '90%',
      overflowY: 'auto',
      overflowX: 'hidden',
      margin: 0,
      padding: 0
    };

    this.listStyle = {
      margin: 0
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
    window.setTimeout(ManagerActions.setSelectedWorkbenchGraphNode.bind(null,node.id, node.type, node.name, this.props.workbench.id, node.linkId),10);
    window.setTimeout(this.props.managerstore.requestGraphAround(node.id, node.type, this.props.index+1, undefined, undefined, true), 100);
    ManagerActions.setActiveItemInWorkbench(this.props.index, idx);
  }

  selectAndLoadWorkbench(idx, item) {
    window.setTimeout(ViewActions.setActiveWorkbench.bind(null, item.id), 10);
    window.setTimeout(ManagerActions.toggleWorkbenchManagerVisibility.bind(null,false),20);
  }

  componentDidMount() {
    this.props.managerstore.addSelectionChangeListener(this._onSelectionChange);
  }

  componentWillUnmount() {
    this.props.managerstore.removeSelectionChangeListener(this._onSelectionChange);
  }

  render() {
    var self = this;
    // No content yet, show a loader
    if(!this.props.workbench) {
      return <div className='ui segment' style={this.containerStyle}>
        <div className='ui active inverted dimmer'>
          <div className='ui text loader'></div>
        </div>
      </div>
    }

    // Content received but workbench is empty at the moment.
    if(this.props.workbench.children.length == 0) {
      return <div className='ui segments' style={this.containerStyle}>
        <div className='ui tertiary center aligned segment' style={this.titleStyle}>{this.props.workbench.name}</div>
        <div className='ui compact info message segment'>
          <div className='ui center aligned justified header'>
            <i className='large inbox icon' />
          </div>
          <div className='content'>
            <p>Cette étude est vide. Vous pouvez la remplir avec le panier ci-dessous ou en important des images externes via les options du menu à gauche de l'écran</p>
          </div>
        </div>
      </div>;
    }

    // Display children. List has attached style to prevent that stupid label from padding
    return <div style={this.containerStyle} className='ui segments'>
      <div className='ui tertiary center aligned segment' style={this.titleStyle}>{this.props.workbench.name}</div>
      <div className='ui segment' style={this.listContainerStyle}>
        <div className='ui selection list' style={this.listStyle}>
          {this.props.workbench.children.map(function(item, idx) {
            var icon = 'ui icon help';
            var linkStyle = {
              margin: 0
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

            if(item.id == self.props.workbench.activeId) {
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
      </div>
    </div>
  }
}

export default WorkbenchNodeDisplay;