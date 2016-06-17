package fr.recolnat.database.utils;

import com.drew.lang.annotations.NotNull;
import com.tinkerpop.blueprints.Direction;
import com.tinkerpop.blueprints.Edge;
import com.tinkerpop.blueprints.Vertex;
import com.tinkerpop.blueprints.impls.orient.OrientEdge;
import com.tinkerpop.blueprints.impls.orient.OrientElement;
import com.tinkerpop.blueprints.impls.orient.OrientGraph;
import com.tinkerpop.blueprints.impls.orient.OrientVertex;
import fr.recolnat.database.model.DataModel;
import java.util.ArrayList;
import java.util.HashMap;

import java.util.Iterator;
import java.util.List;
import java.util.Map;
import javax.ws.rs.NotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Created by Dmitri Voitsekhovitch (dvoitsekh@gmail.com) on 21/04/15.
 */
public class AccessUtils {
  private static final Logger log = LoggerFactory.getLogger(AccessUtils.class);
  
  public static OrientVertex findLatestVersion(Iterator<Vertex> itNodesWithSameUID, OrientGraph g) {
    try{
      while(true) {
      OrientVertex candidateNode = (OrientVertex) itNodesWithSameUID.next();
      if(candidateNode.countEdges(Direction.OUT, DataModel.Links.hasNewerVersion) == 0) {
        return candidateNode;
      }
    }
    }
    catch(Exception e) {
      
    }
//    while(itNodesWithSameUID.hasNext()) {
//      OrientVertex candidateNode = (OrientVertex) itNodesWithSameUID.next();
//      if(candidateNode.countEdges(Direction.OUT, DataModel.Links.hasNewerVersion) == 0) {
//        return candidateNode;
//      }
//    }
    return null;
  }
  
  public static OrientEdge findLatestVersion(OrientEdge edge, OrientGraph g) {
    if(edge.getProperty(DataModel.Properties.nextVersionId) == null) {
      return edge;
    }
    
    String nextVersionId = edge.getProperty(DataModel.Properties.nextVersionId);
    return AccessUtils.findLatestVersion(AccessUtils.getEdgeById(nextVersionId, g), g);
  }
  
  public static OrientVertex findLatestVersion(OrientVertex v) {
    Iterator<Vertex> itNewVersion = v.getVertices(Direction.OUT, DataModel.Links.hasNewerVersion).iterator();
    if(itNewVersion.hasNext()) {
      return AccessUtils.findLatestVersion((OrientVertex) itNewVersion.next());
    }
    else {
      return v;
    }
  }
  
  public static boolean isLatestVersion(OrientVertex v) {
    if(log.isDebugEnabled()) {
      log.debug("Vertex " + v.toString() + " has " + v.countEdges(Direction.OUT, DataModel.Links.hasNewerVersion) + " new versions");
    }
    if(v.countEdges(Direction.OUT, DataModel.Links.hasNewerVersion) > 0) {
      return false;
    }
    
//    Iterator<Vertex> itNewVersion = v.getVertices(Direction.OUT, DataModel.Links.hasNewerVersion).iterator();
//    if(itNewVersion.hasNext()) {
//      // Removing edges may leave an empty collection which still has a hasNext field, therefore
//      Vertex vNewVersion = itNewVersion.next();
//      if(vNewVersion == null) {
//        return true;
//      }
//      return false;
//    }
    return true;
  }
  
  public static boolean isLatestVersion(OrientEdge e) {
    if(e.getProperty(DataModel.Properties.nextVersionId) != null) {
      return false;
    }
    return true;
  }
  
  public static OrientVertex getSet(String workbenchId, OrientGraph graph) {
    Iterator<Vertex> itWb = graph.getVertices(DataModel.Classes.set, new String[]{DataModel.Properties.id}, new Object[]{workbenchId}).iterator();
    
    return AccessUtils.findLatestVersion(itWb, graph);
  }
  
