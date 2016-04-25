/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package fr.recolnat.database.model.impl;

import com.tinkerpop.blueprints.impls.orient.OrientElement;
import com.tinkerpop.blueprints.impls.orient.OrientGraph;
import com.tinkerpop.blueprints.impls.orient.OrientVertex;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author dmitri
 */
public class AbstractObject {
  protected final Map<String, Object> properties = new HashMap<>();
  protected boolean userCanDelete = false;
  private String type = null;
  
  private final Logger log = LoggerFactory.getLogger(AbstractObject.class);
  
  private AbstractObject() {
    
  }
  
  public AbstractObject(OrientElement e, OrientVertex vUser, OrientGraph g) {
    if (log.isTraceEnabled()) {
      log.trace("----- BEGIN OBJECT PROPERTIES -----");
    }
    Iterator<String> itKeys = e.getPropertyKeys().iterator();
    while (itKeys.hasNext()) {
      String key = itKeys.next();
      Object value = e.getProperty(key);
      if (log.isTraceEnabled()) {
        log.trace("{" + key + ":" + value.toString() + "}");
      }
      properties.put(key, value);
    }
    if (log.isTraceEnabled()) {
      log.trace("----- END OBJECT PROPERTIES -----");
    }
    this.type = e.getProperty("@class");
  }
  
  public JSONObject toJSON() throws JSONException {
    JSONObject ret = new JSONObject();
    Iterator<String> itProps = properties.keySet().iterator();
    while(itProps.hasNext()) {
      String key = itProps.next();
      Object value = properties.get(key);
      ret.put(key, value);
    }
    ret.put("type", this.type);
    ret.put("deletable", this.userCanDelete);
    
    return ret;
  }
      
}
