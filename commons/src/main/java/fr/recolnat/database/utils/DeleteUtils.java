package fr.recolnat.database.utils;

import com.tinkerpop.blueprints.Direction;
import com.tinkerpop.blueprints.Edge;
import com.tinkerpop.blueprints.Vertex;
import com.tinkerpop.blueprints.impls.orient.OrientEdge;
import com.tinkerpop.blueprints.impls.orient.OrientBaseGraph;
import com.tinkerpop.blueprints.impls.orient.OrientVertex;
import fr.recolnat.database.RightsManagementDatabase;
import fr.recolnat.database.exceptions.AccessForbiddenException;
import fr.recolnat.database.exceptions.ObsoleteDataException;
import fr.recolnat.database.exceptions.ResourceNotExistsException;
import fr.recolnat.database.model.DataModel;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashSet;

import java.util.Iterator;
import java.util.LinkedList;
import java.util.List;
import java.util.Set;
import org.apache.commons.lang.NotImplementedException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Created by Dmitri Voitsekhovitch (dvoitsekh@gmail.com) on 29/04/15.
 */
public class DeleteUtils {

  private static final Logger log = LoggerFactory.getLogger(DeleteUtils.class);

  /**
   * Removes the link between a set and one of its items. Internally this
   * creates updated versions of impacted vertices and edges where the link no
   * longer exists. If the children are sets and are orphaned, they are unlinked
   * as well, recursively.
   *
   * @param linkId
   * @param vUser
   * @param graph
   * @return
   */
  public static List<String> unlinkItemFromSet(String linkId, OrientVertex vUser, OrientBaseGraph graph, RightsManagementDatabase rightsDb) throws AccessForbiddenException, ObsoleteDataException {
    List<String> modified = new LinkedList<>();
    OrientEdge eLink = AccessUtils.getEdgeById(linkId, graph);
    if (eLink == null) {
      throw new ObsoleteDataException(linkId);
    }
    OrientVertex vParentSet = eLink.getVertex(Direction.OUT);
    OrientVertex vChildItemOrSet = eLink.getVertex(Direction.IN);

    if (log.isDebugEnabled()) {
      log.debug("Parent is " + vParentSet.getProperty(DataModel.Properties.name));
      log.debug("Child is " + vChildItemOrSet.getProperty(DataModel.Properties.name));
    }

    if (!DeleteUtils.canUserDeleteVertex(vParentSet, vUser, graph, rightsDb)) {
      throw new AccessForbiddenException((String) vUser.getProperty(DataModel.Properties.id), (String) vParentSet.getProperty(DataModel.Properties.id));
    }
    // Create new version of the parent
    String userId = (String) vUser.getProperty(DataModel.Properties.id);
    OrientVertex vNewParent = UpdateUtils.createNewVertexVersion(vParentSet, userId, graph);

    if (log.isDebugEnabled()) {
      log.debug("New vertex version created");
    }
    // Get the updated version of the link from parent using nextVerionId and remove it
//    eLink = AccessUtils.getEdgeById(linkId, graph);
    eLink = AccessUtils.getEdgeById((String) eLink.getProperty(DataModel.Properties.nextVersionId), graph);
    if (log.isDebugEnabled()) {
      log.debug(eLink.toString());
    }
    eLink.remove();
    modified.add((String) vParentSet.getProperty(DataModel.Properties.id));
    modified.add((String) vChildItemOrSet.getProperty(DataModel.Properties.id));

    // Remove item from all associated views
    Iterator<Vertex> itViews = vNewParent.getVertices(Direction.OUT, DataModel.Links.hasView).iterator();
    while (itViews.hasNext()) {
      OrientVertex vView = (OrientVertex) itViews.next();
      if (AccessUtils.isLatestVersion(vView)) {
        // No need to check for rights. If the user was able to remove entity from set, it must be removed from view
        // Check if view displays the child (which can be a Set, a Specimen, or an Image). Specimens are not displayed, but their images are.
        boolean noProcessor = true;
        String type = (String) vChildItemOrSet.getProperty("@class");
        switch (type) {
          case DataModel.Classes.specimen:
            // If vChildItemOrSet is a Specimen we need to process every Image associated with it
            Iterator<Vertex> itImages = vChildItemOrSet.getVertices(Direction.OUT, DataModel.Links.hasImage).iterator();
            while (itImages.hasNext()) {
              OrientVertex vImage = (OrientVertex) itImages.next();
              if (AccessUtils.isLatestVersion(vImage)) {
                modified.addAll(DeleteUtils.removeEntityFromView(vImage, vView, vUser, graph));
              }
            }
            break;
          case DataModel.Classes.set:
            noProcessor = false;
          case DataModel.Classes.image:
            noProcessor = false;
          default:
            if (noProcessor) {
              log.info("No specific processor for view containing element of type " + type);
            }
            modified.addAll(DeleteUtils.removeEntityFromView(vChildItemOrSet, vView, vUser, graph));
            break;
        }
      }
    }
    return modified;
  }

