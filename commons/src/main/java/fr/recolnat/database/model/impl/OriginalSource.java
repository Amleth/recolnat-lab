/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package fr.recolnat.database.model.impl;

import com.tinkerpop.blueprints.impls.orient.OrientGraph;
import com.tinkerpop.blueprints.impls.orient.OrientVertex;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;

/**
 *
 * @author dmitri
 */
public class OriginalSource extends AbstractObject {
  
  public OriginalSource(OrientVertex vOriginalSource, OrientVertex vUser, OrientGraph g) {
    super(vOriginalSource, vUser, g);
  }
  
  @Override
  public JSONObject toJSON() throws JSONException {
    JSONObject ret = super.toJSON();
    
    return ret;
  }
}
