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
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

/**
 * Created by dmitri on 10/08/15.
 */
public class TrailOfInterest extends AbstractObject {
  private final List<String> measurements = new ArrayList<>();

  public TrailOfInterest(OrientVertex vPath, OrientVertex vUser, OrientBaseGraph g, RightsManagementDatabase rightsDb) throws AccessForbiddenException {
    super(vPath, vUser, g, rightsDb);
    
    if(!AccessRights.canRead(vUser, vPath, g, rightsDb)) {
      throw new AccessForbiddenException((String) vUser.getProperty(DataModel.Properties.id), (String) vPath.getProperty(DataModel.Properties.id));
    }
    
    this.userCanDelete = DeleteUtils.canUserDeleteSubGraph(vPath, vUser, g, rightsDb);
    
    Iterator<Vertex> itMeasurements = vPath.getVertices(Direction.OUT, DataModel.Links.hasMeasurement).iterator();
    while(itMeasurements.hasNext()) {
      OrientVertex vMeasurement = (OrientVertex) itMeasurements.next();
      if(AccessUtils.isLatestVersion(vMeasurement)) {
        if(AccessRights.canRead(vUser, vMeasurement, g, rightsDb)) {
          measurements.add((String) vMeasurement.getProperty(DataModel.Properties.id));
        }
      }
    }
    
    Iterator<Vertex> itParents = vPath.getVertices(Direction.IN, DataModel.Links.toi).iterator();
    while(itParents.hasNext()) {
      OrientVertex vParent = (OrientVertex) itParents.next();
      if(AccessUtils.isLatestVersion(vParent)) {
        if(AccessRights.canRead(vUser, vParent, g, rightsDb)) {
          this.parents.add((String) vParent.getProperty(DataModel.Properties.id));
        }
      }
    }
  }

  @Override
  public JSONObject toJSON() throws JSONException {
    JSONObject ret = super.toJSON();

    ret.put("measurements", this.measurements);

    return ret;
  }
}
