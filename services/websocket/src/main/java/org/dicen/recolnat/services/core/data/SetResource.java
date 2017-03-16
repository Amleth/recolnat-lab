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
import fr.recolnat.database.utils.AccessRights;
import fr.recolnat.database.utils.AccessUtils;
import fr.recolnat.database.utils.BranchUtils;
import fr.recolnat.database.utils.CreatorUtils;
import fr.recolnat.database.utils.DeleteUtils;
import fr.recolnat.database.utils.UpdateUtils;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.net.URL;
import java.util.LinkedList;
import java.util.List;
import javax.imageio.ImageIO;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import fr.recolnat.database.exceptions.ResourceNotExistsException;
import fr.recolnat.database.model.impl.ColaboratoryImage;
import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.net.MalformedURLException;
import java.util.Date;
import java.util.Iterator;
import java.util.UUID;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;
import org.apache.commons.httpclient.HttpClient;
import org.apache.commons.httpclient.methods.GetMethod;
import org.apache.commons.io.FileUtils;
import org.dicen.recolnat.services.configuration.Configuration;
import org.dicen.recolnat.services.core.actions.ActionResult;
import org.dicen.recolnat.services.core.format.DateFormatUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Static methods to operate on Set-type Vertices.
 * @author dmitri
 */
public class SetResource {
  private static final Logger log = LoggerFactory.getLogger(SetResource.class);

  /**
   * Creates a new Set defined as child of a parent Set. Also creates the default (empty) View of the new Set.
   * @param parentSetId UID of the parent Set. If null the new Set will be created in the user's core set.
   * @param name Name of the new Set.
   * @param user Login of the user
   * @return Response includes : id of parent set (parentSet), id of new set (subSet), id of parent->new set link (link), id of the new set's default View (defaultView). Modified ids : parent set, new set, new set default view.
   * @throws JSONException
   * @throws AccessForbiddenException 
   */
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
        if (!AccessRights.canWrite(vUser, vParentSet, g, DatabaseAccess.rightsDb)) {
          throw new AccessForbiddenException(user, (String) vParentSet.getProperty(DataModel.Properties.id));
        }

        // Create new set & default view
        OrientVertex vSet = CreatorUtils.createSet(name, DataModel.Globals.SET_ROLE, g);
        OrientVertex vView = CreatorUtils.createView("Vue par défaut", DataModel.Globals.DEFAULT_VIEW, g);

        OrientEdge eParentToChildLink = null;
        // Add new set to parent
        eParentToChildLink = UpdateUtils.addSubsetToSet(vParentSet, vSet, vUser, g);
        UpdateUtils.link(vSet, vView, DataModel.Links.hasView, (String) vUser.getProperty(DataModel.Properties.id), g);
        g.commit();

        // Grant creator rights on new set & default view
        AccessRights.grantAccessRights(vUser, vSet, DataModel.Enums.AccessRights.WRITE, DatabaseAccess.rightsDb);
        AccessRights.grantAccessRights(vUser, vView, DataModel.Enums.AccessRights.WRITE, DatabaseAccess.rightsDb);

        // Build return object
        result.addModifiedId((String) vParentSet.getProperty(DataModel.Properties.id));
        result.addModifiedId((String) vSet.getProperty(DataModel.Properties.id));
        result.addModifiedId((String) vView.getProperty(DataModel.Properties.id));

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

