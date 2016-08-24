package fr.recolnat.database.model.impl;

import com.tinkerpop.blueprints.Direction;
import com.tinkerpop.blueprints.Vertex;
import com.tinkerpop.blueprints.impls.orient.OrientGraph;
import com.tinkerpop.blueprints.impls.orient.OrientVertex;
import fr.recolnat.database.exceptions.AccessForbiddenException;
import fr.recolnat.database.model.DataModel;
import fr.recolnat.database.utils.AccessRights;
import fr.recolnat.database.utils.AccessUtils;
import fr.recolnat.database.utils.DeleteUtils;
import java.nio.file.AccessDeniedException;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;

import java.util.Iterator;

/**
 * Created by Dmitri Voitsekhovitch (dvoitsekh@gmail.com) on 30/09/15.
 */
public class MeasureStandard extends AbstractObject {
  private Double mmPerPixel;

  public MeasureStandard(OrientVertex scale, OrientVertex vUser, OrientGraph g) throws AccessForbiddenException {
    super(scale, vUser, g);
    if (!AccessRights.canRead(vUser, scale, g)) {
      throw new AccessForbiddenException((String) vUser.getProperty(DataModel.Properties.id), (String) scale.getProperty(DataModel.Properties.id));
    }

    this.userCanDelete = DeleteUtils.canUserDeleteSubGraph(scale, vUser, g);
    Double lengthInMm = scale.getProperty(DataModel.Properties.length);

    Iterator<Vertex> itMeasurements = scale.getVertices(Direction.IN, DataModel.Links.definedAsMeasureStandard).iterator();
    // It's 1 and only 1 (except for new versions of it)
    Vertex vMeasurement = AccessUtils.findLatestVersion(itMeasurements, g);
    Double lengthInPixels = vMeasurement.getProperty(DataModel.Properties.pxValue);
    this.mmPerPixel = lengthInMm / lengthInPixels;
  }

  @Override
  public JSONObject toJSON() throws JSONException {
    JSONObject ret = super.toJSON();
    ret.put("mmPerPixel", this.mmPerPixel);
    return ret;
  }
}
