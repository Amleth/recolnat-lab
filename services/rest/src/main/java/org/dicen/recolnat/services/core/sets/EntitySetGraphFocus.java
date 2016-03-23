package org.dicen.recolnat.services.core.sets;

import com.tinkerpop.blueprints.Direction;
import com.tinkerpop.blueprints.Edge;
import com.tinkerpop.blueprints.Vertex;
import com.tinkerpop.blueprints.impls.orient.OrientEdge;
import com.tinkerpop.blueprints.impls.orient.OrientGraph;
import com.tinkerpop.blueprints.impls.orient.OrientVertex;
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
@Deprecated
public class EntitySetGraphFocus {

  private static final Logger log = LoggerFactory.getLogger(EntitySetGraphFocus.class);
  private Set<EntitySet> parents = new HashSet<EntitySet>();
  private Set<EntitySet> childBags = new HashSet<EntitySet>();
  private Set<SetEntity> childLeaves = new HashSet<SetEntity>();
  private Object focusData;

  public EntitySetGraphFocus(@NotNull String workbench, @NotNull OrientVertex user, @NotNull OrientGraph graph) throws AccessDeniedException {
    // Retrieve workbench with input id or root workbench if root
    OrientVertex vWorkbench = null;
    if (workbench.equals("root")) {
      vWorkbench = AccessUtils.getRootSet(user, graph);
    } else {
      vWorkbench = AccessUtils.getSet(workbench, graph);
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
      this.focusData = new SetEntity(vWorkbench, null, user, graph);
    } else if (DataModel.Globals.SET_ROLE.equals(role)) {
      // This is a bag
      this.focusData = new EntitySet(vWorkbench, user, graph);
    } else if (DataModel.Globals.ROOT_SET_ROLE.equals(role)) {
      // This is a bag too!
      this.focusData = new EntitySet(vWorkbench, user, graph);
    } else {
      // We don't know what it is, therefore it is something completely new or unrelated. Could be an error though. But for now we issue a simple warning.
      log.warn("Unknown node role " + role + " for node " + vWorkbench.getProperty(DataModel.Properties.id));
    }

    // Get workbench parents (bags), root wbs have no parents
    if (!workbench.equals("root")) {
      Iterator<Edge> itEdges = vWorkbench.getEdges(Direction.IN, DataModel.Links.hasChild).iterator();
      while (itEdges.hasNext()) {
        OrientEdge linkEdge = (OrientEdge) itEdges.next();
        OrientVertex parent = linkEdge.getVertex(Direction.OUT);
        try {
          this.parents.add(new EntitySet(parent, user, graph));
        } catch (AccessDeniedException e) {
          // Do nothing
        }
      }
    }

    // Get workbench children (bags or leaves, filter by type)
    Iterator<Edge> itEdges = vWorkbench.getEdges(Direction.OUT, DataModel.Links.hasChild).iterator();
    while (itEdges.hasNext()) {
      OrientEdge linkEdge = (OrientEdge) itEdges.next();
      OrientVertex child = linkEdge.getVertex(Direction.IN);
      String childRole = child.getProperty(DataModel.Properties.role);
      if (DataModel.Globals.SET_ROLE.equals(childRole)) {
        try {
          this.childBags.add(new EntitySet(child, user, graph));
        } catch (AccessDeniedException e) {
          // Do nothing
        }
      } else if (childRole == null) {
        try {
          this.childLeaves.add(new SetEntity(child, linkEdge, user, graph));
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
    Iterator<EntitySet> itBags = this.parents.iterator();
    while (itBags.hasNext()) {
      parents.put(itBags.next().toJSON());
    }

    JSONArray children = new JSONArray();
    Iterator<SetEntity> itLeaves = this.childLeaves.iterator();
    while (itLeaves.hasNext()) {
      children.put(itLeaves.next().toJSON());
    }
    itBags = this.childBags.iterator();
    while (itBags.hasNext()) {
      children.put(itBags.next().toJSON());
    }

    if (this.focusData.getClass().equals(EntitySet.class)) {
      ret.put("current", ((EntitySet) this.focusData).toJSON());
    } else if (this.focusData.getClass().equals(SetEntity.class)) {
      ret.put("current", ((SetEntity) this.focusData).toJSON());
    }
    ret.put("parents", parents);
    ret.put("children", children);

    return ret;
  }
}
