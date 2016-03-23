/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package org.dicen.recolnat.services.resources;

import com.codahale.metrics.annotation.Timed;
import com.google.common.base.Optional;
import com.orientechnologies.orient.core.exception.OConcurrentModificationException;
import com.tinkerpop.blueprints.Vertex;
import com.tinkerpop.blueprints.impls.orient.OrientEdge;
import com.tinkerpop.blueprints.impls.orient.OrientGraph;
import com.tinkerpop.blueprints.impls.orient.OrientVertex;
import fr.recolnat.database.model.DataModel;
import fr.recolnat.database.utils.AccessRights;
import fr.recolnat.database.utils.AccessUtils;
import fr.recolnat.database.utils.CreatorUtils;
import fr.recolnat.database.utils.DeleteUtils;
import fr.recolnat.database.utils.UpdateUtils;
import java.nio.file.AccessDeniedException;
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
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.dicen.recolnat.services.core.DatabaseAccess;
import org.dicen.recolnat.services.core.SessionManager;
import org.dicen.recolnat.services.core.metadata.StudySet;
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
  @Timed
  public Response getSet(@QueryParam("id") Optional<String> id, @Context HttpServletRequest request) throws JSONException {
    if (log.isTraceEnabled()) {
      log.trace("Receiving new GET request");
    }

    final String setId = id.or(DatabaseAccess.defaultRootWorkbenchId);
    String session = SessionManager.getSessionId(request, true);
    String user = SessionManager.getUserLogin(session);

    OrientGraph g = DatabaseAccess.getTransactionalGraph();
    StudySet set = null;
    try {
      OrientVertex vUser = AccessUtils.getUserByLogin(user, g);
      OrientVertex vSet = AccessUtils.getNodeById(setId, g);
      set = new StudySet(vSet, vUser, g);
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
      return Response.ok(set.toJSON(), MediaType.APPLICATION_JSON_TYPE).build();
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

    JSONObject ret = null;

    try {
      ret = this.createSet(name, parentSetId, user);
    } catch (AccessDeniedException e) {
      throw new WebApplicationException(e.getCause(), Response.Status.FORBIDDEN);
    }
    return Response.ok(ret, MediaType.APPLICATION_JSON_TYPE).build();
  }

  @POST
  @Consumes(MediaType.APPLICATION_JSON)
  @Path("/delete-element-from-set")
  @Timed
  public Response deleteElementFromSet(final String input, @Context HttpServletRequest request) throws JSONException {

    JSONObject params = new JSONObject(input);
    String linkSetToElementId = (String) params.get("linkId");
    String parentSetId = (String) params.get("container");
    String elementId = (String) params.get("target");
    String session = SessionManager.getSessionId(request, true);
    String user = SessionManager.getUserLogin(session);

    try {
      String ret = deleteElementFromSet(linkSetToElementId, elementId, parentSetId, user);
      if (ret != null) {
        throw new WebApplicationException(ret);
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
        if (vTarget.getProperty("@class").equals(DataModel.Classes.set)) {
          UpdateUtils.link(vSet, vTarget, DataModel.Links.containsSubSet, user, g);
        } else {
          UpdateUtils.link(vSet, vTarget, DataModel.Links.containsItem, user, g);
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
  @Path("/copy")
  @Timed
  public Response copy(final String input, @Context HttpServletRequest request) throws JSONException {
    JSONObject params = new JSONObject(input);
    String session = SessionManager.getSessionId(request, true);
    String user = SessionManager.getUserLogin(session);
    String elementToCopyId = params.getString("target");
    String currentParentId = params.getString("source");
    String futureParentId = params.getString("destination");
    boolean retry = true;
    
    while(retry) {
      retry = false;
      OrientGraph g = DatabaseAccess.getTransactionalGraph();
      try {
        OrientVertex vUser = AccessUtils.getUserByLogin(user, g);
        OrientVertex vSource = AccessUtils.getSet(currentParentId, g);
        OrientVertex vDestination = AccessUtils.getSet(futureParentId, g);
        OrientVertex vTarget = AccessUtils.getNodeById(elementToCopyId, g);
        
        // User must have write rights on destination, all other rights irrelevant as we are forking
        if(!AccessRights.canWrite(vUser, vDestination, g)) {
          throw new WebApplicationException(Response.Status.FORBIDDEN);
        }
        // Create a fork of the sub-tree starting at elementToCopy
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

    try {
      String ret = copy(elementToPasteId, futureParentId, user);
      if (ret != null) {
        throw new WebApplicationException(ret);
      }
      ret = deleteElementFromWorkbench(currentParentToElementLinkId, elementToPasteId, currentParentId, user);
      if (ret != null) {
        throw new WebApplicationException(ret);
      }
    } catch (AccessDeniedException e) {
      throw new WebApplicationException(e.getCause(), Response.Status.FORBIDDEN);
    }

    return Response.ok().build();
  }

  @POST
  @Consumes(MediaType.APPLICATION_JSON)
  @Path("/import")
  @Timed
  public Response importElement(final String input, @Context HttpServletRequest request) throws JSONException {

    JSONObject params = new JSONObject(input);
    String session = SessionManager.getSessionId(request, true);
    String user = SessionManager.getUserLogin(session);
    String workbenchId = params.getString("workbench");
    String imageUrl = params.getString("url");
    String thumburl = params.getString("thumburl");
    String catalog = params.getString("catalogNumber");
    String name = params.getString("name");
    String specimenId = params.getString("recolnatSpecimenUUID");

    try {
      String ret = runImport(imageUrl, thumburl, catalog, name, specimenId, workbenchId, user);
      if (ret != null) {
        throw new WebApplicationException(ret);
      }
    } catch (AccessDeniedException e) {
      throw new WebApplicationException(e.getCause(), Response.Status.FORBIDDEN);
    }

    return Response.ok().build();
  }

  @POST
  @Consumes(MediaType.APPLICATION_JSON)
  @Path("/import-item-to-set")
  @Timed
  public Response importItemToSet(final String input, @Context HttpServletRequest request) throws JSONException {

    JSONObject params = new JSONObject(input);
    String setId = params.getString("set");
    String itemUrl = params.getString("url");
    String itemName = params.getString("name");
    String session = SessionManager.getSessionId(request, true);
    String user = SessionManager.getUserLogin(session);

    try {
      String ret = this.importSheet(itemUrl, itemName, setId, user);
      if (ret != null) {
        throw new WebApplicationException(ret);
      }
    } catch (AccessDeniedException e) {
      throw new WebApplicationException(e.getCause(), Response.Status.FORBIDDEN);
    }

    return Response.ok().build();
  }

  /**
   *
   * @param name
   * @param parent
   * @param user
   * @return json containing 'workbench' (the new workbench id) and 'link' (the
   * id of the link to the parent)
   * @throws AccessDeniedException
   */
  private JSONObject createSet(@NotNull String name, @NotNull String parent, @NotNull String user) throws AccessDeniedException {
    boolean retry = true;
    JSONObject ret = new JSONObject();
    while (retry) {
      retry = false;
      OrientGraph g = DatabaseAccess.getTransactionalGraph();
      try {
        OrientVertex vUser = AccessUtils.getUserByLogin(user, g);
        OrientVertex vParent = AccessUtils.getNodeById(parent, g);

        // Check permissions
        if (!AccessRights.canWrite(vUser, vParent, g)) {
          throw new AccessDeniedException(null, null, "User not authorized to write in workbench " + parent);
        }

        // Create new workbench
        OrientVertex vSet = CreatorUtils.createSet(name, DataModel.Globals.SET_ROLE, g);

        // Add new workbench to parent
        OrientEdge eParentToChildLink = UpdateUtils.addSetToSet(parent, vSet, vUser, g);

        // Build return object
        ret.put("set", (String) vSet.getProperty(DataModel.Properties.id));
        ret.put("link", (String) eParentToChildLink.getProperty(DataModel.Properties.id));

        // Grant creator rights on new workbench
        AccessRights.grantAccessRights(vUser, vSet, DataModel.Enums.AccessRights.WRITE, g);
        g.commit();
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
    return ret;
  }

  private String copy(@NotNull String elementToCopyId, @NotNull String parentSetId, @NotNull String user) throws AccessDeniedException {
    boolean retry = true;
    while (retry) {
      retry = false;
      OrientGraph g = DatabaseAccess.getTransactionalGraph();
      try {
        OrientVertex vUser = AccessUtils.getUserByLogin(user, g);
        OrientVertex vFutureParentSet = AccessUtils.getSet(parentSetId, g);
        OrientVertex vChild = AccessUtils.getNodeById(elementToCopyId, g);

        // Check permissions
        if (!AccessRights.canWrite(vUser, vFutureParentSet, g)) {
          throw new AccessDeniedException(null, null, "User not authorized to write in workbench " + parentSetId);
        }

        if (!AccessRights.canWrite(vUser, vChild, g)) {
          throw new AccessDeniedException(null, null, "User not authorized to copy element " + elementToCopyId);
        }

        // Create link between workbench and child
        UpdateUtils.addItemToSet(vChild, vFutureParentSet, vUser, g);
        g.commit();
      } catch (OConcurrentModificationException e) {
        log.warn("Database busy, retrying operation");
        retry = true;
      } finally {
        g.rollback();
        g.shutdown();
      }
    }
    return null;

  }

  private String deleteElementFromSet(@NotNull String linkId, @NotNull String childId, @NotNull String parentSetId, @NotNull String user) throws AccessDeniedException {
    boolean retry = true;
    String ret = null;

    while (retry) {
      retry = false;
      OrientGraph g = DatabaseAccess.getTransactionalGraph();
      try {
        OrientVertex vUser = AccessUtils.getUserByLogin(user, g);
        OrientVertex vParentSet = AccessUtils.getSet(parentSetId, g);
        OrientVertex vElementToDelete = AccessUtils.getNodeById(childId, g);
        // Check permissions
        if (!AccessRights.canWrite(vUser, vParentSet, g)) {
          throw new AccessDeniedException(null, null, "User not authorized to delete in workbench " + parentWorkbenchId);
        }

        if (AccessRights.getAccessRights(vUser, vElementToDelete, g) != DataModel.Enums.AccessRights.WRITE) {
          throw new AccessDeniedException(null, null, "User not authorized to delete element " + childId);
        }

        ret = DeleteUtils.removeParentChildLink(linkId, childId, parentWorkbenchId, g);
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

  // TODO not finished, import from basket
  private String runImport(String url, String thumburl, String catalog, String name, String recolnatSpecimenId, String workbenchId, String user) throws AccessDeniedException {
    boolean retry = true;
    while (retry) {
      retry = false;
      OrientGraph g = DatabaseAccess.getTransactionalGraph();
      try {
        OrientVertex vUser = (OrientVertex) AccessUtils.getUserByLogin(user, g);
        OrientVertex vWorkbench = (OrientVertex) AccessUtils.getWorkbench(workbenchId, g);
        // Check access rights
        if (AccessRights.getAccessRights(vUser, vWorkbench, g) != DataModel.Enums.AccessRights.WRITE) {
          throw new AccessDeniedException(null, null, "User not authorized to create elements in workbench " + workbenchId);
        }

        OrientVertex vSheet = CreatorUtils.createHerbariumSheet(name, url, thumburl, recolnatSpecimenId, catalog, g);
        OrientVertex vRecolnatSpecimen = CreatorUtils.createOriginalSourceEntity(recolnatSpecimenId, "recolnat", "specimen", g);

        // Link new sheet to workbench
        UpdateUtils.addItemToWorkbench(vSheet, vWorkbench, vUser, g);

        // Grant creator rights on sheet
        AccessRights.grantAccessRights(vUser, vSheet, DataModel.Enums.AccessRights.WRITE, g);

        // Link sheet to original source
        UpdateUtils.addOriginalSource(vSheet, vRecolnatSpecimen, vUser, g);

        g.commit();
      } catch (OConcurrentModificationException e) {
        log.warn("Database busy, retrying operation");
        retry = true;
      } finally {
        g.rollback();
        g.shutdown();
      }

    }

    return null;
  }

  private String importSheet(String url, String name, String workbench, String user) throws AccessDeniedException {
    boolean retry = true;
    while (retry) {
      retry = false;
      OrientGraph g = DatabaseAccess.getTransactionalGraph();
      try {
        OrientVertex vUser = (OrientVertex) AccessUtils.getUserByLogin(user, g);
        Vertex vWorkbench = AccessUtils.getWorkbench(workbench, g);
        // Check access rights
        if (AccessRights.getAccessRights(vUser, vWorkbench, g) != DataModel.Enums.AccessRights.WRITE) {
          throw new AccessDeniedException(null, null, "User not authorized to create elements in workbench " + workbench);
        }

        // Create new sheet
        OrientVertex vSheet = CreatorUtils.createHerbariumSheet(name, url, "No ReColNat Id", "No Catalog Reference", g);

        // Link new sheet to workbench
        UpdateUtils.addItemToWorkbench(vSheet, workbench, vUser, g);

        // Grant creator rights on sheet
        AccessRights.grantAccessRights(vUser, vSheet, DataModel.Enums.AccessRights.WRITE, g);

        g.commit();
      } catch (OConcurrentModificationException e) {
        log.warn("Database busy, retrying operation");
        retry = true;
      } finally {
        g.rollback();
        g.shutdown();
      }
    }
    return null;
  }

}
