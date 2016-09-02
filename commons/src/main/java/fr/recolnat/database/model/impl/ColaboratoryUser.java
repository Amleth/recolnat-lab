/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package fr.recolnat.database.model.impl;

import com.tinkerpop.blueprints.Direction;
import com.tinkerpop.blueprints.impls.orient.OrientBaseGraph;
import com.tinkerpop.blueprints.impls.orient.OrientVertex;
import fr.recolnat.database.model.DataModel;
import fr.recolnat.database.utils.AccessUtils;
import java.util.HashSet;
import java.util.Set;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;

/**
 *
 * @author dmitri
 */
public class ColaboratoryUser extends AbstractObject {
  private Set<String> entitiesCreatedByUser = new HashSet<>();
  private Set<String> entitiesUserHasAccessTo = new HashSet<>();
  private String userCoreSet = null;
  
  public ColaboratoryUser(OrientVertex vRequestedUser, OrientVertex vRequestingUser, OrientBaseGraph g) {
    super(vRequestedUser, vRequestingUser, g);
    
    // If requesting user is same as requested, provide full info, otherwise only properties/statistics
    if(vRequestedUser.getProperty(DataModel.Properties.id) == vRequestingUser.getProperty(DataModel.Properties.id)) {
      this.userCoreSet = AccessUtils.findLatestVersion(vRequestedUser.getVertices(Direction.OUT, DataModel.Links.hasCoreSet).iterator(), g).getProperty(DataModel.Properties.id);
      
//      vRequestedUser.getVertices(Direction.IN, DataModel.Links.createdBy)
    }
    else {
      //@TODO Implement this when necessary
    }
  }
  
  public JSONObject toJSON() throws JSONException {
    JSONObject ret = super.toJSON();
    ret.put("coreSet", this.userCoreSet);
    
    return ret;
  }
  
}
