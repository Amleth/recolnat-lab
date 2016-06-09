/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package org.dicen.recolnat.services.resources;

import com.codahale.metrics.annotation.Timed;
import com.google.common.base.Optional;
import com.orientechnologies.orient.core.exception.OConcurrentModificationException;
import com.tinkerpop.blueprints.Direction;
import com.tinkerpop.blueprints.Vertex;
import com.tinkerpop.blueprints.impls.orient.OrientEdge;
import com.tinkerpop.blueprints.impls.orient.OrientGraph;
import com.tinkerpop.blueprints.impls.orient.OrientVertex;
import fr.recolnat.database.model.DataModel;
import fr.recolnat.database.model.impl.RecolnatImage;
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
import java.nio.file.AccessDeniedException;
import java.util.Iterator;
import java.util.logging.Level;
import javax.imageio.ImageIO;
import javax.servlet.http.HttpServletRequest;
import javax.validation.constraints.NotNull;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.dicen.recolnat.services.core.DatabaseAccess;
import org.dicen.recolnat.services.core.SessionManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author dmitri
 */
@Path("/set")
@Produces(MediaType.APPLICATION_JSON)
public class SetResource {

  private final Logger log = LoggerFactory.getLogger(SetResource.class);

  @GET
  @Path("/get-set")
  @Timed
  public Response getSet(@QueryParam("id") Optional<String> id, @Context HttpServletRequest request) throws JSONException {
    if (log.isTraceEnabled()) {
      log.trace("Receiving new GET request");
    }

    final String setId = id.orNull();
//    if (setId == null) {
//      throw new WebApplicationException("Null request", Status.BAD_REQUEST);
//    }
    String session = SessionManager.getSessionId(request, true);
    String user = SessionManager.getUserLogin(session);

    OrientGraph g = DatabaseAccess.getTransactionalGraph();
    StudySet set = null;
    try {
      OrientVertex vUser = AccessUtils.getUserByLogin(user, g);
      if(setId == null) {
        OrientVertex vCoreSet = AccessUtils.getCoreSet(vUser, g);
        set = new StudySet(vCoreSet, vUser, g);
      }
      else {
        OrientVertex vSet = AccessUtils.getNodeById(setId, g);
        set = new StudySet(vSet, vUser, g);
      }
    } catch (AccessDeniedException ex) {
      throw new WebApplicationException("User not authorized to access resource " + setId, Response.Status.FORBIDDEN);
    } finally {
      g.rollback();
      g.shutdown();
    }
    if (set == null) {
      throw new WebApplicationException("Workbench not found " + setId, Response.Status.NOT_FOUND);
    }
    try {
      return Response.ok(set.toJSON().toString(), MediaType.APPLICATION_JSON_TYPE).build();
    } catch (JSONException e) {
      log.error("Could not convert message to JSON.", e);
      throw new WebApplicationException("Could not serialize workbench as JSON " + setId, Response.Status.INTERNAL_SERVER_ERROR);
    }
  }

