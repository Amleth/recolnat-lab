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
import fr.recolnat.database.utils.UpdateUtils;
import fr.recolnat.database.utils.DeleteUtils;
import java.nio.file.AccessDeniedException;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.dicen.recolnat.services.core.DatabaseAccess;
import org.dicen.recolnat.services.core.Globals;
import org.dicen.recolnat.services.core.workbench.WorkbenchGraphFocus;
import org.dicen.recolnat.services.core.workbench.WorkbenchList;
import org.glassfish.jersey.client.ClientResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.validation.constraints.NotNull;
import javax.ws.rs.*;
import javax.ws.rs.client.Client;
import javax.ws.rs.client.ClientBuilder;
import javax.ws.rs.client.WebTarget;
import javax.ws.rs.core.MediaType;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.logging.Level;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.Response;
import org.dicen.recolnat.services.core.SessionManager;

/**
 * Created by Dmitri Voitsekhovitch (dvoitsekh@gmail.com) on 24/04/15.
 */
@Path("/virtual-workbench")
@Produces(MediaType.APPLICATION_JSON)
public class VirtualWorkbenchRESTResource {

  private final static Logger log = LoggerFactory.getLogger(VirtualWorkbenchRESTResource.class);

  public VirtualWorkbenchRESTResource() {
    if (log.isTraceEnabled()) {
      log.trace("New resource created");
    }
  }

  @GET
  @Timed
  public String getWorkbench(@QueryParam("id") Optional<String> id, @Context HttpServletRequest request) throws JSONException {
    if (log.isTraceEnabled()) {
      log.trace("Receiving new GET request");
    }
    
    final String workbenchId = id.or(DatabaseAccess.defaultRootWorkbenchId);
    String session = SessionManager.getSessionId(request, true);
    String user = SessionManager.getUserLogin(session);

    OrientGraph g = DatabaseAccess.getTransactionalGraph();
    WorkbenchGraphFocus wbG = null;
    try {
      OrientVertex vUser = (OrientVertex) AccessUtils.getUserByLogin(user, g);
      wbG = new WorkbenchGraphFocus(workbenchId, vUser, g);
    } catch (AccessDeniedException ex) {
      throw new WebApplicationException("User not authorized to access resource " + workbenchId, Response.Status.FORBIDDEN);
    } finally {
      g.rollback();
      g.shutdown();
    }
    if (wbG == null) {
      throw new WebApplicationException("Workbench not found " + workbenchId);
    }
    try {
      return wbG.toJSON().toString();
    } catch (JSONException e) {
      log.error("Could not convert message to JSON.", e);
      throw new WebApplicationException("Could not serialize workbench as JSON " + workbenchId);
    }
  }

  @GET
  @Path("/list-user-workbenches")
  @Timed
  public String listUserWorkbenches(@Context HttpServletRequest request) throws JSONException {
    String session = SessionManager.getSessionId(request, true);
    String user = SessionManager.getUserLogin(session);
    WorkbenchList response = this.getWorkbenchesList(user);
    return response.toJSON().toString();
  }

  @POST
  @Consumes(MediaType.APPLICATION_JSON)
  @Path("/create-new-workbench")
  @Timed
  public Response createNewWorkbench(final String input, @Context HttpServletRequest request) throws JSONException {
    if (log.isTraceEnabled()) {
      log.trace("Entering createNewWorkbench");
    }
    JSONObject params = new JSONObject(input);
    String session = SessionManager.getSessionId(request, true);
    String user = SessionManager.getUserLogin(session);
    String name = (String) params.get("name");
    String parent = (String) params.get("parent");
    
    JSONObject ret = null;

    try {
      ret = this.createNewWorkbench(name, parent, user);
    } catch (AccessDeniedException e) {
      throw new WebApplicationException(e.getCause(), Response.Status.FORBIDDEN);
    }
    return Response.ok(ret.toString(), MediaType.APPLICATION_JSON_TYPE).build();
  }