  /**
   * Does not check user rights or versioning.
   *
   * @param vEntity
   * @param vView
   * @param userId
   * @param g
   */
  private static List<String> removeEntityFromView(OrientVertex vEntity, OrientVertex vView, OrientVertex vUser, OrientBaseGraph g) throws AccessForbiddenException {
    List<String> modified = new LinkedList<>();
    Iterator<Edge> itDisplays = vView.getEdges(vEntity, Direction.OUT, DataModel.Links.displays).iterator();
    if (itDisplays.hasNext()) {
      // Fork view.
      OrientVertex vNewView = UpdateUtils.createNewVertexVersion(vView, (String) vUser.getProperty(DataModel.Properties.id), g);
      itDisplays = vNewView.getEdges(vEntity, Direction.OUT, DataModel.Links.displays).iterator();
      while (itDisplays.hasNext()) {
        itDisplays.next().remove();
      }
      modified.add((String) vNewView.getProperty(DataModel.Properties.id));
    }
    return modified;
  }

  public static List<String> unlinkItemFromView(String linkId, OrientVertex vUser, OrientBaseGraph g, RightsManagementDatabase rightsDb) throws ObsoleteDataException, AccessForbiddenException {
    List<String> modified = new LinkedList<>();
    OrientEdge eLink = AccessUtils.getEdgeById(linkId, g);
    if (eLink == null) {
      throw new ObsoleteDataException(linkId);
    }
    OrientVertex vView = eLink.getVertex(Direction.OUT);
    OrientVertex vChildItemOrSet = eLink.getVertex(Direction.IN);

    if (!DeleteUtils.canUserDeleteVertex(vView, vUser, g, rightsDb)) {
      throw new AccessForbiddenException((String) vUser.getProperty(DataModel.Properties.id), (String) vView.getProperty(DataModel.Properties.id));
    }

    // Create new version of the parent
    String userId = (String) vUser.getProperty(DataModel.Properties.id);
    OrientVertex vNewParent = UpdateUtils.createNewVertexVersion(vView, userId, g);

    // Get the updated version of the link from parent using nextVerionId and remove it
//    eLink = AccessUtils.getEdgeById(linkId, g);
    if (log.isDebugEnabled()) {
      log.debug(eLink.toString());
    }
    eLink = AccessUtils.getEdgeById((String) eLink.getProperty(DataModel.Properties.nextVersionId), g);
    if (log.isDebugEnabled()) {
      log.debug(eLink.toString());
    }
    eLink.remove();
    modified.add((String) vNewParent.getProperty(DataModel.Properties.id));
    modified.add((String) vChildItemOrSet.getProperty(DataModel.Properties.id));

    return modified;
  }

