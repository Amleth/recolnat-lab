/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package fr.recolnat.database.model.impl;

import com.tinkerpop.blueprints.impls.orient.OrientEdge;
import com.tinkerpop.blueprints.impls.orient.OrientGraph;
import com.tinkerpop.blueprints.impls.orient.OrientVertex;
import fr.recolnat.database.model.DataModel;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;

/**
 *
 * @author dmitri
 */
public class PositionedEntity implements Comparable<PositionedEntity> {
  public final Integer x;
  public final Integer y;
  public final Integer z;
  public final Float opacity;
  public final String linkId;
  public final String parentViewId;
  public final String displayedEntityId;
  
  public PositionedEntity(OrientEdge eLink, OrientVertex vDisplayedEntity, OrientVertex vParent, OrientGraph g) {
    this.linkId = eLink.getProperty(DataModel.Properties.id);
    this.x = eLink.getProperty(DataModel.Properties.coordX);
    this.y = eLink.getProperty(DataModel.Properties.coordY);
    this.z = eLink.getProperty(DataModel.Properties.coordZ);
    this.opacity = eLink.getProperty(DataModel.Properties.opacity);
    
    this.parentViewId = vParent.getProperty(DataModel.Properties.id);
    this.displayedEntityId = vDisplayedEntity.getProperty(DataModel.Properties.id);
  }
  
  public JSONObject toJSON() throws JSONException {
    JSONObject ret = new JSONObject();
    
    ret.put("link", this.linkId);
    ret.put("view", this.parentViewId);
    ret.put("entity", this.displayedEntityId);
    
    ret.put("x", this.x);
    ret.put("y", this.y);
    ret.put("z", this.z);
    ret.put("opacity", this.opacity);
    
    return ret;
  }

  @Override
  public int compareTo(PositionedEntity o) {
    return this.linkId.compareTo(o.linkId);
  }
}
