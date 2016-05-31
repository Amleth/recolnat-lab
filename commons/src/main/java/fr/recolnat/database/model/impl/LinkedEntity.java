/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package fr.recolnat.database.model.impl;

import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;

/**
 *
 * @author dmitri
 */
public class LinkedEntity implements Comparable<LinkedEntity>{
  private final String linkId;
  private final String entityId;
  
  public LinkedEntity(String entity, String link) {
    this.linkId = link;
    this.entityId = entity;
  }
  
  public JSONObject toJSON() throws JSONException {
    JSONObject ret = new JSONObject();
    ret.put("link", linkId);
    ret.put("uid", entityId);
    
    return ret;
  }
  
  @Override
  public int compareTo(LinkedEntity o) {
    return this.linkId.compareTo(o.linkId);
  }
}