  /**
   * Recursive.
   *
   * @param eLink
   * @param vChildItemOrSet Something that can be contained in a Set (i.e.
   * anything)
   * @param g
   */
  private static boolean unlinkItemFromSet(OrientEdge eLink, OrientVertex vChildItemOrSet, OrientVertex vParentSet, OrientVertex vUser, OrientBaseGraph g, RightsManagementDatabase rightsDb) {
    if (log.isDebugEnabled()) {
      log.debug("unlinkItemFromSet(" + eLink.toString() + "," + vChildItemOrSet.toString() + ", " + vParentSet.toString() + ", " + vUser.toString() + ")");
    }
    eLink.remove();

    // Now process parent views
    // Get views of parent set and update them with the change
    Iterator<Vertex> itViews = vParentSet.getVertices(Direction.OUT, DataModel.Links.hasView).iterator();
    while (itViews.hasNext()) {
      OrientVertex view = (OrientVertex) itViews.next();
      if (view.countEdges(Direction.OUT, DataModel.Links.hasNewerVersion) == 0) {
        // This is the most up to date version of a view, ergo one of those that must be modified, BUT it might be a view that was already deleted...
        // BUT the view might already been deleted, therefore check
        OrientVertex updatedView = UpdateUtils.createNewVertexVersion(view, (String) vUser.getProperty(DataModel.Properties.id), g);
        // Now we need to also remove it from the view if it exists (note, a view may have multiple displays of an item)
        Iterator<Edge> itViewToItemLinks = updatedView.getEdges(vChildItemOrSet, Direction.OUT, DataModel.Links.displays).iterator();
        while (itViewToItemLinks.hasNext()) {
          OrientEdge viewToItemLink = (OrientEdge) itViewToItemLinks.next();
          if (viewToItemLink.getProperty(DataModel.Properties.nextVersionId) == null) {
            itViewToItemLinks.remove();
          }
        }
      }
    }

    String linkToParentLabel = null;
    if (vChildItemOrSet.getProperty("@class").equals(DataModel.Classes.set)) {
      linkToParentLabel = DataModel.Links.containsSubSet;
    } else {
      linkToParentLabel = DataModel.Links.containsItem;
    }

    Iterator<Edge> itParents = vChildItemOrSet.getEdges(Direction.IN, linkToParentLabel).iterator();
    if (itParents.hasNext()) {
      if (itParents.next().getProperty(DataModel.Properties.nextVersionId) == null) {
        // The new version without the original link still has parents and does not need to be deleted. Operation finished.
        return true;
      }
    }

    // Child must be deleted as well, therefore process all of its children in turn
    if (!DeleteUtils.canUserDeleteVertex(vChildItemOrSet, vUser, g, rightsDb)) {
      // Either user cannot delete child, or child is of a non-deletable type.
      // Removal has deleted everything that could be deleted, therefore success.
      return true;
    }

    OrientVertex vNewChildItemOrSet = UpdateUtils.createNewVertexVersion(vChildItemOrSet, (String) vUser.getProperty(DataModel.Properties.id), g);

    Iterator<Edge> itChildEdge = vNewChildItemOrSet.getEdges(Direction.OUT, DataModel.Links.containsSubSet, DataModel.Links.containsItem).iterator();
    while (itChildEdge.hasNext()) {
      OrientEdge childEdge = (OrientEdge) itChildEdge.next();
      // If the edge is no longer relevant (not the most up to date version), ignore it
      if (childEdge.getProperty(DataModel.Properties.nextVersionId) == null) {
        OrientVertex vChildChildItemOrSet = childEdge.getVertex(Direction.IN);
        DeleteUtils.unlinkItemFromSet(childEdge, vChildChildItemOrSet, vNewChildItemOrSet, vUser, g, rightsDb);
      }
    }
    // The new version without the original link has no parents, therefore it must be deleted along with its orphaned children.
    // However due to our model, the vertex does not need to be deleted to become invisible, only its links must be
    // Recursively remove child's children
    return true;
  }

