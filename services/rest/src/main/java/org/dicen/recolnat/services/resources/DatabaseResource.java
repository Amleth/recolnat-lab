package org.dicen.recolnat.services.resources;

import com.codahale.metrics.annotation.Timed;
import com.orientechnologies.orient.core.exception.OConcurrentModificationException;
import com.tinkerpop.blueprints.Direction;
import com.tinkerpop.blueprints.Edge;
import com.tinkerpop.blueprints.Vertex;
import com.tinkerpop.blueprints.impls.orient.OrientEdge;
import com.tinkerpop.blueprints.impls.orient.OrientGraph;
import com.tinkerpop.blueprints.impls.orient.OrientGraphNoTx;
import com.tinkerpop.blueprints.impls.orient.OrientVertex;
import fr.recolnat.database.model.DataModel;
import fr.recolnat.database.model.StructureBuilder;
import fr.recolnat.database.utils.AccessRights;
import fr.recolnat.database.utils.AccessUtils;
import fr.recolnat.database.utils.DatabaseTester;
import fr.recolnat.database.utils.DeleteUtils;
import java.nio.file.AccessDeniedException;
import java.util.Iterator;
import java.util.logging.Level;
import javax.servlet.http.HttpServletRequest;
import org.codehaus.jettison.json.JSONException;
import org.dicen.recolnat.services.core.DatabaseAccess;
import org.dicen.recolnat.services.core.Globals;

import javax.ws.rs.*;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import org.codehaus.jettison.json.JSONObject;
import org.dicen.recolnat.services.core.SessionManager;
import org.dicen.recolnat.services.core.logbook.Log;
import org.dicen.recolnat.services.core.metadata.AbstractObjectMetadata;
import org.dicen.recolnat.services.core.metadata.SheetMetadata;
import org.dicen.recolnat.services.core.metadata.WorkbenchMetadata;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Created by Dmitri Voitsekhovitch (dvoitsekh@gmail.com) on 20/10/15.
 */
@Path("/database")
@Produces(MediaType.APPLICATION_JSON)
public class DatabaseResource {

  private static final Logger log = LoggerFactory.getLogger(DatabaseResource.class);

  @POST
  @Path("/create-structure")
  @Timed
  public String createStructure(final String input) throws JSONException {
    OrientGraphNoTx gntx = DatabaseAccess.databaseConnector.getNonTransactionalGraph();
    try {
      StructureBuilder.createRecolnatDataModel(gntx);
      StructureBuilder.createDefaultNodes(gntx);
      gntx.shutdown(false, true);
    } catch (IllegalAccessException e) {
      throw new WebApplicationException(e);
    }
    return Globals.OK;
  }

  @GET
  @Path("/get-data")
  @Timed
  public Response getData(@QueryParam("id") String id, @Context HttpServletRequest request) {
    if (log.isTraceEnabled()) {
      log.trace("Entering with id=" + id);
    }
    String session = SessionManager.getSessionId(request, true);
    String user = SessionManager.getUserLogin(session);
    JSONObject metadata = null;

    OrientGraph g = DatabaseAccess.getTransactionalGraph();
    try {
      OrientVertex vUser = (OrientVertex) AccessUtils.getUserByLogin(user, g);
      OrientVertex v = (OrientVertex) AccessUtils.getNodeById(id, g);
      if (v != null) {
        if (!AccessRights.canRead(vUser, v, g)) {
          throw new WebApplicationException("User not authorized to access data", Response.Status.UNAUTHORIZED);
        }

        metadata = this.getVertexMetadata(v, vUser, g).toJSON();

      } else {
        OrientEdge e = (OrientEdge) AccessUtils.getEdgeById(id, g);
        // Perhaps we should check access rights on both sides of the edge ?
        if (e != null) {
          metadata = this.getEdgeMetadata(e, vUser, g).toJSON();
        } else {
          throw new WebApplicationException("Object not found", Response.Status.NOT_FOUND);
        }
      }
    } catch (JSONException ex) {
      log.error("Unable to put element in JSON");
      throw new WebApplicationException("Server error while writing response", Response.Status.INTERNAL_SERVER_ERROR);
    } finally {
      g.rollback();
      g.shutdown();
    }

    if (metadata == null) {
      throw new WebApplicationException("No metadata", Response.Status.INTERNAL_SERVER_ERROR);
    } else {
      return Response.ok(metadata.toString(), MediaType.APPLICATION_JSON_TYPE).build();
    }
  }

