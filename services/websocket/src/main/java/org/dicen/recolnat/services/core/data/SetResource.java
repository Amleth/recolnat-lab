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
import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.net.URLConnection;
import java.nio.channels.Channels;
import java.nio.channels.ReadableByteChannel;
import java.util.Date;
import java.util.Iterator;
import java.util.UUID;
import java.util.logging.Level;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;
import org.apache.commons.httpclient.HttpClient;
import org.apache.commons.httpclient.methods.GetMethod;
import org.apache.commons.io.FileUtils;
import org.dicen.recolnat.services.configuration.Configuration;
import org.dicen.recolnat.services.core.actions.ActionResult;
import org.dicen.recolnat.services.core.format.DateFormatUtils;
import org.glassfish.grizzly.utils.BufferOutputStream;
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
        set = new StudySet(vCoreSet, vUser, g, DatabaseAccess.rightsDb);
      } else {
        OrientVertex vSet = AccessUtils.getNodeById(setId, g);
        set = new StudySet(vSet, vUser, g, DatabaseAccess.rightsDb);
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
        if (!AccessRights.canWrite(vUser, vParentSet, g, DatabaseAccess.rightsDb)) {
          throw new AccessForbiddenException(user, (String) vParentSet.getProperty(DataModel.Properties.id));
        }

        // Create new set & default view
        OrientVertex vSet = CreatorUtils.createSet(name, DataModel.Globals.SET_ROLE, g);
        OrientVertex vView = CreatorUtils.createView("Vue par défaut", DataModel.Globals.DEFAULT_VIEW, g);
//        g.commit();

//        boolean retry1 = true;
        OrientEdge eParentToChildLink = null;
//        while (retry1) {
//          retry1 = false;
//          try {
//            vParentSet.reload();
//            vParentSet = AccessUtils.findLatestVersion(vParentSet);
            // Add new set to parent
            eParentToChildLink = UpdateUtils.addSubsetToSet(vParentSet, vSet, vUser, g);
            UpdateUtils.link(vSet, vView, DataModel.Links.hasView, vUser.getProperty(DataModel.Properties.id), g);
            g.commit();
//          } catch (OConcurrentModificationException e) {
//            log.warn("Database busy, retrying internal operation");
//            retry1 = true;
//          }
//        }

        // Grant creator rights on new set & default view
        AccessRights.grantAccessRights(vUser, vSet, DataModel.Enums.AccessRights.WRITE, DatabaseAccess.rightsDb);
        AccessRights.grantAccessRights(vUser, vView, DataModel.Enums.AccessRights.WRITE, DatabaseAccess.rightsDb);

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

        List<String> deleted = DeleteUtils.unlinkItemFromSet(linkSetToElementId, vUser, g, DatabaseAccess.rightsDb);
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
        if (!AccessRights.canWrite(vUser, vCurrentParentSet, g, DatabaseAccess.rightsDb)) {
          throw new AccessForbiddenException(user, (String) vCurrentParentSet.getProperty(DataModel.Properties.id));
        }
        if (!AccessRights.canWrite(vUser, vFutureParentSet, g, DatabaseAccess.rightsDb)) {
          throw new AccessForbiddenException(user, (String) vFutureParentSet.getProperty(DataModel.Properties.id));
        }
        if (!AccessRights.canRead(vUser, vTargetItemOrSet, g, DatabaseAccess.rightsDb)) {
          throw new AccessForbiddenException(user, (String) vTargetItemOrSet.getProperty(DataModel.Properties.id));
        }

        changes = DeleteUtils.unlinkItemFromSet(currentParentToElementLinkId, vUser, g, DatabaseAccess.rightsDb);

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
              RecolnatImage image = new RecolnatImage(vImage, vUser, g, DatabaseAccess.rightsDb);
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

        RecolnatImage img = new RecolnatImage(vImage, vUser, g, DatabaseAccess.rightsDb);
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
  
  public static ActionResult listUserDownloads(String user) throws JSONException {
    ActionResult ret = new ActionResult();
    List<String[]> files = DatabaseAccess.exportsDb.listUserExports(user);
    JSONArray jFiles = new JSONArray();
    for(String[] file : files) {
      log.debug("User " + user + " has file " + file[0]);
      jFiles.put(file[0]);
    }
    
    ret.setResponse("files", jFiles);
    
    return ret;
  }

  public static void prepareDownload(String setId, String user) throws AccessForbiddenException {
    // Get set data, download images
    boolean retry = true;
    List<File> images = new LinkedList<>();
    String setName = "";

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
          SetResource.getImagesOfItem((OrientVertex) itItems.next(), images, vUser, g);
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
    
    if(!images.isEmpty()) {
      String zipFileName = Configuration.Exports.DIRECTORY + "/" + user + "-" + setName + "-" + DateFormatUtils.export.format(new Date()) + ".zip";
      File zipFile = new File(zipFileName);
      
      try {
        zipFile.createNewFile();
        ZipOutputStream zos = new ZipOutputStream(new BufferedOutputStream(new FileOutputStream(zipFile)));
        
        final int BUFFER = 2048;
        byte data[] = new byte[BUFFER];
        
        for(File f : images) {
          log.info("Compressing " + f.getName());
          FileInputStream fis = new FileInputStream(f);
          ZipEntry entry = new ZipEntry(f.getName());
          zos.putNextEntry(entry);
          int count = 0;
          while((count = fis.read(data)) != -1) {
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
      
      // Add file to list of stuff ready to export
      DatabaseAccess.exportsDb.addUserExport(user, zipFile.getName(), zipFile.getName());
    }
  }

  private static void getImagesOfItem(OrientVertex vItem, List<File> accumulator, OrientVertex vUser, OrientBaseGraph g) {
    switch ((String) vItem.getProperty("@class")) {
      case DataModel.Classes.specimen:
        Iterator<Vertex> itImages = vItem.getVertices(Direction.OUT, DataModel.Links.hasImage).iterator();
        while (itImages.hasNext()) {
          SetResource.getImagesOfItem((OrientVertex) itImages.next(), accumulator, vUser, g);
        }
        break;
      case DataModel.Classes.image:
        String imageUrlString = vItem.getProperty(DataModel.Properties.imageUrl);
        File imageFile;
        try {
          imageFile = File.createTempFile(vItem.getProperty(DataModel.Properties.name), ".jpg");
        } catch (IOException ex) {
          log.error("Could not create temporary file.");
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
