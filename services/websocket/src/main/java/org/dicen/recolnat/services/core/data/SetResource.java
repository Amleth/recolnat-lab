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
import com.tinkerpop.blueprints.impls.orient.OrientGraph;
import com.tinkerpop.blueprints.impls.orient.OrientVertex;
import fr.recolnat.data.ImageMetadataDownloader;
import fr.recolnat.database.exceptions.AccessForbiddenException;
import fr.recolnat.database.exceptions.ObsoleteDataException;
import fr.recolnat.database.model.DataModel;
import fr.recolnat.database.model.impl.AbstractObject;
import fr.recolnat.database.model.impl.RecolnatImage;
import fr.recolnat.database.model.impl.SetView;
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
import java.util.logging.Level;
import javassist.tools.web.BadHttpRequest;
import javax.imageio.ImageIO;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.dicen.recolnat.services.core.exceptions.InternalServerErrorException;
import org.dicen.recolnat.services.core.exceptions.ResourceNotExistsException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author dmitri
 */
public class SetResource {

  private static final Logger log = LoggerFactory.getLogger(SetResource.class);

  public static JSONObject getSet(String setId, String user) throws JSONException, AccessForbiddenException, ResourceNotExistsException, InternalServerErrorException {
    OrientGraph g = DatabaseAccess.getTransactionalGraph();
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

  public static List<AbstractObject> createSet(String parentSetId, String name, String user) throws JSONException, AccessForbiddenException {
    if (log.isTraceEnabled()) {
      log.trace("Entering createSet");
    }

    if (log.isDebugEnabled()) {
      log.debug("Parent set id is " + parentSetId);
    }

    List<AbstractObject> changes = new LinkedList<>();
    boolean retry = true;
    while (retry) {
      retry = false;
      OrientGraph g = DatabaseAccess.getTransactionalGraph();
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
        changes.add(new StudySet(vParentSet, vUser, g));
        changes.add(new StudySet(vSet, vUser, g));
        changes.add(new SetView(vView, vUser, g));
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

  public static List<AbstractObject> deleteElementFromSet(String linkSetToElementId, String user) throws AccessForbiddenException, ObsoleteDataException {
    List<AbstractObject> changes = new LinkedList<>();

    boolean retry = true;
    while (retry) {
      retry = false;
      OrientGraph g = DatabaseAccess.getTransactionalGraph();
      try {
        OrientVertex vUser = AccessUtils.getUserByLogin(user, g);
        // Permissions checked internally

        List<AbstractObject> deleted = DeleteUtils.unlinkItemFromSet(linkSetToElementId, vUser, g);
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

  public static List<AbstractObject> link(String elementToCopyId, String futureParentId, String user) throws JSONException, AccessForbiddenException {
    List<AbstractObject> changes = new LinkedList<>();
    boolean retry = true;
    while (retry) {
      retry = false;
      OrientGraph g = DatabaseAccess.getTransactionalGraph();
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

        changes.add(new StudySet(vSet, vUser, g));
        changes.add(new StudySet(vTarget, vUser, g));
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

  public List<String> copy(String elementToCopyId, String futureParentId, String user) throws JSONException, AccessForbiddenException {
    List<String> changes = new ArrayList<>();
    boolean retry = true;
    while (retry) {
      retry = false;
      OrientGraph g = DatabaseAccess.getTransactionalGraph();
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

        changes.add((String) vNewTarget.getProperty(DataModel.Properties.id));
        changes.add(futureParentId);
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

  public List<String> cutPaste(String currentParentToElementLinkId, String futureParentId, String user) throws JSONException, AccessForbiddenException {
    List<String> changes = new ArrayList<>();
    boolean retry = true;
    while (retry) {
      retry = false;
      OrientGraph g = DatabaseAccess.getTransactionalGraph();
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

        if (!DeleteUtils.unlinkItemFromSet(currentParentToElementLinkId, vUser, g)) {
          // Removal failed
          throw new AccessForbiddenException(user, (String) vCurrentParentSet.getProperty(DataModel.Properties.id));
        }

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

  public List<String> importRecolnatSpecimen(String setId, JSONArray specimens, String user) throws JSONException, InterruptedException, AccessForbiddenException, ResourceNotExistsException {
    String imageUrl = null;
    List<String> changes = new ArrayList<>();

    boolean retry = true;
    while (retry) {
      retry = false;
      OrientGraph g = DatabaseAccess.getTransactionalGraph();
      try {
        OrientVertex vUser = AccessUtils.getUserByLogin(user, g);
        OrientVertex vSet = AccessUtils.getSet(setId, g);
//        OrientVertex vPublic = AccessUtils.getPublic(g);
        if (!AccessRights.canWrite(vUser, vSet, g)) {
          throw new AccessForbiddenException(user, setId);
        }
        for (int j = 0; j < specimens.length(); ++j) {
          String name = specimens.getJSONObject(j).getString("name");
          String recolnatSpecimenUuid = specimens.getJSONObject(j).getString("recolnatSpecimenUuid");
          JSONArray images = specimens.getJSONObject(j).getJSONArray("images");

          OrientVertex vSpecimen = null;
          OrientVertex vOriginalSource = AccessUtils.getOriginalSource(recolnatSpecimenUuid, g);
          if (vOriginalSource == null) {
            // Create source, specimen, link both
            vOriginalSource = CreatorUtils.createOriginalSourceEntity(recolnatSpecimenUuid, DataModel.Globals.Sources.RECOLNAT, DataModel.Globals.SourceDataTypes.SPECIMEN, g);
            vSpecimen = CreatorUtils.createSpecimen(name, g);
            UpdateUtils.addOriginalSource(vSpecimen, vOriginalSource, vUser, g);
            AccessRights.grantPublicAccessRights(vOriginalSource, DataModel.Enums.AccessRights.READ, g);
            AccessRights.grantPublicAccessRights(vSpecimen, DataModel.Enums.AccessRights.READ, g);
            g.commit();
          } else {
            vSpecimen = AccessUtils.getSpecimenFromOriginalSource(vOriginalSource, g);
            if (vSpecimen == null) {
              vSpecimen = CreatorUtils.createSpecimen(name, g);
              UpdateUtils.addOriginalSource(vSpecimen, vOriginalSource, vUser, g);
              AccessRights.grantPublicAccessRights(vSpecimen, DataModel.Enums.AccessRights.READ, g);
              g.commit();
            }
          }
          
          changes.add((String) vOriginalSource.getProperty(DataModel.Properties.id));
          changes.add((String) vSpecimen.getProperty(DataModel.Properties.id));
          // Check if all images are on the main tree of the specimen
          for (int i = 0; i < images.length(); ++i) {
            JSONObject image = images.getJSONObject(i);
            imageUrl = image.getString("url");
            String thumbUrl = image.getString("thumburl");
            OrientVertex vImage = AccessUtils.getImageMainBranch(imageUrl, g);
            if (vImage == null) {
//              JSONObject metadata = ImageMetadataDownloader.downloadImageMetadata(imageUrl);
              BufferedImage img = ImageIO.read(new URL(imageUrl));
              vImage = UpdateUtils.addImageToSpecimen(vSpecimen, imageUrl, img.getWidth(), img.getHeight(), thumbUrl, g);
              g.commit();
              
              changes.add((String) vImage.getProperty(DataModel.Properties.id));
            }
          }
          // Make branch of specimen tree
          vSpecimen = BranchUtils.branchSubTree(vSpecimen, vUser, g);
          vSpecimen.setProperties(DataModel.Properties.name, name);

          // Link specimen to set
          OrientEdge eLink = UpdateUtils.link(vSet, vSpecimen, DataModel.Links.containsItem, user, g);
          g.commit();
          
          changes.add((String) vSpecimen.getProperty(DataModel.Properties.id));
        }
        changes.add((String) vSet.getProperty(DataModel.Properties.id));
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
    
    return changes;
  }

  public List<String> importExternalImages(String setId, JSONArray images, String user) throws JSONException, AccessForbiddenException, BadHttpRequest {
    List<String> changes = new ArrayList<>();
    boolean retry = true;
    while (retry) {
      retry = false;
      OrientGraph g = DatabaseAccess.getTransactionalGraph();
      try {
        OrientVertex vUser = AccessUtils.getUserByLogin(user, g);
        OrientVertex vSet = AccessUtils.getSet(setId, g);
        if (!AccessRights.canWrite(vUser, vSet, g)) {
          throw new AccessForbiddenException(user, setId);
        }

        for (int i = 0; i < images.length(); ++i) {
          JSONObject jImage = images.getJSONObject(i);
          String imageUrl = jImage.getString("url");
          String imageName = jImage.getString("name");

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
        }
      } catch (OConcurrentModificationException e) {
        log.warn("Database busy, retrying operation");
        retry = true;
      } catch (IOException ex) {
        log.warn("Unable to read image ");
        throw new BadHttpRequest();
      } finally {
        g.rollback();
        g.shutdown();
      }
    }

    return changes;
  }

}
