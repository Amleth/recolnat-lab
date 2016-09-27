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
import java.util.HashSet;
import java.util.Iterator;
import java.util.Set;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;

/**
 *
 * @author dmitri
 */
public class TagDefinition extends AbstractObject {
  private final Set<String> tags = new HashSet<>();

  public TagDefinition(OrientVertex vDefinition, OrientVertex vUser, OrientBaseGraph g) throws AccessForbiddenException {
    super(vDefinition, vUser, g);
    if(!AccessRights.canRead(vUser, vDefinition, g)) {
      throw new AccessForbiddenException((String) vUser.getProperty(DataModel.Properties.id), (String) vDefinition.getProperty(DataModel.Properties.id));
    }
    
    Iterator<Vertex> itTags = vDefinition.getVertices(Direction.IN, DataModel.Links.hasDefinition).iterator();
    while(itTags.hasNext()) {
      OrientVertex vTag = (OrientVertex) itTags.next();
      if(AccessUtils.isLatestVersion(vTag)) {
        if(AccessRights.canRead(vUser, vTag, g)) {
          tags.add((String) vTag.getProperty(DataModel.Properties.id));
        }
      }
    }
  }
  
  @Override
  public JSONObject toJSON() throws JSONException {
    JSONObject ret = super.toJSON();
    
    JSONArray jTags = new JSONArray();
    for(String tag : tags) {
      jTags.put(tag);
    }
    ret.put("tags", tags);
    
    return ret;
  }
}