  /**
   * Deletes the element denoted by the provided ID. Deletion only removes the
   * link between the new version of a node and its linked nodes, rendering it
   * inaccessible. However it still remains in the database for integrity
   * requirements and could theoretically be found by an administrator.
   *
   * @param id
   * @param user
   * @param g
   * @return
   */
  public static Set<String> delete(String id, OrientVertex user, OrientBaseGraph g, RightsManagementDatabase rightsDb) throws ResourceNotExistsException, AccessForbiddenException {
    Set<String> deleted = new HashSet<>();
    OrientVertex vElt = AccessUtils.getNodeById(id, g);
    if (vElt != null) {
      if (DeleteUtils.canUserDeleteSubGraph(vElt, user, g, rightsDb)) {
        // Grab all linked vertices uids as they were modified
        Iterator<Vertex> itLinked = vElt.getVertices(Direction.BOTH).iterator();
        while (itLinked.hasNext()) {
          deleted.add(itLinked.next().getProperty(DataModel.Properties.id));
        }
        // Simply creates a new version of this Vertex which is not linked to anything, therefore inaccessible without rollbacks.
        deleted.addAll(DeleteUtils.deleteVertex(vElt, user, g));
      }
      return deleted;
    }

    OrientEdge eElt = AccessUtils.getEdgeById(id, g);
    if (eElt != null) {
      // Check if user can delete this edge
      if (DeleteUtils.canUserDeleteEdge((OrientEdge) eElt, user, g, rightsDb)) {
        // Clone both ends of the edge and remove the edge.
        deleted = DeleteUtils.deleteEdge((OrientEdge) eElt, user, g);
      }
      return deleted;
    }
    log.error("Id not found in database " + id);
    throw new ResourceNotExistsException(id);
  }

  /**
   * Creates a new version of the current vertex with no links to anything,
   * effectively removing it.
   *
   * @param vertexToDelete
   * @param user
   * @param g
   * @pre User must be allowed to delete this vertex (canUserDeleteSubGraph
   * static method).
   * @return
   */
  private static Set<String> deleteVertex(OrientVertex vertexToDelete, OrientVertex user, OrientBaseGraph g) {
    Set<String> deleted = new HashSet<>();
    // Clone node representing new version
    OrientVertex deletedVertex = (OrientVertex) g.addVertex("class:" + vertexToDelete.getProperty("@class"));
    deletedVertex.setProperties(DataModel.Properties.id, vertexToDelete.getProperty(DataModel.Properties.id), DataModel.Properties.deleted, true);

    // Link new version to old version
    OrientEdge eVersionLink = (OrientEdge) vertexToDelete.addEdge(DataModel.Links.hasNewerVersion, deletedVertex);
    eVersionLink.setProperties(
        DataModel.Properties.id, CreatorUtils.newEdgeUUID(g),
        DataModel.Properties.creationDate, (new Date()).getTime());

    deleted.add((String) vertexToDelete.getProperty(DataModel.Properties.id));
    return deleted;
  }