  public static OrientVertex getOriginalSource(@NotNull String recolnatUUID, @NotNull OrientGraph g) {
    if(log.isTraceEnabled()) {
      log.trace("getOriginalSource(" + recolnatUUID + ", g)");
    }
    Iterable<Vertex> it = g.getVertices(DataModel.Classes.originalSource, 
        new String[] {DataModel.Properties.idInOriginSource, DataModel.Properties.branch}, 
        new Object[] {recolnatUUID, DataModel.Globals.BRANCH_MAIN});
    OrientVertex vSource = AccessUtils.findLatestVersion(it.iterator(), g);
        
    return vSource;
  }
  
  public static OrientVertex getPublic(OrientGraph g) {
    Iterator<Vertex> itGroups = g.getVertices(DataModel.Classes.group, 
        new String[] {DataModel.Properties.id}, 
        new Object[] {DataModel.Globals.PUBLIC_GROUP_ID}).iterator();
    
    if(!itGroups.hasNext()) {
      log.error("PUBLIC group does not exist!");
      return null;
    }
    
    return (OrientVertex) itGroups.next();
  }

  /**
   * Retrieves the given user's root set. If none exists, throws exception.
   * @param user
   * @param graph
   * @return
   */
  public static OrientVertex getCoreSet(OrientVertex user, OrientGraph graph) {
    OrientVertex vCoreSet = AccessUtils.findLatestVersion(user.getVertices(Direction.OUT, DataModel.Links.hasCoreSet).iterator(), graph);
    // Get user's direct-link workbench iterator
//    Iterator<Edge> edgeIt = user.getEdges(Direction.IN, DataModel.Links.createdBy).iterator();
//    // Return the right workbench
//    while(edgeIt.hasNext()) {
//      Vertex vCreated = edgeIt.next().getVertex(Direction.OUT);
//      if(DataModel.Globals.ROOT_SET_ROLE.equals(vCreated.getProperty(DataModel.Properties.role))) {
//        if(vCreated.getEdges(Direction.OUT, DataModel.Links.hasNewerVersion).iterator().hasNext()) {
//          continue;
//        }
//        return (OrientVertex) vCreated;
//      }
//    }
if(vCoreSet != null) {
  return vCoreSet;
}
    // Or create one if it does not exist
//    OrientVertex rootWb = CreatorUtils.createWorkbenchContent("Mes Etudes", DataModel.Globals.ROOT_SET_ROLE, graph);
//    UpdateUtils.addCreator(rootWb, (OrientVertex) user, graph);
//    AccessRights.grantAccessRights(user, rootWb, DataModel.Enums.AccessRights.WRITE, graph);
    throw new NotFoundException("No root set for user " + user.getProperty(DataModel.Properties.id));
//    return null;
  }
  
  public static OrientVertex getView(String id, OrientGraph g) {
    Iterator<Vertex> itViews = g.getVertices(DataModel.Classes.setView, new String[] {DataModel.Properties.id}, new Object[]{id}).iterator();
    return AccessUtils.findLatestVersion(itViews, g);
  }

  public static OrientVertex getUserByUUID(String user, OrientGraph graph) {
    Iterator<Vertex> itUs = graph.getVertices(DataModel.Classes.user, new String [] {DataModel.Properties.id}, new Object[] {user}).iterator();
    if(itUs.hasNext()) {
      return (OrientVertex) itUs.next();
    }
    return null;
  }
  
  public static OrientVertex getUserByLogin(String user, OrientGraph graph) {
    Iterator<Vertex> itUs = graph.getVertices(DataModel.Classes.user, new String [] {DataModel.Properties.login}, new Object[] {user}).iterator();
    if(itUs.hasNext()) {
      return (OrientVertex) itUs.next();
    }
    return null;
  }

  public static OrientVertex getNodeById(String id, OrientGraph graph) {
    Iterator<Vertex> itNode = graph.getVertices(DataModel.Properties.id, id).iterator();
    return AccessUtils.findLatestVersion(itNode, graph);
  }
  
