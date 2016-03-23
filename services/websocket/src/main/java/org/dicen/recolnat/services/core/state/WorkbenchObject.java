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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Created by Dmitri Voitsekhovitch (dvoitsekh@gmail.com) on 07/04/15.
 */
public class WorkbenchObject implements Comparable<WorkbenchObject> {

  protected String id;
  protected String name;
//  protected String imageSource;
//  protected String thumbnailSource;
  
  private static final Logger log = LoggerFactory.getLogger(WorkbenchObject.class);
  
  public WorkbenchObject(OrientVertex vObject, OrientEdge linkToParent, OrientVertex vUser, OrientGraph g) throws IllegalAccessException {
    if (AccessRights.getAccessRights(vUser, vObject, g).value() < DataModel.Enums.AccessRights.READ.value()) {
      throw new IllegalAccessException("User not authorized to access object");
    }

    this.id = vObject.getProperty(DataModel.Properties.id);
        this.name = vObject.getProperty(DataModel.Properties.name);
    // Current child types taken into account: Image, Specimen
//    switch ((String) vObject.getProperty("@class")) {
//      case DataModel.Classes.image:
//        this.id = vObject.getProperty(DataModel.Properties.id);
//        this.name = vObject.getProperty(DataModel.Properties.name);
//        this.imageSource = vObject.getProperty(DataModel.Properties.imageUrl);
//        this.thumbnailSource = vObject.getProperty(DataModel.Properties.thumbUrl);
//        break;
//      case DataModel.Classes.specimen:
//        break;
//      default:
//        log.warn("Class processing not supported: " + vObject.getProperty("@class"));
//    }
    
  }
  
  public JSONObject toJSON() throws JSONException {
    JSONObject ret = new JSONObject();
    ret.put("id", this.id);
    ret.put("name", this.name);
    ret.put("type", "item");
//    ret.put("url", this.imageSource);
//    if (this.thumbnailSource != null) {
//      ret.put("thumburl", this.thumbnailSource);
//    }
    
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
    if (!(o instanceof WorkbenchObject)) {
      return false;
    }
    WorkbenchObject wo = (WorkbenchObject) o;
    return wo.getId().equals(this.getId());
  }
  
  @Override
  public int hashCode() {
    return id.hashCode();
  }
}
