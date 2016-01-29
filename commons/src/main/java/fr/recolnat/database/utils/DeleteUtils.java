package fr.recolnat.database.utils;

import com.tinkerpop.blueprints.Direction;
import com.tinkerpop.blueprints.Edge;
import com.tinkerpop.blueprints.Vertex;
import com.tinkerpop.blueprints.impls.orient.OrientEdge;
import com.tinkerpop.blueprints.impls.orient.OrientElement;
import com.tinkerpop.blueprints.impls.orient.OrientGraph;
import com.tinkerpop.blueprints.impls.orient.OrientVertex;
import fr.recolnat.database.model.DataModel;

import java.util.Iterator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Created by Dmitri Voitsekhovitch (dvoitsekh@gmail.com) on 29/04/15.
 */
public class DeleteUtils {

  private static final Logger log = LoggerFactory.getLogger(DeleteUtils.class);

  public static String removeParentChildLink(String linkId, String childId, String parentId, OrientGraph graph) {
    Vertex vParent = AccessUtils.getWorkbench(parentId, graph);
    Vertex vChild = AccessUtils.getNodeById(childId, graph);
    Edge eLink = graph.getEdges(DataModel.Properties.id, linkId).iterator().next();
    String childRole = vChild.getProperty(DataModel.Properties.role);

    if ("workbench-root".equals(childRole)) {
      return "Operation not allowed: deleting root workbench";
    }

    DeleteUtils.removeParentChildLink(eLink, vChild, vParent, graph);

    return null;
  }

  public static String delete(String id, OrientVertex user, OrientGraph g) {
    OrientElement elt = g.getElement(id);
    if (elt.getElementType().equals("Vertex")) {
      return DeleteUtils.deleteVertex((OrientVertex) elt, user, g);
    } else if (elt.getElementType().equals("Edge")) {
      return DeleteUtils.deleteEdge((OrientEdge) elt, user, g);
    } else {
      log.error("Unknown element type " + elt.getElementType() + " for id " + id);
      return null;
    }
  }

