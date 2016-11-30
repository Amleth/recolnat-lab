/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package fr.recolnat.database.utils;

import com.drew.lang.annotations.NotNull;
import com.tinkerpop.blueprints.Direction;
import com.tinkerpop.blueprints.Edge;
import com.tinkerpop.blueprints.Vertex;
import com.tinkerpop.blueprints.impls.orient.OrientEdge;
import com.tinkerpop.blueprints.impls.orient.OrientBaseGraph;
import com.tinkerpop.blueprints.impls.orient.OrientVertex;
import fr.recolnat.database.RightsManagementDatabase;
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

  public static DataModel.Enums.AccessRights getAccessRights(@NotNull OrientVertex user, @NotNull OrientVertex node, OrientBaseGraph graph, RightsManagementDatabase rightsDb) {
    DataModel.Enums.AccessRights ret = DataModel.Enums.AccessRights.NONE;

    // If node and user are same, user HAS access rights to his own node
    try {
      if (user.getProperty(DataModel.Properties.id).equals(node.getProperty(DataModel.Properties.id))) {
        return DataModel.Enums.AccessRights.WRITE;
      }
    } catch (NullPointerException ex) {
      log.error("Caught NPE with user=" + user + " node=" + node);
    }
    
    if(log.isDebugEnabled()) {
    log.debug("Checking access rights for " + (String) user.getProperty(DataModel.Properties.login) + " over " + (String) node.getProperty(DataModel.Properties.id));
    }
    ret = rightsDb.getAccessRights((String) user.getProperty(DataModel.Properties.login), (String) node.getProperty(DataModel.Properties.id));
    if(ret.value() > DataModel.Enums.AccessRights.NONE.value()) {
      return ret;
    }
    if(log.isDebugEnabled()) {
    log.debug("No personal rights found, trying public rights");
    }
    
    ret = rightsDb.getAccessRights("PUBLIC", (String) node.getProperty(DataModel.Properties.id));
    if(ret.value() > DataModel.Enums.AccessRights.NONE.value()) {
      return ret;
    }
    if(log.isDebugEnabled()) {
    log.debug("No public rights found, trying legacy methods");
    }

    // The following is legacy rights checking, if value above is non, check in old graphs
    // Check personal access rights
    Edge e = AccessUtils.getEdgeBetweenVertices(user, node, DataModel.Links.hasAccessRights, true, graph);
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
    Integer publicAccessRights = node.getProperty(DataModel.Properties.publicAccess);
    if (publicAccessRights != null) {
      ret = DataModel.Enums.AccessRights.fromInt(publicAccessRights);
      if (ret == DataModel.Enums.AccessRights.WRITE) {
        return ret;
      }
    }

    // Check group access rights
    Iterator<Edge> itMemberships = user.getEdges(Direction.OUT, DataModel.Links.isMemberOfGroup).iterator();
    while (itMemberships.hasNext()) {
      OrientVertex group = (OrientVertex) itMemberships.next().getVertex(Direction.IN);
      e = AccessUtils.getEdgeBetweenVertices(group, node, DataModel.Links.hasAccessRights, true, graph);
      if (e != null) {
        int accessRight = e.getProperty(DataModel.Properties.accessRights);
        if (accessRight > ret.value()) {
          ret = DataModel.Enums.AccessRights.fromInt(accessRight);
        }
      }
    }

    return ret;
  }

  public static boolean canRead(OrientVertex vUser, OrientVertex vNode, OrientBaseGraph g, RightsManagementDatabase rightsDb) {
    if (AccessRights.getAccessRights(vUser, vNode, g, rightsDb).value() >= DataModel.Enums.AccessRights.READ.value()) {
      return true;
    }
    return false;
  }

  public static boolean canWrite(@NotNull OrientVertex vUser, @NotNull OrientVertex vNode, OrientBaseGraph g, RightsManagementDatabase rightsDb) {
    if (AccessRights.getAccessRights(vUser, vNode, g, rightsDb).value() >= DataModel.Enums.AccessRights.WRITE.value()) {
      return true;
    }
    return false;
  }

  public static boolean canPublicRead(OrientVertex vNode, OrientBaseGraph g, RightsManagementDatabase rightsDb) {
    if(rightsDb.getAccessRights("PUBLIC", (String) vNode.getProperty(DataModel.Properties.id)).value() > DataModel.Enums.AccessRights.NONE.value()) {
      return true;
    }
    
    // Legacy checks
    Integer publicAccessRights = vNode.getProperty(DataModel.Properties.publicAccess);
    if (publicAccessRights == null) {
      return false;
    }
    if (publicAccessRights >= DataModel.Enums.AccessRights.READ.value()) {
      return true;
    }
    return false;
  }

  /**
   * Checks to see if user is allowed to grant access must be performed before
   * calling this method. To remove rights, call revokeAccessRights instead as
   * this method will terminate with an error.
   *
   * @param accessor User or Group whose rights will be changed
   * @param node
   * @param rights
   * @param graph
   * @pre Current user is allowed to change access rights for accessor and node
   * @return
   */
  public static void grantAccessRights(OrientVertex accessor, OrientVertex node, DataModel.Enums.AccessRights rights, RightsManagementDatabase rightsDb) {
    if(log.isDebugEnabled()) {
      log.debug("grantAccessRights user=" + (String) accessor.getProperty(DataModel.Properties.login) + " node=" + (String) node.getProperty(DataModel.Properties.id) + " rights=" + rights.name());
    }
    rightsDb.setAccessRights((String) accessor.getProperty(DataModel.Properties.login), (String) node.getProperty(DataModel.Properties.id), rights);
//    OrientEdge edge = AccessUtils.getEdgeBetweenVertices(accessor, node, DataModel.Links.hasAccessRights, true, graph);
//    if (edge == null) {
//      edge = graph.addEdge("class:" + DataModel.Links.hasAccessRights, accessor, node, DataModel.Links.hasAccessRights);
//      edge.setProperty(DataModel.Properties.id, CreatorUtils.newEdgeUUID(graph));
//      edge.setProperty(DataModel.Properties.creationDate, (new Date()).getTime());
//    }
//
//    edge.setProperty(DataModel.Properties.accessRights, rights.value());
//    return edge;
  }

  public static void grantPublicAccessRights(OrientVertex node, DataModel.Enums.AccessRights rights, RightsManagementDatabase rightsDb) {
    rightsDb.setAccessRights("PUBLIC", (String) node.getProperty(DataModel.Properties.id), rights);
//    node.setProperty(DataModel.Properties.publicAccess, rights.value());
  }

  public static void revokeAccessRights(OrientVertex user, OrientVertex node, OrientBaseGraph graph, RightsManagementDatabase rightsDb) {
    rightsDb.setAccessRights((String) user.getProperty(DataModel.Properties.login), (String) node.getProperty(DataModel.Properties.id), DataModel.Enums.AccessRights.NONE);
//    OrientEdge edge = AccessUtils.getEdgeBetweenVertices(user, node, DataModel.Links.hasAccessRights, true, graph);
//    if (edge != null) {
//      edge.remove();
//    }
  }

  public static boolean isLatestVersionAndHasRights(OrientVertex user, OrientVertex node, DataModel.Enums.AccessRights level, OrientBaseGraph g, RightsManagementDatabase rightsDb) {
    if (AccessUtils.isLatestVersion(node)) {
      if (AccessRights.getAccessRights(user, node, g, rightsDb).value() >= level.value()) {
        return true;
      }
    }
    return false;
  }
}
