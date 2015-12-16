package org.dicen.recolnat.services.resources;

import org.dicen.recolnat.services.core.image.RecolnatImage;
import com.codahale.metrics.annotation.Timed;
import com.orientechnologies.orient.core.exception.OConcurrentModificationException;
import com.tinkerpop.blueprints.Vertex;
import com.tinkerpop.blueprints.impls.orient.OrientGraph;
import com.tinkerpop.blueprints.impls.orient.OrientVertex;
import fr.recolnat.database.model.DataModel;
import fr.recolnat.database.utils.AccessRights;
import fr.recolnat.database.utils.AccessUtils;
import fr.recolnat.database.utils.CreatorUtils;
import fr.recolnat.database.utils.UpdateUtils;
import java.nio.file.AccessDeniedException;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.dicen.recolnat.services.core.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.ws.rs.*;
import javax.ws.rs.Path;
import javax.ws.rs.core.MediaType;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;

/**
 * Created by Dmitri Voitsekhovitch (dvoitsekh@gmail.com) on 21/05/15.
 */
@Path("/image-editor")
@Produces(MediaType.APPLICATION_JSON)
public class ImageEditorRESTResource {
  private final static Logger log = LoggerFactory.getLogger(ImageEditorRESTResource.class);
  private static final Map<String, String> userToActiveData = new ConcurrentHashMap<String, String>();

  @POST
  @Consumes(MediaType.APPLICATION_JSON)
  @Timed
  public String getEntity(final String input, @Context HttpServletRequest request) throws JSONException {
    if (log.isTraceEnabled()) {
      log.trace("Requesting new image");
    }
    
    String session = SessionManager.getSessionId(request, true);
    JSONObject params = new JSONObject(input);
    String id = params.getString("id");
    String user = SessionManager.getUserLogin(session);

    OrientGraph g = DatabaseAccess.getTransactionalGraph();
    RecolnatImage img = null;
    try {
      OrientVertex vUser = (OrientVertex) AccessUtils.getUserByLogin(user, g);
      img = new RecolnatImage(id, vUser, g);
    }
    catch (AccessDeniedException e) {
      throw new WebApplicationException("Access to image " + id + " not authorized for current user", Status.FORBIDDEN);
    }
    finally {
      if(!g.isClosed()) {
        g.rollback();
        g.shutdown(false);
      }
    }
    try {
      return img.toJSON().toString();
    } catch (JSONException e) {
      log.error("Unable to convert object to JSON for id " + id);
      throw new WebApplicationException(e, Status.INTERNAL_SERVER_ERROR);
    }
  }

  @POST
  @Consumes(MediaType.APPLICATION_JSON)
  @Path("/create-polygon")
  @Timed
  public String createPolygon(final String input, @Context HttpServletRequest request) throws JSONException {
    if(log.isTraceEnabled()) {
      log.trace("Entering /create-polygon");
    }

    if(log.isDebugEnabled()) {
      log.debug("Input received " + input);
    }
    // Retrieve params
    JSONObject params = new JSONObject(input);
    String session = SessionManager.getSessionId(request, true);
    String user = SessionManager.getUserLogin(session);
    String parent = params.getString("parent");
    JSONObject message = params.getJSONObject("payload");
    Double area = message.getDouble("area");
    Double perimeter = message.getDouble("perimeter");
    List<List<Integer>> polygon = new ArrayList<List<Integer>>();
    JSONArray polygonVertices = message.getJSONArray("polygon");
    for(int i = 0; i < polygonVertices.length(); ++i) {
      JSONArray polygonVertex = polygonVertices.getJSONArray(i);
      List<Integer> coords = new ArrayList<Integer>();
      coords.add(polygonVertex.getInt(0));
      coords.add(polygonVertex.getInt(1));
      polygon.add(coords);
    }
    boolean retry;

    // Store ROI
    String roiId = null;
    retry = true;
    while(retry) {
      retry = false;
      OrientGraph g = DatabaseAccess.getTransactionalGraph();
      try {
        OrientVertex vUser = (OrientVertex) AccessUtils.getUserByLogin(user, g);
        Vertex vEntity = AccessUtils.getNodeById(parent, g);
        // Check write rights
        if(AccessRights.getAccessRights(vUser, vEntity, g) != DataModel.Enums.AccessRights.WRITE) {
          throw new WebApplicationException("User does not have edit rights on entity " + parent, Status.FORBIDDEN);
        }
        
        // Create region of interest
        OrientVertex vROI = CreatorUtils.createRegionOfInterest(polygon, g);
        roiId = vROI.getProperty(DataModel.Properties.id);
        
        // Link region to creator
        UpdateUtils.addCreator(vROI, vUser, g);
        
        // Link region to parent
        UpdateUtils.linkRegionOfInterestToEntity(parent, vROI, g);
        
        // Grant creator access rights
        AccessRights.grantAccessRights(vUser, vROI, DataModel.Enums.AccessRights.WRITE, g);
        g.commit();
      }
      catch(OConcurrentModificationException e) {
        log.warn("Database busy, retrying operation");
        retry = true;
      }
      finally {
        if (!g.isClosed()) {
          g.rollback();
          g.shutdown(false);
        }
      }
    }

    // Store ROI annotation
    retry = true;
    while(retry) {
      retry = false;
      OrientGraph g = DatabaseAccess.getTransactionalGraph();
      try {
        // No need to check rights, it is freshly created.
        OrientVertex vUser = (OrientVertex) AccessUtils.getUserByLogin(user, g);
        // Create annotation of the right type
        OrientVertex vArea = CreatorUtils.createMeasurement(area, DataModel.Enums.Measurement.AREA, g);
        OrientVertex vPerim = CreatorUtils.createMeasurement(perimeter, DataModel.Enums.Measurement.PERIMETER, g);
        // Link annotation to polygon
        UpdateUtils.linkAnnotationToEntity(roiId, vArea, g);
        UpdateUtils.linkAnnotationToEntity(roiId, vPerim, g);
        // Link annotation to creator user
        UpdateUtils.addCreator(vArea, vUser, g);
        UpdateUtils.addCreator(vPerim, vUser, g);
        // Grant access rights to creator
        AccessRights.grantAccessRights(vUser, vArea, DataModel.Enums.AccessRights.WRITE, g);
        AccessRights.grantAccessRights(vUser, vPerim, DataModel.Enums.AccessRights.WRITE, g);
        g.commit();
      }
      catch(OConcurrentModificationException e) {
        log.warn("Database busy, retrying operation");
        retry = true;
      }
      finally {
        if (!g.isClosed()) {
          g.rollback();
          g.shutdown(false);
        }
      }
    }

    // Return OK
    return Globals.OK;
  }

