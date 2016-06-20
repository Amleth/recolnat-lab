package fr.recolnat.database.utils;

import com.tinkerpop.blueprints.Direction;
import com.tinkerpop.blueprints.Edge;
import com.tinkerpop.blueprints.Vertex;
import com.tinkerpop.blueprints.impls.orient.OrientEdge;
import com.tinkerpop.blueprints.impls.orient.OrientGraph;
import com.tinkerpop.blueprints.impls.orient.OrientVertex;
import fr.recolnat.database.model.DataModel;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Created by Dmitri Voitsekhovitch (dvoitsekh@gmail.com) on 26/03/15.
 */
public class UpdateUtils {

  private static Logger log = LoggerFactory.getLogger(UpdateUtils.class);

  public static OrientVertex createNewVertexVersion(OrientVertex vToUpdate, String userId, OrientGraph g) {
    if (log.isDebugEnabled()) {
      log.debug("createNewVertexVersion(" + vToUpdate.toString() + ", " + userId);
    }
    OrientVertex updatedVertex = g.addVertex("class:" + vToUpdate.getProperty("@class"));
    // Copy properties
    updatedVertex.setProperties(AccessUtils.getRecolnatProperties(vToUpdate));

    // Copy edges
    if (log.isDebugEnabled()) {
      log.debug("createNewVertexVersion::Copying ingoing edges");
    }
    Iterator<Edge> itEdges = vToUpdate.getEdges(Direction.IN).iterator();
    while (itEdges.hasNext()) {
      OrientEdge oldEdge = (OrientEdge) itEdges.next();
      if (oldEdge.getLabel().equals(DataModel.Links.hasNewerVersion)) {
        // Do NOT copy edge from previous version
        continue;
      }
      if (!AccessUtils.isLatestVersion(oldEdge)) {
        // Do NOT copy obsolete edges
        continue;
      }
      OrientVertex v = (OrientVertex) oldEdge.getVertex(Direction.OUT);
      // Create same edge to new version of vertex
      UpdateUtils.createNewEdgeVersion(v, updatedVertex, oldEdge, g);
    }

    if (log.isDebugEnabled()) {
      log.debug("createNewVertexVersion::Copying outgoing edges");
    }
    Iterator<Edge> itOutEdges = vToUpdate.getEdges(Direction.OUT).iterator();
    // Use an accumulator otherwise, for some reason, the update operation loops infinitely
    List<OrientEdge> outEdgeTempStore = new ArrayList<>();
    while(itOutEdges.hasNext()) {
      outEdgeTempStore.add((OrientEdge) itOutEdges.next());
    }
    
    for (OrientEdge oldEdge: outEdgeTempStore) {
//      OrientEdge oldEdge = (OrientEdge) itOutEdges.next();
      if (log.isDebugEnabled()) {
        log.debug("createNewVertexVersion::Copying outgoing edge " + oldEdge.toString());
      }
      if (oldEdge.getLabel().equals(DataModel.Links.hasNewerVersion)) {
        // Do NOT copy edge from previous version
        continue;
      }
      if (!AccessUtils.isLatestVersion(oldEdge)) {
        // Do NOT copy obsolete edges
        continue;
      }
      OrientVertex v = (OrientVertex) oldEdge.getVertex(Direction.IN);
      // Create same edge to new version of vertex
      UpdateUtils.createNewEdgeVersion(updatedVertex, v, oldEdge, g);
    }

    // Link versions
    if (log.isDebugEnabled()) {
      log.debug("createNewVertexVersion::Link old vertex to new vertex");
    }
    OrientEdge edgeToNewVersion = (OrientEdge) vToUpdate.addEdge(DataModel.Links.hasNewerVersion, updatedVertex);
    edgeToNewVersion.setProperties(
        DataModel.Properties.id, CreatorUtils.newEdgeUUID(g),
        DataModel.Properties.creationDate, (new Date()).getTime(),
        DataModel.Properties.creator, userId);

    if (log.isDebugEnabled()) {
      log.debug("createNewVertexVersion END");
    }

    return updatedVertex;
  }

