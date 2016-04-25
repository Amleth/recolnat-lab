package fr.recolnat.database.model.impl;

import com.tinkerpop.blueprints.Direction;
import com.tinkerpop.blueprints.Vertex;
import com.tinkerpop.blueprints.impls.orient.OrientGraph;
import com.tinkerpop.blueprints.impls.orient.OrientVertex;
import fr.recolnat.database.model.DataModel;
import fr.recolnat.database.utils.AccessRights;
import fr.recolnat.database.utils.AccessUtils;
import fr.recolnat.database.utils.DeleteUtils;
import java.nio.file.AccessDeniedException;
import org.codehaus.jettison.json.JSONArray;
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

  public TrailOfInterest(OrientVertex vPath, OrientVertex vUser, OrientGraph g) throws AccessDeniedException {
    super(vPath, vUser, g);
    
    if(!AccessRights.canRead(vUser, vPath, g)) {
      throw new AccessDeniedException((String) vPath.getProperty(DataModel.Properties.id));
    }
    
    this.userCanDelete = DeleteUtils.canUserDeleteSubGraph(vPath, vUser, g);
    
    Iterator<Vertex> itMeasurements = vPath.getVertices(Direction.OUT, DataModel.Links.hasMeasurement).iterator();
    while(itMeasurements.hasNext()) {
      OrientVertex vMeasurement = (OrientVertex) itMeasurements.next();
      if(AccessUtils.isLatestVersion(vMeasurement)) {
        if(AccessRights.canRead(vUser, vMeasurement, g)) {
          measurements.add((String) vMeasurement.getProperty(DataModel.Properties.id));
        }
      }
    }
  }

  @Override
  public JSONObject toJSON() throws JSONException {
    JSONObject ret = super.toJSON();
    

    JSONArray jMeasurements = new JSONArray();
    Iterator<String> itAnnot = measurements.iterator();
    while(itAnnot.hasNext()) {
      jMeasurements.put(itAnnot.next());
    }
    ret.put("measurements", jMeasurements);

    return ret;
  }
}
