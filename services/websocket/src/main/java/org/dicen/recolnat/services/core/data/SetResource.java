/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package org.dicen.recolnat.services.core.data;

import com.orientechnologies.orient.core.exception.OConcurrentModificationException;
import com.tinkerpop.blueprints.Direction;
import com.tinkerpop.blueprints.Vertex;
import com.tinkerpop.blueprints.impls.orient.OrientEdge;
import com.tinkerpop.blueprints.impls.orient.OrientBaseGraph;
import com.tinkerpop.blueprints.impls.orient.OrientVertex;
import fr.recolnat.database.exceptions.AccessForbiddenException;
import fr.recolnat.database.exceptions.ObsoleteDataException;
import fr.recolnat.database.model.DataModel;
import fr.recolnat.database.model.impl.StudySet;
import fr.recolnat.database.utils.AccessRights;
import fr.recolnat.database.utils.AccessUtils;
import fr.recolnat.database.utils.BranchUtils;
import fr.recolnat.database.utils.CreatorUtils;
import fr.recolnat.database.utils.DeleteUtils;
import fr.recolnat.database.utils.UpdateUtils;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.net.URL;
import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;
import javax.imageio.ImageIO;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.dicen.recolnat.services.core.exceptions.InternalServerErrorException;
import fr.recolnat.database.exceptions.ResourceNotExistsException;
import fr.recolnat.database.model.impl.RecolnatImage;
import java.io.InputStream;
import java.net.URLConnection;
import java.util.Iterator;
import org.apache.commons.httpclient.HttpClient;
import org.apache.commons.httpclient.methods.GetMethod;
import org.dicen.recolnat.services.core.actions.ActionResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author dmitri
 */
public class SetResource {

  private static final Logger log = LoggerFactory.getLogger(SetResource.class);

  public static JSONObject getSet(String setId, String user) throws JSONException, AccessForbiddenException, ResourceNotExistsException, InternalServerErrorException {
    OrientBaseGraph g = DatabaseAccess.getReadOnlyGraph();
    StudySet set = null;
    try {
      OrientVertex vUser = AccessUtils.getUserByLogin(user, g);
      if (setId == null) {
        OrientVertex vCoreSet = AccessUtils.getCoreSet(vUser, g);
        set = new StudySet(vCoreSet, vUser, g);
      } else {
        OrientVertex vSet = AccessUtils.getNodeById(setId, g);
        set = new StudySet(vSet, vUser, g);
      }
    } finally {
      g.rollback();
      g.shutdown();
    }
    if (set == null) {
      throw new ResourceNotExistsException(setId);
    }
    try {
      return set.toJSON();
    } catch (JSONException e) {
      log.error("Could not convert message to JSON.", e);
      throw new InternalServerErrorException("Could not serialize workbench as JSON " + setId);
    }
  }