  @POST
  @Consumes(MediaType.APPLICATION_JSON)
  @Path("/create-vertex")
  @Timed
  public String createVertex(final String input, @Context HttpServletRequest request) throws JSONException {
    if(log.isDebugEnabled()) {
      log.debug("Input received " + input);
    }

    JSONObject params = new JSONObject(input);
    String session = SessionManager.getSessionId(request, true);
    String user = SessionManager.getUserLogin(session);
    String parent = params.getString("parent");
    JSONObject message = params.getJSONObject("payload");
    Integer x = message.getInt("x");
    Integer y = message.getInt("y");
    String letters = message.getString("letters");
    String color = message.getString("color");
    String text = message.getString("text");
    boolean retry;

    retry = true;
    while(retry) {
      retry = false;
      OrientGraph g = DatabaseAccess.getTransactionalGraph();
      try {
        OrientVertex vUser = (OrientVertex) AccessUtils.getUserByLogin(user, g);
        Vertex vEntity = AccessUtils.getNodeById(parent, g);
        // Check write rights
        if(AccessRights.getAccessRights(vUser, vEntity, g) != DataModel.Enums.AccessRights.WRITE) {
          throw new WebApplicationException("User does not have edit rights on entity " + parent, Status.FORBIDDEN);
        }
        // Create point of interest
        OrientVertex vPoI = CreatorUtils.createPointOfInterest(x, y, text, color, letters, g);
        
        UpdateUtils.addCreator(vPoI, vUser, g);
        UpdateUtils.linkPointOfInterestToEntity(parent, vPoI, g);
        AccessRights.grantAccessRights(vUser, vPoI, DataModel.Enums.AccessRights.WRITE, g);
        g.commit();
      }
      catch(OConcurrentModificationException e) {
        log.warn("Database busy, retrying operation");
        retry = true;
      }
      finally {
        if (!g.isClosed()) {
          g.rollback();
          g.shutdown(false);
        }
      }
    }
    return Globals.OK;
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
    String parentObjectId = params.getString("parent");
    String annotationType = params.getString("type");
    String annotationText = params.getString("content");
    boolean retry;

    // Convert data exchange model annotation type to database model type
    if (annotationType.equals(Globals.ExchangeModel.ImageEditorProperties.AnnotationTypes.transcription))
    {
      annotationType = DataModel.Classes.LeafTypes.transcription;
    }
    else if (annotationType.equals(Globals.ExchangeModel.ImageEditorProperties.AnnotationTypes.note))
    {
      annotationType = DataModel.Classes.LeafTypes.comment;
    }
    else {
      log.error("Unrecognized annotation type " + annotationType);
      throw new WebApplicationException("Unrecognized annotation type " + annotationType);
    }

    retry = true;
    while(retry) {
      retry = false;
      OrientGraph g = DatabaseAccess.getTransactionalGraph();
      try {
        OrientVertex vUser = (OrientVertex) AccessUtils.getUserByLogin(user, g);
        Vertex vEntity = AccessUtils.getNodeById(parentObjectId, g);
        // Check write rights
        if(AccessRights.getAccessRights(vUser, vEntity, g) != DataModel.Enums.AccessRights.WRITE) {
          throw new WebApplicationException("User does not have edit rights on entity " + parentObjectId, Status.FORBIDDEN);
        }
        // Create annotation of the right type
        OrientVertex vAnnotation = CreatorUtils.createTextAnnotation(annotationType, annotationText, g);
        // Link annotation to polygon
        UpdateUtils.linkAnnotationToEntity(parentObjectId, vAnnotation, g);
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
          g.shutdown(false);
        }
      }
    }

