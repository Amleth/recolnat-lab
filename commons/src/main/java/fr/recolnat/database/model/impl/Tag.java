/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package fr.recolnat.database.model.impl;

import com.tinkerpop.blueprints.Direction;
import com.tinkerpop.blueprints.Vertex;
import com.tinkerpop.blueprints.impls.orient.OrientBaseGraph;
import com.tinkerpop.blueprints.impls.orient.OrientElement;
import com.tinkerpop.blueprints.impls.orient.OrientVertex;
import fr.recolnat.database.exceptions.AccessForbiddenException;
import fr.recolnat.database.model.DataModel;
import fr.recolnat.database.utils.AccessRights;
import fr.recolnat.database.utils.AccessUtils;
import fr.recolnat.database.utils.DeleteUtils;
import java.util.Iterator;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;

/**
 *
 * @author dmitri
 */
public class Tag extends AbstractObject {
  private String definition;
  private String resource;
  
  public Tag(OrientVertex vTag, OrientVertex vUser, OrientBaseGraph g) throws AccessForbiddenException {
    super(vTag, vUser, g);
    if (!AccessRights.canRead(vUser, vTag, g)) {
      throw new AccessForbiddenException((String) vUser.getProperty(DataModel.Properties.id), (String) vTag.getProperty(DataModel.Properties.id));
    }
    
    Iterator<Vertex> itDefinitions = vTag.getVertices(Direction.OUT, DataModel.Links.hasDefinition).iterator();
    while(itDefinitions.hasNext()) {
      OrientVertex vDefinition = (OrientVertex) itDefinitions.next();
      if(AccessUtils.isLatestVersion(vDefinition)) {
        if(AccessRights.canRead(vUser, vDefinition, g)) {
          this.definition = (String) vDefinition.getProperty(DataModel.Properties.id);
          break;
        }
      }
    }
    
    Iterator<Vertex> itResources = vTag.getVertices(Direction.IN, DataModel.Links.isTagged).iterator();
    while(itResources.hasNext()) {
      OrientVertex vResource = (OrientVertex) itResources.next();
      if(AccessUtils.isLatestVersion(vResource)) {
        if(AccessRights.canRead(vUser, vResource, g)) {
          this.resource = (String) vResource.getProperty(DataModel.Properties.id);
        }
      }
    }
    
    this.userCanDelete = DeleteUtils.canUserDeleteSubGraph(vTag, vUser, g);
  }
  
  @Override
  public JSONObject toJSON() throws JSONException {
    JSONObject ret = super.toJSON();
    
    ret.put("definition", this.definition);
    ret.put("resource", this.resource);
    
    return ret;
  }
  
}