  /**
   * Deletes an edge. Internally creates new versions of one of the vertices at
   * the right end (depending on edge type) and removes the new edge version.
   *
   * @param edgeToDelete
   * @param user
   * @param g
   * @pre User has the rights to delete this edge (call canUserDeleteEdge to
   * make sure beforehand).
   * @return
   */
  private static Set<String> deleteEdge(OrientEdge edgeToDelete, OrientVertex user, OrientBaseGraph g) throws AccessForbiddenException {
    Set<String> modified = new HashSet<>();
    String userId = user.getProperty(DataModel.Properties.id);
    OrientVertex itemToVersion = null;
    switch (edgeToDelete.getLabel()) {
      case DataModel.Links.createdBy:
        // The item at the beginning of the edge gets a new version
        itemToVersion = edgeToDelete.getVertex(Direction.OUT);
        break;
      case DataModel.Links.displays:
        // View at the beginning of edge is versioned
        itemToVersion = edgeToDelete.getVertex(Direction.OUT);
        break;
      case DataModel.Links.hasAccessRights:
        // Not versionable, user AccessRights methods to modify
        log.warn("Attempt to change rights through deleteEdge, use AccessRights methods instead");
        throw new AccessForbiddenException(userId, "hasAccessRights");
      case DataModel.Links.hasAnnotation:
        // New version for the annotation at the end of edge
        itemToVersion = edgeToDelete.getVertex(Direction.IN);
        break;
      case DataModel.Links.containsItem:
        log.warn("Attempt to change set content through deleteEdge, use unlinkItemFromSet instead");
        throw new AccessForbiddenException(userId, "containsItem");
      case DataModel.Links.containsSubSet:
        log.warn("Attempt to change set content through deleteEdge, use unlinkItemFromSet instead");
        throw new AccessForbiddenException(userId, "containsSubSet");
      case DataModel.Links.hasDefinition:
        log.error("Cannot delete link between tag definition and tagging, delete the tagging instead");
        throw new AccessForbiddenException(userId, "hasDefinition");
      case DataModel.Links.hasDiscussion:
        log.error("Cannot delete link between entity and discussion, delete discussion instead");
        throw new AccessForbiddenException(userId, "hasDiscussion");
      case DataModel.Links.hasMessage:
        log.error("Cannot delete link between discussion and message, delete message instead");
        throw new AccessForbiddenException(userId, "hasMessage");
      case DataModel.Links.hasNewerVersion:
        log.error("Cannot delete link to new version");
        throw new AccessForbiddenException(userId, "hasNewerVersion");
      case DataModel.Links.hasOriginalSource:
        log.error("Cannot delete link between entity and its original source, update the original source instead");
        throw new AccessForbiddenException(userId, "hasOriginalSource");
      case DataModel.Links.definedAsMeasureStandard:
        log.error("Cannot delete link between entity and scaling data, delete the scaling data instead");
        throw new AccessForbiddenException(userId, "definedAsMeasureStandard");
      case DataModel.Links.hasView:
        log.error("Cannot delete link between set and view, delete the set instead");
        throw new AccessForbiddenException(userId, "hasView");
      case DataModel.Links.isMemberOfGroup:
        // User and Group are graph invariants, no versioning needed
        OrientVertex vIn = edgeToDelete.getVertex(Direction.IN);
        OrientVertex vOut = edgeToDelete.getVertex(Direction.OUT);
        edgeToDelete.remove();
        modified.add((String) vIn.getProperty(DataModel.Properties.id));
        modified.add((String) vOut.getProperty(DataModel.Properties.id));
        return modified;
      case DataModel.Links.isTagged:
        log.error("Cannot delete link between entity and tagging, delete the tagging instead");
        throw new AccessForbiddenException(userId, "isTagged");
      case DataModel.Links.toi:
        log.error("Cannot delete link between entity and path, delete the path instead");
        throw new AccessForbiddenException(userId, "toi");
      case DataModel.Links.poi:
        log.error("Cannot delete link between entity and PoI, delete the PoI instead");
        throw new AccessForbiddenException(userId, "poi");
      case DataModel.Links.roi:
        log.error("Cannot delete link between entity and RoI, delete the RoI instead");
        throw new AccessForbiddenException(userId, "roi");
      default:
        log.error("Label not implemented for delete edge operation " + edgeToDelete.getLabel());
        throw new AccessForbiddenException(userId, "unknown link");
    }

    UpdateUtils.createNewVertexVersion(itemToVersion, userId, g);
    OrientEdge updatedEdge = AccessUtils.findLatestVersion(edgeToDelete, g);
    OrientVertex vIn = updatedEdge.getVertex(Direction.IN);
    OrientVertex vOut = updatedEdge.getVertex(Direction.OUT);
    modified.add((String) vIn.getProperty(DataModel.Properties.id));
    modified.add((String) vOut.getProperty(DataModel.Properties.id));
    updatedEdge.remove();
    return modified;
  }

