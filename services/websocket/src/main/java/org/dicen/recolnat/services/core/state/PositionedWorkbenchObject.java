package org.dicen.recolnat.services.core.state;

import com.tinkerpop.blueprints.Direction;
import com.tinkerpop.blueprints.Edge;
import com.tinkerpop.blueprints.Vertex;
import com.tinkerpop.blueprints.impls.orient.OrientEdge;
import com.tinkerpop.blueprints.impls.orient.OrientGraph;
import com.tinkerpop.blueprints.impls.orient.OrientVertex;
import fr.recolnat.database.model.DataModel;
import fr.recolnat.database.utils.AccessRights;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;

import java.util.*;

/**
 * Created by Dmitri Voitsekhovitch (dvoitsekh@gmail.com) on 07/04/15.
 */
public class PositionedWorkbenchObject extends WorkbenchObject {

  private Integer positionFromTop;
  private Integer positionFromLeft;
  private Integer zIndex;
  private Double opacity;
  private List<List<Integer>> polygonMask = new ArrayList<List<Integer>>();

  public PositionedWorkbenchObject(OrientVertex vObject, OrientEdge linkToParent, OrientVertex vUser, OrientGraph g) throws IllegalAccessException {
    super(vObject, linkToParent, vUser, g);

    // Current child types taken into account: Image
    if (linkToParent != null) {
      this.positionFromLeft = (Integer) linkToParent.getProperty(DataModel.Properties.coordX);
      this.positionFromTop = (Integer) linkToParent.getProperty(DataModel.Properties.coordY);
      this.zIndex = (Integer) linkToParent.getProperty(DataModel.Properties.coordZ);
      this.opacity = (Double) linkToParent.getProperty(DataModel.Properties.opacity);
    } else {
      this.positionFromLeft = null;
      this.positionFromTop = null;
      this.zIndex = null;
      this.opacity = 1.0;
    }

    // If this object is a region of interest which has been extracted as a separate image.
//    if (vObject.getProperty("@class").equals(DataModel.Classes.regionOfInterest)) {
//      Iterator<Vertex> itSheets = vObject.getVertices(Direction.IN, DataModel.Links.roi).iterator();
//      if (itSheets.hasNext()) {
//        this.imageSource = itSheets.next().getProperty(DataModel.Properties.imageUrl);
//      } else {
//        this.imageSource = null;
//      }
//      if (this.imageSource != null) {
//        // Get the polygon
//        this.polygonMask = vObject.getProperty(DataModel.Properties.vertices);
//      }
//    }
    if (this.opacity == null) {
      this.opacity = 1.0;
    }
//    if(this.positionFromLeft == null) {
//      this.positionFromLeft = 10;
//      this.positionFromTop = 10;
//    }
    if (this.zIndex == null) {
      this.zIndex = 0;
    }
  }

  @Override
  public JSONObject toJSON() throws JSONException {
    JSONObject ret = super.toJSON();

    ret.put("x", this.positionFromLeft);
    ret.put("y", this.positionFromTop);
    ret.put("z", this.zIndex);
    ret.put("opacity", this.opacity);
    if (this.polygonMask.size() > 0) {
      ret.put("polygonMask", this.polygonMask);
    }

    return ret;
  }
}
