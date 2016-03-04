package org.dicen.recolnat.services.core.image;

import com.tinkerpop.blueprints.Direction;
import com.tinkerpop.blueprints.Vertex;
import com.tinkerpop.blueprints.impls.orient.OrientGraph;
import com.tinkerpop.blueprints.impls.orient.OrientVertex;
import fr.recolnat.database.model.DataModel;
import fr.recolnat.database.utils.AccessRights;
import fr.recolnat.database.utils.DeleteUtils;
import java.nio.file.AccessDeniedException;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;

import java.util.Iterator;
import org.dicen.recolnat.services.core.Globals;

/**
 * Created by Dmitri Voitsekhovitch (dvoitsekh@gmail.com) on 30/09/15.
 */
public class ScalingData {

  private String id;
  private String name;
  private Double mmPerPixel;
  private boolean userCanDelete = false;

  public ScalingData(OrientVertex scale, OrientVertex vUser, OrientGraph g) throws AccessDeniedException {
    if (AccessRights.getAccessRights(vUser, scale, g) == DataModel.Enums.AccessRights.NONE) {
      throw new AccessDeniedException((String) scale.getProperty(DataModel.Properties.id));
    }

    this.id = scale.getProperty(DataModel.Properties.id);
    this.name = scale.getProperty(DataModel.Properties.name);
    this.userCanDelete = DeleteUtils.canUserDeleteSubGraph(scale, vUser, g);
    Double lengthInMm = scale.getProperty(DataModel.Properties.length);

    Iterator<Vertex> itLines = scale.getVertices(Direction.IN, DataModel.Links.hasAnnotation).iterator();
    if (itLines.hasNext()) {
      // It's 1 really, can't be more, can't be less. And it is necessarily a line
      Vertex vLine = itLines.next();
      Iterator<Vertex> itAnnots = vLine.getVertices(Direction.OUT, DataModel.Links.hasAnnotation).iterator();
      while (itAnnots.hasNext()) {
        Vertex vLineMeasurement = itAnnots.next();
        if (vLineMeasurement.getProperty("@class").equals(DataModel.Classes.LeafTypes.measurement)) {
          Double lengthInPixels = vLineMeasurement.getProperty(DataModel.Properties.pxValue);
          this.mmPerPixel = lengthInMm / lengthInPixels;
          break;
        }
      }
    }
  }

  public JSONObject toJSON() throws JSONException {
    JSONObject ret = new JSONObject();

    ret.put("id", this.id);
    ret.put("name", this.name);
    ret.put("mmPerPixel", this.mmPerPixel);
    ret.put(Globals.ExchangeModel.ObjectProperties.userCanDelete, this.userCanDelete);

    return ret;
  }
}
