/**
 * Created by dmitri on 18/01/16.
 */
'use strict';

import React from 'react';

import ManagerActions from '../../actions/ManagerActions';

import WorkbenchNodeDisplay from './WorkbenchNodeDisplay';

class WorkbenchBase extends WorkbenchNodeDisplay {
  constructor(props) {
    super(props);
  }

  //setActive(idx, node) {
  //  window.setTimeout(ManagerActions.setSelectedWorkbenchGraphNode.bind(null,node),1);
  //  window.setTimeout(this.props.managerstore.requestGraphAround(node.id, node.type, 0, undefined, undefined, true), 1);
  //  ManagerActions.setActiveItemInWorkbench(this.props.index, idx);
  //}
}

export default WorkbenchBase;