  private static OrientEdge createNewEdgeVersion(OrientVertex fromVertex, OrientVertex toVertex, OrientEdge oldEdge, OrientGraph g) {
    if(log.isDebugEnabled()) {
      log.debug("createNewEdgeVersion(" + fromVertex.toString() + ", " + toVertex.toString() + ", " + oldEdge.toString() + ")");
    }
    String newEdgeId = CreatorUtils.newEdgeUUID(g);
    OrientEdge newEdge = (OrientEdge) fromVertex.addEdge(oldEdge.getLabel(), toVertex);
    Map<String, Object> newProps = AccessUtils.getRecolnatProperties(oldEdge);
    newProps.put(DataModel.Properties.id, newEdgeId);
    newEdge.setProperties(newProps);
    oldEdge.setProperty(DataModel.Properties.nextVersionId, newEdgeId);
    // However the new edge must have a different id. Creation date is technically the same as the old one
//    newEdge.setProperty(DataModel.Properties.id, newEdgeId);

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
    OrientEdge hasChild = (OrientEdge) set.addEdge(DataModel.Links.containsItem, item);
    hasChild.setProperty(DataModel.Properties.id, CreatorUtils.newEdgeUUID(g));
    hasChild.setProperty(DataModel.Properties.creationDate, (new Date()).getTime());
    hasChild.setProperty(DataModel.Properties.creator, user.getProperty(DataModel.Properties.id));

    String role = item.getProperty(DataModel.Properties.role);
    if (role != null) {
      hasChild.setProperty(DataModel.Properties.coordX, null);
      hasChild.setProperty(DataModel.Properties.coordY, null);
      hasChild.setProperty(DataModel.Properties.coordZ, 0);
    }
    return hasChild;
  }

  public static OrientEdge addSubsetToSet(OrientVertex set, OrientVertex subSet, OrientVertex user, OrientGraph g) {
    OrientEdge e = (OrientEdge) set.addEdge(DataModel.Links.containsSubSet, subSet);
    e.setProperty(DataModel.Properties.id, CreatorUtils.newEdgeUUID(g));
    e.setProperty(DataModel.Properties.creationDate, (new Date()).getTime());
    e.setProperty(DataModel.Properties.creator, user.getProperty(DataModel.Properties.id));

    return e;
  }

  public static OrientEdge addSubsetToSet(String setId, OrientVertex subSet, OrientVertex user, OrientGraph g) {
    OrientVertex vParent = (OrientVertex) AccessUtils.getSet(setId, g);
    return UpdateUtils.addSubsetToSet(vParent, subSet, user, g);
  }

  /**
   * Adds provided image signature to provided specimen. Does not check if image is already linked to specimen (this check must be made beforehand). 
   * This method operates on the main branch only.
   *
   * @param vSpecimen Latest version of a specimen on its main branch.
   * @param imageUrl
   * @param thumbUrl
   * @param g
   * @return The newly added image on the main branch.
   */
  public static OrientVertex addImageToSpecimen(OrientVertex vSpecimen, String imageUrl, int width, int height, String thumbUrl, OrientGraph g) {
    // See if image exists and is linked to specimen
//    Iterator<Vertex> itImageCandidates = g.getVertices(DataModel.Classes.image, 
//        new String[] {
//          DataModel.Properties.imageUrl,
//          DataModel.Properties.thumbUrl,
//          DataModel.Properties.branch
//        }, 
//        new Object[] {
//          imageUrl,
//          thumbUrl,
//          DataModel.Globals.BRANCH_MAIN
//        }).iterator();
//    
//    while(itImageCandidates.hasNext()) {
//      OrientVertex vImageCandidate = (OrientVertex) itImageCandidates.next();
//      if(AccessUtils.isLatestVersion(vImageCandidate)) {
//        Iterator<Edge> itHasImage = vSpecimen.getEdges(vImageCandidate, Direction.OUT, DataModel.Links.hasImage).iterator();
//        if(itHasImage.hasNext()) {
//          return vImageCandidate;
//        }
//      }
//    }

    // If not, create it and grant read rights to the general public
    String name = vSpecimen.getProperty(DataModel.Properties.name);
    if(name == null) {
      name = "Intitulé inconnu";
    }
//    OrientVertex vPublic = AccessUtils.getPublic(g);
    OrientVertex vImage = CreatorUtils.createImage(name, imageUrl, width, height, thumbUrl, g);
    UpdateUtils.link(vSpecimen, vImage, DataModel.Links.hasImage, DataModel.Globals.PUBLIC_GROUP_ID, g);
//    AccessRights.grantAccessRights(vPublic, vImage, DataModel.Enums.AccessRights.WRITE, g);
    AccessRights.grantPublicAccessRights(vImage, DataModel.Enums.AccessRights.READ, g);

    return vImage;
  }

