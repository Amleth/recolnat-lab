package org.dicen.recolnat.services.core.state;

import com.tinkerpop.blueprints.Direction;
import com.tinkerpop.blueprints.Edge;
import com.tinkerpop.blueprints.Vertex;
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

  public Workbench(String id, OrientVertex vUser, OrientGraph g) throws IllegalAccessException {
    // Build a workbench from given graph by extracting all data pertaining to workbench 'id' accessible by user
    OrientVertex vWorkbench = (OrientVertex) AccessUtils.getWorkbench(id, g);
    if(AccessRights.getAccessRights(vUser, vWorkbench, g).value() < DataModel.Enums.AccessRights.READ.value()) {
      throw new IllegalAccessException("User not authorized to access workbench " + id );
    }
    
    this.name = vWorkbench.getProperty(DataModel.Properties.name);
      this.id = id;
      if("workbench-root".equals(vWorkbench.getProperty(DataModel.Properties.role))) {
        this.type = "root";
      }
      else {
        this.type = "bag";
      }
    
      // Get children. Each child class must check access rights internally.
      Iterator<Edge> itChildLinks = vWorkbench.getEdges(Direction.OUT, DataModel.Links.hasChild).iterator();
      while(itChildLinks.hasNext()) {
        Edge cl = itChildLinks.next();
        Vertex child = cl.getVertex(Direction.IN);
        // Check what the child is
        if(child.getProperty("@class").equals(DataModel.Classes.LevelOneHeirTypes.relationship)) {
          // If it's a Relationship, it's a WorkbenchLink
          WorkbenchLink l = new WorkbenchLink(child, vUser, g);
        }
        else if(DataModel.Classes.CompositeTypes.workbench.equals(child.getProperty("@class"))) {
          // TODO handle this carefully, it could create processing loops
          // For now there is no need to populate children in the 2D view.
          continue;
        }
        else {
          WorkbenchObject obj = new WorkbenchObject(child, cl, vUser, g);
          this.nodes.add(obj);
        }
      }
    
    
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

    ret.put(wb);

    return ret;
  }

}
