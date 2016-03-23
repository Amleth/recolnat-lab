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
public class EntitySet {

  private Set<String> parentIds = new HashSet<String>();
  private Set<String> childrenIds = new HashSet<String>();
  private String viewId = null;

  private String id;
//  private String linkId = null;
  private String type;
  private String name;
  private boolean userCanDelete = false;

  private EntitySet() {
  }

  public EntitySet(OrientVertex vSet, OrientVertex vUser, OrientGraph g) throws AccessDeniedException {
    if (AccessRights.getAccessRights(vUser, vSet, g) == DataModel.Enums.AccessRights.NONE) {
      throw new AccessDeniedException((String) vSet.getProperty(DataModel.Properties.id));
    }
    
    this.type = "bag";
    this.userCanDelete = DeleteUtils.canUserDeleteSubGraph(vSet, vUser, g);
    this.name = (String) vSet.getProperty(DataModel.Properties.name);
    this.id = (String) vSet.getProperty(DataModel.Properties.id);
//    if (edge != null) {
//      this.linkId = (String) edge.getProperty(DataModel.Properties.id);
//    }

    Iterator<Vertex> itParents = vSet.getVertices(Direction.IN, DataModel.Links.hasChild).iterator();
    while (itParents.hasNext()) {
      OrientVertex vParent = (OrientVertex) itParents.next();
      vParent = AccessUtils.findLatestVersion(vParent);
      if (AccessRights.canRead(vUser, vParent, g)) {
        this.parentIds.add((String) vParent.getProperty(DataModel.Properties.id));
      }
    }

    Iterator<Vertex> itChildren = vSet.getVertices(Direction.OUT, DataModel.Links.hasChild).iterator();
    while (itChildren.hasNext()) {
      OrientVertex vChild = (OrientVertex) itChildren.next();
      vChild = AccessUtils.findLatestVersion(vChild);
      if (AccessRights.canRead(vUser, vChild, g)) {
        this.childrenIds.add((String) vChild.getProperty(DataModel.Properties.id));  
      }
    }
    
    OrientVertex vView = AccessUtils.findLatestVersion(vSet.getVertices(Direction.OUT, DataModel.Links.hasView).iterator(), g);
    if(vView != null) {
      if(AccessRights.canRead(vUser, vView, g)) {
        this.viewId = vView.getProperty(DataModel.Properties.id);
      }
    }
  }

  public JSONObject toJSON() throws JSONException {
    JSONObject ret = new JSONObject();
    ret.put("id", this.id);
    ret.put("name", this.name);
    ret.put("type", this.type);
    ret.put("deletable", this.userCanDelete);
//    if (this.linkId != null) {
//      ret.put("linkId", this.linkId);
//    }

    JSONArray aParents = new JSONArray();
    for (String parent : this.parentIds) {
      aParents.put(parent);
    }
    JSONArray aChildren = new JSONArray();
    for (String child : this.childrenIds) {
      aChildren.put(child);
    }

    ret.put("parents", aParents);
    ret.put("children", aChildren);
    ret.put("view", this.viewId);

    return ret;
  }
}