  public static boolean canUserDeleteSubGraph(OrientVertex vObject, OrientVertex vUser, OrientBaseGraph g, RightsManagementDatabase rightsDb) {
    if (!DeleteUtils.canUserDeleteVertex(vObject, vUser, g, rightsDb)) {
      return false;
    }
    // Check rights : user must be able to WRITE; vertex must not be shared with anyone; children (annotations, measures) must not be shared and will be deleted
    // Filter by type for the last criterion
    String type = vObject.getProperty("@class");
    String id = vObject.getProperty(DataModel.Properties.id);
    Iterator itLinks = null;
    switch (type) {
//      case DataModel.Classes.abstractEntity:
      // Too abstract, we're not touching this
//        return false;
      case DataModel.Classes.originalSource:
        // Never delete external stuff, nobody has right to anyway
        return false;
//      case DataModel.Classes.collection:
      // Only collection administrators (curators) can delete collections (and even then they might not be able to)
//        return false;
//      case DataModel.Classes.curator:
      // These people are a permanent fixture of the landscape.
//        return false;
      case DataModel.Classes.discussion:
        // A discussion can be deleted if it contains messages only by the current user (unless it is open to the public)
        itLinks = vObject.getVertices(Direction.OUT, DataModel.Links.hasMessage).iterator();
        while (itLinks.hasNext()) {
          OrientVertex vMessage = (OrientVertex) itLinks.next();
          if (AccessUtils.isLatestVersion(vMessage)) {
            if (!DeleteUtils.canUserDeleteVertex(vMessage, vUser, g, rightsDb)) {
              return false;
            }
          }
        }
        return true;
//      case DataModel.Classes.harvest:
      // Not deletable
//        return false;
//      case DataModel.Classes.harvester:
      // TODO find out if this can be deleted
//        return false;
//      case DataModel.Classes.herbarium:
      // How does one actually delete an entire herbarium ?
//        return false;
//      case DataModel.Classes.CompositeTypes.herbariumSheet:
      // This cannot be deleted
      // Unless it is a personal image upload ?
//        return false;
//      case DataModel.Classes.mission:
      // Not deletable
//        return false;
//      case DataModel.Classes.organisation:
      // Not deletable unless an organisation and all of its work can cease to exist.
      // But it could be renamed, which might lead to it being linked to its renamed version
//        return false;
//      case DataModel.Classes.CompositeTypes.sheetPart:
      // Can a part be deleted without deleting the sheet it is part of?
//        return false;
      case DataModel.Classes.specimen:
        // Main branch not deletable, side branch deletable with the usual restrictions
        if (!BranchUtils.isMainBranch(vObject, g)) {
          return true;
        }
        return false;
      case DataModel.Classes.image:
        if (!BranchUtils.isMainBranch(vObject, g)) {
          return true;
        }
        return false;
      case DataModel.Classes.user:
        // Not deletable
        return false;
//      case DataModel.Classes.virtualTour:
      // TODO not defined yet
//        throw new NotImplementedException();
      case DataModel.Classes.study:
        // User must be able to delete everything in the study (all subsets)
        itLinks = vObject.getVertices(Direction.OUT, DataModel.Links.hasCoreSet).iterator();
        while (itLinks.hasNext()) {
          OrientVertex vCoreSet = (OrientVertex) itLinks.next();
          if (AccessUtils.isLatestVersion(vCoreSet)) {
            if (!DeleteUtils.canUserDeleteSubGraph(vCoreSet, vUser, g, rightsDb)) {
              return false;
            }
          }
        }
        return true;
      case DataModel.Classes.set:
        // role:root-workbench is not deletable
        if (DataModel.Globals.ROOT_SET_ROLE.equals(vObject.getProperty(DataModel.Properties.role))) {
          return false;
        }
        // Deletable only if not shared and user has write access
        // Sharing already checked
        return true;
      case DataModel.Classes.annotation:
        return true;
//      case DataModel.Classes.coordinates:
//        return true;
//      case DataModel.Classes.determination:
      // Not deletable
//        return false;
      case DataModel.Classes.measureStandard:
        return true;
      case DataModel.Classes.measurement:
        return true;
      case DataModel.Classes.message:
        return true;
      case DataModel.Classes.angleOfInterest:
        // Annotation, Measurement, Comment
        itLinks = vObject.getVertices(Direction.OUT, DataModel.Links.hasAnnotation).iterator();
        while (itLinks.hasNext()) {
          OrientVertex vAnnotation = (OrientVertex) itLinks.next();
          if (AccessUtils.isLatestVersion(vAnnotation)) {
            if (!DeleteUtils.canUserDeleteSubGraph(vAnnotation, vUser, g, rightsDb)) {
              return false;
            }
          }
        }
        // Discussion
        itLinks = vObject.getVertices(Direction.OUT, DataModel.Links.hasDiscussion).iterator();
        while (itLinks.hasNext()) {
          OrientVertex vDiscussion = (OrientVertex) itLinks.next();
          if (AccessUtils.isLatestVersion(vDiscussion)) {
            if (!DeleteUtils.canUserDeleteSubGraph(vDiscussion, vUser, g, rightsDb)) {
              return false;
            }
          }
        }
        // TagAssociation... do not care, just delete
        return true;
      case DataModel.Classes.trailOfInterest:
        // Annotation, Measurement, Comment
        itLinks = vObject.getVertices(Direction.OUT, DataModel.Links.hasAnnotation).iterator();
        while (itLinks.hasNext()) {
          OrientVertex vAnnotation = (OrientVertex) itLinks.next();
          if (AccessUtils.isLatestVersion(vAnnotation)) {
            if (!DeleteUtils.canUserDeleteSubGraph(vAnnotation, vUser, g, rightsDb)) {
              return false;
            }
          }
        }
        // Discussion
        itLinks = vObject.getVertices(Direction.OUT, DataModel.Links.hasDiscussion).iterator();
        while (itLinks.hasNext()) {
          OrientVertex vDiscussion = (OrientVertex) itLinks.next();
          if (AccessUtils.isLatestVersion(vDiscussion)) {
            if (!DeleteUtils.canUserDeleteSubGraph(vDiscussion, vUser, g, rightsDb)) {
              return false;
            }
          }
        }
        // TagAssociation... do not care, just delete
        return true;
      case DataModel.Classes.pointOfInterest:
        // Annotation, Comment
        itLinks = vObject.getVertices(Direction.OUT, DataModel.Links.hasAnnotation).iterator();
        while (itLinks.hasNext()) {
          OrientVertex vAnnotation = (OrientVertex) itLinks.next();
          if (AccessUtils.isLatestVersion(vAnnotation)) {
            if (!DeleteUtils.canUserDeleteSubGraph(vAnnotation, vUser, g, rightsDb)) {
              return false;
            }
          }
        }
        // Discussion
        itLinks = vObject.getVertices(Direction.OUT, DataModel.Links.hasDiscussion).iterator();
        while (itLinks.hasNext()) {
          OrientVertex vDiscussion = (OrientVertex) itLinks.next();
          if (AccessUtils.isLatestVersion(vDiscussion)) {
            if (!DeleteUtils.canUserDeleteSubGraph(vDiscussion, vUser, g, rightsDb)) {
              return false;
            }
          }
        }
        return true;
      case DataModel.Classes.regionOfInterest:
        // Annotation, Comment
        itLinks = vObject.getVertices(Direction.OUT, DataModel.Links.hasAnnotation).iterator();
        while (itLinks.hasNext()) {
          OrientVertex vAnnotation = (OrientVertex) itLinks.next();
          if (AccessUtils.isLatestVersion(vAnnotation)) {
            if (!DeleteUtils.canUserDeleteSubGraph(vAnnotation, vUser, g, rightsDb)) {
              return false;
            }
          }
        }
        // Discussion
        itLinks = vObject.getVertices(Direction.OUT, DataModel.Links.hasDiscussion).iterator();
        while (itLinks.hasNext()) {
          OrientVertex vDiscussion = (OrientVertex) itLinks.next();
          if (AccessUtils.isLatestVersion(vDiscussion)) {
            if (!DeleteUtils.canUserDeleteSubGraph(vDiscussion, vUser, g, rightsDb)) {
              return false;
            }
          }
        }
        return true;
//      case DataModel.Classes.transcription:
//        return true;
//      case DataModel.Classes.vernacularName:
//        return true;
//      case DataModel.Classes.compositeEntity:
      // Too abstract, cannot delete
//        return false;
//      case DataModel.Classes.leafEntity:
      // Too abstract, cannot delete
//        return false;
      case DataModel.Classes.opinion:
        // Open for debate, any opinion (+1 / 0 / -1) can ideally be modified by its creator and an opinion is always shared
        // Howver there is no real point in deleting it
        return false;
      case DataModel.Classes.relationship:
        // Too abstract, cannot be deleted
        return false;
//      case DataModel.Classes.socialEntity:
      // Too abstract, cannot be deleted
//        return false;
      case DataModel.Classes.tag:
        return false;
      case DataModel.Classes.tagging:
        return true;
      default:
        log.error("Unknown vertex type " + type);
        throw new NotImplementedException();
    }
  }

