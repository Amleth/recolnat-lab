/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package org.dicen.recolnat.services.core.metadata;

import com.tinkerpop.blueprints.Direction;
import com.tinkerpop.blueprints.Vertex;
import com.tinkerpop.blueprints.impls.orient.OrientGraph;
import com.tinkerpop.blueprints.impls.orient.OrientVertex;
import fr.recolnat.database.model.DataModel;
import fr.recolnat.database.utils.AccessRights;
import fr.recolnat.database.utils.AccessUtils;
import fr.recolnat.database.utils.DeleteUtils;
import fr.recolnat.database.utils.UpdateUtils;
import java.nio.file.AccessDeniedException;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Set;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;

/**
 *
 * @author dmitri
 */
public class StudySet {

  private Set<String> parentIds = new HashSet<String>();
  private Set<String> subSetIds = new HashSet<String>();
  private Set<String> itemIds = new HashSet<String>();
  private String viewId = null;

  private String id;
//  private String linkId = null;
  private String type;
  private String name;
  private boolean userCanDelete = false;

  private StudySet() {
  }

  public StudySet(OrientVertex vSet, OrientVertex vUser, OrientGraph g) throws AccessDeniedException {
    if (AccessRights.getAccessRights(vUser, vSet, g) == DataModel.Enums.AccessRights.NONE) {
      throw new AccessDeniedException((String) vSet.getProperty(DataModel.Properties.id));
    }

    this.type = "bag";
    this.userCanDelete = DeleteUtils.canUserDeleteSubGraph(vSet, vUser, g);
    this.name = (String) vSet.getProperty(DataModel.Properties.name);
    this.id = (String) vSet.getProperty(DataModel.Properties.id);

    // Process parent sets
    Iterator<Vertex> itParents = vSet.getVertices(Direction.IN, DataModel.Links.containsSubSet).iterator();
    while (itParents.hasNext()) {
      OrientVertex vParent = (OrientVertex) itParents.next();
      if (AccessUtils.isLatestVersion(vParent)) {
        if (AccessRights.canRead(vUser, vParent, g)) {
          this.parentIds.add((String) vParent.getProperty(DataModel.Properties.id));
        }
      }
    }

    // Process children sets
    Iterator<Vertex> itSubSets = vSet.getVertices(Direction.OUT, DataModel.Links.containsSubSet).iterator();
    while (itSubSets.hasNext()) {
      OrientVertex vSubset = (OrientVertex) itSubSets.next();
      if (AccessUtils.isLatestVersion(vSubset)) {
        if (AccessRights.canRead(vUser, vSubset, g)) {
          this.subSetIds.add((String) vSubset.getProperty(DataModel.Properties.id));
        }
      }
    }

    // Process children enities (not sets)
    Iterator<Vertex> itChildren = vSet.getVertices(Direction.OUT, DataModel.Links.containsItem).iterator();
    while(itChildren.hasNext()) {
      OrientVertex vChild = (OrientVertex) itChildren.next();
      if(AccessUtils.isLatestVersion(vChild)) {
        if(AccessRights.canRead(vUser, vChild, g)) {
          this.itemIds.add((String) vChild.getProperty(DataModel.Properties.id));
        }
      }
    }
    
    // Process views (or, temorarily, one view)
    // @TODO V1, process all views and view creation
    OrientVertex vView = AccessUtils.findLatestVersion(vSet.getVertices(Direction.OUT, DataModel.Links.hasView).iterator(), g);
    if (vView != null) {
      if (AccessRights.canRead(vUser, vView, g)) {
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

    JSONArray aParents = new JSONArray();
    for (String parent : this.parentIds) {
      aParents.put(parent);
    }
    JSONArray aSubsets = new JSONArray();
    for (String subset : this.subSetIds) {
      aSubsets.put(subset);
    }
    JSONArray aItems = new JSONArray();
    for (String item : this.itemIds) {
      aItems.put(item);
    }

    ret.put("parents", aParents);
    ret.put("subsets", aSubsets);
    ret.put("items", aItems);
    ret.put("view", this.viewId);

    return ret;
  }
}
