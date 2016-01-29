/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package fr.recolnat.database.utils;

import com.tinkerpop.blueprints.Direction;
import com.tinkerpop.blueprints.Edge;
import com.tinkerpop.blueprints.Vertex;
import com.tinkerpop.blueprints.impls.orient.OrientEdge;
import com.tinkerpop.blueprints.impls.orient.OrientGraph;
import fr.recolnat.database.model.DataModel;
import java.util.Date;
import java.util.Iterator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author dmitri
 */
public class AccessRights {
  private static final Logger log = LoggerFactory.getLogger(AccessRights.class);

  public static DataModel.Enums.AccessRights getAccessRights(Vertex user, Vertex node, OrientGraph graph) {
    DataModel.Enums.AccessRights ret = DataModel.Enums.AccessRights.NONE;
    
    // If node and user are same, user HAS access rights to his own node
    if(user.getProperty(DataModel.Properties.id).equals(node.getProperty(DataModel.Properties.id))) {
      return DataModel.Enums.AccessRights.WRITE;
    }

    // Check personal access rights
    Edge e = AccessUtils.getEdgeBetweenVertices(user, node, DataModel.Links.hasAccessRights, graph);
    if (e != null) {
      // User has personal access rights
      int accessRight = e.getProperty(DataModel.Properties.accessRights);
      ret = DataModel.Enums.AccessRights.fromInt(accessRight);
    }

    if (ret.value() == DataModel.Enums.AccessRights.WRITE.value()) {
      // Highest rights available. No point in checking elsewhere.
      return ret;
    }

    // Check public access rights
    Vertex vPublic = AccessUtils.getUserByUUID(DataModel.Globals.PUBLIC_USER_ID, graph);
    if(vPublic == null) {
      log.error("User PUBLIC does not exist in database.");
    }
    else {
    e = AccessUtils.getEdgeBetweenVertices(vPublic, node, DataModel.Links.hasAccessRights, graph);
    if (e != null) {
      // Public has access rights
      int accessRight = e.getProperty(DataModel.Properties.accessRights);
      ret = DataModel.Enums.AccessRights.fromInt(accessRight);
    }

    if (ret == DataModel.Enums.AccessRights.WRITE) {
      // Highest rights available. No point in checking elsewhere.
      return ret;
    }
    }

    // Check group access rights
    Iterator<Edge> itMemberships = user.getEdges(Direction.OUT, DataModel.Links.isMemberOfGroup).iterator();
    while (itMemberships.hasNext()) {
      Vertex group = itMemberships.next().getVertex(Direction.IN);
      e = AccessUtils.getEdgeBetweenVertices(group, node, DataModel.Links.hasAccessRights, graph);
      if (e != null) {
        int accessRight = e.getProperty(DataModel.Properties.accessRights);
        if (accessRight > ret.value()) {
          ret = DataModel.Enums.AccessRights.fromInt(accessRight);
        }
      }
    }

    return ret;
  }

  /**
   * Checks to see if user is allowed to grant access must be performed before calling this method. To remove rights, call revokeAccessRights instead as this method will terminate with an error.
   * @param user
   * @param node
   * @param rights
   * @param graph
   * @return 
   */
  public static OrientEdge grantAccessRights(Vertex user, Vertex node, DataModel.Enums.AccessRights rights, OrientGraph graph) {
    OrientEdge edge = AccessUtils.getEdgeBetweenVertices(user, node, DataModel.Links.hasAccessRights, graph);
    if(edge == null) {
      edge = graph.addEdge("class:" + DataModel.Links.hasAccessRights, user, node, DataModel.Links.hasAccessRights);
      edge.setProperty(DataModel.Properties.id, CreatorUtils.newEdgeUUID(graph));
      edge.setProperty(DataModel.Properties.creationDate, (new Date()).getTime());
    }
    
    edge.setProperty(DataModel.Properties.accessRights, rights.value());
    return edge;
  }
  
  public static void revokeAccessRights(Vertex user, Vertex node, OrientGraph graph) {
    OrientEdge edge = AccessUtils.getEdgeBetweenVertices(user, node, DataModel.Links.hasAccessRights, graph);
    if(edge != null) {
      graph.removeEdge(edge);
    }
  }
}