  @POST
  @Consumes(MediaType.APPLICATION_JSON)
  @Path("/create-set")
  @Timed
  public Response createSet(final String input, @Context HttpServletRequest request) throws JSONException {
    if (log.isTraceEnabled()) {
      log.trace("Entering createSet");
    }
    JSONObject params = new JSONObject(input);
    String session = SessionManager.getSessionId(request, true);
    String user = SessionManager.getUserLogin(session);
    String name = (String) params.get("name");
    String parentSetId = (String) params.get("parent");

    boolean retry = true;
    JSONObject ret = new JSONObject();
    while (retry) {
      retry = false;
      OrientGraph g = DatabaseAccess.getTransactionalGraph();
      try {
        OrientVertex vUser = AccessUtils.getUserByLogin(user, g);
        OrientVertex vParentSet = AccessUtils.getNodeById(parentSetId, g);
        // Check permissions
        if (!AccessRights.canWrite(vUser, vParentSet, g)) {
          throw new WebApplicationException("User not authorized to write in workbench " + parentSetId, Response.Status.FORBIDDEN);
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
        ret.put("parentSet", (String) vParentSet.getProperty(DataModel.Properties.id));
        ret.put("subSet", (String) vSet.getProperty(DataModel.Properties.id));
        ret.put("link", (String) eParentToChildLink.getProperty(DataModel.Properties.id));
        ret.put("defaultView", (String) vView.getProperty(DataModel.Properties.id));
      } catch (OConcurrentModificationException e) {
        log.warn("Database busy, retrying operation");
        retry = true;
      } catch (JSONException ex) {
        log.error("Could not serialize response", ex);
        throw new WebApplicationException("Could not send response", ex);
      } finally {
        g.rollback();
        g.shutdown();
      }
    }

    return Response.ok(ret.toString(), MediaType.APPLICATION_JSON_TYPE).build();
  }

  @POST
  @Consumes(MediaType.APPLICATION_JSON)
  @Path("/delete-element-from-set")
  @Timed
  public Response deleteElementFromSet(final String input, @Context HttpServletRequest request) throws JSONException {
    JSONObject params = new JSONObject(input);
    String linkSetToElementId = (String) params.get("linkId");
    String session = SessionManager.getSessionId(request, true);
    String user = SessionManager.getUserLogin(session);

    try {
      boolean ret = deleteElementFromSet(linkSetToElementId, user);
      if(!ret) {
        return Response.notModified(linkSetToElementId).build();
      }
    } catch (AccessDeniedException e) {
      throw new WebApplicationException(e.getCause(), Response.Status.FORBIDDEN);
    }
    return Response.ok().build();
  }

  @POST
  @Consumes(MediaType.APPLICATION_JSON)
  @Path("/link")
  @Timed
  public Response link(final String input, @Context HttpServletRequest request) throws JSONException {
    JSONObject params = new JSONObject(input);
    String session = SessionManager.getSessionId(request, true);
    String user = SessionManager.getUserLogin(session);
    String elementToCopyId = params.getString("target");
    String futureParentId = params.getString("destination");

    JSONObject ret = null;
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
          throw new WebApplicationException(Response.Status.FORBIDDEN);
        }
        if (!AccessRights.canRead(vUser, vTarget, g)) {
          throw new WebApplicationException(Response.Status.FORBIDDEN);
        }

        // Link according to child type
        OrientEdge newLink = null;
        if (vTarget.getProperty("@class").equals(DataModel.Classes.set)) {
          newLink = UpdateUtils.link(vSet, vTarget, DataModel.Links.containsSubSet, user, g);
        } else {
          newLink = UpdateUtils.link(vSet, vTarget, DataModel.Links.containsItem, user, g);
        }
        g.commit();

        ret = new JSONObject();
        ret.put("link", (String) newLink.getProperty(DataModel.Properties.id));
      } catch (OConcurrentModificationException e) {
        log.warn("Database busy, retrying operation");
        retry = true;
      } finally {
        g.rollback();
        g.shutdown();
      }
    }
    return Response.ok(ret.toString(), MediaType.APPLICATION_JSON_TYPE).build();
  }

  @POST
  @Consumes(MediaType.APPLICATION_JSON)
  @Path("/copy")
  @Timed
  public Response copy(final String input, @Context HttpServletRequest request) throws JSONException {
    JSONObject params = new JSONObject(input);
    String session = SessionManager.getSessionId(request, true);
    String user = SessionManager.getUserLogin(session);
    String elementToCopyId = params.getString("target");
    String futureParentId = params.getString("destination");
    boolean retry = true;
    JSONObject ret = null;

    while (retry) {
      retry = false;
      OrientGraph g = DatabaseAccess.getTransactionalGraph();
      try {
        OrientVertex vUser = AccessUtils.getUserByLogin(user, g);
        OrientVertex vDestination = AccessUtils.getSet(futureParentId, g);
        OrientVertex vTarget = AccessUtils.getNodeById(elementToCopyId, g);

        // User must have write rights on destination, all other rights irrelevant as we are forking
        if (!AccessRights.canWrite(vUser, vDestination, g)) {
          throw new WebApplicationException(Response.Status.FORBIDDEN);
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
        ret = new JSONObject();
        ret.put("child", (String) vNewTarget.getProperty(DataModel.Properties.id));
        ret.put("link", (String) link.getProperty(DataModel.Properties.id));
      } catch (OConcurrentModificationException e) {
        log.warn("Database busy, retrying operation");
        retry = true;
      } finally {
        g.rollback();
        g.shutdown();
      }

    }

    return Response.ok(ret.toString(), MediaType.APPLICATION_JSON_TYPE).build();
  }

  @POST
  @Consumes(MediaType.APPLICATION_JSON)
  @Path("/cutpaste")
  @Timed
  public Response cutPaste(final String input, @Context HttpServletRequest request) throws JSONException {
    JSONObject params = new JSONObject(input);
    String session = SessionManager.getSessionId(request, true);
    String user = SessionManager.getUserLogin(session);
    String elementToPasteId = params.getString("target");
    String currentParentToElementLinkId = (String) params.get("linkId");
    String currentParentId = params.getString("source");
    String futureParentId = params.getString("destination");

    boolean retry = true;
    while (retry) {
      retry = false;
      OrientGraph g = DatabaseAccess.getTransactionalGraph();
      try {
        OrientVertex vUser = AccessUtils.getUserByLogin(user, g);
        OrientVertex vCurrentParentSet = AccessUtils.getSet(currentParentId, g);
        OrientVertex vFutureParentSet = AccessUtils.getSet(futureParentId, g);
        OrientVertex vTargetItemOrSet = AccessUtils.getNodeById(elementToPasteId, g);
        OrientEdge eLinkCurrent = AccessUtils.getEdgeById(currentParentToElementLinkId, g);

        // Check rights: WRITE current, WRITE future, READ target
        if (!AccessRights.canWrite(vUser, vCurrentParentSet, g)) {
          throw new WebApplicationException(Response.Status.FORBIDDEN);
        }
        if (!AccessRights.canWrite(vUser, vFutureParentSet, g)) {
          throw new WebApplicationException(Response.Status.FORBIDDEN);
        }
        if (!AccessRights.canRead(vUser, vTargetItemOrSet, g)) {
          throw new WebApplicationException(Response.Status.FORBIDDEN);
        }

        // Create new version of parent and remove the updated version of link, thus 'cutting' from parent
        OrientVertex vUpdatedCurrentParentSet = UpdateUtils.createNewVertexVersion(vCurrentParentSet, user, g);
        AccessRights.grantAccessRights(vUser, vUpdatedCurrentParentSet, DataModel.Enums.AccessRights.WRITE, g);
        OrientEdge eUpdatedLinkCurrent = AccessUtils.findLatestVersion(eLinkCurrent, g);
        eUpdatedLinkCurrent.remove();

        // Link new version of target with new parent
        switch ((String) vTargetItemOrSet.getProperty("@class")) {
          case DataModel.Classes.set:
            UpdateUtils.addSubsetToSet(vFutureParentSet, vTargetItemOrSet, vUser, g);
            break;
          default:
            UpdateUtils.addItemToSet(vFutureParentSet, vTargetItemOrSet, vUser, g);
            break;
        }

        g.commit();
      } catch (OConcurrentModificationException e) {
        log.warn("Database busy, retrying operation");
        retry = true;
      } finally {
        g.rollback();
        g.shutdown();
      }
    }

    return Response.ok().build();
  }

  @POST
  @Consumes(MediaType.APPLICATION_JSON)
  @Path("/import-recolnat-specimen")
  @Timed
  public Response importRecolnatSpecimen(final String input, @Context HttpServletRequest request) throws JSONException, InterruptedException {
    JSONObject params = new JSONObject(input);
    String session = SessionManager.getSessionId(request, true);
    String user = SessionManager.getUserLogin(session);
    String setId = params.getString("set");
    JSONArray specimens = params.getJSONArray("specimens");
//    String name = params.getString("name");
//    String recolnatSpecimenUuid = params.getString("recolnatSpecimenUUID");
//    JSONArray images = params.getJSONArray("images");
    String imageUrl = null;
    
    JSONObject response = new JSONObject();
    response.put("set", setId);
    JSONArray importedObjects = new JSONArray();

    boolean retry = true;
    while (retry) {
      retry = false;
      OrientGraph g = DatabaseAccess.getTransactionalGraph();
      try {
        OrientVertex vUser = AccessUtils.getUserByLogin(user, g);
        OrientVertex vSet = AccessUtils.getSet(setId, g);
//        OrientVertex vPublic = AccessUtils.getPublic(g);
        if (!AccessRights.canWrite(vUser, vSet, g)) {
          throw new WebApplicationException(Response.Status.FORBIDDEN);
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
          // Check if all images are on the main tree of the specimen
          for (int i = 0; i < images.length(); ++i) {
            JSONObject image = images.getJSONObject(i);
            imageUrl = image.getString("url");
            String thumbUrl = image.getString("thumburl");
            OrientVertex vImage = AccessUtils.getImageMainBranch(imageUrl, g);
            if (vImage == null) {
              BufferedImage img = ImageIO.read(new URL(imageUrl));
              UpdateUtils.addImageToSpecimen(vSpecimen, imageUrl, img.getWidth(), img.getHeight(), thumbUrl, g);
              g.commit();
            }
          }
          // Make branch of specimen tree
          vSpecimen = BranchUtils.branchSubTree(vSpecimen, vUser, g);
          vSpecimen.setProperties(DataModel.Properties.name, name);

          // Link specimen to set
          OrientEdge eLink = UpdateUtils.link(vSet, vSpecimen, DataModel.Links.containsItem, user, g);
          g.commit();
          
          // Add specimen and images to response
          JSONObject importedObject = new JSONObject();
          importedObject.put("specimen", (String) vSpecimen.getProperty(DataModel.Properties.id));
          importedObject.put("link", (String) eLink.getProperty(DataModel.Properties.id));
          JSONArray jImages = new JSONArray();
          Iterator<Vertex> itImages = vSpecimen.getVertices(Direction.OUT, DataModel.Links.hasImage).iterator();
          while(itImages.hasNext()) {
            OrientVertex vImage = (OrientVertex) itImages.next();
            if(AccessUtils.isLatestVersion(vImage)) {
              if(AccessRights.canRead(vUser, vImage, g)) {
                RecolnatImage image = new RecolnatImage(vImage, vUser, g);
                jImages.put(image.toJSON());
              }
            }
          }
          importedObject.put("images", jImages);
          importedObjects.put(importedObject);
        }
      } catch (OConcurrentModificationException e) {
        log.warn("Database busy, retrying operation");
        retry = true;
      } catch (IOException ex) {
        log.warn("Unable to load image " + imageUrl);
        throw new WebApplicationException("Unable to load image " + imageUrl, Status.BAD_REQUEST);
      } finally {
        g.rollback();
        g.shutdown();
        if (retry) {
          Thread.sleep(500);
        }
      }
    }
    
    response.put("linkedEntities", importedObjects);
    return Response.ok(response.toString(), MediaType.APPLICATION_JSON_TYPE).build();
  }

  @POST
  @Consumes(MediaType.APPLICATION_JSON)
  @Path("/import-external-image")
  @Timed
  public Response importExternalImage(final String input, @Context HttpServletRequest request) throws JSONException {
    JSONObject params = new JSONObject(input);
    String setId = params.getString("set");
    String imageUrl = params.getString("url");
    String imageName = params.getString("name");
    String session = SessionManager.getSessionId(request, true);
    String user = SessionManager.getUserLogin(session);

    boolean retry = true;
    while (retry) {
      retry = false;
      OrientGraph g = DatabaseAccess.getTransactionalGraph();
      try {
        OrientVertex vUser = AccessUtils.getUserByLogin(user, g);
        OrientVertex vSet = AccessUtils.getSet(setId, g);
        if (!AccessRights.canWrite(vUser, vSet, g)) {
          throw new WebApplicationException(Response.Status.FORBIDDEN);
        }

        // If image exists on main branch, branch it, otherwise create it and then branch it
        OrientVertex vImage = AccessUtils.getImageMainBranch(imageUrl, g);
        if (vImage == null) {
          // Get image height and width
          BufferedImage img = ImageIO.read(new URL(imageUrl));
          vImage = CreatorUtils.createImage(imageName, imageUrl, img.getWidth(), img.getHeight(), imageUrl, g);
//          OrientVertex vPublic = AccessUtils.getPublic(g);
          AccessRights.grantPublicAccessRights(vImage, DataModel.Enums.AccessRights.READ, g);
        }

        vImage = BranchUtils.branchSubTree(vImage, vUser, g);
        vImage.setProperty(DataModel.Properties.name, imageName);

        UpdateUtils.addItemToSet(vImage, vSet, vUser, g);

        g.commit();
      } catch (OConcurrentModificationException e) {
        log.warn("Database busy, retrying operation");
        retry = true;
      } catch (IOException ex) {
        log.warn("Unable to read image " + imageUrl);
        throw new WebApplicationException(Response.Status.BAD_REQUEST);
      } finally {
        g.rollback();
        g.shutdown();
      }
    }

    return Response.ok().build();
  }

  private boolean deleteElementFromSet(@NotNull String linkId, @NotNull String user) throws AccessDeniedException {
    boolean retry = true;
    boolean ret = true;

    while (retry) {
      retry = false;
      OrientGraph g = DatabaseAccess.getTransactionalGraph();
      try {
        OrientVertex vUser = AccessUtils.getUserByLogin(user, g);
        // Permissions checked internally

        ret = DeleteUtils.unlinkItemFromSet(linkId, vUser, g);
        g.commit();
      } catch (OConcurrentModificationException e) {
        log.warn("Database busy, retrying operation");
        retry = true;
      } finally {
        g.rollback();
        g.shutdown();
      }
    }
    
    return ret;
  }
}