  public static ActionResult createSet(String parentSetId, String name, String user) throws JSONException, AccessForbiddenException {
    if (log.isTraceEnabled()) {
      log.trace("Entering createSet");
    }

    if (log.isDebugEnabled()) {
      log.debug("Parent set id is " + parentSetId);
    }

    ActionResult result = new ActionResult();
//    List<String> changes = new LinkedList<>();
    boolean retry = true;
    while (retry) {
      retry = false;
      OrientBaseGraph g = DatabaseAccess.getReaderWriterGraph();
      try {
        OrientVertex vUser = AccessUtils.getUserByLogin(user, g);
        OrientVertex vParentSet = null;
        try {
          vParentSet = AccessUtils.getNodeById(parentSetId, g);
        } catch (NullPointerException e) {
          // Do nothing
        }

        if (vParentSet == null) {
          vParentSet = AccessUtils.getCoreSet(vUser, g);
        }

        // Check permissions
        if (!AccessRights.canWrite(vUser, vParentSet, g)) {
          throw new AccessForbiddenException(user, (String) vParentSet.getProperty(DataModel.Properties.id));
        }

        // Create new set & default view
        OrientVertex vSet = CreatorUtils.createSet(name, DataModel.Globals.SET_ROLE, g);
        OrientVertex vView = CreatorUtils.createView("Vue par défaut", DataModel.Globals.DEFAULT_VIEW, g);

        // Add new set to parent
        OrientEdge eParentToChildLink = UpdateUtils.addSubsetToSet(vParentSet, vSet, vUser, g);
        UpdateUtils.link(vSet, vView, DataModel.Links.hasView, vUser.getProperty(DataModel.Properties.id), g);

        // Grant creator rights on new set & default view
        AccessRights.grantAccessRights(vUser, vSet, DataModel.Enums.AccessRights.WRITE, g);
        AccessRights.grantAccessRights(vUser, vView, DataModel.Enums.AccessRights.WRITE, g);
        g.commit();

        // Build return object
        result.addModifiedId(vParentSet.getProperty(DataModel.Properties.id));
        result.addModifiedId(vSet.getProperty(DataModel.Properties.id));
        result.addModifiedId(vView.getProperty(DataModel.Properties.id));

        result.setResponse("parentSet", vParentSet.getProperty(DataModel.Properties.id));
        result.setResponse("subSet", vSet.getProperty(DataModel.Properties.id));
        result.setResponse("link", eParentToChildLink.getProperty(DataModel.Properties.id));
        result.setResponse("defaultView", vView.getProperty(DataModel.Properties.id));
      } catch (OConcurrentModificationException e) {
        log.warn("Database busy, retrying operation");
        retry = true;
      } finally {
        g.rollback();
        g.shutdown();
      }
    }

    return result;
  }

  public static List<String> deleteElementFromSet(String linkSetToElementId, String user) throws AccessForbiddenException, ObsoleteDataException {
    List<String> changes = new LinkedList<>();

    boolean retry = true;
    while (retry) {
      retry = false;
      OrientBaseGraph g = DatabaseAccess.getReaderWriterGraph();
      try {
        OrientVertex vUser = AccessUtils.getUserByLogin(user, g);
        // Permissions checked internally

        List<String> deleted = DeleteUtils.unlinkItemFromSet(linkSetToElementId, vUser, g);
        g.commit();

        changes.addAll(deleted);
      } catch (OConcurrentModificationException e) {
        log.warn("Database busy, retrying operation");
        retry = true;
      } finally {
        g.rollback();
        g.shutdown();
      }
    }

    return changes;
  }

  public static List<String> link(String elementToCopyId, String futureParentId, String user) throws JSONException, AccessForbiddenException {
    List<String> changes = new LinkedList<>();
    boolean retry = true;
    while (retry) {
      retry = false;
      OrientBaseGraph g = DatabaseAccess.getReaderWriterGraph();
      try {
        OrientVertex vUser = AccessUtils.getUserByLogin(user, g);
        OrientVertex vTarget = AccessUtils.getNodeById(elementToCopyId, g);
        OrientVertex vSet = AccessUtils.getSet(futureParentId, g);

        // Check access rights
        if (!AccessRights.canWrite(vUser, vSet, g)) {
          throw new AccessForbiddenException(user, futureParentId);
        }
        if (!AccessRights.canRead(vUser, vTarget, g)) {
          throw new AccessForbiddenException(user, elementToCopyId);
        }

        // Link according to child type
        OrientEdge newLink = null;
        if (vTarget.getProperty("@class").equals(DataModel.Classes.set)) {
          newLink = UpdateUtils.link(vSet, vTarget, DataModel.Links.containsSubSet, user, g);
        } else {
          newLink = UpdateUtils.link(vSet, vTarget, DataModel.Links.containsItem, user, g);
        }
        g.commit();

        changes.add(vSet.getProperty(DataModel.Properties.id));
        changes.add(vTarget.getProperty(DataModel.Properties.id));
      } catch (OConcurrentModificationException e) {
        log.warn("Database busy, retrying operation");
        retry = true;
      } finally {
        g.rollback();
        g.shutdown();
      }
    }
    return changes;
  }

