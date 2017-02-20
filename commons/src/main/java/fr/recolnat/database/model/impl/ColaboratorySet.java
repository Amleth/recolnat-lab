/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package fr.recolnat.database.model.impl;

import com.tinkerpop.blueprints.Direction;
import com.tinkerpop.blueprints.Edge;
import com.tinkerpop.blueprints.Vertex;
import com.tinkerpop.blueprints.impls.orient.OrientEdge;
import com.tinkerpop.blueprints.impls.orient.OrientBaseGraph;
import com.tinkerpop.blueprints.impls.orient.OrientVertex;
import fr.recolnat.database.RightsManagementDatabase;
import fr.recolnat.database.exceptions.AccessForbiddenException;
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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author dmitri
 */
public class StudySet extends AbstractObject {

  private final Set<LinkedEntity> parentIds = new HashSet<>();
  private final Set<LinkedEntity> subSetIds = new HashSet<>();
  private final Set<LinkedEntity> itemIds = new HashSet<>();
  private String viewId = null;
  
  private static final Logger log = LoggerFactory.getLogger(StudySet.class);

//  private String id;
//  private String linkId = null;
//  private final String type = "bag";
//  private String name;
  public StudySet(OrientVertex vSet, OrientVertex vUser, OrientBaseGraph g, RightsManagementDatabase rightsDb) throws AccessForbiddenException {
    super(vSet, vUser, g, rightsDb);
    if (!AccessRights.canRead(vUser, vSet, g, rightsDb)) {
      throw new AccessForbiddenException((String) vUser.getProperty(DataModel.Properties.id), (String) vSet.getProperty(DataModel.Properties.id));
    }

    if(log.isDebugEnabled()) {
      log.debug("User can access entity " + vSet.getId());
    }
    this.userCanDelete = DeleteUtils.canUserDeleteSubGraph(vSet, vUser, g, rightsDb);
//    this.name = (String) vSet.getProperty(DataModel.Properties.name);
//    this.id = (String) vSet.getProperty(DataModel.Properties.id);

    // Process parent sets
    Iterator<Edge> itParentLinks = vSet.getEdges(Direction.IN, DataModel.Links.containsSubSet).iterator();
    while (itParentLinks.hasNext()) {
      OrientEdge eParentLink = (OrientEdge) itParentLinks.next();
      if (AccessUtils.isLatestVersion(eParentLink)) {
        OrientVertex vParent = eParentLink.getVertex(Direction.OUT);
        if (AccessUtils.isLatestVersion(vParent)) {
          if (AccessRights.canRead(vUser, vParent, g, rightsDb)) {
            this.parentIds.add(
                new LinkedEntity(
                    (String) vParent.getProperty(DataModel.Properties.id),
                    (String) eParentLink.getProperty(DataModel.Properties.id)
                ));
          }
        }
      }
    }

    // Process children sets
    Iterator<Edge> itSubSetLinks = vSet.getEdges(Direction.OUT, DataModel.Links.containsSubSet).iterator();
    while (itSubSetLinks.hasNext()) {
      OrientEdge eSubSetLink = (OrientEdge) itSubSetLinks.next();
      if (AccessUtils.isLatestVersion(eSubSetLink)) {
        OrientVertex vSubset = eSubSetLink.getVertex(Direction.IN);
        if (AccessUtils.isLatestVersion(vSubset)) {
          if (AccessRights.canRead(vUser, vSubset, g, rightsDb)) {
            this.subSetIds.add(
                new LinkedEntity(
                    (String) vSubset.getProperty(DataModel.Properties.id),
                    (String) eSubSetLink.getProperty(DataModel.Properties.id)
                ));
          }
        }
      }
    }

    // Process children enities (not sets)
    Iterator<Edge> itChildLinks = vSet.getEdges(Direction.OUT, DataModel.Links.containsItem).iterator();
    while (itChildLinks.hasNext()) {
      OrientEdge eChildLink = (OrientEdge) itChildLinks.next();
      if (AccessUtils.isLatestVersion(eChildLink)) {
        OrientVertex vChild = eChildLink.getVertex(Direction.IN);
        if (AccessUtils.isLatestVersion(vChild)) {
          if (AccessRights.canRead(vUser, vChild, g, rightsDb)) {
            this.itemIds.add(
                new LinkedEntity(
                    (String) vChild.getProperty(DataModel.Properties.id),
                    (String) eChildLink.getProperty(DataModel.Properties.id)
                ));
          }
        }
      }
    }

    // Process views (or, temorarily, one view)
    // @TODO V1, process all views and view creation
    OrientVertex vView = AccessUtils.findLatestVersion(vSet.getVertices(Direction.OUT, DataModel.Links.hasView).iterator(), g);
    if (vView != null) {
      if (AccessRights.canRead(vUser, vView, g, rightsDb)) {
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
    for (LinkedEntity parent : this.parentIds) {
      aParents.put(parent.toJSON());
    }
    JSONArray aSubsets = new JSONArray();
    for (LinkedEntity subset : this.subSetIds) {
      aSubsets.put(subset.toJSON());
    }
    JSONArray aItems = new JSONArray();
    for (LinkedEntity item : this.itemIds) {
      aItems.put(item.toJSON());
    }

    ret.put("parents", aParents);
    ret.put("subsets", aSubsets);
    ret.put("items", aItems);
    ret.put("view", this.viewId);
    
    if(log.isTraceEnabled()) {
      log.trace(ret.toString());
    }

    return ret;
  }
}