  public static OrientEdge getEdgeById(String id, OrientGraph graph) {
    Iterator<Edge> itEdges = graph.getEdges(DataModel.Properties.id, id).iterator();
    if(itEdges.hasNext()) {
      return AccessUtils.findLatestVersion((OrientEdge) itEdges.next(), graph);
    }
    return null;
  }

  public static OrientEdge getEdgeBetweenVertices(OrientVertex parent, OrientVertex child, String label, boolean current, OrientGraph graph) {
    OrientVertex vParentVersioned = parent;
    OrientVertex vChildVersioned = child;
    if(current) {
      vParentVersioned = AccessUtils.findLatestVersion(parent);
      vChildVersioned = AccessUtils.findLatestVersion(child);
    }
    
    Iterator<Edge> itEdge = vParentVersioned.getEdges(vChildVersioned, Direction.OUT, label).iterator();
    try {
      return (OrientEdge) itEdge.next();
    }
    catch(Exception e) {
      
    }
//    if(itEdge.hasNext()) {
//      return (OrientEdge) itEdge.next();
//    }
    
    return null;
  }

  public static OrientVertex getCreator(OrientVertex vertex, OrientGraph g) {
    OrientVertex creator = AccessUtils.findLatestVersion(vertex.getVertices(Direction.OUT, DataModel.Links.createdBy).iterator(), g);
    if(creator == null) {
      log.error("Node " + vertex.toString() + " does not have a creator. This must never happen in production.");
    }
    return creator;
  }
  
  public static String getCreatorId(OrientVertex vertex, OrientGraph g) {
    return AccessUtils.getCreator(vertex, g).getProperty(DataModel.Properties.id);
  }
  
  public static OrientVertex getSpecimenFromOriginalSource(OrientVertex vOriginalSource, OrientGraph g) {
    Iterator<Vertex> itSourcedEntities = vOriginalSource.getVertices(Direction.IN, DataModel.Links.hasOriginalSource).iterator();
    while (itSourcedEntities.hasNext()) {
      OrientVertex sourcedEntity = (OrientVertex) itSourcedEntities.next();
      if (BranchUtils.isMainBranch(sourcedEntity, g)) {
        if (AccessUtils.isLatestVersion(sourcedEntity)) {
          if (sourcedEntity.getProperty("@class").equals(DataModel.Classes.specimen)) {
            return sourcedEntity;
          }
        }
      }
    }
    return null;
  }
  
  public static List<OrientVertex> getSpecimenImages(OrientVertex vSpecimen, OrientGraph g) {
    List<OrientVertex> retImages = new ArrayList<>();
    Iterator<Vertex> itImages = vSpecimen.getVertices(Direction.OUT, DataModel.Links.hasImage).iterator();
    while(itImages.hasNext()) {
      OrientVertex vImage = (OrientVertex) itImages.next();
      if(AccessUtils.isLatestVersion(vImage)) {
        retImages.add(vImage);
      }
    }
    return retImages;
  }
  
//  public static OrientVertex getImage(String imageUrl, OrientGraph g) {
//    Iterator<Vertex> itSheets = g.getVertices(DataModel.Classes.CompositeTypes.image, 
//        new String[] {DataModel.Properties.imageUrl}, 
//        new Object[] {imageUrl})
//        .iterator();
//    return AccessUtils.findLatestVersion(itSheets, g);
//  }

  public static OrientVertex getImageMainBranch(String imageUrl, OrientGraph g) {
    String[] fields = new String[] {DataModel.Properties.imageUrl, DataModel.Properties.branch};
    Object[] fieldValues = new Object[] {imageUrl, DataModel.Globals.BRANCH_MAIN};
    
    Iterator<Vertex> itImages = g.getVertices(DataModel.Classes.image, fields, fieldValues).iterator();
    return AccessUtils.findLatestVersion(itImages, g);
  }
  
  public static Map<String, Object> getRecolnatProperties(OrientElement elt) {
    Map<String, Object> returnProps = new HashMap<>();
    Map<String, Object> elementProps = elt.getProperties();
    for(String key: elt.getPropertyKeys()) {
      returnProps.put(key, elementProps.get(key));
    }
    
    return returnProps;
  }
}
