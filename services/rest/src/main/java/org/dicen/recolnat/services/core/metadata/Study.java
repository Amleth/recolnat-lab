/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package org.dicen.recolnat.services.core.metadata;

import com.tinkerpop.blueprints.Direction;
import com.tinkerpop.blueprints.impls.orient.OrientGraph;
import com.tinkerpop.blueprints.impls.orient.OrientVertex;
import fr.recolnat.database.model.DataModel;
import fr.recolnat.database.utils.AccessRights;
import fr.recolnat.database.utils.AccessUtils;
import fr.recolnat.database.utils.DeleteUtils;
import java.nio.file.AccessDeniedException;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;

/**
 *
 * @author dmitri
 */
public class Study {
  private String id;
  private String name;
  private boolean userCanDelete = false;
  private StudySet coreSet;
  
  private Study() {
    
  }
  
  public Study(OrientVertex vStudy, OrientVertex vUser, OrientGraph g) throws AccessDeniedException {
    if(!AccessRights.canRead(vUser, vStudy, g)) {
      throw new AccessDeniedException((String) vStudy.getProperty(DataModel.Properties.id));
    }
    
    this.id = vStudy.getProperty(DataModel.Properties.id);
    this.name = vStudy.getProperty(DataModel.Properties.name);
    this.userCanDelete = DeleteUtils.canUserDeleteSubGraph(vStudy, vUser, g);
    
    OrientVertex vCoreSet = AccessUtils.findLatestVersion(vStudy.getVertices(Direction.OUT, DataModel.Links.hasCoreSet).iterator(), g);
    this.coreSet = new StudySet(vCoreSet, vUser, g);
  }
  
  public JSONObject toJSON() throws JSONException {
    JSONObject ret = new JSONObject();
    
    ret.put("id", this.id);
    ret.put("name", this.name);
    ret.put("deletable", this.userCanDelete);
    
    ret.put("core", this.coreSet.toJSON());
    
    return ret;
  }
}
