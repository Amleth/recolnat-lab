'use strict';

import {EventEmitter} from 'events';
import request from 'superagent';

import AppDispatcher from "../dispatcher/AppDispatcher";

import ToolConstants from "../constants/ToolConstants";
import EditorConstants from "../constants/EditorConstants";
import ViewConstants from '../constants/ViewConstants';

import ToolEvents from "./events/ToolEvents";
import EntitiesEvents from './events/EntitiesEvents';

import ViewActions from "../actions/ViewActions";

class EditorStore extends EventEmitter {
  constructor() {
    super();

    this.tools = {};
    this.activeTool = null;
    this.activeToolPopup = null;
    this.editorReady = false;
    this.imageId = null;

    AppDispatcher.register((action) => {
      switch (action.actionType) {
        case ToolConstants.ActionTypes.TOOL_SET_ACTIVE_TOOL:
          console.log("TS received action: set active tool " + action.tool);
          this.setActiveTool(action.tool);
          this.emit(ToolEvents.CHANGE_TOOL_EVENT);
          break;
        case ToolConstants.ActionTypes.TOOL_CLEAR:
          console.log("TS received action: clear tool");
          this.finishActiveTool();
          this.setActiveTool('null');
          //this.setOnClickAction(function(){return false;});
          this.emit(ToolEvents.CHANGE_TOOL_EVENT);
          break;
        case ToolConstants.ActionTypes.TOOL_REGISTER:
          console.log("TS registering new tool: " + action.name);
          this.register(action.name, action.onClickCallback, action.component);
          break;
        case ToolConstants.ActionTypes.TOOL_RUN:
          console.log("TS running active tool");
          this.runTool(action.x, action.y, action.misc);
          break;
        case EditorConstants.ActionTypes.EDITOR_READY:
          console.log("TS editor readiness state change ");
          this.editorReady = action.ready;
          break;
        case ViewConstants.ActionTypes.Local.VIEW_SET_SELECTION:
          if(this.imageId != action.selection.id) {
            this.resetActiveTool();
            this.imageId = action.selection.id;
          }
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
      }
    });

    this.register("null", function() {return;}, null);
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
        var saveData = this.activeTool.component.save();
        if(saveData) {
          this.sendData(saveData, this.resetActiveTool.bind(this));
        }
        else {
          console.log("No data to save");
        }
      }
    }
  }

  sendData(data, onSuccessCallback) {
    console.log("Saving data about image " + this.imageId + " " + JSON.stringify(data));
    request.post(data.serviceUrl)
      .set("Content-Type", "application/json")
      .send({parent: this.imageId})
      .send({payload: data.payload})
      .withCredentials()
      .end((err, res) => {
        if (err) {
          console.log(err);
          alert("Impossible de sauvegarder les changements");
        }
        else {
          ViewActions.updateMetadata(this.imageId);
          //this.emit(EntitiesEvents.RELOAD_IMAGE_EVENT, this.imageId);
          onSuccessCallback();
        }
      });
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

  addImageReloadListener(callback) {
    this.on(ToolEvents.RELOAD_IMAGE_EVENT, callback);
  }

  removeImageReloadListener(callback) {
    this.removeListener(ToolEvents.RELOAD_IMAGE_EVENT, callback);
  }

  isEditorReady() {
    return this.editorReady;
  }
}

export default EditorStore;