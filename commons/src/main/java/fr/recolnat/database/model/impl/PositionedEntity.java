/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package fr.recolnat.database.model.impl;

import com.tinkerpop.blueprints.impls.orient.OrientEdge;
import com.tinkerpop.blueprints.impls.orient.OrientBaseGraph;
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
  public Integer displayHeight = null;
  public Integer displayWidth = null;
  public final Float opacity;
  public final String linkId;
  public final String parentViewId;
  public final String displayedEntityId;
  
  public PositionedEntity(OrientEdge eLink, OrientVertex vDisplayedEntity, OrientVertex vParent, OrientBaseGraph g) {
    this.linkId = eLink.getProperty(DataModel.Properties.id);
    this.x = eLink.getProperty(DataModel.Properties.coordX);
    this.y = eLink.getProperty(DataModel.Properties.coordY);
    this.z = eLink.getProperty(DataModel.Properties.coordZ);
    this.opacity = eLink.getProperty(DataModel.Properties.opacity);
    this.displayHeight = eLink.getProperty(DataModel.Properties.height);
    if(this.displayHeight == null) {
      this.displayHeight = vDisplayedEntity.getProperty(DataModel.Properties.height);
      if(this.displayHeight == null) {
        this.displayHeight = 200;
      }
    }
    this.displayWidth = eLink.getProperty(DataModel.Properties.width);
    if(this.displayWidth == null) {
      this.displayWidth = vDisplayedEntity.getProperty(DataModel.Properties.width);
      if(this.displayWidth == null) {
        this.displayWidth = 200;
      }
    }
    
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
    ret.put("displayWidth", this.displayWidth);
    ret.put("displayHeight", this.displayHeight);
    ret.put("opacity", this.opacity);
    
    return ret;
  }

  @Override
  public int compareTo(PositionedEntity o) {
    return this.linkId.compareTo(o.linkId);
  }
}