  public static String deleteVertex(OrientVertex vertexToDelete, OrientVertex user, OrientGraph g) {
    // Check rights : user must be able to WRITE; vertex must not be shared with anyone; children (annotations, measures) must not be shared and will be deleted
    // Filter by type for the last criterion
    String type = vertexToDelete.getProperty("@class");
    switch (type) {
      case DataModel.Classes.BaseTypes.abstractEntity:
        // Too abstract, we're not touching this
        return null;
      case DataModel.Classes.BaseTypes.externBaseEntity:
        // Never delete external stuff, nobody has right to anyway
        return null;
      case DataModel.Classes.CompositeTypes.collection:
        // Only collection administrators can delete collections (and even then they might not be able to)
        return null;
      case DataModel.Classes.CompositeTypes.curator:
        // These people are a permanent fixture of the landscape.
        return null;
      case DataModel.Classes.CompositeTypes.discussion:
        // A discussion can be deleted if it is empty
        //@TODO: delete it
        return null;
      case DataModel.Classes.CompositeTypes.harvest:
        // TODO find out if this can be deleted
        return null;
      case DataModel.Classes.CompositeTypes.harvester:
        // TODO find out if this can be deleted
        return null;
      case DataModel.Classes.CompositeTypes.herbarium:
// TODO find out if this can be deleted          
        return null;
      case DataModel.Classes.CompositeTypes.herbariumSheet:
        // This cannot be deleted
        // Unless it is a personal image upload ?
        return null;
      case DataModel.Classes.CompositeTypes.mission:
        // Not deletable
        return null;
      case DataModel.Classes.CompositeTypes.organisation:
        // Not deletable unless an organisation and all of its work can cease to exist.
        // But it could be renamed, which might lead to it being linked to its renamed version
        return null;
      case DataModel.Classes.CompositeTypes.sheetPart:
        // Can a part be deleted without deleting the sheet it is part of?
        return null;
      case DataModel.Classes.CompositeTypes.specimen:
        // Not deletable, but the link between an entity and a specimen is deletable
        return null;
      case DataModel.Classes.CompositeTypes.user:
        // Not deletable
        return null;
      case DataModel.Classes.CompositeTypes.virtualTour:
        // TODO not defined yet
        return null;
      case DataModel.Classes.CompositeTypes.workbench:
        // Deletable only if not shared and user has write access
        if(AccessRights.getAccessRights(user, vertexToDelete, g).value() < DataModel.Enums.AccessRights.WRITE.value()) {
          return "Delete not authorized. User does not have WRITE permission";
        }
        if(vertexToDelete.countEdges(Direction.IN, DataModel.Links.hasAccessRights) > 1) {
          return "Delete not authorized. Entity is shared.";
        }
        // At this stage we do not know from which parent it needs to be removed, therefore we will assume it needs to be deleted in general (i.e. from all parents). This is done automatically by OrientDB when deleting a vertex.
        // Do not touch children as they could be shared
        g.removeVertex(vertexToDelete);
        return null;
      case DataModel.Classes.LeafTypes.comment:
        // Can only be deleted by admin
        return null;
      case DataModel.Classes.LeafTypes.coordinates:
        // Only if not shared
        return null;
      case DataModel.Classes.LeafTypes.determination:
        // Not deletable
        return null;
      case DataModel.Classes.LeafTypes.measureReference:
        // Deletable with WRITE unless shared
        return null;
      case DataModel.Classes.LeafTypes.measurement:
        // Deletable with WRITE unless shared
        return null;
      case DataModel.Classes.LeafTypes.message:
        // Deletable with WRITE unless shared
        return null;
      case DataModel.Classes.LeafTypes.path:
        // Deletable with WRITE unless shared (must check the whole annotation chain starting at the path)
        return null;
      case DataModel.Classes.LeafTypes.pointOfInterest:
        // Deletable with WRITE unless shared (must check the whole annotation chain starting at the path)
        return null;
      case DataModel.Classes.LeafTypes.regionOfInterest:
        // Deletable with WRITE unless shared (must check the whole annotation chain starting at the path)
        return null;
      case DataModel.Classes.LeafTypes.transcription:
        // Deletable with WRITE unless shared
        return null;
      case DataModel.Classes.LeafTypes.vernacularName:
        // Deletable with WRITE unless shared
        return null;
      case DataModel.Classes.LevelOneHeirTypes.compositeEntity:
        // Too abstract, cannot delete
        return null;
      case DataModel.Classes.LevelOneHeirTypes.leafEntity:
        // Too abstract, cannot delete
        return null;
      case DataModel.Classes.LevelOneHeirTypes.opinion:
        // Open for debate, any opinion can ideally be modified by its creator and an opinion is always shared
        return null;
      case DataModel.Classes.LevelOneHeirTypes.relationship:
        // Too abstract, cannot be deleted
        return null;
      case DataModel.Classes.LevelOneHeirTypes.socialEntity:
        // Too abstract, cannot be deleted
        return null;
      case DataModel.Classes.RelationshipTypes.tag:
        // Deletable with WRITE unless shared
        return null;
      default:
        log.error("Unknown vertex type " + type);
        return null;
    }
  }

  public static String deleteEdge(OrientEdge edgeToDelete, OrientVertex user, OrientGraph g) {
    // What should we do here ? How to know if an edge is deletable ?
    // User must have WRITE access to both ends? Does not work if a sheet is at one end
    // Best course of action would be to process according to edge type
    return null;
  }

  private static void removeParentChildLink(Edge link, Vertex child, Vertex parent, OrientGraph graph) {
    String childRole = child.getProperty(DataModel.Properties.role);
    if ("workbench-root".equals(childRole)) {
      return;
    }

    graph.removeEdge(link);

    if (childRole == null) {
      // Not a workbench, do not delete. Operation finished
      return;
    }
    Iterator<Edge> itParents = child.getEdges(Direction.IN, DataModel.Links.hasChild).iterator();
    if (itParents.hasNext()) {
      // Element still has parents and does not need to be deleted. Operation finished
      return;
    }

    // Recursively remove child's children
    Iterator<Edge> itChildEdge = child.getEdges(Direction.OUT, DataModel.Links.hasChild).iterator();
    while (itChildEdge.hasNext()) {
      Edge childEdge = itChildEdge.next();
      DeleteUtils.removeParentChildLink(childEdge, childEdge.getVertex(Direction.IN), child, graph);
    }

    // Finally remove the child itself. Previous checks must have ensured it is an orphan.
    graph.removeVertex(child);
    return;
  }
}
