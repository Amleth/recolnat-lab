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
import fr.recolnat.database.model.impl.AbstractObject;
import fr.recolnat.database.model.impl.Annotation;
import fr.recolnat.database.model.impl.MeasureStandard;
import fr.recolnat.database.model.impl.OriginalSource;
import fr.recolnat.database.model.impl.PointOfInterest;
import fr.recolnat.database.model.impl.RecolnatImage;
import fr.recolnat.database.model.impl.RegionOfInterest;
import fr.recolnat.database.model.impl.SetView;
import fr.recolnat.database.model.impl.Specimen;
import fr.recolnat.database.model.impl.Study;
import fr.recolnat.database.model.impl.StudySet;
import fr.recolnat.database.model.impl.TrailOfInterest;
import fr.recolnat.database.utils.AccessRights;
import fr.recolnat.database.utils.AccessUtils;
import fr.recolnat.database.utils.CreatorUtils;
import fr.recolnat.database.utils.DatabaseTester;
import fr.recolnat.database.utils.DeleteUtils;
import fr.recolnat.database.utils.UpdateUtils;
import java.nio.file.AccessDeniedException;
import java.util.Iterator;
import java.util.List;
import java.util.logging.Level;
import javax.servlet.http.HttpServletRequest;
import org.codehaus.jettison.json.JSONException;
import org.dicen.recolnat.services.core.DatabaseAccess;
import org.dicen.recolnat.services.core.Globals;

