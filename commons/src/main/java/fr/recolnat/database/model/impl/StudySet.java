/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package fr.recolnat.database.model.impl;

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
public class StudySet extends AbstractObject {

  private final Set<String> parentIds = new HashSet<String>();
  private final Set<String> subSetIds = new HashSet<String>();
  private final Set<String> itemIds = new HashSet<String>();
  private String viewId = null;

//  private String id;
//  private String linkId = null;
//  private final String type = "bag";
//  private String name;

  public StudySet(OrientVertex vSet, OrientVertex vUser, OrientGraph g) throws AccessDeniedException {
    super(vSet, vUser, g);
    if (!AccessRights.canRead(vUser, vSet, g)) {
      throw new AccessDeniedException((String) vSet.getProperty(DataModel.Properties.id));
    }

    this.userCanDelete = DeleteUtils.canUserDeleteSubGraph(vSet, vUser, g);
//    this.name = (String) vSet.getProperty(DataModel.Properties.name);
//    this.id = (String) vSet.getProperty(DataModel.Properties.id);

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

  @Override
  public JSONObject toJSON() throws JSONException {
    JSONObject ret = super.toJSON();
//    ret.put("type", this.type);
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
