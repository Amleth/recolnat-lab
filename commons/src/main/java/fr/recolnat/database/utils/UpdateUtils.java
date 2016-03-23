package fr.recolnat.database.utils;

import com.tinkerpop.blueprints.Direction;
import com.tinkerpop.blueprints.Edge;
import com.tinkerpop.blueprints.impls.orient.OrientEdge;
import com.tinkerpop.blueprints.impls.orient.OrientGraph;
import com.tinkerpop.blueprints.impls.orient.OrientVertex;
import fr.recolnat.database.model.DataModel;
import java.util.Date;
import java.util.Iterator;

/**
 * Created by Dmitri Voitsekhovitch (dvoitsekh@gmail.com) on 26/03/15.
 */
public class UpdateUtils {
  public static OrientVertex createNewVertexVersion(OrientVertex vToUpdate, String userId, OrientGraph g) {
    OrientVertex updatedVertex = g.addVertex("class:" + vToUpdate.getProperty("@class"));
    // Copy properties
    updatedVertex.setProperties(vToUpdate.getProperties());
    
    // Copy edges
    Iterator<Edge> itEdges = vToUpdate.getEdges(Direction.IN).iterator();
    while(itEdges.hasNext()) {
      OrientEdge oldEdge = (OrientEdge) itEdges.next();
      if(oldEdge.getLabel().equals(DataModel.Links.hasNewerVersion)) {
        // Do NOT copy edge from previous version
        continue;
      }
      OrientVertex v = (OrientVertex) oldEdge.getVertex(Direction.OUT);
      // Create same edge to new version of vertex
      UpdateUtils.createNewEdgeVersion(v, updatedVertex, oldEdge, g);
    }
    
    itEdges = vToUpdate.getEdges(Direction.OUT).iterator();
    while(itEdges.hasNext()) {
      OrientEdge oldEdge = (OrientEdge) itEdges.next();
      OrientVertex v = (OrientVertex) oldEdge.getVertex(Direction.IN);
      // Create same edge to new version of vertex
      UpdateUtils.createNewEdgeVersion(updatedVertex, v, oldEdge, g);
    }
    
    // Link versions
    OrientEdge edgeToNewVersion = (OrientEdge) vToUpdate.addEdge(DataModel.Links.hasNewerVersion, updatedVertex);
    edgeToNewVersion.setProperties(new String[] {DataModel.Properties.id, DataModel.Properties.creationDate, DataModel.Properties.creator}, new Object[] {CreatorUtils.newEdgeUUID(g), new Date(), userId});
    
    return updatedVertex;
  }
  
  private static OrientEdge createNewEdgeVersion(OrientVertex fromVertex, OrientVertex toVertex, OrientEdge oldEdge, OrientGraph g) {
    String newEdgeId = CreatorUtils.newEdgeUUID(g);
      OrientEdge newEdge = (OrientEdge) fromVertex.addEdge(oldEdge.getLabel(), toVertex);
      newEdge.setProperties(oldEdge.getProperties());
      oldEdge.setProperty(DataModel.Properties.nextVersionId, newEdgeId);
      // However the new edge must have a different id. Creation date is technically the same as the old one
      newEdge.setProperty(DataModel.Properties.id, newEdgeId);
      
      return newEdge;
  }
  
  
  public static OrientEdge addCreator(OrientVertex item, OrientVertex creator, OrientGraph graph) {
    OrientEdge edge = graph.addEdge("class:" + DataModel.Links.createdBy, item, creator, DataModel.Links.createdBy);
    edge.setProperty(DataModel.Properties.id, CreatorUtils.newEdgeUUID(graph));
    edge.setProperty(DataModel.Properties.creationDate, (new Date()).getTime());
    
    AccessRights.grantAccessRights(creator, item, DataModel.Enums.AccessRights.WRITE, graph);
    return edge;
  }

  public static OrientEdge addItemToSet(OrientVertex item, String setId, OrientVertex user, OrientGraph g) {
    OrientVertex vSet = AccessUtils.getSet(setId, g);
    return UpdateUtils.addItemToSet(item, vSet, user, g);
  }

  public static OrientEdge addItemToSet(OrientVertex item, OrientVertex set, OrientVertex user, OrientGraph g) {
    OrientEdge hasChild = (OrientEdge) set.addEdge(DataModel.Links.hasChild, item);
    hasChild.setProperty(DataModel.Properties.id, CreatorUtils.newEdgeUUID(g));
    hasChild.setProperty(DataModel.Properties.creationDate, (new Date()).getTime());
    hasChild.setProperty(DataModel.Properties.creator, user.getProperty(DataModel.Properties.id));

    String role = item.getProperty(DataModel.Properties.role);
    if(role != null) {
        hasChild.setProperty(DataModel.Properties.coordX, null);
        hasChild.setProperty(DataModel.Properties.coordY, null);
        hasChild.setProperty(DataModel.Properties.coordZ, 0);
    }
    return hasChild;
  }

