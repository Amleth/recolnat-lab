/**
 * Created by dmitri on 08/10/15.
 */
'use strict';

import AppDispatcher from '../dispatcher/AppDispatcher';
import ToolConstants from '../constants/ToolConstants';

export default {
  setTool: (toolName) => {
    console.log("ToolActions setTool");
    AppDispatcher.dispatch({
      actionType: ToolConstants.ActionTypes.TOOL_SET_ACTIVE_TOOL,
      tool: toolName
    });
  },

  clearTool: () => {
    console.log("ToolActions clearTool");
    AppDispatcher.dispatch({
      actionType: ToolConstants.ActionTypes.TOOL_CLEAR
    });
  },

  registerTool: (name, onClickAction, component) => {
    console.log("ToolActions registerTool");
    AppDispatcher.dispatch({
      actionType: ToolConstants.ActionTypes.TOOL_REGISTER,
      name: name,
      onClickCallback: onClickAction,
      component: component
    });
  },

  runTool: (x, y, miscData) => {
    console.log("ToolActions executeTool");
    AppDispatcher.dispatch({
      actionType: ToolConstants.ActionTypes.TOOL_RUN,
      x: x,
      y: y,
      misc: miscData
    });
  },

  updateTooltipData: (text) => {
    AppDispatcher.dispatch({
      actionType: ToolConstants.ActionTypes.TOOL_UPDATE_DATA_DISPLAY,
      content: text
    });
  },

  save: () => {
    AppDispatcher.dispatch({
      actionType: ToolConstants.ActionTypes.TOOL_SAVE
    });
  },

  reset: () => {
    AppDispatcher.dispatch({
      actionType: ToolConstants.ActionTypes.TOOL_RESET
    });
  },

  activeToolPopupUpdate: (popup) => {
    window.setTimeout(function() {
        AppDispatcher.dispatch({
          actionType: ToolConstants.ActionTypes.TOOL_POPUP,
          popup: popup
        });},
      50);
  }
}
