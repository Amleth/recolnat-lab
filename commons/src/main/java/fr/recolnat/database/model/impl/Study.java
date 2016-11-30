/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package fr.recolnat.database.model.impl;

import com.tinkerpop.blueprints.Direction;
import com.tinkerpop.blueprints.impls.orient.OrientBaseGraph;
import com.tinkerpop.blueprints.impls.orient.OrientVertex;
import fr.recolnat.database.RightsManagementDatabase;
import fr.recolnat.database.exceptions.AccessForbiddenException;
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
public class Study extends AbstractObject {
  private StudySet coreSet;
  
  public Study(OrientVertex vStudy, OrientVertex vUser, OrientBaseGraph g, RightsManagementDatabase rightsDb) throws AccessForbiddenException {
    super(vStudy, vUser, g, rightsDb);
    if(!AccessRights.canRead(vUser, vStudy, g, rightsDb)) {
      throw new AccessForbiddenException((String) vUser.getProperty(DataModel.Properties.id), (String) vStudy.getProperty(DataModel.Properties.id));
    }
    
    this.userCanDelete = DeleteUtils.canUserDeleteSubGraph(vStudy, vUser, g, rightsDb);
    
    OrientVertex vCoreSet = AccessUtils.findLatestVersion(vStudy.getVertices(Direction.OUT, DataModel.Links.hasCoreSet).iterator(), g);
    this.coreSet = new StudySet(vCoreSet, vUser, g, rightsDb);
  }
  
  @Override
  public JSONObject toJSON() throws JSONException {
    JSONObject ret = super.toJSON();
    
    ret.put("deletable", this.userCanDelete);
    ret.put("core", this.coreSet.toJSON());
    
    return ret;
  }
}