  private static boolean canUserDeleteVertex(OrientVertex vObject, OrientVertex vUser, OrientBaseGraph g, RightsManagementDatabase rightsDb) {
    // If a vertex has a newer version, it cannot be deleted (no forks in graph)
    if (!AccessUtils.isLatestVersion(vObject)) {
      return false;
    }

    // Check user's access rights
    if (!AccessRights.canWrite(vUser, vObject, g, rightsDb)) {
      // User requires WRITE permission to delete
      return false;
    }

    // Does the public have access to the vertex?
    if (AccessRights.canPublicRead(vObject, g, rightsDb)) {
      return false;
    }

    // Does anyone else have access to the vertex?
    Iterator<Vertex> itAccessors = vObject.getVertices(Direction.IN, DataModel.Links.hasAccessRights).iterator();
    while (itAccessors.hasNext()) {
      OrientVertex vAccessor = (OrientVertex) itAccessors.next();
      if (vAccessor.equals(vUser)) {
        continue;
      }
      if (AccessRights.canRead(vAccessor, vObject, g, rightsDb)) {
//        if (vAccessor.getProperty(DataModel.Properties.id).equals(DataModel.Globals.PUBLIC_GROUP_ID)) {
//          // Object shared with general public
//          return false;
//        }

        if (!DataModel.Classes.user.equals(vAccessor.getProperty("@class"))) {
          // Object is shared with a group
          return false;
        }
      }
    }
    return true;
  }

