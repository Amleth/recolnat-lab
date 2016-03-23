/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package org.dicen.recolnat.services.core.state;

import com.tinkerpop.blueprints.Direction;
import com.tinkerpop.blueprints.Edge;
import com.tinkerpop.blueprints.impls.orient.OrientEdge;
import com.tinkerpop.blueprints.impls.orient.OrientGraph;
import com.tinkerpop.blueprints.impls.orient.OrientVertex;
import fr.recolnat.database.model.DataModel;
import fr.recolnat.database.utils.AccessRights;
import fr.recolnat.database.utils.AccessUtils;
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
public class WorkbenchView {
  private String id;
  private String name;
  private Set<PositionedWorkbenchObject> nodes = new HashSet<PositionedWorkbenchObject>();
  private Set<WorkbenchLink> links = new HashSet<WorkbenchLink>();
  
  public WorkbenchView(OrientVertex vView, Set<WorkbenchObject> allContent, Set<WorkbenchLink> allLinks, OrientVertex vUser, OrientGraph g) throws IllegalAccessException {
    if (AccessRights.getAccessRights(vUser, vView, g).value() < DataModel.Enums.AccessRights.READ.value()) {
      throw new IllegalAccessException("User not authorized to access view " + id);
    }

    this.name = vView.getProperty(DataModel.Properties.name);
    this.id = vView.getProperty(DataModel.Properties.id);
   
    // Get entity position for all entities
    Iterator<WorkbenchObject> itSetContent = allContent.iterator();
    while(itSetContent.hasNext()) {
      WorkbenchObject obj = itSetContent.next();
      OrientVertex vObj = AccessUtils.getNodeById(obj.getId(), g);
      Iterator<Edge> itPositions = vView.getEdges(vObj, Direction.OUT, DataModel.Links.displays).iterator();
      boolean hasPosition = false;
      while(itPositions.hasNext()) {
        OrientEdge position = (OrientEdge) itPositions.next();
        if(position.getProperty(DataModel.Properties.nextVersionId) == null) {
          hasPosition = true;
          if(AccessRights.canRead(vUser, vObj, g)) {
            PositionedWorkbenchObject posObj = new PositionedWorkbenchObject(vObj, position, vUser, g);
            this.nodes.add(posObj);
          }
        }
      }
      if(!hasPosition) {
        // Object is not positioned in this view
        PositionedWorkbenchObject posObj = new PositionedWorkbenchObject(vObj, null, vUser, g);
        this.nodes.add(posObj);
      }
    }
  }
  
  public JSONObject toJSON() throws JSONException {
    JSONObject ret = new JSONObject();
    ret.put("id", this.id);
    ret.put("name", this.name);
    
    Iterator<PositionedWorkbenchObject> itObjects = this.nodes.iterator();
    JSONArray jObjects = new JSONArray();
    while(itObjects.hasNext()) {
      jObjects.put(itObjects.next().toJSON());
    }
    ret.put("objects", jObjects);
    
    return ret;
  }
}
