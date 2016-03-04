/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package org.dicen.recolnat.services.core.image;

import com.tinkerpop.blueprints.impls.orient.OrientGraph;
import com.tinkerpop.blueprints.impls.orient.OrientVertex;
import fr.recolnat.database.model.DataModel;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.dicen.recolnat.services.core.Globals;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author dmitri
 */
public class OriginalSourceItem {
  private String source = null;
  private String type = null;
  private String id = null;
  private boolean userCanDelete = false;
  
  private final static Logger log = LoggerFactory.getLogger(OriginalSourceItem.class);
  
  private OriginalSourceItem() {
    
  }
  
  public OriginalSourceItem(OrientVertex vOriginalSource, OrientGraph g) {
    // Original sources are always public access
    id = vOriginalSource.getProperty(DataModel.Properties.id);
    source = vOriginalSource.getProperty(DataModel.Properties.origin);
    type = vOriginalSource.getProperty(DataModel.Properties.type);
  }
  
  public JSONObject toJSON() throws JSONException {
    JSONObject ret = new JSONObject();
    ret.put("id", id);
    ret.put("source", source);
    ret.put("type", type);
    ret.put(Globals.ExchangeModel.ObjectProperties.userCanDelete, this.userCanDelete);
    
    return ret;
  }
}