  /**
   * Deletes (unlinks) an element of a Set from the Set. The child set itself is not deleted even if it has no parents as checking connectivity would be too time-expensive (this operation is already long enough). Internally this method creates a new version of the child set and its links and removes the new version of the link.
   * @param linkSetToElementId UID of the link between both sets
   * @param user
   * @return Modified ids : anything linked to the child set.
   * @throws AccessForbiddenException
   * @throws ObsoleteDataException 
   */
  public static ActionResult deleteElementFromSet(String linkSetToElementId, String user) throws AccessForbiddenException, ObsoleteDataException {
    ActionResult changes = new ActionResult();

    boolean retry = true;
    while (retry) {
      retry = false;
      OrientBaseGraph g = DatabaseAccess.getReaderWriterGraph();
      try {
        OrientVertex vUser = AccessUtils.getUserByLogin(user, g);
        // Permissions checked internally

        List<String> deleted = DeleteUtils.unlinkItemFromSet(linkSetToElementId, vUser, g, DatabaseAccess.rightsDb);
        g.commit();

        for(String id: deleted) {
          changes.addModifiedId(id);
        }
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

  /**
   * Creates a parentToChild link between a parent Set and an entity.
   * @param elementToCopyId UID of the child entity.
   * @param futureParentId UID of the parent set.
   * @param user Login of the user
   * @return Modified ids : set, entity
   * @throws JSONException
   * @throws AccessForbiddenException 
   */
  public static ActionResult link(String elementToCopyId, String futureParentId, String user) throws JSONException, AccessForbiddenException {
    ActionResult changes = new ActionResult();
    boolean retry = true;
    while (retry) {
      retry = false;
      OrientBaseGraph g = DatabaseAccess.getReaderWriterGraph();
      try {
        OrientVertex vUser = AccessUtils.getUserByLogin(user, g);
        OrientVertex vTarget = AccessUtils.getNodeById(elementToCopyId, g);
        OrientVertex vSet = AccessUtils.getSet(futureParentId, g);

        // Check access rights
        if (!AccessRights.canWrite(vUser, vSet, g, DatabaseAccess.rightsDb)) {
          throw new AccessForbiddenException(user, futureParentId);
        }
        if (!AccessRights.canRead(vUser, vTarget, g, DatabaseAccess.rightsDb)) {
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

        changes.addModifiedId((String) vSet.getProperty(DataModel.Properties.id));
        changes.addModifiedId((String) vTarget.getProperty(DataModel.Properties.id));
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

  /**
   * Creates a deep copy of an entity and adds link the copy to a parent Set. This effectively creates a new fork of the tree of the entity, following links to : Set, Specimen, Image. Other entities (spatial anchors, annotations, etc) are not copied.
   * @param elementToCopyId UID of the element to fork from
   * @param futureParentId UID of the set to link the element to.
   * @param user Login of the user
   * @return id of the parent Set
   * @throws JSONException
   * @throws AccessForbiddenException 
   */
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
        if (!AccessRights.canWrite(vUser, vDestination, g, DatabaseAccess.rightsDb)) {
          throw new AccessForbiddenException(user, futureParentId);
        }

        // Create a fork of the sub-tree starting at elementToCopy
        OrientVertex vNewTarget = BranchUtils.branchSubTree(vTarget, vUser, g, DatabaseAccess.rightsDb);
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
        changes.add((String) vDestination.getProperty(DataModel.Properties.id));
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

  /**
   * Adds an entity to a Set and removes it from its parent Set.
   * @param currentParentToElementLinkId UID of the link between the current parent Set and the entity.
   * @param futureParentId UID of the Set to link the entity to
   * @param user Login of the user
   * @return Modified ids : former Set, new parent Set, entity
   * @throws JSONException
   * @throws AccessForbiddenException
   * @throws ObsoleteDataException 
   */
  public static ActionResult cutPaste(String currentParentToElementLinkId, String futureParentId, String user) throws JSONException, AccessForbiddenException, ObsoleteDataException {
    ActionResult changes = new ActionResult();
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
        if (!AccessRights.canWrite(vUser, vCurrentParentSet, g, DatabaseAccess.rightsDb)) {
          throw new AccessForbiddenException(user, (String) vCurrentParentSet.getProperty(DataModel.Properties.id));
        }
        if (!AccessRights.canWrite(vUser, vFutureParentSet, g, DatabaseAccess.rightsDb)) {
          throw new AccessForbiddenException(user, (String) vFutureParentSet.getProperty(DataModel.Properties.id));
        }
        if (!AccessRights.canRead(vUser, vTargetItemOrSet, g, DatabaseAccess.rightsDb)) {
          throw new AccessForbiddenException(user, (String) vTargetItemOrSet.getProperty(DataModel.Properties.id));
        }

        // Link new version of target with new parent
        switch ((String) vTargetItemOrSet.getProperty("@class")) {
          case DataModel.Classes.set:
            UpdateUtils.addSubsetToSet(vFutureParentSet, vTargetItemOrSet, vUser, g);
            break;
          default:
            UpdateUtils.addItemToSet(vTargetItemOrSet, vFutureParentSet, vUser, g);
            break;
        }

        List<String> deletionChanges = DeleteUtils.unlinkItemFromSet(currentParentToElementLinkId, vUser, g, DatabaseAccess.rightsDb);
        g.commit();

        for(String id: deletionChanges) {
          changes.addModifiedId(id);
        }
        changes.addModifiedId((String) vCurrentParentSet.getProperty(DataModel.Properties.id));
        changes.addModifiedId((String) vTargetItemOrSet.getProperty(DataModel.Properties.id));
        changes.addModifiedId((String) vFutureParentSet.getProperty(DataModel.Properties.id));
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

  /**
   * Imports a ReColNat specimen and its images into the Colaboratory database and adds the specimen to a Set. When importing from ReColNat, if the specimen already exists only new images are imported (existing images are left as they are). Note that the Specimen linked to the Set is not the imported Specimen but a fork of it and its Images.
   * @param setId UID of the Set
   * @param specimenName Name of the specimen (display name).
   * @param recolnatSpecimenUuid UUID of the specimen in the ReColNat database (i.e OriginalSource).
   * @param images List of images associated with the specimen. Each image is a JSONObject which must contain at least an "url" and "thumburl" property.
   * @param user Login of the user
   * @return Response includes : UID of the ReColNat specimen (recolnatUuid), complete list of image Colaboratory ids of the specimen (images). Modified ids : set, specimen (main and fork), images (main and fork).
   * @throws JSONException
   * @throws AccessForbiddenException
   * @throws InterruptedException
   * @throws ResourceNotExistsException 
   */
  public static ActionResult importRecolnatSpecimen(String setId, String specimenName, String recolnatSpecimenUuid, JSONArray images, String user) throws JSONException, AccessForbiddenException, InterruptedException, ResourceNotExistsException {
    String imageUrl = null;
    ActionResult result = new ActionResult();

    boolean retry = true;
    while (retry) {
      retry = false;
      OrientBaseGraph g = DatabaseAccess.getReaderWriterGraph();
      try {
        OrientVertex vUser = AccessUtils.getUserByLogin(user, g);
        OrientVertex vSet = AccessUtils.getSet(setId, g);
        if (!AccessRights.canWrite(vUser, vSet, g, DatabaseAccess.rightsDb)) {
          throw new AccessForbiddenException(user, setId);
        }

        OrientVertex vSpecimen = null;
        OrientVertex vOriginalSource = AccessUtils.getOriginalSource(recolnatSpecimenUuid, g);

        if (vOriginalSource == null) {
          // Create source, specimen, link both
          vOriginalSource = CreatorUtils.createOriginalSourceEntity(recolnatSpecimenUuid, DataModel.Globals.Sources.RECOLNAT, DataModel.Globals.SourceDataTypes.SPECIMEN, g);
          vSpecimen = CreatorUtils.createSpecimen(specimenName, g);
          UpdateUtils.addOriginalSource(vSpecimen, vOriginalSource, vUser, g);
          AccessRights.grantPublicAccessRights(vOriginalSource, DataModel.Enums.AccessRights.READ, DatabaseAccess.rightsDb);
          AccessRights.grantPublicAccessRights(vSpecimen, DataModel.Enums.AccessRights.READ, DatabaseAccess.rightsDb);
          g.commit();
        } else {
          vSpecimen = AccessUtils.getSpecimenFromOriginalSource(vOriginalSource, g);
          if (vSpecimen == null) {
            vSpecimen = CreatorUtils.createSpecimen(specimenName, g);
            UpdateUtils.addOriginalSource(vSpecimen, vOriginalSource, vUser, g);
            AccessRights.grantPublicAccessRights(vSpecimen, DataModel.Enums.AccessRights.READ, DatabaseAccess.rightsDb);
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
              if (log.isDebugEnabled()) {
                log.debug("GETting " + metadataUrlString);
              }
              GetMethod get = new GetMethod(metadataUrlString);
              client.executeMethod(get);
              String response = get.getResponseBodyAsString();
              get.releaseConnection();
              if (log.isDebugEnabled()) {
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

            vImage = UpdateUtils.addImageToSpecimen(vSpecimen, imageUrl, width, height, thumbUrl, g, DatabaseAccess.rightsDb);
            g.commit();

            result.addModifiedId((String) vImage.getProperty(DataModel.Properties.id));
          }
        }

        OrientVertex vForkedSpecimen = BranchUtils.isSourceForkedInSet(vOriginalSource, vSet, vUser, g, DatabaseAccess.rightsDb);
        if (vForkedSpecimen == null) {
          // Make branch of specimen tree
          vSpecimen = BranchUtils.branchSubTree(vSpecimen, vUser, g, DatabaseAccess.rightsDb);
          vSpecimen.setProperties(DataModel.Properties.name, specimenName);

          // Link specimen to set
          OrientEdge eLink = UpdateUtils.link(vSet, vSpecimen, DataModel.Links.containsItem, user, g);
          g.commit();
        } else {
          vSpecimen = vForkedSpecimen;
        }

        result.addModifiedId((String) vSpecimen.getProperty(DataModel.Properties.id));

        result.addModifiedId((String) vSet.getProperty(DataModel.Properties.id));
        result.setResponse("recolnatUuid", recolnatSpecimenUuid);

        JSONArray jImages = new JSONArray();
        Iterator<Vertex> itImages = vSpecimen.getVertices(Direction.OUT, DataModel.Links.hasImage).iterator();
        while (itImages.hasNext()) {
          OrientVertex vImage = (OrientVertex) itImages.next();
          if (AccessUtils.isLatestVersion(vImage)) {
            if (AccessRights.canRead(vUser, vImage, g, DatabaseAccess.rightsDb)) {
              ColaboratoryImage image = new ColaboratoryImage(vImage, vUser, g, DatabaseAccess.rightsDb);
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

  /**
   * Imports an image from the Web using its URL into a Set. If the image already exists, uses the existing image. In both cases the image is forked and the fork is added to the Set.
   * @param setId UID of the Set
   * @param imageUrl URL of the image.
   * @param imageName Display name of the image.
   * @param user User login
   * @return Response includes complete image data in Colaboratory (image). Modified ids : image (main and fork), set
   * @throws JSONException
   * @throws AccessForbiddenException
   * @throws ResourceNotExistsException 
   */
  public static ActionResult importExternalImage(String setId, String imageUrl, String imageName, String user) throws JSONException, AccessForbiddenException, ResourceNotExistsException {
//    List<String> changes = new LinkedList<>();
    ActionResult result = new ActionResult();
    boolean retry = true;
    while (retry) {
      retry = false;
      OrientBaseGraph g = DatabaseAccess.getReaderWriterGraph();
      try {
        OrientVertex vUser = AccessUtils.getUserByLogin(user, g);
        OrientVertex vSet = AccessUtils.getSet(setId, g);
        if (!AccessRights.canWrite(vUser, vSet, g, DatabaseAccess.rightsDb)) {
          throw new AccessForbiddenException(user, setId);
        }

        // If image exists on main branch, branch it, otherwise create it and then branch it
        OrientVertex vImage = AccessUtils.getImageMainBranch(imageUrl, g);
        if (vImage == null) {
          // Get image height and width
          BufferedImage img = ImageIO.read(new URL(imageUrl));
          vImage = CreatorUtils.createImage(imageName, imageUrl, img.getWidth(), img.getHeight(), imageUrl, g);
          AccessRights.grantPublicAccessRights(vImage, DataModel.Enums.AccessRights.READ, DatabaseAccess.rightsDb);
          g.commit();

          result.addModifiedId((String) vImage.getProperty(DataModel.Properties.id));
        }

        // If image is already in set, return the existing image, otherwise fork a new one
        OrientVertex vForkedImage = BranchUtils.isImageForkedInSet(vImage, vSet, vUser, g, DatabaseAccess.rightsDb);
        if (vForkedImage == null) {
          vImage = BranchUtils.branchSubTree(vImage, vUser, g, DatabaseAccess.rightsDb);
          vImage.setProperty(DataModel.Properties.name, imageName);

          UpdateUtils.addItemToSet(vImage, vSet, vUser, g);
//          AccessRights.grantAccessRights(vUser, vImage, DataModel.Enums.AccessRights.WRITE, g);
        } else {
          vImage = vForkedImage;
        }
        g.commit();

        result.addModifiedId((String) vImage.getProperty(DataModel.Properties.id));
        result.addModifiedId((String) vSet.getProperty(DataModel.Properties.id));

        ColaboratoryImage img = new ColaboratoryImage(vImage, vUser, g, DatabaseAccess.rightsDb);
        result.setResponse("image", img.toJSON());
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

    return result;
  }

  /**
   * Gives a list of files downloadable by user. These files result from previous Set exports.
   * @param user Login of the user
   * @return Response contains a list of file names available to the user (String array)
   * @throws JSONException 
   */
  public static ActionResult listUserDownloads(String user) throws JSONException {
    ActionResult ret = new ActionResult();
    List<String[]> files = DatabaseAccess.exportsDb.listUserExports(user);
    JSONArray jFiles = new JSONArray();
    for (String[] file : files) {
      log.debug("User " + user + " has file " + file[0]);
      jFiles.put(file[0]);
    }

    ret.setResponse("files", jFiles);

    return ret;
  }

  /**
   * Creates a zip file in the Colaboratory's downloads directory containing the images of a Set.
   * @param setId UID of the Set to export/download.
   * @param user Login of the user
   * @throws AccessForbiddenException 
   */
  public static void prepareDownload(String setId, String user) throws AccessForbiddenException {
    // Get set data, download images
    boolean retry = true;
    List<File> images = new LinkedList<>();
    String setName = "";
    String uuid = UUID.randomUUID().toString();
    String tempDirPath = Configuration.Exports.DIRECTORY + "/" + uuid + "/";
    File temporaryDirectory = new File(tempDirPath);
    temporaryDirectory.mkdir();

    while (retry) {
      retry = false;
      OrientBaseGraph g = DatabaseAccess.getReadOnlyGraph();
      try {
        OrientVertex vUser = AccessUtils.getUserByLogin(user, g);
        OrientVertex vSet = AccessUtils.getSet(setId, g);
        if (!AccessRights.canRead(vUser, vSet, g, DatabaseAccess.rightsDb)) {
          throw new AccessForbiddenException(user, setId);
        }
        Iterator<Vertex> itItems = vSet.getVertices(Direction.OUT, DataModel.Links.containsItem).iterator();
        while (itItems.hasNext()) {
          SetResource.getImagesOfItem((OrientVertex) itItems.next(), images, tempDirPath, vUser, g);
        }
        setName = vSet.getProperty(DataModel.Properties.name);
      } catch (OConcurrentModificationException e) {
        log.warn("Database busy, retrying operation");
        retry = true;
      } finally {
        g.rollback();
        g.shutdown();
      }
    }

    if (!images.isEmpty()) {
      String zipFileName = Configuration.Exports.DIRECTORY + "/" + user + "-" + setName + "-" + DateFormatUtils.export.format(new Date()) + ".zip";
      File zipFile = new File(zipFileName);

      try {
        zipFile.createNewFile();
        ZipOutputStream zos = new ZipOutputStream(new BufferedOutputStream(new FileOutputStream(zipFile)));

        final int BUFFER = 2048;
        byte data[] = new byte[BUFFER];

        for (File f : images) {
          log.info("Compressing " + f.getName());
          FileInputStream fis = new FileInputStream(f);
          ZipEntry entry = new ZipEntry(f.getName());
          zos.putNextEntry(entry);
          int count = 0;
          while ((count = fis.read(data)) != -1) {
            log.info("Compressed " + count);
            zos.write(data);
          }
          zos.closeEntry();
          fis.close();
          f.delete();
        }
        zos.close();
      } catch (FileNotFoundException ex) {
        log.error("Destination zip file not created " + zipFileName);
        return;
      } catch (IOException ex) {
        log.error("Error with file " + zipFileName, ex);
        return;
      }
      
      temporaryDirectory.delete();

      // Add file to list of stuff ready to export
      DatabaseAccess.exportsDb.addUserExport(user, zipFile.getName(), zipFile.getName());
    }
  }

  /**
   * Internal method used by prepareDownload to retrieve image files and store them on disk.
   * 
   * @param vItem
   * @param accumulator
   * @param dir
   * @param vUser
   * @param g 
   */
  private static void getImagesOfItem(OrientVertex vItem, List<File> accumulator, String dir, OrientVertex vUser, OrientBaseGraph g) {
    switch ((String) vItem.getProperty("@class")) {
      case DataModel.Classes.specimen:
        Iterator<Vertex> itImages = vItem.getVertices(Direction.OUT, DataModel.Links.hasImage).iterator();
        while (itImages.hasNext()) {
          SetResource.getImagesOfItem((OrientVertex) itImages.next(), accumulator, dir, vUser, g);
        }
        break;
      case DataModel.Classes.image:
        String imageUrlString = vItem.getProperty(DataModel.Properties.imageUrl);
        File imageFile;
        try {
          imageFile = new File(dir + ((String) vItem.getProperty(DataModel.Properties.name)) + ".jpg");
          imageFile.createNewFile();
        } catch (IOException ex) {
          log.error("Could not create temporary file" + dir + ((String) vItem.getProperty(DataModel.Properties.name)) + ".jpg", ex);
          return;
        }

        try {
          URL imageUrl = new URL(imageUrlString);
          FileUtils.copyURLToFile(imageUrl, imageFile, 60 * 1000, 60 * 1000);
          accumulator.add(imageFile);
        } catch (MalformedURLException ex) {
          log.warn("URL is invalid. File will not be downloaded " + imageUrlString);
          imageFile.delete();
        } catch (IOException ex) {
          log.warn("Error opening stream to URL. File will not be downloaded " + imageUrlString);
          imageFile.delete();
        }
        break;
      default:
        log.warn("No handler for class " + (String) vItem.getProperty("@class"));
    }
  }

}
