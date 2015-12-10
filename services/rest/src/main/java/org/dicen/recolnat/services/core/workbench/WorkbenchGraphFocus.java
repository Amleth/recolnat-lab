package org.dicen.recolnat.services.core.workbench;

import com.tinkerpop.blueprints.Direction;
import com.tinkerpop.blueprints.Edge;
import com.tinkerpop.blueprints.Vertex;
import com.tinkerpop.blueprints.impls.orient.OrientGraph;
import fr.recolnat.database.model.DataModel;
import fr.recolnat.database.utils.AccessRights;
import fr.recolnat.database.utils.AccessUtils;
import java.nio.file.AccessDeniedException;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashSet;
import java.util.Iterator;
import java.util.Set;
import javax.validation.constraints.NotNull;

/**
 * Created by Dmitri Voitsekhovitch (dvoitsekh@gmail.com) on 24/04/15.
 */
public class WorkbenchGraphFocus {

  private static final Logger log = LoggerFactory.getLogger(WorkbenchGraphFocus.class);
  private Set<WorkbenchGraphGroupNode> parents = new HashSet<WorkbenchGraphGroupNode>();
  private Set<WorkbenchGraphGroupNode> childBags = new HashSet<WorkbenchGraphGroupNode>();
  private Set<WorkbenchGraphLeafNode> childLeaves = new HashSet<WorkbenchGraphLeafNode>();
  private Object focusData;

  public WorkbenchGraphFocus(@NotNull String workbench, @NotNull Vertex user, @NotNull OrientGraph graph) throws AccessDeniedException {
    // Retrieve workbench with input id or root workbench if root
    Vertex vWorkbench = null;
    if (workbench.equals("root")) {
      vWorkbench = AccessUtils.getRootWorkbench(user, graph);
    } else {
      vWorkbench = AccessUtils.getWorkbench(workbench, graph);
    }

    if (AccessRights.getAccessRights(user, vWorkbench, graph) == DataModel.Enums.AccessRights.NONE) {
      throw new AccessDeniedException((String) vWorkbench.getProperty(DataModel.Properties.id));
    }
    // Add data from this workbench either into bags or leaves
    String role = null;
    if (vWorkbench != null) {
      role = vWorkbench.getProperty(DataModel.Properties.role);
    }
    // In the next three cases we checked user rights before. So we can safely ignore access denied exceptions.
    if (role == null) {
      // This is a leaf, not a workbench. 
      this.focusData = new WorkbenchGraphLeafNode(vWorkbench, null, user, graph);
    } else if ("workbench".equals(role)) {
      // This is a bag
      this.focusData = new WorkbenchGraphGroupNode(vWorkbench, null, user, graph);
    } else if ("workbench-root".equals(role)) {
      // This is a bag too!
      this.focusData = new WorkbenchGraphGroupNode(vWorkbench, null, user, graph);
    } else {
      // We don't know what it is, therefore it is something completely new or unrelated. Could be an error though. But for now we issue a simple warning.
      log.warn("Unknown node role " + role + " for node " + vWorkbench.getProperty(DataModel.Properties.id));
    }

    // Get workbench parents (bags), root wbs have no parents
    if (!workbench.equals("root")) {
      Iterator<Edge> itEdges = vWorkbench.getEdges(Direction.IN, DataModel.Links.hasChild).iterator();
      while (itEdges.hasNext()) {
        Edge linkEdge = itEdges.next();
        Vertex parent = linkEdge.getVertex(Direction.OUT);
        try {
          this.parents.add(new WorkbenchGraphGroupNode(parent, linkEdge, user, graph));
        } catch (AccessDeniedException e) {
          // Do nothing
        }
      }
    }

    // Get workbench children (bags or leaves, filter by type)
    Iterator<Edge> itEdges = vWorkbench.getEdges(Direction.OUT, DataModel.Links.hasChild).iterator();
    while (itEdges.hasNext()) {
      Edge linkEdge = itEdges.next();
      Vertex child = linkEdge.getVertex(Direction.IN);
      String childRole = child.getProperty(DataModel.Properties.role);
      if ("workbench".equals(childRole)) {
        try {
          this.childBags.add(new WorkbenchGraphGroupNode(child, linkEdge, user, graph));
        } catch (AccessDeniedException e) {
          // Do nothing
        }
      } else if (childRole == null) {
        try {
          this.childLeaves.add(new WorkbenchGraphLeafNode(child, linkEdge, user, graph));
        } catch (AccessDeniedException e) {
          // Do nothing
        }
      } else {
        // A new role was introduced? The likely sign of an error somewhere
        log.warn("WorkbenchGraph::new - Role unknown: " + childRole + " for node: " + child.getProperty(DataModel.Properties.id));
      }
    }
  }

  public JSONObject toJSON() throws JSONException {
    JSONObject ret = new JSONObject();
    JSONArray parents = new JSONArray();
    Iterator<WorkbenchGraphGroupNode> itBags = this.parents.iterator();
    while (itBags.hasNext()) {
      parents.put(itBags.next().toJSON());
    }

    JSONArray children = new JSONArray();
    Iterator<WorkbenchGraphLeafNode> itLeaves = this.childLeaves.iterator();
    while (itLeaves.hasNext()) {
      children.put(itLeaves.next().toJSON());
    }
    itBags = this.childBags.iterator();
    while (itBags.hasNext()) {
      children.put(itBags.next().toJSON());
    }

    if (this.focusData.getClass().equals(WorkbenchGraphGroupNode.class)) {
      ret.put("current", ((WorkbenchGraphGroupNode) this.focusData).toJSON());
    } else if (this.focusData.getClass().equals(WorkbenchGraphLeafNode.class)) {
      ret.put("current", ((WorkbenchGraphLeafNode) this.focusData).toJSON());
    }
    ret.put("parents", parents);
    ret.put("children", children);

    return ret;
  }
}
