/**
 * Actions which coocrdinate communication between tools in the Toolbox, their respective Popups, and the ToolStore.
 * Created by dmitri on 08/10/15.
 */
'use strict';

import AppDispatcher from '../dispatcher/AppDispatcher';
import ToolConstants from '../constants/ToolConstants';

export default {
  /**
   * Set the active tool. To deactivate a tool use the 'nothing' tool.
   * @param toolName String name of the tool to activate (see conf/Tools-conf for complete list)
   */
  setTool: (toolName) => {
    AppDispatcher.dispatch({
      actionType: ToolConstants.ActionTypes.TOOL_SET_ACTIVE_TOOL,
      tool: toolName
    });
  },

  /**
   * Registers a tool when application loads. An unregistered tool cannot be activated.
   * @param name String see conf/Tools-conf for complete list
   * @param onClickAction Function to be called when user clicks (deprecated)
   * @param component Object reference to the component ('this' context).
   */
  registerTool: (name, onClickAction, component) => {
    AppDispatcher.dispatch({
      actionType: ToolConstants.ActionTypes.TOOL_REGISTER,
      name: name,
      onClickCallback: onClickAction,
      component: component
    });
  },

  /**
   * Runs the click action registered for the tool. Deprecated in favor of direct handling from component code.
   * @param x Integer x-coordinate of the click in the D3 space coordinates
   * @param y Integer y-coordinate of the click in the D3 space coordinates
   * @param miscData Object data sent along with the click (such as objects at location or event data)
   */
  runTool: (x, y, miscData) => {
    //console.log("ToolActions executeTool");
    AppDispatcher.dispatch({
      actionType: ToolConstants.ActionTypes.TOOL_RUN,
      x: x,
      y: y,
      misc: miscData
    });
  },

  /**
   * Change the tooltip data with the given text.
   * @param text String or JSXHTML Text to be set.
   */
  updateTooltipData: (text) => {
    AppDispatcher.dispatch({
      actionType: ToolConstants.ActionTypes.TOOL_UPDATE_DATA_DISPLAY,
      content: text
    });
  },

  /**
   * Used to pass data between the tool and its popup component.
   * @param data Object representing the data to be passed. Each component/popup has its own structure expectations.
   */
  updateToolData: (data) => {
    AppDispatcher.dispatch({
      actionType: ToolConstants.ActionTypes.TOOL_UPDATE_DATA,
      data: data
    });
  },

  /**
   * Save the tool data on server. Some components do not use this action and save directly. This only produces results if the canSave function of the tool returns true.
   */
  save: () => {
    AppDispatcher.dispatch({
      actionType: ToolConstants.ActionTypes.TOOL_SAVE
    });
  },

  /**
   * Resets data in the current tool, effectively sending it back to its initial state.
   */
  reset: () => {
    AppDispatcher.dispatch({
      actionType: ToolConstants.ActionTypes.TOOL_RESET
    });
  },

  /**
   * Displays the tool's popup.
   * @param popup Object popup React component to be mounted in the popup container.
   */
  activeToolPopupUpdate: (popup) => {
    window.setTimeout(function() {
        AppDispatcher.dispatch({
          actionType: ToolConstants.ActionTypes.TOOL_POPUP,
          popup: popup
        });},
      50);
  }
}