  public static OrientEdge showItemInView(Integer x, Integer y, OrientVertex item, OrientVertex view, OrientVertex user, OrientGraph g) {
    OrientEdge link = UpdateUtils.link(view, item, DataModel.Links.displays, (String) user.getProperty(DataModel.Properties.id), g);

    link.setProperty(DataModel.Properties.coordX, x);
    link.setProperty(DataModel.Properties.coordY, y);

    return link;
  }

  public static OrientEdge link(OrientVertex source, OrientVertex destination, String label, String creatorId, OrientGraph g) {
    if (source == null || destination == null) {
      return null;
    }
    OrientEdge link = (OrientEdge) source.addEdge(label, destination);

    link.setProperty(DataModel.Properties.id, CreatorUtils.newEdgeUUID(g));
    link.setProperty(DataModel.Properties.creationDate, (new Date()).getTime());
    if (creatorId != null) {
      link.setProperty(DataModel.Properties.creator, creatorId);
    }

    return link;
  }
  
  public static OrientEdge linkAnnotationToEntity(OrientVertex annotation, OrientVertex entity, String userId, OrientGraph g) {
      return UpdateUtils.link(entity, annotation, DataModel.Links.hasAnnotation, userId, g);
  }

  public static OrientEdge linkRegionOfInterestToImage(OrientVertex image, OrientVertex regionOfInterest, String userId, OrientGraph g) {
    return UpdateUtils.link(image, regionOfInterest, DataModel.Links.roi, userId, g);
  }

  public static OrientEdge linkPointOfInterestToImage(OrientVertex image, OrientVertex pointOfInterest, String userId, OrientGraph g) {
    return UpdateUtils.link(image, pointOfInterest, DataModel.Links.poi, userId, g);
  }

  public static OrientEdge linkTrailOfInterestToImage(OrientVertex image, OrientVertex path, String user, OrientGraph g) {
    return UpdateUtils.link(image, path, DataModel.Links.toi, user, g);
  }

//  public static OrientEdge linkAnnotationToEntity(String entityId, OrientVertex annotation, OrientGraph g) {
//    OrientVertex vEntity = (OrientVertex) AccessUtils.getNodeById(entityId, g);
//    return UpdateUtils.linkAnnotationToEntity(vEntity, annotation, g);
//  }
//
//  public static OrientEdge linkAnnotationToEntity(OrientVertex entity, OrientVertex annotation, OrientGraph g) {
//    OrientEdge link = g.addEdge("class:" + DataModel.Links.hasAnnotation, entity, annotation, DataModel.Links.hasAnnotation);
//    link.setProperty(DataModel.Properties.id, CreatorUtils.newEdgeUUID(g));
//    link.setProperty(DataModel.Properties.creationDate, (new Date()).getTime());
//
//    return link;
//  }
  public static OrientEdge addRegionOfInterestToSet(String roiId, String setId, OrientVertex user, OrientGraph g) {
    OrientVertex vRoi = AccessUtils.getNodeById(roiId, g);
    OrientVertex vSet = AccessUtils.getSet(setId, g);

    OrientEdge link = UpdateUtils.addItemToSet(vRoi, vSet, user, g);
    link.setProperty(DataModel.Properties.opacity, 1.0);
    return link;
  }

  public static OrientEdge linkMeasureStandard(OrientVertex standard, OrientVertex measurement, OrientVertex user, OrientGraph g) {
    String userId = user.getProperty(DataModel.Properties.id);
    return UpdateUtils.link(measurement, standard, DataModel.Links.definedAsMeasureStandard, userId, g);
  }

  public static OrientEdge addOriginalSource(OrientVertex entity, OrientVertex source, OrientVertex user, OrientGraph g) {
    OrientEdge e = g.addEdge("class:" + DataModel.Links.hasOriginalSource, entity, source, DataModel.Links.hasOriginalSource);
    e.setProperty(DataModel.Properties.creationDate, (new Date()).getTime());
    e.setProperty(DataModel.Properties.creator, user.getProperty(DataModel.Properties.id));
    return e;
  }
}
