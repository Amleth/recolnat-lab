/**
 * Store for tool data and interaction
 */
'use strict';

import {EventEmitter} from 'events';

import AppDispatcher from "../dispatcher/AppDispatcher";

import ToolConstants from "../constants/ToolConstants";
import ViewConstants from '../constants/ViewConstants';

import ToolEvents from "./events/ToolEvents";
import ViewEvents from "./events/ViewEvents";

class ToolStore extends EventEmitter {
  constructor() {
    super();

    this.tools = {};
    this.activeTool = null;
    this.activeToolPopup = null;
    this.tooltipContent = null;
    /**
     * Selected image UID
     * @type {string}
     */
    this.imageId = null;
    this.toolData = null;

    AppDispatcher.register((action) => {
      switch (action.actionType) {
        case ToolConstants.ActionTypes.TOOL_SET_ACTIVE_TOOL:
          this.setActiveTool(action.tool);
          this.emit(ToolEvents.CHANGE_TOOL_EVENT);
          break;
        case ToolConstants.ActionTypes.TOOL_CLEAR:
          this.finishActiveTool();
          this.setActiveTool('null');
          this.emit(ToolEvents.CHANGE_TOOL_EVENT);
          break;
        case ToolConstants.ActionTypes.TOOL_REGISTER:
          //console.log("Tool registered with ToolStore: " + action.name);
          this.register(action.name, action.onClickCallback, action.component);
          break;
        case ToolConstants.ActionTypes.TOOL_RUN:
          this.runTool(action.x, action.y, action.misc);
          break;
        case ViewConstants.ActionTypes.Local.VIEW_SET_SELECTION:
          if(this.imageId != action.selection.id) {
            this.resetActiveTool();
            this.imageId = action.selection.id;
            this.emit(ViewEvents.SELECTION_CHANGE);
          }
          //console.log('post sel=' + this.imageId);
          break;
        case ToolConstants.ActionTypes.TOOL_SAVE:
          this.saveToolData();
          break;
        case ToolConstants.ActionTypes.TOOL_RESET:
          this.resetActiveTool();
          break;
        case ToolConstants.ActionTypes.TOOL_POPUP:
          this.setActiveToolPopup(action.popup);
          this.emit(ToolEvents.CHANGE_ACTIVE_TOOL_POPUP_EVENT);
          break;
        case ToolConstants.ActionTypes.TOOL_UPDATE_DATA_DISPLAY:
          this.tooltipContent = action.content;
          this.emit(ToolEvents.TOOLTIP_CONTENT_UPDATE);
          break;
        case ToolConstants.ActionTypes.TOOL_UPDATE_DATA:
          this.toolData = action.data?JSON.parse(JSON.stringify(action.data)): null;
          this.emit(ToolEvents.TOOL_DATA_CHANGED);
          break;
      }
    });

    this.register("null", function() {}, null);
  }

  getToolData() {
    return JSON.parse(JSON.stringify(this.toolData));
  }

  getTooltipContent() {
    return this.tooltipContent;
  }

  getSelectedImageId() {
    return this.imageId;
  }

  resetActiveTool() {
    if(this.activeTool) {
      if(this.activeTool.component) {
        this.activeTool.component.reset();
      }
    }
  }

  finishActiveTool() {
    if(this.activeTool) {
      if(this.activeTool.component) {
        this.activeTool.component.finish();
      }
    }
  }

  beginActiveTool() {
    if(this.activeTool) {
      if(this.activeTool.component) {
        this.activeTool.component.begin();
      }
    }
  }

  setActiveTool(name) {
    // Reset previous active tool
    this.finishActiveTool();
    // Set new active tool
    this.activeTool = this.tools[name];
    // Reset state of the new tool, to initialize it
    this.beginActiveTool();
  }

  getOnClickAction() {
    if(this.activeTool) {
      if (this.activeTool.component) {
        return this.activeTool.onClickAction;
      }
    }
  }

  getActiveTool() {
    return this.activeTool.component;
  }

  getToolName() {
    if(this.activeTool) {
      return this.activeTool.name;
    }
    else return null;
  }

  setActiveToolPopup(popup) {
    this.activeToolPopup = popup;
  }

  getActiveToolPopup() {
    return this.activeToolPopup;
  }

  runTool(x, y, misc) {
    if(this.activeTool) {
      if(this.activeTool.component) {
        this.activeTool.component.click.call(this.activeTool.component, this.activeTool.component, x, y, misc);
      }
    }
  }

  canSave() {
    if(this.activeTool.component) {
      return this.activeTool.component.canSave();
    }
    return false;
  }

  saveToolData() {
    if(this.activeTool) {
      if(this.activeTool.component.canSave()) {
        this.activeTool.component.save();
      }
    }
  }

  register(name, onClickAction, component) {
    this.tools[name] = {
      name: name,
      onClickAction: onClickAction,
      component: component
    };
  }

  addToolChangeListener(callback) {
    this.on(ToolEvents.CHANGE_TOOL_EVENT, callback);
  }

  removeToolChangeListener(callback) {
    this.removeListener(ToolEvents.CHANGE_TOOL_EVENT, callback);
  }

  addActiveToolPopupChangeListener(callback) {
    this.on(ToolEvents.CHANGE_ACTIVE_TOOL_POPUP_EVENT, callback);
  }

  removeActiveToolPopupChangeListener(callback) {
    this.removeListener(ToolEvents.CHANGE_ACTIVE_TOOL_POPUP_EVENT, callback);
  }

  addSelectionChangeListener(callback) {
    this.on(ViewEvents.SELECTION_CHANGE, callback);
    if(this.imageId) {
      window.setTimeout(function(){callback();}, 10);
    }
  }

  removeSelectionChangeListener(callback) {
    this.removeListener(ViewEvents.SELECTION_CHANGE, callback);
  }

  addTooltipChangeListener(callback) {
    this.on(ToolEvents.TOOLTIP_CONTENT_UPDATE, callback);
  }

  removeTooltipChangeListener(callback) {
    this.removeListener(ToolEvents.TOOLTIP_CONTENT_UPDATE, callback);
  }

  addToolDataChangeListener(callback) {
    this.on(ToolEvents.TOOL_DATA_CHANGED, callback);
  }

  removeToolDataChangeListener(callback) {
    this.removeListener(ToolEvents.TOOL_DATA_CHANGED, callback);
  }
}

export default ToolStore;
