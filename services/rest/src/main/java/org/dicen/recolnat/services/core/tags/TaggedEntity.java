/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package org.dicen.recolnat.services.core.tags;

import com.tinkerpop.blueprints.Direction;
import com.tinkerpop.blueprints.Vertex;
import com.tinkerpop.blueprints.impls.orient.OrientGraph;
import com.tinkerpop.blueprints.impls.orient.OrientVertex;
import fr.recolnat.database.model.DataModel;
import fr.recolnat.database.utils.AccessRights;
import fr.recolnat.database.utils.AccessUtils;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response;
import org.apache.commons.lang.NotImplementedException;
import org.codehaus.jettison.json.JSONObject;

/**
 *
 * @author dmitri
 */
public class TaggedEntity {

  private final String id;
  private Map<String, Tag> privateTags = new HashMap<String, Tag>();
  private Map<String, Tag> sharedTags = new HashMap<String, Tag>();
  private Map<String, Tag> publicTags = new HashMap<String, Tag>();

  private TaggedEntity() {
    id = null;
  }

  public TaggedEntity(String id, String user, OrientGraph g) {
    // All tags and associations with this entity must be readable by the user in order to be shown.
    this.id = id;
    OrientVertex vUser = (OrientVertex) AccessUtils.getUserByLogin(user, g);
    OrientVertex vSubject = (OrientVertex) AccessUtils.getNodeById(id, g);
    if (AccessRights.getAccessRights(vUser, vSubject, g).value() < DataModel.Enums.AccessRights.READ.value()) {
      throw new WebApplicationException("User " + user + " does not have READ rights to node " + id, Response.Status.FORBIDDEN);
    }

    Iterator<Vertex> itTagAssocs = vSubject.getVertices(Direction.OUT, DataModel.Links.isTagged).iterator();
    while (itTagAssocs.hasNext()) {
      OrientVertex vTagAssoc = (OrientVertex) itTagAssocs.next();
      // If user does not have read access to the association, skip
      if (AccessRights.getAccessRights(vUser, vTagAssoc, g).value() < DataModel.Enums.AccessRights.READ.value()) {
        continue;
      }
      Vertex vTag = vTagAssoc.getVertices(Direction.OUT, DataModel.Links.hasDefinition).iterator().next();
      String tagName = vTag.getProperty(DataModel.Properties.name);
      Tag t = null;
//      if(associatedTags.containsKey(tagName)) {
//        t = associatedTags.get(tagName);
//      }
//      else {
        
//      }

    }
  }

  public JSONObject toJSON() {
    throw new NotImplementedException();
  }
}