  public static List<String> copy(String elementToCopyId, String futureParentId, String user) throws JSONException, AccessForbiddenException {
    List<String> changes = new LinkedList<>();
    boolean retry = true;
    while (retry) {
      retry = false;
      OrientBaseGraph g = DatabaseAccess.getReaderWriterGraph();
      try {
        OrientVertex vUser = AccessUtils.getUserByLogin(user, g);
        OrientVertex vDestination = AccessUtils.getSet(futureParentId, g);
        OrientVertex vTarget = AccessUtils.getNodeById(elementToCopyId, g);

        // User must have write rights on destination, all other rights irrelevant as we are forking
        if (!AccessRights.canWrite(vUser, vDestination, g)) {
          throw new AccessForbiddenException(user, futureParentId);
        }

        // Create a fork of the sub-tree starting at elementToCopy
        OrientVertex vNewTarget = BranchUtils.branchSubTree(vTarget, vUser, g);
        OrientEdge link = null;
        switch ((String) vNewTarget.getProperty("@class")) {
          case DataModel.Classes.set:
            link = UpdateUtils.addSubsetToSet(vDestination, vNewTarget, vUser, g);
            break;
          default:
            link = UpdateUtils.addItemToSet(vNewTarget, vDestination, vUser, g);
            break;
        }

        g.commit();

        // Do not include newly created item : we don't know what that item type is and no-one has subscribed to it anyway
        changes.add(vDestination.getProperty(DataModel.Properties.id));
      } catch (OConcurrentModificationException e) {
        log.warn("Database busy, retrying operation");
        retry = true;
      } finally {
        g.rollback();
        g.shutdown();
      }

    }

    return changes;
  }

  public static List<String> cutPaste(String currentParentToElementLinkId, String futureParentId, String user) throws JSONException, AccessForbiddenException, ObsoleteDataException {
    List<String> changes = new LinkedList<>();
    boolean retry = true;
    while (retry) {
      retry = false;
      OrientBaseGraph g = DatabaseAccess.getReaderWriterGraph();
      try {
        OrientVertex vUser = AccessUtils.getUserByLogin(user, g);

        OrientVertex vFutureParentSet = AccessUtils.getSet(futureParentId, g);

        OrientEdge eLinkCurrent = AccessUtils.getEdgeById(currentParentToElementLinkId, g);
        OrientVertex vTargetItemOrSet = eLinkCurrent.getVertex(Direction.IN);
        OrientVertex vCurrentParentSet = eLinkCurrent.getVertex(Direction.OUT);

        // Check rights: WRITE current, WRITE future, READ target
        if (!AccessRights.canWrite(vUser, vCurrentParentSet, g)) {
          throw new AccessForbiddenException(user, (String) vCurrentParentSet.getProperty(DataModel.Properties.id));
        }
        if (!AccessRights.canWrite(vUser, vFutureParentSet, g)) {
          throw new AccessForbiddenException(user, (String) vFutureParentSet.getProperty(DataModel.Properties.id));
        }
        if (!AccessRights.canRead(vUser, vTargetItemOrSet, g)) {
          throw new AccessForbiddenException(user, (String) vTargetItemOrSet.getProperty(DataModel.Properties.id));
        }

        changes = DeleteUtils.unlinkItemFromSet(currentParentToElementLinkId, vUser, g);

        vTargetItemOrSet = AccessUtils.findLatestVersion(vTargetItemOrSet);

        // Link new version of target with new parent
        switch ((String) vTargetItemOrSet.getProperty("@class")) {
          case DataModel.Classes.set:
            UpdateUtils.addSubsetToSet(vFutureParentSet, vTargetItemOrSet, vUser, g);
            break;
          default:
            UpdateUtils.addItemToSet(vTargetItemOrSet, vFutureParentSet, vUser, g);
            break;
        }

        g.commit();

        changes.add((String) vCurrentParentSet.getProperty(DataModel.Properties.id));
        changes.add((String) vTargetItemOrSet.getProperty(DataModel.Properties.id));
        changes.add((String) vFutureParentSet.getProperty(DataModel.Properties.id));
      } catch (OConcurrentModificationException e) {
        log.warn("Database busy, retrying operation");
        retry = true;
      } finally {
        g.rollback();
        g.shutdown();
      }
    }

    return changes;
  }