import javax.ws.rs.*;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONObject;
import org.dicen.recolnat.services.core.SessionManager;
import org.dicen.recolnat.services.core.logbook.Log;
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
//    OrientGraphNoTx gntx = DatabaseAccess.databaseConnector.getNonTransactionalGraph();
    OrientGraphNoTx gntx = DatabaseAccess.factory.getNoTx();
    try {
      StructureBuilder.createRecolnatDataModel(gntx);
      StructureBuilder.createDefaultNodes(gntx);
      gntx.shutdown(false, true);
    } catch (IllegalAccessException e) {
      throw new WebApplicationException(e);
    }
    return Globals.OK;
  }

  @POST
  @Path("/get-data")
  @Timed
  public Response getData(final String input, @Context HttpServletRequest request) {
    if (log.isTraceEnabled()) {
      log.trace("Entering with id=" + input);
    }
    String session = SessionManager.getSessionId(request, true);
    String user = SessionManager.getUserLogin(session);
    JSONArray metadata = new JSONArray();

    OrientGraph g = DatabaseAccess.getTransactionalGraph();
    try {
      OrientVertex vUser = (OrientVertex) AccessUtils.getUserByLogin(user, g);
      JSONArray ids = new JSONArray(input);
      for(int i = 0; i < ids.length(); ++i) {
        String id = ids.getString(i);
        OrientVertex v = (OrientVertex) AccessUtils.getNodeById(id, g);
        if (v != null) {
        if (!AccessRights.canRead(vUser, v, g)) {
          throw new WebApplicationException("User not authorized to access data", Response.Status.UNAUTHORIZED);
        }
        
        metadata.put(this.getVertexMetadata(v, vUser, g).toJSON());

      } else {
        OrientEdge e = (OrientEdge) AccessUtils.getEdgeById(id, g);
        // Perhaps we should check access rights on both sides of the edge ?
        if (e != null) {
          metadata.put(this.getEdgeMetadata(e, vUser, g).toJSON());
        } else {
          throw new WebApplicationException("Object not found", Response.Status.NOT_FOUND);
        }
      }
      }
    } catch (JSONException ex) {
      log.error("Unable to put element in JSON");
      throw new WebApplicationException("Server error while writing response", Response.Status.INTERNAL_SERVER_ERROR);
    } catch (AccessDeniedException ex) {
      throw new WebApplicationException(Response.Status.FORBIDDEN);
    } finally {
      g.rollback();
      g.shutdown();
    }

    return Response.ok(metadata.toString(), MediaType.APPLICATION_JSON_TYPE).build();
//    if (metadata == null) {
//      throw new WebApplicationException("No metadata", Response.Status.INTERNAL_SERVER_ERROR);
//    } else {
//      
//    }
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
  
  @POST
  @Consumes(MediaType.APPLICATION_JSON)
  @Path("/add-annotation")
  @Timed
  public String addAnnotation(final String input, @Context HttpServletRequest request) throws JSONException {
    if (log.isTraceEnabled()) {
      log.trace("Entering /add-annotation");
    }
    JSONObject params = new JSONObject(input);
    String session = SessionManager.getSessionId(request, true);
    String user = SessionManager.getUserLogin(session);
    String parentObjectId = params.getString("entity");
    String annotationText = params.getString("text");
    
    boolean retry = true;
    while(retry) {
      retry = false;
      OrientGraph g = DatabaseAccess.getTransactionalGraph();
      try {
        OrientVertex vUser = AccessUtils.getUserByLogin(user, g);
        OrientVertex vEntity = AccessUtils.getNodeById(parentObjectId, g);
        // Check write rights
        if(!AccessRights.canWrite(vUser, vEntity, g)) {
          throw new WebApplicationException("User does not have edit rights on entity " + parentObjectId, Response.Status.FORBIDDEN);
        }
        // Create annotation of the right type
        OrientVertex vAnnotation = CreatorUtils.createAnnotation(annotationText, g);
        // Link annotation to polygon
        UpdateUtils.linkAnnotationToEntity(vAnnotation, vEntity, (String) vUser.getProperty(DataModel.Properties.id), g);
        // Link annotation to creator user
        UpdateUtils.addCreator(vAnnotation, vUser , g);
        // Grant creator rights
        AccessRights.grantAccessRights(vUser, vAnnotation, DataModel.Enums.AccessRights.WRITE, g);
        g.commit();
      }
      catch(OConcurrentModificationException e) {
        log.warn("Database busy, retrying operation");
        retry = true;
      }
      finally {
        if (!g.isClosed()) {
          g.rollback();
          g.shutdown();
        }
      }
    }

    return Globals.OK;
  }
  
  @POST
  @Consumes(MediaType.APPLICATION_JSON)
  @Path("/edit-properties")
  @Timed
  public Response editProperties(final String input, @Context HttpServletRequest request) throws JSONException {
    if (log.isTraceEnabled()) {
      log.trace("Entering /edit-properties");
    }
    JSONObject params = new JSONObject(input);
    String session = SessionManager.getSessionId(request, true);
    String user = SessionManager.getUserLogin(session);
    String entityId = params.getString("entity");
    JSONArray properties = params.getJSONArray("properties");
    
    boolean retry = true;
    while(retry) {
      retry = false;
      OrientGraph g = DatabaseAccess.getTransactionalGraph();
      try {
        OrientVertex vUser = AccessUtils.getUserByLogin(user, g);
        OrientVertex vEntity = AccessUtils.getNodeById(entityId, g);
        // Check write rights
        if(!AccessRights.canWrite(vUser, vEntity, g)) {
          throw new WebApplicationException("User does not have edit rights on entity " + entityId, Response.Status.FORBIDDEN);
        }
        
        OrientVertex vNewEntityVersion = UpdateUtils.createNewVertexVersion(vEntity, (String) vUser.getProperty(DataModel.Properties.id), g);
        for(int i = 0; i < properties.length(); ++i) {
          vNewEntityVersion.setProperty(properties.getJSONObject(i).getString("key"), properties.getJSONObject(i).getString("value"));
        }
        g.commit();
      }
      catch(OConcurrentModificationException e) {
        log.warn("Database busy, retrying operation");
        retry = true;
      }
      finally {
        if (!g.isClosed()) {
          g.rollback();
          g.shutdown();
        }
      }
    }

    return Response.ok(input, MediaType.APPLICATION_JSON_TYPE).build();
  }

  private AbstractObject getVertexMetadata(OrientVertex v, OrientVertex vUser, OrientGraph g) throws JSONException, AccessDeniedException {
    String cl = v.getProperty("@class");
    switch (cl) {
      case DataModel.Classes.set:
        return new StudySet(v, vUser, g);
      case DataModel.Classes.originalSource:
        return new OriginalSource(v, vUser, g);
      case DataModel.Classes.pointOfInterest:
        return new PointOfInterest(v, vUser, g);
      case DataModel.Classes.regionOfInterest:
        return new RegionOfInterest(v, vUser, g);
      case DataModel.Classes.trailOfInterest:
        return new TrailOfInterest(v, vUser, g);
      case DataModel.Classes.annotation:
        return new Annotation(v, vUser, g);
      case DataModel.Classes.image:
        return new RecolnatImage(v, vUser, g);
      case DataModel.Classes.measureStandard:
        return new MeasureStandard(v, vUser, g);
      case DataModel.Classes.study:
        return new Study(v, vUser, g);
      case DataModel.Classes.specimen:
        return new Specimen(v, vUser, g);
      case DataModel.Classes.setView:
        return new SetView(v, vUser, g);
      default:
        log.warn("No specific handler for extracting metadata from vertex class " + cl);
        return new AbstractObject(v, vUser, g);
    }
  }

  private AbstractObject getEdgeMetadata(OrientEdge e, OrientVertex vUser, OrientGraph g) {
    String cl = e.getProperty("@class");
    switch (cl) {
      default:
        log.warn("No specific handler for extracting metadata from edge class " + cl);
        return new AbstractObject(e, vUser, g);
    }
  }
}
