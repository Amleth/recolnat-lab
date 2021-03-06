package org.dicen.recolnat.services.core.data;

import com.orientechnologies.orient.core.exception.OConcurrentModificationException;
import com.tinkerpop.blueprints.Direction;
import com.tinkerpop.blueprints.impls.orient.OrientBaseGraph;
import com.tinkerpop.blueprints.impls.orient.OrientVertex;
import fr.recolnat.database.model.DataModel;
import fr.recolnat.database.utils.AccessRights;
import fr.recolnat.database.utils.AccessUtils;
import fr.recolnat.database.utils.CreatorUtils;
import fr.recolnat.database.utils.UpdateUtils;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.List;
import fr.recolnat.database.exceptions.AccessForbiddenException;
import org.dicen.recolnat.services.core.actions.ActionResult;

/**
 * Static methods to operate on Vertices representing an Image.
 * @author dmitri
 */
public class ImageEditorResource {
  private final static Logger log = LoggerFactory.getLogger(ImageEditorResource.class);

  /**
   * Creates a new Region of Interest in an image, the Annotations to represent its area and perimeter and creates the required links between these.
   * @param imageId UID of the image
   * @param name Name of the new Region of Interest. If null a random name is generated.
   * @param area Area of the new RoI (in px²)
   * @param perimeter Perimeter of the new RoI (in px)
   * @param polygonVertices Array of coordinates of the vertices defining this RoI. Each member of this array is a length 2 Array (the x,y coordinates of each vertex)
   * @param user Login of the user
   * @return The returned response includes : the UID of the new RoI (id). Modified Vertex ids : image, region, area, perimeter.
   * @throws JSONException
   * @throws AccessForbiddenException 
   */
  public static ActionResult createRegionOfInterest(String imageId, String name, Double area, Double perimeter, JSONArray polygonVertices, String user) throws JSONException, AccessForbiddenException {
    List<List<Integer>> polygon = new ArrayList<>();
    for (int i = 0; i < polygonVertices.length(); ++i) {
      JSONArray polygonVertex = polygonVertices.getJSONArray(i);
      List<Integer> coords = new ArrayList<>();
      coords.add(polygonVertex.getInt(0));
      coords.add(polygonVertex.getInt(1));
      polygon.add(coords);
    }
    if(name == null) {
      name = CreatorUtils.generateName("Zone ");
    }

    // Store ROI
    ActionResult res = new ActionResult();
//    List<String> changes = new LinkedList<>();
    boolean retry = true;
    while (retry) {
      retry = false;
      OrientBaseGraph g = DatabaseAccess.getReaderWriterGraph();
      try {
        OrientVertex vUser = AccessUtils.getUserByLogin(user, g);
        String userId = vUser.getProperty(DataModel.Properties.id);
        OrientVertex vImage = AccessUtils.getNodeById(imageId, g);
        // Check write rights
        if (!AccessRights.canWrite(vUser, vImage, g, DatabaseAccess.rightsDb)) {
          throw new AccessForbiddenException(user, imageId);
        }

        // Create region of interest
        OrientVertex vROI = CreatorUtils.createRegionOfInterest(name, polygon, g);
        UpdateUtils.addCreator(vROI, vUser, g, DatabaseAccess.rightsDb);
        

        // Link region to parent
        UpdateUtils.linkRegionOfInterestToImage(vImage, vROI, userId, g);

        // Create measurements
        OrientVertex vArea = CreatorUtils.createMeasurement(area, DataModel.Enums.Measurement.AREA, g);
        OrientVertex vPerim = CreatorUtils.createMeasurement(perimeter, DataModel.Enums.Measurement.PERIMETER, g);
        UpdateUtils.addCreator(vArea, vUser, g, DatabaseAccess.rightsDb);
        UpdateUtils.addCreator(vPerim, vUser, g, DatabaseAccess.rightsDb);
        
        // Link measurements to polygon
        UpdateUtils.link(vROI, vArea, DataModel.Links.hasMeasurement, userId, g);
        UpdateUtils.link(vROI, vPerim, DataModel.Links.hasMeasurement, userId, g);

        g.commit();
        
        AccessRights.grantAccessRights(vUser, vROI, DataModel.Enums.AccessRights.WRITE, DatabaseAccess.rightsDb);
        AccessRights.grantAccessRights(vUser, vArea, DataModel.Enums.AccessRights.WRITE, DatabaseAccess.rightsDb);
        AccessRights.grantAccessRights(vUser, vPerim, DataModel.Enums.AccessRights.WRITE, DatabaseAccess.rightsDb);

        res.addModifiedId((String) vImage.getProperty(DataModel.Properties.id));
        res.addModifiedId((String) vROI.getProperty(DataModel.Properties.id));
        res.addModifiedId((String) vArea.getProperty(DataModel.Properties.id));
        res.addModifiedId((String) vPerim.getProperty(DataModel.Properties.id));
        res.setResponse("id", vROI.getProperty(DataModel.Properties.id));
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
    return res;
  }

  /**
   * Create a new Point of Interest in an image
   * @param imageId UID of the image
   * @param x x-coordinate of the PoI
   * @param y y-coordinate of the PoI
   * @param name Name to give the PoI. If null a random name is generated.
   * @param user Login of the user
   * @return Response includes the id of the new PoI. Modified ids : image, PoI
   * @throws AccessForbiddenException
   * @throws JSONException 
   */
  public static ActionResult createPointOfInterest(String imageId, Integer x, Integer y, String name, String user) throws AccessForbiddenException, JSONException {
    if(name == null) {
      name = CreatorUtils.generateName("PoI ");
    }
    
    ActionResult res = new ActionResult();
    boolean retry = true;
    while (retry) {
      retry = false;
      OrientBaseGraph g = DatabaseAccess.getReaderWriterGraph();
      try {
        OrientVertex vUser = AccessUtils.getUserByLogin(user, g);
        OrientVertex vImage = AccessUtils.getNodeById(imageId, g);
        // Check write rights
        if (!AccessRights.canWrite(vUser, vImage, g, DatabaseAccess.rightsDb)) {
          throw new AccessForbiddenException(user, imageId);
        }
        // Create point of interest
        OrientVertex vPoI = CreatorUtils.createPointOfInterest(x, y, name, g);
        UpdateUtils.addCreator(vPoI, vUser, g, DatabaseAccess.rightsDb);
        

        // Link point of interest to image
        UpdateUtils.linkPointOfInterestToImage(vImage, vPoI, (String) vUser.getProperty(DataModel.Properties.id), g);

        g.commit();
        
        AccessRights.grantAccessRights(vUser, vPoI, DataModel.Enums.AccessRights.WRITE, DatabaseAccess.rightsDb);
        
        res.addModifiedId((String) vImage.getProperty(DataModel.Properties.id));
        res.addModifiedId((String) vPoI.getProperty(DataModel.Properties.id));
        res.setResponse("id", vPoI.getProperty(DataModel.Properties.id));
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
    return res;
  }

  /**
   * Defines a Measurement as a MeasureStandard. Creates a new MeasureStandard vertex linked with the Measurement.
   * @param measurementId UID of the Measurement
   * @param value Length value of the standard
   * @param unit Unit of the value. Accepted values are: mm, cm, m, in
   * @param name Name of the MeasureStandard
   * @param user Login of the user
   * @return Response includes the id of the new standard. Modified ids : measurement, standard, trail (linked to the measurement), image
   * @throws fr.recolnat.database.exceptions.AccessForbiddenException
   */
  public static ActionResult addMeasureStandard(String measurementId, Double value, String unit, String name, String user) throws AccessForbiddenException, JSONException {
//    List<String> changes = new LinkedList<>();
    ActionResult res = new ActionResult();
    boolean retry = true;
    while (retry) {
      retry = false;
      OrientBaseGraph g = DatabaseAccess.getReaderWriterGraph();
      try {
        OrientVertex vUser = AccessUtils.getUserByLogin(user, g);
        OrientVertex vMeasurement = AccessUtils.getNodeById(measurementId, g);
        // User must have write rights on image
        if (!AccessRights.canWrite(vUser, vMeasurement, g, DatabaseAccess.rightsDb)) {
          throw new AccessForbiddenException(user, measurementId);
        }

        // Create annotation of the right type
        OrientVertex vStandard = CreatorUtils.createMeasureStandard(value, unit, name, g);

        // Link standard to creator user
        UpdateUtils.addCreator(vStandard, vUser, g, DatabaseAccess.rightsDb);
        // Link standard to trail and image
        UpdateUtils.linkMeasureStandard(vStandard, vMeasurement, vUser, g);
        g.commit();
        
        // Grant creator rights
        AccessRights.grantAccessRights(vUser, vStandard, DataModel.Enums.AccessRights.WRITE, DatabaseAccess.rightsDb);
        
        
        res.addModifiedId((String) vMeasurement.getProperty(DataModel.Properties.id));
        res.addModifiedId((String) vStandard.getProperty(DataModel.Properties.id));
        res.setResponse("id", vStandard.getProperty(DataModel.Properties.id));
        // In this case the grandparent image has changed as well
        OrientVertex vTrail = AccessUtils.findLatestVersion(vMeasurement.getVertices(Direction.IN, DataModel.Links.hasMeasurement).iterator(), g);
        OrientVertex vImage = AccessUtils.findLatestVersion(vTrail.getVertices(Direction.IN, DataModel.Links.toi).iterator(), g);
        res.addModifiedId((String) vTrail.getProperty(DataModel.Properties.id));
        res.addModifiedId((String) vImage.getProperty(DataModel.Properties.id));
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

    return res;
  }

  /**
   * Creates a new Trail of Interest on an image
   * @param parent UID of the image
   * @param name Name of the new trail. If null a random name is generated.
   * @param length Length in px of the trail.
   * @param pathVertices Array of coordinates of the vertices defining this ToI. Each member of this array is a length 2 Array (the x,y coordinates of each vertex)
   * @param user Login of the user
   * @return Response includes id of the trail (id) and id of the measurement (measurementId). Modified ids : image, trail, measurement
   * @throws JSONException
   * @throws AccessForbiddenException 
   */
  public static ActionResult createTrailOfInterest(String parent, String name, Double length, JSONArray pathVertices, String user) throws JSONException, AccessForbiddenException {
    if (log.isTraceEnabled()) {
      log.trace("Entering createTrailOfInterest(" + parent + ", " + name +", " + length + ", " + pathVertices + ", " + user);
    }

    if(name == null) {
      name = CreatorUtils.generateName("ToI ");
    }
    
    List<List<Integer>> path = new ArrayList<>();
    for (int i = 0; i < pathVertices.length(); ++i) {
      JSONArray pathVertex = pathVertices.getJSONArray(i);
      List<Integer> coords = new ArrayList<>();
      coords.add(pathVertex.getInt(0));
      coords.add(pathVertex.getInt(1));
      path.add(coords);
    }

//    List<String> changes = new ArrayList<>();
    ActionResult res = new ActionResult();
    boolean retry = true;
    while (retry) {
      retry = false;
      OrientBaseGraph g = DatabaseAccess.getReaderWriterGraph();
      try {
        OrientVertex vUser = AccessUtils.getUserByLogin(user, g);
        OrientVertex vImage = AccessUtils.getNodeById(parent, g);
        // Check write rights on image
        if (!AccessRights.canWrite(vUser, vImage, g, DatabaseAccess.rightsDb)) {
          throw new AccessForbiddenException(user, parent);
        }

        String userId = vUser.getProperty(DataModel.Properties.id);

        // Create trailOfInterest
        OrientVertex vPath = CreatorUtils.createTrailOfInterest(path, name, g);

        // Create measure
        OrientVertex mRefPx = CreatorUtils.createMeasurement(length, DataModel.Enums.Measurement.LENGTH, g);

        // Link user to trailOfInterest & measure as creator
        UpdateUtils.addCreator(vPath, vUser, g, DatabaseAccess.rightsDb);
        UpdateUtils.addCreator(mRefPx, vUser, g, DatabaseAccess.rightsDb);

        // Link measure to trailOfInterest
        UpdateUtils.link(vPath, mRefPx, DataModel.Links.hasMeasurement, userId, g);
//        UpdateUtils.linkAnnotationToEntity(vPath, mRefPx, g);

        // Link trailOfInterest to parent entity
        UpdateUtils.linkTrailOfInterestToImage(vImage, vPath, userId, g);
        
        g.commit();

        // Grant creator rights on trailOfInterest
        AccessRights.grantAccessRights(vUser, vPath, DataModel.Enums.AccessRights.WRITE, DatabaseAccess.rightsDb);

        // Grant creator rights on measure
        AccessRights.grantAccessRights(vUser, mRefPx, DataModel.Enums.AccessRights.WRITE, DatabaseAccess.rightsDb);

        
        
        res.addModifiedId((String) vImage.getProperty(DataModel.Properties.id));
        res.addModifiedId((String) vPath.getProperty(DataModel.Properties.id));
        res.addModifiedId((String) mRefPx.getProperty(DataModel.Properties.id));
        res.setResponse("id", vPath.getProperty(DataModel.Properties.id));
        res.setResponse("measurementId", mRefPx.getProperty(DataModel.Properties.id));
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
    return res;
  }

  /**
   * Creates a new Angle of Interest in an image.
   * @param parent UID of the image
   * @param name Name of the new angle. If null, a random name is generated.
   * @param length Measure of the angle, in degrees
   * @param angleVertices Array (length 3) of coordinates of the vertices defining this AoI. Each member of this array is a length 2 Array (the x,y coordinates of each vertex). Order of the vertices is : angle center, first angle vertex, second angle vertex.
   * @param user Login of the user.
   * @return Response includes the id of the new angle (id). Modified ids : image, angle, measurement
   * @throws JSONException
   * @throws AccessForbiddenException 
   */
  public static ActionResult createAngleOfInterest(String parent, String name, Double length, JSONArray angleVertices, String user) throws JSONException, AccessForbiddenException {
    // Retrieve params
    List<List<Integer>> vertices = new ArrayList<>();
    for (int i = 0; i < angleVertices.length(); ++i) {
      JSONArray angleVertex = angleVertices.getJSONArray(i);
      List<Integer> coords = new ArrayList<>();
      coords.add(angleVertex.getInt(0));
      coords.add(angleVertex.getInt(1));
      vertices.add(coords);
    }
    
    if(name == null) {
      name = CreatorUtils.generateName("AoI ");
    }
    
    ActionResult res = new ActionResult();
    boolean retry = true;
    while (retry) {
      retry = false;
      OrientBaseGraph g = DatabaseAccess.getReaderWriterGraph();
      try {

        OrientVertex vUser = AccessUtils.getUserByLogin(user, g);
        OrientVertex vImage = AccessUtils.getNodeById(parent, g);
        // Check write rights on image
        if (!AccessRights.canWrite(vUser, vImage, g, DatabaseAccess.rightsDb)) {
          throw new AccessForbiddenException(user, parent);
        }

        String userId = vUser.getProperty(DataModel.Properties.id);

        // Create angleOfInterest
        OrientVertex vAngle = CreatorUtils.createAngleOfInterest(name, vertices, g);

        // Create measure
        OrientVertex mRefDeg = CreatorUtils.createMeasurement(length, DataModel.Enums.Measurement.ANGLE, g);

        // Link user to angleOfInterest & measure as creator
        UpdateUtils.addCreator(vAngle, vUser, g, DatabaseAccess.rightsDb);
        UpdateUtils.addCreator(mRefDeg, vUser, g, DatabaseAccess.rightsDb);

        // Link measure to angleOfInterest
        UpdateUtils.link(vAngle, mRefDeg, DataModel.Links.hasMeasurement, userId, g);
//        UpdateUtils.linkAnnotationToEntity(vPath, mRefPx, g);

        // Link angleOfInterest to parent entity
        UpdateUtils.linkAngleOfInterestToImage(vImage, vAngle, userId, g);
        
        g.commit();

        // Grant creator rights on angleOfInterest
        AccessRights.grantAccessRights(vUser, vAngle, DataModel.Enums.AccessRights.WRITE, DatabaseAccess.rightsDb);

        // Grant creator rights on measure
        AccessRights.grantAccessRights(vUser, mRefDeg, DataModel.Enums.AccessRights.WRITE, DatabaseAccess.rightsDb);

        
        
        res.addModifiedId((String) vImage.getProperty(DataModel.Properties.id));
        res.addModifiedId((String) vAngle.getProperty(DataModel.Properties.id));
        res.addModifiedId((String) mRefDeg.getProperty(DataModel.Properties.id));
        res.setResponse("id", vAngle.getProperty(DataModel.Properties.id));
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
    return res;
  }

}