  public static ActionResult importRecolnatSpecimen(String setId, String specimenName, String recolnatSpecimenUuid, JSONArray images, String user) throws JSONException, AccessForbiddenException, InterruptedException, ResourceNotExistsException {
    String imageUrl = null;
    ActionResult result = new ActionResult();
//    List<String> changes = new ArrayList<>();

    boolean retry = true;
    while (retry) {
      retry = false;
      OrientBaseGraph g = DatabaseAccess.getReaderWriterGraph();
      try {
        OrientVertex vUser = AccessUtils.getUserByLogin(user, g);
        OrientVertex vSet = AccessUtils.getSet(setId, g);
//        OrientVertex vPublic = AccessUtils.getPublic(g);
        if (!AccessRights.canWrite(vUser, vSet, g)) {
          throw new AccessForbiddenException(user, setId);
        }

        OrientVertex vSpecimen = null;
        OrientVertex vOriginalSource = AccessUtils.getOriginalSource(recolnatSpecimenUuid, g);
        if (vOriginalSource == null) {
          // Create source, specimen, link both
          vOriginalSource = CreatorUtils.createOriginalSourceEntity(recolnatSpecimenUuid, DataModel.Globals.Sources.RECOLNAT, DataModel.Globals.SourceDataTypes.SPECIMEN, g);
          vSpecimen = CreatorUtils.createSpecimen(specimenName, g);
          UpdateUtils.addOriginalSource(vSpecimen, vOriginalSource, vUser, g);
          AccessRights.grantPublicAccessRights(vOriginalSource, DataModel.Enums.AccessRights.READ, g);
          AccessRights.grantPublicAccessRights(vSpecimen, DataModel.Enums.AccessRights.READ, g);
          g.commit();
        } else {
          vSpecimen = AccessUtils.getSpecimenFromOriginalSource(vOriginalSource, g);
          if (vSpecimen == null) {
            vSpecimen = CreatorUtils.createSpecimen(specimenName, g);
            UpdateUtils.addOriginalSource(vSpecimen, vOriginalSource, vUser, g);
            AccessRights.grantPublicAccessRights(vSpecimen, DataModel.Enums.AccessRights.READ, g);
            g.commit();
          }
        }

        result.addModifiedId((String) vOriginalSource.getProperty(DataModel.Properties.id));
        result.addModifiedId((String) vSpecimen.getProperty(DataModel.Properties.id));
        // Check if all images are on the main tree of the specimen
        HttpClient client = new HttpClient();
        for (int i = 0; i < images.length(); ++i) {
          JSONObject image = images.getJSONObject(i);
          imageUrl = image.getString("url");
          String thumbUrl = image.getString("thumburl");
          OrientVertex vImage = AccessUtils.getImageMainBranch(imageUrl, g);
          if (vImage == null) {
            Integer height, width = null;
            try {
              String metadataUrlString = "https://mediatheque.mnhn.fr/service/public/media" + imageUrl.substring(imageUrl.lastIndexOf("/"));
              if(log.isDebugEnabled()) {
                log.debug("GETting " + metadataUrlString);
              }
              GetMethod get = new GetMethod(metadataUrlString);
              client.executeMethod(get);
              String response = get.getResponseBodyAsString();
              get.releaseConnection();
              if(log.isDebugEnabled()) {
                log.debug("Received response " + response);
              }
              JSONObject metadata = new JSONObject(response);

              width = metadata.getInt("width");
              height = metadata.getInt("height");
            } catch (IOException | JSONException | NullPointerException ex) {
              log.warn("No metadata available for https://mediatheque.mnhn.fr/service/public/media" + imageUrl.substring(imageUrl.lastIndexOf("/")));
              log.warn("Falling back to image download.");
              BufferedImage img = ImageIO.read(new URL(imageUrl));
              width = img.getWidth();
              height = img.getHeight();
            }

            vImage = UpdateUtils.addImageToSpecimen(vSpecimen, imageUrl, width, height, thumbUrl, g);
            g.commit();

            result.addModifiedId((String) vImage.getProperty(DataModel.Properties.id));
          }
        }
        // Make branch of specimen tree
        vSpecimen = BranchUtils.branchSubTree(vSpecimen, vUser, g);
        vSpecimen.setProperties(DataModel.Properties.name, specimenName);

        // Link specimen to set
        OrientEdge eLink = UpdateUtils.link(vSet, vSpecimen, DataModel.Links.containsItem, user, g);
        g.commit();

        result.addModifiedId((String) vSpecimen.getProperty(DataModel.Properties.id));

        result.addModifiedId((String) vSet.getProperty(DataModel.Properties.id));
        result.setResponse("recolnatUuid", recolnatSpecimenUuid);

        JSONArray jImages = new JSONArray();
        Iterator<Vertex> itImages = vSpecimen.getVertices(Direction.OUT, DataModel.Links.hasImage).iterator();
        while (itImages.hasNext()) {
          OrientVertex vImage = (OrientVertex) itImages.next();
          if (AccessUtils.isLatestVersion(vImage)) {
            if (AccessRights.canRead(vUser, vImage, g)) {
              RecolnatImage image = new RecolnatImage(vImage, vUser, g);
              jImages.put(image.toJSON());
            }
          }
        }
        result.setResponse("images", jImages);
      } catch (OConcurrentModificationException e) {
        log.warn("Database busy, retrying operation");
        retry = true;
      } catch (IOException ex) {
        log.warn("Unable to load image " + imageUrl);
        throw new ResourceNotExistsException(imageUrl);
      } finally {
        g.rollback();
        g.shutdown();
        if (retry) {
          Thread.sleep(500);
        }
      }
    }

    return result;
  }

