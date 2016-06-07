package org.dicen.recolnat.services.resources;

import com.codahale.metrics.annotation.Timed;
import com.orientechnologies.orient.core.exception.OConcurrentModificationException;
import com.tinkerpop.blueprints.impls.orient.OrientGraph;
import com.tinkerpop.blueprints.impls.orient.OrientVertex;
import fr.recolnat.database.model.DataModel;
import fr.recolnat.database.model.impl.RecolnatImage;
import fr.recolnat.database.model.impl.Specimen;
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
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;

/**
 * Created by Dmitri Voitsekhovitch (dvoitsekh@gmail.com) on 21/05/15.
 */
@Path("/image")
@Produces(MediaType.APPLICATION_JSON)
public class ImageEditorResource {

  private final static Logger log = LoggerFactory.getLogger(ImageEditorResource.class);
  private static final Map<String, String> userToActiveData = new ConcurrentHashMap<String, String>();

  @POST
  @Consumes(MediaType.APPLICATION_JSON)
  @Path("/get-image")
  @Timed
  public Response getImage(final String input, @Context HttpServletRequest request) throws JSONException {
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
      OrientVertex vImage = (OrientVertex) AccessUtils.getNodeById(id, g);
      img = new RecolnatImage(vImage, vUser, g);
      
      return Response.ok(img.toJSON().toString(), MediaType.APPLICATION_JSON_TYPE).build();
      
    } catch (AccessDeniedException e) {
      throw new WebApplicationException("Access to image " + id + " not authorized for current user", Status.FORBIDDEN);
    } catch (JSONException e) {
      log.error("Unable to convert object to JSON for id " + id);
      throw new WebApplicationException(e, Status.INTERNAL_SERVER_ERROR);
    } finally {
      if (!g.isClosed()) {
        g.rollback();
        g.shutdown();
      }
    }
  }
  
  @POST
  @Consumes(MediaType.APPLICATION_JSON)
  @Path("/get-specimen")
  @Timed
  public Response getSpecimen(final String input, @Context HttpServletRequest request) throws JSONException {
    if (log.isTraceEnabled()) {
      log.trace("Requesting new image");
    }

    String session = SessionManager.getSessionId(request, true);
    JSONObject params = new JSONObject(input);
    String id = params.getString("id");
    String user = SessionManager.getUserLogin(session);

    OrientGraph g = DatabaseAccess.getTransactionalGraph();
    try {
      OrientVertex vUser = (OrientVertex) AccessUtils.getUserByLogin(user, g);
      OrientVertex vSpecimen = (OrientVertex) AccessUtils.getNodeById(id, g);
      Specimen spec = new Specimen(vSpecimen, vUser, g);
      
      return Response.ok(spec.toJSON().toString(), MediaType.APPLICATION_JSON_TYPE).build();
      
    } catch (AccessDeniedException e) {
      throw new WebApplicationException("Access to specimen " + id + " not authorized for current user", Status.FORBIDDEN);
    } catch (JSONException e) {
      log.error("Unable to convert object to JSON for id " + id);
      throw new WebApplicationException(e, Status.INTERNAL_SERVER_ERROR);
    } finally {
      if (!g.isClosed()) {
        g.rollback();
        g.shutdown();
      }
    }
  }

  @POST
  @Consumes(MediaType.APPLICATION_JSON)
  @Path("/create-roi")
  @Timed
  public String createRegionOfInterest(final String input, @Context HttpServletRequest request) throws JSONException {
    if (log.isTraceEnabled()) {
      log.trace("createRegionOfInterest()");
    }

    // Retrieve params
    JSONObject params = new JSONObject(input);
    String session = SessionManager.getSessionId(request, true);
    String user = SessionManager.getUserLogin(session);
    String imageId = params.getString("image");
    JSONObject message = params.getJSONObject("payload");
    Double area = message.getDouble("area");
    Double perimeter = message.getDouble("perimeter");
    List<List<Integer>> polygon = new ArrayList<List<Integer>>();
    JSONArray polygonVertices = message.getJSONArray("polygon");
    for (int i = 0; i < polygonVertices.length(); ++i) {
      JSONArray polygonVertex = polygonVertices.getJSONArray(i);
      List<Integer> coords = new ArrayList<Integer>();
      coords.add(polygonVertex.getInt(0));
      coords.add(polygonVertex.getInt(1));
      polygon.add(coords);
    }
    String name = null;
    try {
    name = message.getString("name");
    }
    catch(JSONException e) {
      name = CreatorUtils.generateName("Zone ");
    }
    
    // Store ROI
//    String roiId = null;
//    String userId = null;
    boolean retry = true;
    while (retry) {
      retry = false;
      OrientGraph g = DatabaseAccess.getTransactionalGraph();
      try {
        OrientVertex vUser = AccessUtils.getUserByLogin(user, g);
        String userId = vUser.getProperty(DataModel.Properties.id);
        OrientVertex vImage = AccessUtils.getNodeById(imageId, g);
        // Check write rights
        if (!AccessRights.canWrite(vUser, vImage, g)) {
          throw new WebApplicationException("User does not have edit rights on entity " + imageId, Status.FORBIDDEN);
        }

        // Create region of interest
        OrientVertex vROI = CreatorUtils.createRegionOfInterest(name, polygon, g);
        UpdateUtils.addCreator(vROI, vUser, g);
        AccessRights.grantAccessRights(vUser, vROI, DataModel.Enums.AccessRights.WRITE, g);

        // Link region to parent
        UpdateUtils.linkRegionOfInterestToImage(vImage, vROI, userId, g);
        
        // Create measurements
        OrientVertex vArea = CreatorUtils.createMeasurement(area, DataModel.Enums.Measurement.AREA, g);
        OrientVertex vPerim = CreatorUtils.createMeasurement(perimeter, DataModel.Enums.Measurement.PERIMETER, g);
        UpdateUtils.addCreator(vArea, vUser, g);
        UpdateUtils.addCreator(vPerim, vUser, g);
        AccessRights.grantAccessRights(vUser, vArea, DataModel.Enums.AccessRights.WRITE, g);
        AccessRights.grantAccessRights(vUser, vPerim, DataModel.Enums.AccessRights.WRITE, g);
        
        // Link measurements to polygon
        UpdateUtils.link(vROI, vArea, DataModel.Links.hasMeasurement, userId, g);
        UpdateUtils.link(vROI, vPerim, DataModel.Links.hasMeasurement, userId, g);
        
        g.commit();
      } catch (OConcurrentModificationException e) {
        log.warn("Database busy, retrying operation");
        retry = true;
      } finally {
        if (!g.isClosed()) {
          g.rollback();
          g.shutdown();
        }
      }
    }
    // Return OK
    return Globals.OK;
  }

  @POST
  @Consumes(MediaType.APPLICATION_JSON)
  @Path("/create-poi")
  @Timed
  public String createPointOfInterest(final String input, @Context HttpServletRequest request) throws JSONException {
    if (log.isDebugEnabled()) {
      log.debug("Input received " + input);
    }

    JSONObject params = new JSONObject(input);
    String session = SessionManager.getSessionId(request, true);
    String user = SessionManager.getUserLogin(session);
    String imageId = params.getString("parent");
    JSONObject message = params.getJSONObject("payload");
    Integer x = message.getInt("x");
    Integer y = message.getInt("y");
    String name = null;
    try {
      name = message.getString("name");
    } catch (JSONException e) {
      name = CreatorUtils.generateName("PoI ");
    }
    boolean retry;

    retry = true;
    while (retry) {
      retry = false;
      OrientGraph g = DatabaseAccess.getTransactionalGraph();
      try {
        OrientVertex vUser = AccessUtils.getUserByLogin(user, g);
        OrientVertex vImage = AccessUtils.getNodeById(imageId, g);
        // Check write rights
        if (!AccessRights.canWrite(vUser, vImage, g)) {
          throw new WebApplicationException("User does not have edit rights on entity " + imageId, Status.FORBIDDEN);
        }
        // Create point of interest
        OrientVertex vPoI = CreatorUtils.createPointOfInterest(x, y, name, g);
        UpdateUtils.addCreator(vPoI, vUser, g);
        AccessRights.grantAccessRights(vUser, vPoI, DataModel.Enums.AccessRights.WRITE, g);
        
        // Link point of interest to image
        UpdateUtils.linkPointOfInterestToImage(vImage, vPoI, (String) vUser.getProperty(DataModel.Properties.id), g);
        
        g.commit();
      } catch (OConcurrentModificationException e) {
        log.warn("Database busy, retrying operation");
        retry = true;
      } finally {
        if (!g.isClosed()) {
          g.rollback();
          g.shutdown();
        }
      }
    }
    return Globals.OK;
  }

  
  
  /**
   * Unit must be mm, cm, m, in
   *
   * @param input
   * @return
   * @throws JSONException
   */
  @POST
  @Consumes(MediaType.APPLICATION_JSON)
  @Path("/add-measure-standard")
  @Timed
  public String addMeasureStandard(final String input, @Context HttpServletRequest request) throws JSONException {
    if (log.isTraceEnabled()) {
      log.trace("Entering /add-measure-standard");
    }
    JSONObject params = new JSONObject(input);
    String session = SessionManager.getSessionId(request, true);
    String user = SessionManager.getUserLogin(session);
    String pathId = params.getString("pathId");
    Double value = params.getDouble("value");
    String unit = params.getString("unit");
    String name = params.getString("name");
    boolean retry;

    retry = true;
    while (retry) {
      retry = false;
      OrientGraph g = DatabaseAccess.getTransactionalGraph();
      try {
        OrientVertex vUser = AccessUtils.getUserByLogin(user, g);
        OrientVertex vMeasurement = AccessUtils.getNodeById(pathId, g);
        // User must have write rights on image
        if (!AccessRights.canWrite(vUser, vMeasurement, g)) {
          throw new WebApplicationException(Response.Status.FORBIDDEN);
        }

        // Create annotation of the right type
        OrientVertex vStandard = CreatorUtils.createMeasureStandard(value, unit, name, g);

        // Link standard to creator user
        UpdateUtils.addCreator(vStandard, vUser, g);
        // Link standard to trail and image
        UpdateUtils.linkMeasureStandard(vStandard, vMeasurement, vUser, g);
        // Grant creator rights
        AccessRights.grantAccessRights(vUser, vStandard, DataModel.Enums.AccessRights.WRITE, g);
        g.commit();
      } catch (OConcurrentModificationException e) {
        log.warn("Database busy, retrying operation");
        retry = true;
      } finally {
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
  @Path("/create-toi")
  @Timed
  public String createTrailOfInterest(final String input, @Context HttpServletRequest request) throws JSONException {
    if (log.isTraceEnabled()) {
      log.trace("Entering /create-toi");
    }

    if (log.isDebugEnabled()) {
      log.debug("Input received " + input);
    }
    // Retrieve params
    JSONObject params = new JSONObject(input);
    String session = SessionManager.getSessionId(request, true);
    String user = SessionManager.getUserLogin(session);
    String parent = params.getString("parent");
    JSONObject message = params.getJSONObject("payload");
    String name = message.getString("name");
    Double length = message.getDouble("length");
    List<List<Integer>> path = new ArrayList<>();
    JSONArray pathVertices = message.getJSONArray("path");
    for (int i = 0; i < pathVertices.length(); ++i) {
      JSONArray pathVertex = pathVertices.getJSONArray(i);
      List<Integer> coords = new ArrayList<>();
      coords.add(pathVertex.getInt(0));
      coords.add(pathVertex.getInt(1));
      path.add(coords);
    }
    boolean retry;

    // Store trailOfInterest
    retry = true;
    while (retry) {
      retry = false;
      OrientGraph g = DatabaseAccess.getTransactionalGraph();
      try {

        OrientVertex vUser = AccessUtils.getUserByLogin(user, g);
        OrientVertex vImage = AccessUtils.getNodeById(parent, g);
        // Check write rights on image
        if (!AccessRights.canWrite(vUser, vImage, g)) {
          throw new WebApplicationException("User does not have edit rights on entity " + parent, Status.FORBIDDEN);
        }

        String userId = vUser.getProperty(DataModel.Properties.id);

        // Create trailOfInterest
        OrientVertex vPath = CreatorUtils.createTrailOfInterest(path, name, g);

        // Create measure
        OrientVertex mRefPx = CreatorUtils.createMeasurement(length, DataModel.Enums.Measurement.LENGTH, g);

        // Link user to trailOfInterest as creator
        UpdateUtils.addCreator(vPath, vUser, g);

        // Link measure to trailOfInterest
        UpdateUtils.link(vImage, vPath, DataModel.Links.hasMeasurement, userId, g);
//        UpdateUtils.linkAnnotationToEntity(vPath, mRefPx, g);

        // Link trailOfInterest to parent entity
        UpdateUtils.linkTrailOfInterestToImage(vImage, vPath, userId, g);

        // Grant creator rights on trailOfInterest
        AccessRights.grantAccessRights(vUser, vPath, DataModel.Enums.AccessRights.WRITE, g);

        // Grant creator rights on measure
        AccessRights.grantAccessRights(vUser, mRefPx, DataModel.Enums.AccessRights.WRITE, g);

        g.commit();
      } catch (OConcurrentModificationException e) {
        log.warn("Database busy, retrying operation");
        retry = true;
      } finally {
        if (!g.isClosed()) {
          g.rollback();
          g.shutdown();
        }
      }
    }

    // Return OK
    return Globals.OK;
  }

}