  @POST
  @Consumes(MediaType.APPLICATION_JSON)
  @Path("/delete-workbench")
  @Timed
  public String deleteWorkbench(final String input, @Context HttpServletRequest request) throws JSONException {

    JSONObject params = new JSONObject(input);
    String linkId = (String) params.get("linkId");
    String parent = (String) params.get("container");
    String target = (String) params.get("target");
    String session = SessionManager.getSessionId(request, true);
    String user = SessionManager.getUserLogin(session);

    try {
      String ret = deleteElementFromWorkbench(linkId, target, parent, user);
      if (ret != null) {
        throw new WebApplicationException(ret);
      }
    } catch (AccessDeniedException e) {
      throw new WebApplicationException(e.getCause(), Response.Status.FORBIDDEN);
    }
    return Globals.OK;
  }

  @POST
  @Consumes(MediaType.APPLICATION_JSON)
  @Path("/copypaste")
  @Timed
  public String copyPaste(final String input, @Context HttpServletRequest request) throws JSONException {

    JSONObject params = new JSONObject(input);
    String session = SessionManager.getSessionId(request, true);
    String user = SessionManager.getUserLogin(session);
    String elementToCopyId = params.getString("target");
    String futureParentId = params.getString("destination");

    try {
      String ret = copyPaste(elementToCopyId, futureParentId, user);
      if (ret != null) {
        throw new WebApplicationException(ret);
      }
    } catch (AccessDeniedException e) {
      throw new WebApplicationException(e.getCause(), Response.Status.FORBIDDEN);
    }
    return Globals.OK;
  }

  @POST
  @Consumes(MediaType.APPLICATION_JSON)
  @Path("/cutpaste")
  @Timed
  public String cutPaste(final String input, @Context HttpServletRequest request) throws JSONException {

    JSONObject params = new JSONObject(input);
    String session = SessionManager.getSessionId(request, true);
    String user = SessionManager.getUserLogin(session);
    String elementToPasteId = params.getString("target");
    String linkId = (String) params.get("linkId");
    String previousParentId = params.getString("source");
    String futureParentId = params.getString("destination");

    try {
      String ret = copyPaste(elementToPasteId, futureParentId, user);
      if (ret != null) {
        throw new WebApplicationException(ret);
      }
      ret = deleteElementFromWorkbench(linkId, elementToPasteId, previousParentId, user);
      if (ret != null) {
        throw new WebApplicationException(ret);
      }
    } catch (AccessDeniedException e) {
      throw new WebApplicationException(e.getCause(), Response.Status.FORBIDDEN);
    }

    return Globals.OK;
  }

  @POST
  @Consumes(MediaType.APPLICATION_JSON)
  @Path("/import")
  @Timed
  public String importElement(final String input, @Context HttpServletRequest request) throws JSONException {

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

    return Globals.OK;
  }

  @POST
  @Consumes(MediaType.APPLICATION_JSON)
  @Path("/import-item-to-workbench")
  @Timed
  public String importItemToWorkbench(final String input, @Context HttpServletRequest request) throws JSONException {

    JSONObject params = new JSONObject(input);
    String workbenchId = params.getString("workbench");
    String itemUrl = params.getString("url");
    String itemName = params.getString("name");
    String session = SessionManager.getSessionId(request, true);
    String user = SessionManager.getUserLogin(session);

    try {
      String ret = this.importSheet(itemUrl, itemName, workbenchId, user);
      if (ret != null) {
        throw new WebApplicationException(ret);
      }
    } catch (AccessDeniedException e) {
      throw new WebApplicationException(e.getCause(), Response.Status.FORBIDDEN);
    }

    return Globals.OK;
  }

  @POST
  @Consumes(MediaType.APPLICATION_JSON)
  @Path("/add-items-to-workbench")
  @Timed
  public String addItemsToWorkbench(final String input, @Context HttpServletRequest request) throws JSONException {
    List<String> elementsToImportIds = new ArrayList<String>();

    JSONObject params = new JSONObject(input);
    String session = SessionManager.getSessionId(request, true);
    String user = SessionManager.getUserLogin(session);
    String workbenchId = params.getString("destination");
    JSONArray jRegions = params.getJSONArray("regions");
    for (int i = 0; i < jRegions.length(); ++i) {
      elementsToImportIds.add(jRegions.getString(i));
    }

    Iterator<String> itItems = elementsToImportIds.iterator();
    while (itItems.hasNext()) {
      try {
        String ret = copyPaste(itItems.next(), workbenchId, user);
        if (ret != null) {
          throw new WebApplicationException(ret);
        }
      } catch (AccessDeniedException e) {
        throw new WebApplicationException(e.getCause(), Response.Status.FORBIDDEN);
      }
    }
    return Globals.OK;
  }

