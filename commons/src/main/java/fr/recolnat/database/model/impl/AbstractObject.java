/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package fr.recolnat.database.model.impl;

import com.tinkerpop.blueprints.Direction;
import com.tinkerpop.blueprints.Vertex;
import com.tinkerpop.blueprints.impls.orient.OrientEdge;
import com.tinkerpop.blueprints.impls.orient.OrientElement;
import com.tinkerpop.blueprints.impls.orient.OrientBaseGraph;
import com.tinkerpop.blueprints.impls.orient.OrientVertex;
import fr.recolnat.database.RightsManagementDatabase;
import fr.recolnat.database.model.DataModel;
import fr.recolnat.database.utils.AccessRights;
import fr.recolnat.database.utils.AccessUtils;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Map;
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
public class AbstractObject {

  protected String uuid = null;
  protected final Map<String, Object> properties = new HashMap<>();
  protected final Set<String> parents = new HashSet<>();
  protected boolean userCanDelete = false;
  protected boolean deleted = false;
  protected final Set<String> annotations = new HashSet<>();
  protected final Set<String> taggings = new HashSet<>();
  private String type = null;

  private final Logger log = LoggerFactory.getLogger(AbstractObject.class);

  private AbstractObject() {

  }

  public AbstractObject(OrientElement e, OrientVertex vUser, OrientBaseGraph g, RightsManagementDatabase rightsDb) {
    if (log.isTraceEnabled()) {
      log.trace("----- BEGIN OBJECT PROPERTIES -----");
    }
    Iterator<String> itKeys = e.getPropertyKeys().iterator();
    while (itKeys.hasNext()) {
      String key = itKeys.next();
      Object value = e.getProperty(key);
      if (log.isTraceEnabled()) {
        log.trace("{" + key + ":" + value.toString() + "}");
      }
      properties.put(key, value);

      if (key.equals(DataModel.Properties.id)) {
        this.uuid = (String) value;
      }
    }
    if (log.isTraceEnabled()) {
      log.trace("----- END OBJECT PROPERTIES -----");
    }
    this.type = e.getProperty("@class");

    // Get annotations & tags
    if (e.getElementType().equals("Vertex")) {
      OrientVertex v = (OrientVertex) e;
      if(v.countEdges(Direction.OUT, DataModel.Links.hasNewerVersion) == 1) {
        this.deleted = true;
      }
      Iterator<Vertex> itAnnots = v.getVertices(Direction.OUT, DataModel.Links.hasAnnotation).iterator();
      while (itAnnots.hasNext()) {
        OrientVertex vAnnotation = (OrientVertex) itAnnots.next();
        if (AccessUtils.isLatestVersion(vAnnotation)) {
          if (AccessRights.canRead(vUser, vAnnotation, g, rightsDb)) {
            this.annotations.add((String) vAnnotation.getProperty(DataModel.Properties.id));
          }
        }
      }
      
      Iterator<Vertex> itTaggings = v.getVertices(Direction.OUT, DataModel.Links.isTagged).iterator();
      while(itTaggings.hasNext()) {
        OrientVertex vTagging = (OrientVertex) itTaggings.next();
        if(AccessUtils.isLatestVersion(vTagging)) {
          if(AccessRights.canRead(vUser, vTagging, g, rightsDb)) {
            taggings.add(vTagging.getProperty(DataModel.Properties.id));
          }
        }
      }
    }
    else if(e.getElementType().equals("Edge")) {
      if(e.getProperty(DataModel.Properties.nextVersionId) != null) {
        OrientEdge eNext = AccessUtils.getEdgeById((String) e.getProperty(DataModel.Properties.nextVersionId), g);
        if(eNext == null) {
          this.deleted = true;
        }
      }
    }
  }

  public String getUUID() {
    return this.uuid;
  }

  public JSONObject toJSON() throws JSONException {
    JSONObject ret = new JSONObject();
    Iterator<String> itProps = properties.keySet().iterator();
    while (itProps.hasNext()) {
      String key = itProps.next();
      Object value = properties.get(key);
      ret.put(key, value);
    }
    ret.put("type", this.type);
    ret.put("deletable", this.userCanDelete);
    ret.put("deleted", this.deleted);
    ret.put("annotations", this.annotations);
    ret.put("parents", this.parents);
    ret.put("taggings", this.taggings);

    return ret;
  }

}
