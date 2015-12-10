package org.dicen.recolnat.services.core.workbench;

import com.tinkerpop.blueprints.Direction;
import com.tinkerpop.blueprints.Edge;
import com.tinkerpop.blueprints.Vertex;
import com.tinkerpop.blueprints.impls.orient.OrientGraph;
import fr.recolnat.database.model.DataModel;
import fr.recolnat.database.utils.AccessRights;
import java.nio.file.AccessDeniedException;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;

import java.util.HashSet;
import java.util.Iterator;
import java.util.Set;

/**
 * Created by Dmitri Voitsekhovitch (dvoitsekh@gmail.com) on 24/04/15.
 */
public class WorkbenchGraphGroupNode {

  private Set<String> parents = new HashSet<String>();
  private Set<String> children = new HashSet<String>();

  private String id;
  private String linkId = null;
  private String type;
  private String name;

  private WorkbenchGraphGroupNode() {
  }

  public WorkbenchGraphGroupNode(Vertex node, Edge edge, Vertex vUser, OrientGraph g) throws AccessDeniedException {
    if (AccessRights.getAccessRights(vUser, node, g) == DataModel.Enums.AccessRights.NONE) {
      throw new AccessDeniedException((String) node.getProperty(DataModel.Properties.id));
    }
    
    this.type = "bag";
    this.name = (String) node.getProperty(DataModel.Properties.name);
    this.id = (String) node.getProperty(DataModel.Properties.id);
    if (edge != null) {
      this.linkId = (String) edge.getProperty(DataModel.Properties.id);
    }

    Iterator<Vertex> itParents = node.getVertices(Direction.IN, DataModel.Links.hasChild).iterator();
    while (itParents.hasNext()) {
      Vertex vParent = itParents.next();
      if (AccessRights.getAccessRights(vUser, vParent, g) == DataModel.Enums.AccessRights.NONE) {
        // Do not add
      } else {
        parents.add((String) vParent.getProperty(DataModel.Properties.id));
      }
    }

    Iterator<Vertex> itChildren = node.getVertices(Direction.OUT, DataModel.Links.hasChild).iterator();
    while (itChildren.hasNext()) {
      Vertex vChild = itChildren.next();
      if (AccessRights.getAccessRights(vUser, vChild, g) == DataModel.Enums.AccessRights.NONE) {
        // Do not add
      } else {
        children.add((String) vChild.getProperty(DataModel.Properties.id));
      }
    }
  }

  public JSONObject toJSON() throws JSONException {
    JSONObject ret = new JSONObject();
    ret.put("id", this.id);
    ret.put("name", this.name);
    ret.put("type", this.type);
    if (this.linkId != null) {
      ret.put("linkId", this.linkId);
    }

    JSONArray aParents = new JSONArray();
    for (String parent : this.parents) {
      aParents.put(parent);
    }
    JSONArray aChildren = new JSONArray();
    for (String child : this.children) {
      aChildren.put(child);
    }

    ret.put("parentIds", aParents);
    ret.put("containsIds", aChildren);

    return ret;
  }
}
