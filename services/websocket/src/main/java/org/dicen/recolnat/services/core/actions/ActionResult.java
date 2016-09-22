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
 *
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
  
  public void setResponse(String key, Object value) throws JSONException {
    this.privateResponseData.put(key, value);
  }
  
  public void setResponse(JSONObject response) {
    this.privateResponseData = response;
  }
  
  public JSONObject getResponse() {
    return this.privateResponseData;
  }
}
