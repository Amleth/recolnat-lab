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
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response;
import org.apache.commons.lang.NotImplementedException;
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
    String id = vertexToDelete.getProperty(DataModel.Properties.id);
    Iterator itLinks = null;
    switch (type) {
      case DataModel.Classes.BaseTypes.abstractEntity:
        // Too abstract, we're not touching this
        log.warn("Attempt to delete AbstractEntity denied " + id);
        return "Not implemented";
      case DataModel.Classes.BaseTypes.externBaseEntity:
        // Never delete external stuff, nobody has right to anyway
        log.warn("Attempt to delete ExternalEntity denied " + id);
        return "Not implemented";
      case DataModel.Classes.CompositeTypes.collection:
        // Only collection administrators can delete collections (and even then they might not be able to)
        log.warn("Attempt to delete Collection denied " + id);
        return "Not implemented";
      case DataModel.Classes.CompositeTypes.curator:
        // These people are a permanent fixture of the landscape.
        log.warn("Attempt to delete Curator denied " + id);
        return "Not implemented";
      case DataModel.Classes.CompositeTypes.discussion:
        // A discussion can be deleted if it contains messages only by the current user (unless it is open to the public)
        if (DeleteUtils.canUserDeleteSubGraph(vertexToDelete, user, g)) {
          // Delete all messages
          itLinks = vertexToDelete.getVertices(Direction.OUT, DataModel.Links.hasMessage).iterator();
          while (itLinks.hasNext()) {
            OrientVertex vMessage = (OrientVertex) itLinks.next();
            String status = DeleteUtils.deleteVertex(vMessage, user, g);
            if (status != null) {
              log.error("Deletion of message " + vMessage.toString() + " was authorized but failed for some reason. Operation will be rollbacked to avoid inconsistent db state");
              throw new IllegalStateException("Removal of " + vertexToDelete.toString() + " canceled.");
            }
          }
          // Delete tag associations
          itLinks = vertexToDelete.getVertices(Direction.OUT, DataModel.Links.isTagged).iterator();
          while (itLinks.hasNext()) {
            OrientVertex vTagging = (OrientVertex) itLinks.next();
            String status = DeleteUtils.deleteVertex(vTagging, user, g);
            if (status != null) {
              log.error("Deletion of tagging " + vTagging.toString() + " was authorized but failed for some reason. Operation will be rollbacked to avoid inconsistent db state");
              throw new IllegalStateException("Removal of " + vertexToDelete.toString() + " canceled.");
            }
          }
          // Delete self
          g.removeVertex(vertexToDelete);
          return null;
        }
        return "At least one message in Discussion cannot be deleted.";
      case DataModel.Classes.CompositeTypes.harvest:
        // Not deletable
        return "Harvests are permanent";
      case DataModel.Classes.CompositeTypes.harvester:
        // TODO find out if this can be deleted
        return "Harvesters are permanent";
      case DataModel.Classes.CompositeTypes.herbarium:
        // How does one actually delete an entire herbarium ?
        return "Herbariums are permanent";
      case DataModel.Classes.CompositeTypes.herbariumSheet:
        // This cannot be deleted, however it CAN be removed from a workbench
        // Unless it is a personal image upload ?
        return "HerbariumSheet cannot be deleted.";
      case DataModel.Classes.CompositeTypes.mission:
        // Not deletable
        return "Missions cannot be deleted";
      case DataModel.Classes.CompositeTypes.organisation:
        // Not deletable unless an organisation and all of its work can cease to exist.
        // But it could be renamed, which might lead to it being linked to its renamed version
        return "Organisations cannot be deleted";
      case DataModel.Classes.CompositeTypes.sheetPart:
        // Can a part be deleted without deleting the sheet it is part of?
        return "Parts of herbarium sheets cannot be deleted";
      case DataModel.Classes.CompositeTypes.specimen:
        // Not deletable, but the link between an entity and a specimen is deletable
        // Unless someone identified a new specimen
        return "Specimens cannot be deleted";
      case DataModel.Classes.CompositeTypes.user:
        // Not deletable
        return "Users cannot be deleted";
      case DataModel.Classes.CompositeTypes.virtualTour:
        // TODO not defined yet
        return "Not implemented";
      case DataModel.Classes.CompositeTypes.workbench:
        // Deletable only if not shared and user has write access
        if (!DeleteUtils.canUserDeleteSubGraph(vertexToDelete, user, g)) {
          return "User not allowed to delete one of the items linked with " + vertexToDelete.toString();
        }
        // At this stage we do not know from which parent it needs to be removed, therefore we will assume it needs to be deleted in general (i.e. from all parents). This is done automatically by OrientDB when deleting a vertex.
        // Do not touch children as they could be shared
        g.removeVertex(vertexToDelete);
        // Check if anyone can still access children, if not then delete
        return null;
      case DataModel.Classes.LeafTypes.comment:
        if (!DeleteUtils.canUserDeleteSubGraph(vertexToDelete, user, g)) {
          return "User not allowed to delete one of the items linked with " + vertexToDelete.toString();
        }
        g.removeVertex(vertexToDelete);
        return null;
      case DataModel.Classes.LeafTypes.coordinates:
        if (!DeleteUtils.canUserDeleteSubGraph(vertexToDelete, user, g)) {
          return "User not allowed to delete one of the items linked with " + vertexToDelete.toString();
        }
        g.removeVertex(vertexToDelete);
        return null;
      case DataModel.Classes.LeafTypes.determination:
        // Not deletable
        return "Determination cannot be deleted";
      case DataModel.Classes.LeafTypes.measureReference:
        if (!DeleteUtils.canUserDeleteSubGraph(vertexToDelete, user, g)) {
          return "User not allowed to delete one of the items linked with " + vertexToDelete.toString();
        }
        g.removeVertex(vertexToDelete);
        return null;
      case DataModel.Classes.LeafTypes.measurement:
        if (!DeleteUtils.canUserDeleteSubGraph(vertexToDelete, user, g)) {
          return "User not allowed to delete one of the items linked with " + vertexToDelete.toString();
        }
        g.removeVertex(vertexToDelete);
        return null;
      case DataModel.Classes.LeafTypes.message:
        if (!DeleteUtils.canUserDeleteSubGraph(vertexToDelete, user, g)) {
          return "User not allowed to delete one of the items linked with " + vertexToDelete.toString();
        }
        g.removeVertex(vertexToDelete);
        return null;
      case DataModel.Classes.LeafTypes.path:
        if (!DeleteUtils.canUserDeleteSubGraph(vertexToDelete, user, g)) {
          return "User not allowed to delete one of the items linked with " + vertexToDelete.toString();
        }

        // Annotation, Measurement, Comment
        itLinks = vertexToDelete.getVertices(Direction.OUT, DataModel.Links.hasAnnotation).iterator();
        while (itLinks.hasNext()) {
          OrientVertex vAnnotation = (OrientVertex) itLinks.next();
          String status = DeleteUtils.deleteVertex(vAnnotation, user, g);
          if (status != null) {
            log.error("Deletion of annotation " + vAnnotation.toString() + " was authorized but failed for some reason. Operation will be rollbacked to avoid inconsistent db state");
            throw new IllegalStateException("Removal of " + vertexToDelete.toString() + " canceled.");
          }
        }
        // Discussion
        itLinks = vertexToDelete.getVertices(Direction.IN, DataModel.Links.isLinkedTo).iterator();
        while (itLinks.hasNext()) {
          OrientVertex vDiscussion = (OrientVertex) itLinks.next();
          String status = DeleteUtils.deleteVertex(vDiscussion, user, g);
          if (status != null) {
            log.error("Deletion of discussion " + vDiscussion.toString() + " was authorized but failed for some reason. Operation will be rollbacked to avoid inconsistent db state");
            throw new IllegalStateException("Removal of " + vertexToDelete.toString() + " canceled.");
          }
        }
        // Tag
        itLinks = vertexToDelete.getVertices(Direction.OUT, DataModel.Links.isTagged).iterator();
        while (itLinks.hasNext()) {
          OrientVertex vTagging = (OrientVertex) itLinks.next();
          String status = DeleteUtils.deleteVertex(vTagging, user, g);
          if (status != null) {
            log.error("Deletion of tagging " + vTagging.toString() + " was authorized but failed for some reason. Operation will be rollbacked to avoid inconsistent db state");
            throw new IllegalStateException("Removal of " + vertexToDelete.toString() + " canceled.");
          }
        }
        g.removeVertex(vertexToDelete);
        return null;

      case DataModel.Classes.LeafTypes.pointOfInterest:
        if (!DeleteUtils.canUserDeleteSubGraph(vertexToDelete, user, g)) {
          return "User not allowed to delete one of the items linked with " + vertexToDelete.toString();
        }

        // Annotation, Comment
        itLinks = vertexToDelete.getVertices(Direction.OUT, DataModel.Links.hasAnnotation).iterator();
        while (itLinks.hasNext()) {
          OrientVertex vAnnotation = (OrientVertex) itLinks.next();
          String status = DeleteUtils.deleteVertex(vAnnotation, user, g);
          if (status != null) {
            log.error("Deletion of annotation " + vAnnotation.toString() + " was authorized but failed for some reason. Operation will be rollbacked to avoid inconsistent db state");
            throw new IllegalStateException("Removal of " + vertexToDelete.toString() + " canceled.");
          }
        }
        // Discussion
        itLinks = vertexToDelete.getVertices(Direction.IN, DataModel.Links.isLinkedTo).iterator();
        while (itLinks.hasNext()) {
          OrientVertex vDiscussion = (OrientVertex) itLinks.next();
          String status = DeleteUtils.deleteVertex(vDiscussion, user, g);
          if (status != null) {
            log.error("Deletion of discussion " + vDiscussion.toString() + " was authorized but failed for some reason. Operation will be rollbacked to avoid inconsistent db state");
            throw new IllegalStateException("Removal of " + vertexToDelete.toString() + " canceled.");
          }
        }
        // Tag
        itLinks = vertexToDelete.getVertices(Direction.OUT, DataModel.Links.isTagged).iterator();
        while (itLinks.hasNext()) {
          OrientVertex vTagging = (OrientVertex) itLinks.next();
          String status = DeleteUtils.deleteVertex(vTagging, user, g);
          if (status != null) {
            log.error("Deletion of tagging " + vTagging.toString() + " was authorized but failed for some reason. Operation will be rollbacked to avoid inconsistent db state");
            throw new IllegalStateException("Removal of " + vertexToDelete.toString() + " canceled.");
          }
        }
        g.removeVertex(vertexToDelete);
        return null;

      case DataModel.Classes.LeafTypes.regionOfInterest:
        if (!DeleteUtils.canUserDeleteSubGraph(vertexToDelete, user, g)) {
          return "User not allowed to delete one of the items linked with " + vertexToDelete.toString();
        }

        // Annotation, Comment, Measurement
        itLinks = vertexToDelete.getVertices(Direction.OUT, DataModel.Links.hasAnnotation).iterator();
        while (itLinks.hasNext()) {
          OrientVertex vAnnotation = (OrientVertex) itLinks.next();
          String status = DeleteUtils.deleteVertex(vAnnotation, user, g);
          if (status != null) {
            log.error("Deletion of annotation " + vAnnotation.toString() + " was authorized but failed for some reason. Operation will be rollbacked to avoid inconsistent db state");
            throw new IllegalStateException("Removal of " + vertexToDelete.toString() + " canceled.");
          }
        }
        // Discussion
        itLinks = vertexToDelete.getVertices(Direction.IN, DataModel.Links.isLinkedTo).iterator();
        while (itLinks.hasNext()) {
          OrientVertex vDiscussion = (OrientVertex) itLinks.next();
          String status = DeleteUtils.deleteVertex(vDiscussion, user, g);
          if (status != null) {
            log.error("Deletion of discussion " + vDiscussion.toString() + " was authorized but failed for some reason. Operation will be rollbacked to avoid inconsistent db state");
            throw new IllegalStateException("Removal of " + vertexToDelete.toString() + " canceled.");
          }
        }
        // Tag
        itLinks = vertexToDelete.getVertices(Direction.OUT, DataModel.Links.isTagged).iterator();
        while (itLinks.hasNext()) {
          OrientVertex vTagging = (OrientVertex) itLinks.next();
          String status = DeleteUtils.deleteVertex(vTagging, user, g);
          if (status != null) {
            log.error("Deletion of tagging " + vTagging.toString() + " was authorized but failed for some reason. Operation will be rollbacked to avoid inconsistent db state");
            throw new IllegalStateException("Removal of " + vertexToDelete.toString() + " canceled.");
          }
        }
        g.removeVertex(vertexToDelete);
        return null;

      case DataModel.Classes.LeafTypes.transcription:
        // Deletable with WRITE unless shared
        return "Not implemented";
      case DataModel.Classes.LeafTypes.vernacularName:
        // Deletable with WRITE unless shared
        return "Not implemented";
      case DataModel.Classes.LevelOneHeirTypes.compositeEntity:
        // Too abstract, cannot delete
        return "Elements of type CompositeEntity cannot be deleted.";
      case DataModel.Classes.LevelOneHeirTypes.leafEntity:
        // Too abstract, cannot delete
        return "Elements of type LeafEntity cannot be deleted.";
      case DataModel.Classes.LevelOneHeirTypes.opinion:
        // Open for debate, any opinion can ideally be modified by its creator and an opinion is always shared
        return "Not implemented";
      case DataModel.Classes.LevelOneHeirTypes.relationship:
        // Too abstract, cannot be deleted
        return "Elements of type Relationship cannot be deleted.";
      case DataModel.Classes.LevelOneHeirTypes.socialEntity:
        // Too abstract, cannot be deleted
        return "Elements of type SocialEntity cannot be deleted.";
      case DataModel.Classes.RelationshipTypes.tag:
        // Deletable with WRITE unless shared
        return "Not implemented";
      case DataModel.Classes.RelationshipTypes.tagging:
        return "Not implemented";
      default:
        log.error("Unknown vertex type " + type);
        throw new NotImplementedException();
    }
  }

  /**
   * Not implemented. Too many unanswered questions.
   * @param edgeToDelete
   * @param user
   * @param g
   * @return 
   */
  public static String deleteEdge(OrientEdge edgeToDelete, OrientVertex user, OrientGraph g) {
    // What should we do here ? How to know if an edge is deletable ?
    // User must have WRITE access to both ends? Does not work if a sheet is at one end
    // Best course of action would be to process according to edge type
    throw new NotImplementedException();
  }

  public static boolean canUserDeleteSubGraph(OrientVertex vObject, OrientVertex vUser, OrientGraph g) {
    if (!DeleteUtils.canUserDeleteVertex(vObject, vUser, g)) {
      return false;
    }
    // Check rights : user must be able to WRITE; vertex must not be shared with anyone; children (annotations, measures) must not be shared and will be deleted
    // Filter by type for the last criterion
    String type = vObject.getProperty("@class");
    String id = vObject.getProperty(DataModel.Properties.id);
    Iterator itLinks = null;
    switch (type) {
      case DataModel.Classes.BaseTypes.abstractEntity:
        // Too abstract, we're not touching this
        return false;
      case DataModel.Classes.BaseTypes.externBaseEntity:
        // Never delete external stuff, nobody has right to anyway
        return false;
      case DataModel.Classes.CompositeTypes.collection:
        // Only collection administrators (curators) can delete collections (and even then they might not be able to)
        return false;
      case DataModel.Classes.CompositeTypes.curator:
        // These people are a permanent fixture of the landscape.
        return false;
      case DataModel.Classes.CompositeTypes.discussion:
        // A discussion can be deleted if it contains messages only by the current user (unless it is open to the public)
        itLinks = vObject.getVertices(Direction.OUT, DataModel.Links.hasMessage).iterator();
        while (itLinks.hasNext()) {
          OrientVertex vMessage = (OrientVertex) itLinks.next();
          if (!DeleteUtils.canUserDeleteVertex(vMessage, vUser, g)) {
            return false;
          }
        }
        return true;
      case DataModel.Classes.CompositeTypes.harvest:
        // Not deletable
        return false;
      case DataModel.Classes.CompositeTypes.harvester:
        // TODO find out if this can be deleted
        return false;
      case DataModel.Classes.CompositeTypes.herbarium:
        // How does one actually delete an entire herbarium ?
        return false;
      case DataModel.Classes.CompositeTypes.herbariumSheet:
        // This cannot be deleted
        // Unless it is a personal image upload ?
        return false;
      case DataModel.Classes.CompositeTypes.mission:
        // Not deletable
        return false;
      case DataModel.Classes.CompositeTypes.organisation:
        // Not deletable unless an organisation and all of its work can cease to exist.
        // But it could be renamed, which might lead to it being linked to its renamed version
        return false;
      case DataModel.Classes.CompositeTypes.sheetPart:
        // Can a part be deleted without deleting the sheet it is part of?
        return false;
      case DataModel.Classes.CompositeTypes.specimen:
        // Not deletable, but the link between an entity and a specimen is deletable
        // Unless someone identified a new specimen
        return false;
      case DataModel.Classes.CompositeTypes.user:
        // Not deletable
        return false;
      case DataModel.Classes.CompositeTypes.virtualTour:
        // TODO not defined yet
        throw new NotImplementedException();
      case DataModel.Classes.CompositeTypes.workbench:
        // role:root-workbench is not deletable
        if("workbench-root".equals(vObject.getProperty(DataModel.Properties.role))) {
          return false;
        }
        // Deletable only if not shared and user has write access
        // Sharing already checked
        return true;
      case DataModel.Classes.LeafTypes.comment:
        return true;
      case DataModel.Classes.LeafTypes.coordinates:
        return true;
      case DataModel.Classes.LeafTypes.determination:
        // Not deletable
        return false;
      case DataModel.Classes.LeafTypes.measureReference:
        return true;
      case DataModel.Classes.LeafTypes.measurement:
        return true;
      case DataModel.Classes.LeafTypes.message:
        return true;
      case DataModel.Classes.LeafTypes.path:
        // Annotation, Measurement, Comment
        itLinks = vObject.getVertices(Direction.OUT, DataModel.Links.hasAnnotation).iterator();
        while (itLinks.hasNext()) {
          OrientVertex vAnnotation = (OrientVertex) itLinks.next();
          if (!DeleteUtils.canUserDeleteSubGraph(vAnnotation, vUser, g)) {
            return false;
          }
        }
        // Discussion
        itLinks = vObject.getVertices(Direction.IN, DataModel.Links.isLinkedTo).iterator();
        while (itLinks.hasNext()) {
          OrientVertex vDiscussion = (OrientVertex) itLinks.next();
          if (!DeleteUtils.canUserDeleteSubGraph(vDiscussion, vUser, g)) {
            return false;
          }
        }
        // TagAssociation... do not care, just delete
        return true;
      case DataModel.Classes.LeafTypes.pointOfInterest:
        // Annotation, Comment
        itLinks = vObject.getVertices(Direction.OUT, DataModel.Links.hasAnnotation).iterator();
        while (itLinks.hasNext()) {
          OrientVertex vAnnotation = (OrientVertex) itLinks.next();
          if (!DeleteUtils.canUserDeleteSubGraph(vAnnotation, vUser, g)) {
            return false;
          }
        }
        // Discussion
        itLinks = vObject.getVertices(Direction.IN, DataModel.Links.isLinkedTo).iterator();
        while (itLinks.hasNext()) {
          OrientVertex vDiscussion = (OrientVertex) itLinks.next();
          if (!DeleteUtils.canUserDeleteSubGraph(vDiscussion, vUser, g)) {
            return false;
          }
        }
        return true;
      case DataModel.Classes.LeafTypes.regionOfInterest:
        // Annotation, Comment
        itLinks = vObject.getVertices(Direction.OUT, DataModel.Links.hasAnnotation).iterator();
        while (itLinks.hasNext()) {
          OrientVertex vAnnotation = (OrientVertex) itLinks.next();
          if (!DeleteUtils.canUserDeleteSubGraph(vAnnotation, vUser, g)) {
            return false;
          }
        }
        // Discussion
        itLinks = vObject.getVertices(Direction.IN, DataModel.Links.isLinkedTo).iterator();
        while (itLinks.hasNext()) {
          OrientVertex vDiscussion = (OrientVertex) itLinks.next();
          if (!DeleteUtils.canUserDeleteSubGraph(vDiscussion, vUser, g)) {
            return false;
          }
        }
        return true;
      case DataModel.Classes.LeafTypes.transcription:
        return true;
      case DataModel.Classes.LeafTypes.vernacularName:
        return true;
      case DataModel.Classes.LevelOneHeirTypes.compositeEntity:
        // Too abstract, cannot delete
        return false;
      case DataModel.Classes.LevelOneHeirTypes.leafEntity:
        // Too abstract, cannot delete
        return false;
      case DataModel.Classes.LevelOneHeirTypes.opinion:
        // Open for debate, any opinion (+1 / 0 / -1) can ideally be modified by its creator and an opinion is always shared
        // Howver there is no real point in deleting it
        return false;
      case DataModel.Classes.LevelOneHeirTypes.relationship:
        // Too abstract, cannot be deleted
        return false;
      case DataModel.Classes.LevelOneHeirTypes.socialEntity:
        // Too abstract, cannot be deleted
        return false;
      case DataModel.Classes.RelationshipTypes.tag:
        return true;
      case DataModel.Classes.RelationshipTypes.tagging:
        return true;
      default:
        log.error("Unknown vertex type " + type);
        throw new NotImplementedException();
    }
  }

  public static boolean canUserDeleteVertex(OrientVertex vObject, OrientVertex vUser, OrientGraph g) {
    String id = vObject.getProperty(DataModel.Properties.id);
    if (AccessRights.getAccessRights(vUser, vObject, g).value() < DataModel.Enums.AccessRights.WRITE.value()) {
      // User requires WRITE permission to delete
      return false;
    }
    Iterator<Vertex> itAccessors = vObject.getVertices(Direction.IN, DataModel.Links.hasAccessRights).iterator();
    while (itAccessors.hasNext()) {
      OrientVertex vAccessor = (OrientVertex) itAccessors.next();
      if (vAccessor.equals(vUser)) {
        continue;
      }
      if (AccessRights.getAccessRights(vAccessor, vObject, g).value() > DataModel.Enums.AccessRights.NONE.value()) {
        if (vAccessor.getProperty(DataModel.Properties.id).equals(DataModel.Globals.PUBLIC_USER_ID)) {
          // Object shared with general public
          return false;
        }

        if (!DataModel.Classes.CompositeTypes.user.equals(vAccessor.getProperty("@class"))) {
          // Object is shared with a group
          return false;
        }
      }
    }
    return true;
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