  public static List<String> importExternalImage(String setId, String imageUrl, String imageName, String user) throws JSONException, AccessForbiddenException, ResourceNotExistsException {
    List<String> changes = new LinkedList<>();
    boolean retry = true;
    while (retry) {
      retry = false;
      OrientBaseGraph g = DatabaseAccess.getReaderWriterGraph();
      try {
        OrientVertex vUser = AccessUtils.getUserByLogin(user, g);
        OrientVertex vSet = AccessUtils.getSet(setId, g);
        if (!AccessRights.canWrite(vUser, vSet, g)) {
          throw new AccessForbiddenException(user, setId);
        }

        // If image exists on main branch, branch it, otherwise create it and then branch it
        OrientVertex vImage = AccessUtils.getImageMainBranch(imageUrl, g);
        if (vImage == null) {
          // Get image height and width
          BufferedImage img = ImageIO.read(new URL(imageUrl));
          vImage = CreatorUtils.createImage(imageName, imageUrl, img.getWidth(), img.getHeight(), imageUrl, g);
          AccessRights.grantPublicAccessRights(vImage, DataModel.Enums.AccessRights.READ, g);
          g.commit();

          changes.add((String) vImage.getProperty(DataModel.Properties.id));
        }

        vImage = BranchUtils.branchSubTree(vImage, vUser, g);
        vImage.setProperty(DataModel.Properties.name, imageName);

        UpdateUtils.addItemToSet(vImage, vSet, vUser, g);
        AccessRights.grantAccessRights(vUser, vImage, DataModel.Enums.AccessRights.WRITE, g);

        g.commit();
        changes.add((String) vImage.getProperty(DataModel.Properties.id));
        changes.add((String) vSet.getProperty(DataModel.Properties.id));
      } catch (OConcurrentModificationException e) {
        log.warn("Database busy, retrying operation");
        retry = true;
      } catch (IOException ex) {
        log.warn("Unable to read image ");
        throw new ResourceNotExistsException(imageUrl);
      } finally {
        g.rollback();
        g.shutdown();
      }
    }

    return changes;
  }

}