    return Globals.OK;
  }

  /**
   * Unit must be mm, cm, m, in
   * @param input
   * @return
   * @throws JSONException
   */
  @POST
  @Consumes(MediaType.APPLICATION_JSON)
  @Path("/add-scaling-data")
  @Timed
  public String addMeasureReference(final String input, @Context HttpServletRequest request) throws JSONException {
    if (log.isTraceEnabled()) {
      log.trace("Entering /add-scaling-data");
    }
    JSONObject params = new JSONObject(input);
    String session = SessionManager.getSessionId(request, true);
    String user = SessionManager.getUserLogin(session);
    String pathId = params.getString("pathId");
    String sheetId = params.getString("sheetId");
    Double value = params.getDouble("value");
    String unit = params.getString("unit");
    String name = params.getString("name");
    boolean retry;

    retry = true;
    while(retry) {
      retry = false;
      OrientGraph g = DatabaseAccess.getTransactionalGraph();
      try {
        OrientVertex vUser = (OrientVertex) AccessUtils.getUserByLogin(user, g);
        // Create annotation of the right type
        OrientVertex vMeasureRef = CreatorUtils.createMeasureReference(value, unit, name, g);
        // Link annotation to creator user
        UpdateUtils.addCreator(vMeasureRef, vUser, g);
        // Link annotation to path
        UpdateUtils.linkAnnotationToEntity(pathId, vMeasureRef, g);
        // Link annotation to sheet
        UpdateUtils.linkScalingData(sheetId, vMeasureRef, g);
        // Grant creator rights
        AccessRights.grantAccessRights(vUser, vMeasureRef, DataModel.Enums.AccessRights.WRITE, g);
        g.commit();
      }
      catch(OConcurrentModificationException e) {
        log.warn("Database busy, retrying operation");
        retry = true;
      }
      finally {
        if (!g.isClosed()) {
          g.rollback();
          g.shutdown(false);
        }
      }
    }

    return Globals.OK;
  }

  @POST
  @Consumes(MediaType.APPLICATION_JSON)
  @Path("/create-path")
  @Timed
  public String createPath(final String input, @Context HttpServletRequest request) throws JSONException {
    if(log.isTraceEnabled()) {
      log.trace("Entering /create-path");
    }

    if(log.isDebugEnabled()) {
      log.debug("Input received " + input);
    }
    // Retrieve params
    JSONObject params = new JSONObject(input);
    String session = SessionManager.getSessionId(request, true);
    String user = SessionManager.getUserLogin(session);
    String parent = params.getString("parent");
    JSONObject message = params.getJSONObject("payload");
    Double length = message.getDouble("length");
    List<List<Integer>> path = new ArrayList<List<Integer>>();
    JSONArray pathVertices = message.getJSONArray("path");
    for(int i = 0; i < pathVertices.length(); ++i) {
      JSONArray pathVertex = pathVertices.getJSONArray(i);
      List<Integer> coords = new ArrayList<Integer>();
      coords.add(pathVertex.getInt(0));
      coords.add(pathVertex.getInt(1));
      path.add(coords);
    }
    boolean retry;

    // Store path
    retry = true;
    while(retry) {
      retry = false;
      OrientGraph g = DatabaseAccess.getTransactionalGraph();
      try {
        
        OrientVertex vUser = (OrientVertex) AccessUtils.getUserByLogin(user, g);
        OrientVertex vParent = (OrientVertex) AccessUtils.getNodeById(parent, g);
        // Check write rights on image
        if(AccessRights.getAccessRights(vUser, vParent, g).value() < DataModel.Enums.AccessRights.WRITE.value()) {
          throw new WebApplicationException("User does not have edit rights on entity " + parent, Status.FORBIDDEN);
        }
        
        // Create path
        OrientVertex vPath = CreatorUtils.createPath(path, length, g);
        
        // Link user to path as creator
        UpdateUtils.addCreator(vPath, vUser, g);
        
        // Link path to parent entity
        UpdateUtils.linkPathToEntity(parent, vPath, g);
        
        // Grant creator rights on path
        AccessRights.grantAccessRights(vUser, vPath, DataModel.Enums.AccessRights.WRITE, g);
        g.commit();
      }
      catch(OConcurrentModificationException e) {
        log.warn("Database busy, retrying operation");
        retry = true;
      }
      finally {
        if (!g.isClosed()) {
          g.rollback();
          g.shutdown(false);
        }
      }
    }

    // Return OK
    return Globals.OK;
  }

}
