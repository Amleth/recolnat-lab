package fr.recolnat.database.model.impl;

import com.tinkerpop.blueprints.Direction;
import com.tinkerpop.blueprints.Vertex;
import com.tinkerpop.blueprints.impls.orient.OrientBaseGraph;
import com.tinkerpop.blueprints.impls.orient.OrientVertex;
import fr.recolnat.database.RightsManagementDatabase;
import fr.recolnat.database.exceptions.AccessForbiddenException;
import fr.recolnat.database.model.DataModel;
import fr.recolnat.database.utils.AccessRights;
import fr.recolnat.database.utils.AccessUtils;
import fr.recolnat.database.utils.DeleteUtils;
import java.nio.file.AccessDeniedException;
import java.util.Iterator;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;

/**
 * Created by hector on 03/08/15.
 */
public class PointOfInterest extends AbstractObject {

  public PointOfInterest(OrientVertex vPoint, OrientVertex vUser, OrientBaseGraph g, RightsManagementDatabase rightsDb) throws AccessForbiddenException {
    super(vPoint, vUser, g, rightsDb);
    if (!AccessRights.canRead(vUser, vPoint, g, rightsDb)) {
      throw new AccessForbiddenException((String) vUser.getProperty(DataModel.Properties.id), (String) vPoint.getProperty(DataModel.Properties.id));
    }
    
    Iterator<Vertex> itParents = vPoint.getVertices(Direction.IN, DataModel.Links.poi).iterator();
    while(itParents.hasNext()) {
      OrientVertex vParent = (OrientVertex) itParents.next();
      if(AccessUtils.isLatestVersion(vParent)) {
        if(AccessRights.canRead(vUser, vParent, g, rightsDb)) {
          this.parents.add((String) vParent.getProperty(DataModel.Properties.id));
        }
      }
    }
    
    this.userCanDelete = DeleteUtils.canUserDeleteSubGraph(vPoint, vUser, g, rightsDb);
  }

  @Override
  public JSONObject toJSON() throws JSONException {
    JSONObject ret = super.toJSON();

    return ret;
  }
}