  /**
   * To be deletable: - the user must have write access to the object; - sheets
   * are not deletable; - the object must not be shared with a group or with
   * PUBLIC.
   *
   * @param input
   * @param request
   * @return
   */
  @POST
  @Consumes(MediaType.APPLICATION_JSON)
  @Path("/remove")
  @Timed
  public Response remove(final String input, @Context HttpServletRequest request) {
    String session = SessionManager.getSessionId(request, true);
    String user = SessionManager.getUserLogin(session);
    String idOfElementToDelete = null;
    boolean retry = true;

    try {
      JSONObject jsonInput = new JSONObject(input);
      idOfElementToDelete = jsonInput.getString("id");
    } catch (JSONException ex) {
      log.error("Unable to serialize input data as JSON: " + input);
      throw new WebApplicationException("Input error", Response.Status.BAD_REQUEST);
    }

    while (retry) {
      retry = false;
      OrientGraph g = DatabaseAccess.getTransactionalGraph();
      try {
        OrientVertex vUser = (OrientVertex) AccessUtils.getUserByLogin(user, g);

        // Checking deletability is relegated to the method
        boolean isDeleted = DeleteUtils.delete(idOfElementToDelete, vUser, g);
        if (!isDeleted) {
          throw new WebApplicationException("User " + user + " is not allowed to delete object " + idOfElementToDelete, Response.Status.FORBIDDEN);
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

    return Response.ok("", MediaType.APPLICATION_JSON_TYPE).build();
  }

  @POST
  @Consumes(MediaType.APPLICATION_JSON)
  @Path("/get-change-log")
  @Timed
  public Response getChangeLog(final String input, @Context HttpServletRequest request) throws JSONException {
    String session = SessionManager.getSessionId(request, true);
    String user = SessionManager.getUserLogin(session);

    String object = null;
    Long beginDate = null;
    Long endDate = null;

    JSONObject params = null;
    try {
      params = new JSONObject(input);
    } catch (JSONException e) {
      // Optional parameters not found. Continue.
    }

    if (params != null) {
      try {
        object = params.getString("object");
      } catch (JSONException e) {
        // Optional parameters not found. Continue.
      }

      try {
        beginDate = params.getLong("begin");
      } catch (JSONException e) {
        // Optional parameters not found. Continue.
        beginDate = Long.MIN_VALUE;
      }

      try {
        endDate = params.getLong("end");
      } catch (JSONException e) {
        // Optional parameters not found. Continue.
        endDate = Long.MAX_VALUE;
      }
    }

    if (object == null) {
      throw new WebApplicationException("No 'object' in request.", Response.Status.BAD_REQUEST);
    }

    if (log.isDebugEnabled()) {
      log.debug("begin=" + beginDate + " end=" + endDate);
    }

    OrientGraph g = DatabaseAccess.getTransactionalGraph();
    try {
      try {
        Log l = new Log(object, beginDate, endDate, user, g);
        return Response.ok(l.toJSON(), MediaType.APPLICATION_JSON_TYPE).build();
      } catch (AccessDeniedException ex) {
        log.info("Access denied to user", ex);
        throw new WebApplicationException("Access denied", Response.Status.UNAUTHORIZED);
      }
    } finally {
      g.rollback();
      g.shutdown();
    }
  }

  private AbstractObjectMetadata getVertexMetadata(OrientVertex v, OrientVertex vUser, OrientGraph g) throws JSONException {
    String cl = v.getProperty("@class");
    switch (cl) {
      case DataModel.Classes.set:
        return new WorkbenchMetadata(v, vUser, g);
//      case DataModel.Classes.herbariumSheet:
//        return new SheetMetadata(v, vUser, g);
      default:
        log.warn("No specific handler for extracting metadata from vertex class " + cl);
        return new AbstractObjectMetadata(v, vUser, g);
    }
  }

  private AbstractObjectMetadata getEdgeMetadata(OrientEdge e, OrientVertex vUser, OrientGraph g) {
    String cl = e.getProperty("@class");
    switch (cl) {
      default:
        log.warn("No specific handler for extracting metadata from edge class " + cl);
        return new AbstractObjectMetadata(e, vUser, g);
    }
  }
}
