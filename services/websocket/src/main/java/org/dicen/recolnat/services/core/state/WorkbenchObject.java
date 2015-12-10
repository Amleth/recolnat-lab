package org.dicen.recolnat.services.core.state;

import com.tinkerpop.blueprints.Direction;
import com.tinkerpop.blueprints.Edge;
import com.tinkerpop.blueprints.Vertex;
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
public class WorkbenchObject implements Comparable<WorkbenchObject> {
  private String id;
  private String name;
  private Integer positionFromTop;
  private Integer positionFromLeft;
  private Integer zIndex;
  private Double opacity;
  private List<List<Integer>> polygonMask = new ArrayList<List<Integer>>();
  private String imageSource;
  private Set<String> parentIds = new HashSet<String>();

  public WorkbenchObject(Vertex vObject, Edge linkToParent, OrientVertex vUser, OrientGraph g) throws IllegalAccessException {
    if(AccessRights.getAccessRights(vUser, vObject, g).value() < DataModel.Enums.AccessRights.READ.value()) {
      throw new IllegalAccessException("User not authorized to access object");
    }
    // Current child types taken into account: Image
    this.positionFromLeft = (Integer) linkToParent.getProperty(DataModel.Properties.coordX);
    this.positionFromTop = (Integer) linkToParent.getProperty(DataModel.Properties.coordY);
    this.zIndex = (Integer) linkToParent.getProperty(DataModel.Properties.coordZ);
    this.opacity = (Double) linkToParent.getProperty(DataModel.Properties.opacity);

    this.id = vObject.getProperty(DataModel.Properties.id);
    this.name = vObject.getProperty(DataModel.Properties.name);
    this.imageSource = vObject.getProperty(DataModel.Properties.imageUrl);

    // If this object is a region of interest which has been extracted as a separate image.
    if(vObject.getProperty("@class").equals(DataModel.Classes.LeafTypes.regionOfInterest)) {
      Iterator<Vertex> itSheets = vObject.getVertices(Direction.IN, DataModel.Links.roi).iterator();
      if(itSheets.hasNext()) {
        this.imageSource = itSheets.next().getProperty(DataModel.Properties.imageUrl);
      }
      else {
        this.imageSource = null;
      }
      if(this.imageSource != null) {
        // Get the polygon
        this.polygonMask = vObject.getProperty(DataModel.Properties.vertices);
      }
    }
    if(this.opacity == null) {
      this.opacity = 1.0;
    }
    if(this.positionFromLeft == null) {
      this.positionFromLeft = 10;
      this.positionFromTop = 10;
    }
    if(this.zIndex == null) {
      this.zIndex = 0;
    }

    // Find all parents and add their ids
    Iterator<Edge> itEdge = vObject.getEdges(Direction.IN, DataModel.Links.hasChild).iterator();
    while(itEdge.hasNext()) {
      Edge edgeFromParent = itEdge.next();
      Vertex parent = edgeFromParent.getVertex(Direction.OUT);
      if(AccessRights.getAccessRights(vUser, parent, g).value() > DataModel.Enums.AccessRights.NONE.value()) {
        parentIds.add(parent.getProperty(DataModel.Properties.id).toString());
      }
    }
  }

  public JSONObject toJSON() throws JSONException {
    JSONObject ret = new JSONObject();
    ret.put("id", this.id);
    ret.put("name", this.name);
    ret.put("type", "item");
    ret.put("x", this.positionFromLeft);
    ret.put("y", this.positionFromTop);
    ret.put("z", this.zIndex);
    ret.put("opacity", this.opacity);
    if(this.polygonMask.size() > 0) {
      ret.put("polygonMask", this.polygonMask);
    }
    ret.put("url", this.imageSource);
    ret.put("parentIds", new JSONArray(this.parentIds));

    return ret;
  }

  public String getId() {
    return this.id;
  }

  public int compareTo(WorkbenchObject o) {
    return this.getId().compareTo(o.getId());
  }

  @Override
  public boolean equals(Object o) {
    if(!(o instanceof WorkbenchObject)) return false;
    WorkbenchObject wo = (WorkbenchObject) o;
    return wo.getId().equals(this.getId());
  }

  @Override
  public int hashCode() {
    return id.hashCode();
  }
}