  public static boolean canUserDeleteEdge(OrientEdge edge, OrientVertex user, OrientBaseGraph g, RightsManagementDatabase rightsDb) {
    // The answer depends on user rights on one side of the edge, or both.
    switch (edge.getLabel()) {
      case DataModel.Links.createdBy:
        return false;
      case DataModel.Links.hasAccessRights:
        return false;
      case DataModel.Links.hasAnnotation:
        // Same as deleting the annotation (must have access rights to annotation and annotation must not be shared)
        return DeleteUtils.canUserDeleteSubGraph(edge.getVertex(Direction.IN), user, g, rightsDb);
      case DataModel.Links.containsSubSet:
        // Same as deleting sets, must have rights on parent
        return DeleteUtils.canUserDeleteSubGraph(edge.getVertex(Direction.OUT), user, g, rightsDb);
      case DataModel.Links.containsItem:
        // Same as deleting sets, must have rights on parent
        return DeleteUtils.canUserDeleteSubGraph(edge.getVertex(Direction.OUT), user, g, rightsDb);
      case DataModel.Links.hasDefinition:
        // Definition of tagging cannot be changed. However the tagging itself can be deleted.
        return false;
      case DataModel.Links.hasMessage:
        // Similar to deleting the message from the thread.
        return DeleteUtils.canUserDeleteSubGraph(edge.getVertex(Direction.IN), user, g, rightsDb);
      case DataModel.Links.hasNewerVersion:
        // Rollback only permitted to admin anyway
        return false;
      case DataModel.Links.hasOriginalSource:
        return false;
      case DataModel.Links.definedAsMeasureStandard:
        // Similar to deleting the scaling data itself
        return DeleteUtils.canUserDeleteSubGraph(edge.getVertex(Direction.IN), user, g, rightsDb);
      case DataModel.Links.isMemberOfGroup:
        // Group administrator (any user with WRITE on target) may remove link
        if (DeleteUtils.canUserDeleteVertex(edge.getVertex(Direction.IN), user, g, rightsDb)) {
          return true;
        }
        // User may remove link for himself (user has WRITE on source=self)
        if (edge.getVertex(Direction.OUT).equals(user)) {
          return true;
        }
        return false;
      case DataModel.Links.isTagged:
        // Must have rights on the tag (edge target)
        return DeleteUtils.canUserDeleteVertex(edge.getVertex(Direction.IN), user, g, rightsDb);
      case DataModel.Links.toi:
        // Must have rights on the trailOfInterest
        return DeleteUtils.canUserDeleteVertex(edge.getVertex(Direction.IN), user, g, rightsDb);
      case DataModel.Links.poi:
        // Must have rights on the point
        return DeleteUtils.canUserDeleteVertex(edge.getVertex(Direction.IN), user, g, rightsDb);
      case DataModel.Links.roi:
        // Must have rights on the region
        return DeleteUtils.canUserDeleteVertex(edge.getVertex(Direction.IN), user, g, rightsDb);
      default:
        log.error("Unknown edge label " + edge.getLabel() + " for edge " + edge.toString());
        return false;
    }
  }
}
