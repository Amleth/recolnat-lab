/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package org.dicen.recolnat.services.core.actions;

import java.util.LinkedList;
import java.util.List;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;

/**
 * Contains the result of a processing request. When processing a request, the message handler should use addModifiedId to add ids of entities which have changed (this includes the entity and any entities it is linked to). The MessageProcessorThread will then use this list of ids to notify all listening clients about the changes.
 * The response part is only sent to the original client who requested the action.
 * @author dmitri
 */
public class ActionResult {
  private final List<String> idsOfElementsModifiedByAction = new LinkedList<>();
  private JSONObject privateResponseData = new JSONObject();
  
  public void addModifiedId(String id) {
    this.idsOfElementsModifiedByAction.add(id);
  }
  
  public final List<String> getModified() {
    return this.idsOfElementsModifiedByAction;
  }
  
  /**
   * Adds the given key/value pair to the response.
   * @param key
   * @param value
   * @throws JSONException 
   */
  public void setResponse(String key, Object value) throws JSONException {
    this.privateResponseData.put(key, value);
  }
  
  /**
   * Replaces the response with the provided object.
   * @param response 
   */
  public void setResponse(JSONObject response) {
    this.privateResponseData = response;
  }
  
  public JSONObject getResponse() {
    return this.privateResponseData;
  }
}