  public static OrientEdge addSubsetToSet(OrientVertex set, OrientVertex subSet, OrientVertex user, OrientGraph g) {
    OrientEdge e = (OrientEdge) set.addEdge(DataModel.Links.hasChild, subSet);
    e.setProperty(DataModel.Properties.id, CreatorUtils.newEdgeUUID(g));
    e.setProperty(DataModel.Properties.creationDate, (new Date()).getTime());
    e.setProperty(DataModel.Properties.creator, user.getProperty(DataModel.Properties.id));
    
    return e;
  }

  public static OrientEdge addSubsetToSet(String setId, OrientVertex subSet, OrientVertex user, OrientGraph g) {
    OrientVertex vParent = (OrientVertex) AccessUtils.getSet(setId, g);
    return UpdateUtils.addSubsetToSet(vParent, subSet, user, g);
  }
  
  public static OrientEdge link(OrientVertex source, OrientVertex destination, String label, String creatorId, OrientGraph g) {
    if(source == null || destination == null) {
      return null;
    }
    OrientEdge link = (OrientEdge) source.addEdge(label, destination);
    
    link.setProperty(DataModel.Properties.id, CreatorUtils.newEdgeUUID(g));
    link.setProperty(DataModel.Properties.creationDate, (new Date()).getTime());
    link.setProperty(DataModel.Properties.creator, creatorId);
    
    return link;
  }

  public static OrientEdge linkRegionOfInterestToEntity(String entity, OrientVertex regionOfInterest, OrientGraph g) {
    OrientVertex vEntity = (OrientVertex) AccessUtils.getNodeById(entity, g);
    OrientEdge link = g.addEdge("class:" + DataModel.Links.roi, vEntity, regionOfInterest, DataModel.Links.roi);
    link.setProperty(DataModel.Properties.id, CreatorUtils.newEdgeUUID(g));
    link.setProperty(DataModel.Properties.creationDate, (new Date()).getTime());

    return link;
  }

  public static OrientEdge linkPointOfInterestToEntity(String entity, OrientVertex pointOfInterest, OrientGraph g) {
    OrientVertex vEntity = (OrientVertex) AccessUtils.getNodeById(entity, g);
    OrientEdge link = g.addEdge("class:" + DataModel.Links.poi, vEntity, pointOfInterest, DataModel.Links.poi);
    link.setProperty(DataModel.Properties.id, CreatorUtils.newEdgeUUID(g));
    link.setProperty(DataModel.Properties.creationDate, (new Date()).getTime());

    return link;
  }

  public static OrientEdge linkPathToEntity(String entity, OrientVertex path, OrientGraph g) {
    OrientVertex vEntity = (OrientVertex) AccessUtils.getNodeById(entity, g);
    OrientEdge link = g.addEdge("class:" + DataModel.Links.path, vEntity, path, DataModel.Links.path);
    link.setProperty(DataModel.Properties.id, CreatorUtils.newEdgeUUID(g));
    link.setProperty(DataModel.Properties.creationDate, (new Date()).getTime());

    return link;
  }

  public static OrientEdge linkAnnotationToEntity(String entityId, OrientVertex annotation, OrientGraph g) {
    OrientVertex vEntity = (OrientVertex) AccessUtils.getNodeById(entityId, g);
    return UpdateUtils.linkAnnotationToEntity(vEntity, annotation, g);
  }

  public static OrientEdge linkAnnotationToEntity(OrientVertex entity, OrientVertex annotation, OrientGraph g) {
    OrientEdge link = g.addEdge("class:" + DataModel.Links.hasAnnotation, entity, annotation, DataModel.Links.hasAnnotation);
    link.setProperty(DataModel.Properties.id, CreatorUtils.newEdgeUUID(g));
    link.setProperty(DataModel.Properties.creationDate, (new Date()).getTime());

    return link;
  }

  public static OrientEdge addRegionOfInterestToSet(String roiId, String setId, OrientVertex user, OrientGraph g) {
    OrientVertex vRoi = AccessUtils.getNodeById(roiId, g);
    OrientVertex vSet = AccessUtils.getSet(setId, g);

    OrientEdge link = UpdateUtils.addItemToSet(vRoi, vSet, user, g);
    link.setProperty(DataModel.Properties.opacity, 1.0);
    return link;
  }

  public static OrientEdge linkScalingData(String sheetId, OrientVertex reference, OrientGraph g) {
    OrientVertex vSheet = (OrientVertex) AccessUtils.getNodeById(sheetId, g);
    OrientEdge link = g.addEdge("class:" + DataModel.Links.hasScalingData, vSheet, reference, DataModel.Links.hasScalingData);
    link.setProperty(DataModel.Properties.creationDate, (new Date()).getTime());
    return link;
  }
  
  public static OrientEdge addOriginalSource(OrientVertex destination, OrientVertex source, OrientVertex user, OrientGraph g) {
    OrientEdge e = g.addEdge("class:" + DataModel.Links.hasOriginalSource, destination, source, DataModel.Links.hasOriginalSource);
    e.setProperty(DataModel.Properties.creationDate, (new Date()).getTime());
    e.setProperty(DataModel.Properties.creator, user.getProperty(DataModel.Properties.id));
    return e;
  }
}
