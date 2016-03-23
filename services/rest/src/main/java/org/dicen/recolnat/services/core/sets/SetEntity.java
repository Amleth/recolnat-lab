package org.dicen.recolnat.services.core.workbench;

import com.tinkerpop.blueprints.Direction;
import com.tinkerpop.blueprints.Edge;
import com.tinkerpop.blueprints.Vertex;
import com.tinkerpop.blueprints.impls.orient.OrientEdge;
import com.tinkerpop.blueprints.impls.orient.OrientGraph;
import com.tinkerpop.blueprints.impls.orient.OrientVertex;
import fr.recolnat.database.model.DataModel;
import fr.recolnat.database.utils.AccessRights;
import fr.recolnat.database.utils.DeleteUtils;
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
public class WorkbenchGraphLeafNode {

  private String name;
  private String url;
  private String reColNatID;
  private String catalogNum;
  private String type;
  private String id;
  private String edgeId;
  private boolean userCanDelete = false;
  private Set<String> parents = new HashSet<String>();

  private WorkbenchGraphLeafNode() {
  }

  public WorkbenchGraphLeafNode(OrientVertex node, OrientEdge edge, OrientVertex vUser, OrientGraph g) throws AccessDeniedException {
    if (AccessRights.getAccessRights(vUser, node, g) == DataModel.Enums.AccessRights.NONE) {
      throw new AccessDeniedException((String) node.getProperty(DataModel.Properties.id));
    }

    this.type = "item";
    this.id = node.getProperty(DataModel.Properties.id);
    this.name = node.getProperty(DataModel.Properties.name);
    this.url = node.getProperty(DataModel.Properties.imageUrl);
    this.reColNatID = node.getProperty(DataModel.Properties.recolnatId);
    this.userCanDelete = DeleteUtils.canUserDeleteSubGraph(node, vUser, g);
    this.catalogNum = node.getProperty(DataModel.Properties.mnhnCatalogNumber);
    if (edge != null) {
      this.edgeId = edge.getProperty(DataModel.Properties.id);
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
  }

  public JSONObject toJSON() throws JSONException {
    JSONObject ret = new JSONObject();
    ret.put("name", this.name);
    ret.put("url", this.url);
    ret.put("reColNatID", this.reColNatID);
    ret.put("catalogNum", this.catalogNum);
    ret.put("type", this.type);
    ret.put("id", this.id);
    ret.put("deletable", this.userCanDelete);
    if (this.edgeId != null) {
      ret.put("linkId", this.edgeId);
    }

    JSONArray aParents = new JSONArray();
    for (String parent : this.parents) {
      aParents.put(parent);
    }
    ret.put("parentIds", aParents);

    return ret;
  }
}
