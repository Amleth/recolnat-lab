package org.dicen.recolnat.services.core.state;

import com.tinkerpop.blueprints.Direction;
import com.tinkerpop.blueprints.Edge;
import com.tinkerpop.blueprints.Vertex;
import com.tinkerpop.blueprints.impls.orient.OrientEdge;
import com.tinkerpop.blueprints.impls.orient.OrientGraph;
import com.tinkerpop.blueprints.impls.orient.OrientVertex;
import fr.recolnat.database.model.DataModel;
import fr.recolnat.database.utils.AccessRights;
import fr.recolnat.database.utils.AccessUtils;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;

import java.util.*;

/**
 * Created by Dmitri Voitsekhovitch (dvoitsekh@gmail.com) on 07/04/15.
 */
public class Workbench {

  private String id;
  private String name;
  private String type;
  private Set<WorkbenchObject> nodes = new HashSet<WorkbenchObject>();
  private Set<WorkbenchLink> links = new HashSet<WorkbenchLink>();
  private WorkbenchView view = null;

  public Workbench(String id, OrientVertex vUser, OrientGraph g) throws IllegalAccessException {
    // Build a workbench from given graph by extracting all data pertaining to workbench 'id' accessible by user
    OrientVertex vSet = (OrientVertex) AccessUtils.getSet(id, g);
    if (AccessRights.getAccessRights(vUser, vSet, g).value() < DataModel.Enums.AccessRights.READ.value()) {
      throw new IllegalAccessException("User not authorized to access workbench " + id);
    }

    this.name = vSet.getProperty(DataModel.Properties.name);
    this.id = id;
    if (DataModel.Globals.ROOT_SET_ROLE.equals(vSet.getProperty(DataModel.Properties.role))) {
      this.type = "root";
    } else {
      this.type = "bag";
    }

    // Get children. Each child class must check access rights internally.
    Iterator<Edge> itChildLinks = vSet.getEdges(Direction.OUT, DataModel.Links.hasChild).iterator();
    while (itChildLinks.hasNext()) {
      OrientEdge cl = (OrientEdge) itChildLinks.next();
      OrientVertex child = AccessUtils.findLatestVersion(cl.getVertex(Direction.IN));
      
      if(AccessRights.getAccessRights(vUser, child, g).value() < DataModel.Enums.AccessRights.READ.value()) {
        continue;
      }

      // Check what the child is
      switch ((String) child.getProperty("@class")) {
        case DataModel.Classes.relationship:
          WorkbenchLink l = new WorkbenchLink(child, vUser, g);
          break;
        case DataModel.Classes.set:
          // TODO handle this carefully, it could create processing loops
          // For now there is no need to populate children in the 2D view.
          break;
        default:
          WorkbenchObject obj = new WorkbenchObject(child, cl, vUser, g);
          this.nodes.add(obj);
      }
    }
    
    // Process views associated with workbench.
    // @TODO For now only one view per WB until Vm
    OrientVertex vView = AccessUtils.findLatestVersion(vSet.getVertices(Direction.OUT, DataModel.Links.hasView).iterator(), g);
    this.view = new WorkbenchView(vView, this.nodes, this.links, vUser, g);

  }

  public JSONArray toJSON() throws JSONException {
    JSONArray ret = new JSONArray();
    JSONObject wb = new JSONObject();
    wb.put("id", this.id);
    wb.put("x", 0);
    wb.put("y", 0);
    wb.put("type", this.type);
    wb.put("name", this.name);

    JSONArray children = new JSONArray();
    for (WorkbenchObject child : this.nodes) {
      children.put(child.getId());
      ret.put(child.toJSON());
    }
    wb.put("containsIds", children);

    wb.put("parentIds", new ArrayList());
    
    if(this.view != null) {
      wb.put("view", this.view.toJSON());
    }

    ret.put(wb);

    return ret;
  }

}