  /**
   * 
   * @param name
   * @param parent
   * @param user
   * @return json containing 'workbench' (the new workbench id) and 'link' (the id of the link to the parent)
   * @throws AccessDeniedException 
   */
  private JSONObject createNewWorkbench(@NotNull String name, @NotNull String parent, @NotNull String user) throws AccessDeniedException {
    boolean retry = true;
    JSONObject ret = new JSONObject();
    while (retry) {
      retry = false;
      OrientGraph g = DatabaseAccess.getTransactionalGraph();
      try {
        OrientVertex vUser = (OrientVertex) AccessUtils.getUserByLogin(user, g);
        Vertex vParent = AccessUtils.getNodeById(parent, g);

        // Check permissions
        if (AccessRights.getAccessRights(vUser, vParent, g) != DataModel.Enums.AccessRights.WRITE) {
          throw new AccessDeniedException(null, null, "User not authorized to write in workbench " + parent);
        }

        // Create new workbench
        OrientVertex vWorkbench = (OrientVertex) CreatorUtils.createWorkbenchContent(name, "workbench", g);

        // Add new workbench to parent
        OrientEdge eParentToChildLink = UpdateUtils.addWorkbenchToWorkbench(parent, vWorkbench, vUser, g);
        
        // Build return object
        ret.put("workbench", (String) vWorkbench.getProperty(DataModel.Properties.id));
        ret.put("link", (String) eParentToChildLink.getProperty(DataModel.Properties.id));

        // Grant creator rights on new workbench
        AccessRights.grantAccessRights(vUser, vWorkbench, DataModel.Enums.AccessRights.WRITE, g);
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

  private String copyPaste(@NotNull String elementToCopyId, @NotNull String parentWorkbenchId, @NotNull String user) throws AccessDeniedException {
    boolean retry = true;
    while (retry) {
      retry = false;
      OrientGraph g = DatabaseAccess.getTransactionalGraph();
      try {
        OrientVertex vUser = (OrientVertex) AccessUtils.getUserByLogin(user, g);
        OrientVertex vWorkbench = (OrientVertex) AccessUtils.getWorkbench(parentWorkbenchId, g);
        OrientVertex vChild = (OrientVertex) AccessUtils.getNodeById(elementToCopyId, g);

        // Check permissions
        if (AccessRights.getAccessRights(vUser, vWorkbench, g) != DataModel.Enums.AccessRights.WRITE) {
          throw new AccessDeniedException(null, null, "User not authorized to write in workbench " + parentWorkbenchId);
        }

        if (AccessRights.getAccessRights(vUser, vChild, g) != DataModel.Enums.AccessRights.WRITE) {
          throw new AccessDeniedException(null, null, "User not authorized to copy element " + elementToCopyId);
        }

        // Create link between workbench and child
        UpdateUtils.addItemToWorkbench(vChild, vWorkbench, vUser, g);
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

  private String deleteElementFromWorkbench(@NotNull String linkId, @NotNull String childId, @NotNull String parentWorkbenchId, @NotNull String user) throws AccessDeniedException {
    boolean retry = true;
    String ret = null;

    while (retry) {
      retry = false;
      OrientGraph g = DatabaseAccess.getTransactionalGraph();
      try {
        Vertex vUser = AccessUtils.getUserByLogin(user, g);
        Vertex vWorkbench = AccessUtils.getWorkbench(parentWorkbenchId, g);
        Vertex vElementToDelete = AccessUtils.getNodeById(childId, g);
        // Check permissions
        if (AccessRights.getAccessRights(vUser, vWorkbench, g) != DataModel.Enums.AccessRights.WRITE) {
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
    while(retry) {
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

  private WorkbenchList getWorkbenchesList(String user) {
    OrientGraph g = DatabaseAccess.getTransactionalGraph();
    try {
      OrientVertex vUser = (OrientVertex) AccessUtils.getUserByLogin(user, g);
      return new WorkbenchList(vUser, g);
    } finally {
      g.rollback();
      g.shutdown();
    }
  }
}
