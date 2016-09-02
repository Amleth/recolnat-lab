package org.dicen.recolnat.services.core.data;

import com.orientechnologies.orient.core.exception.OConcurrentModificationException;
import com.tinkerpop.blueprints.Direction;
import com.tinkerpop.blueprints.impls.orient.OrientBaseGraph;
import com.tinkerpop.blueprints.impls.orient.OrientVertex;
import fr.recolnat.database.model.DataModel;
import fr.recolnat.database.model.impl.RecolnatImage;
import fr.recolnat.database.model.impl.Specimen;
import fr.recolnat.database.utils.AccessRights;
import fr.recolnat.database.utils.AccessUtils;
import fr.recolnat.database.utils.CreatorUtils;
import fr.recolnat.database.utils.UpdateUtils;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.List;
import fr.recolnat.database.exceptions.AccessForbiddenException;
import fr.recolnat.database.model.impl.AbstractObject;
import fr.recolnat.database.model.impl.AngleOfInterest;
import fr.recolnat.database.model.impl.Annotation;
import fr.recolnat.database.model.impl.MeasureStandard;
import fr.recolnat.database.model.impl.PointOfInterest;
import fr.recolnat.database.model.impl.RegionOfInterest;
import fr.recolnat.database.model.impl.TrailOfInterest;
import java.util.LinkedList;
import org.dicen.recolnat.services.core.exceptions.InternalServerErrorException;

public class ImageEditorResource {

  private final static Logger log = LoggerFactory.getLogger(ImageEditorResource.class);

  public static JSONObject getImage(String id, String user) throws InternalServerErrorException, AccessForbiddenException {
    OrientBaseGraph g = DatabaseAccess.getTransactionalGraph();
    RecolnatImage img = null;
    try {
      OrientVertex vUser = (OrientVertex) AccessUtils.getUserByLogin(user, g);
      OrientVertex vImage = (OrientVertex) AccessUtils.getNodeById(id, g);
      img = new RecolnatImage(vImage, vUser, g);
      return img.toJSON();
    } catch (JSONException e) {
      log.error("Unable to convert object to JSON for id " + id);
      throw new InternalServerErrorException();
    } finally {
      if (!g.isClosed()) {
        g.rollback();
        g.shutdown();
      }
    }
  }

  public static JSONObject getSpecimen(String id, String user) throws InternalServerErrorException, AccessForbiddenException {
    OrientBaseGraph g = DatabaseAccess.getTransactionalGraph();
    try {
      OrientVertex vUser = (OrientVertex) AccessUtils.getUserByLogin(user, g);
      OrientVertex vSpecimen = (OrientVertex) AccessUtils.getNodeById(id, g);
      Specimen spec = new Specimen(vSpecimen, vUser, g);
      return spec.toJSON();
    } catch (JSONException e) {
      log.error("Unable to convert object to JSON for id " + id);
      throw new InternalServerErrorException();
    } finally {
      g.rollback();
      g.shutdown();
    }
  }

  public static List<String> createRegionOfInterest(String imageId, String name, Double area, Double perimeter, JSONArray polygonVertices, String user) throws JSONException, AccessForbiddenException {
    List<List<Integer>> polygon = new ArrayList<List<Integer>>();
    for (int i = 0; i < polygonVertices.length(); ++i) {
      JSONArray polygonVertex = polygonVertices.getJSONArray(i);
      List<Integer> coords = new ArrayList<Integer>();
      coords.add(polygonVertex.getInt(0));
      coords.add(polygonVertex.getInt(1));
      polygon.add(coords);
    }
    if(name == null) {
      name = CreatorUtils.generateName("Zone ");
    }

    // Store ROI
    List<String> changes = new LinkedList<>();
    boolean retry = true;
    while (retry) {
      retry = false;
      OrientBaseGraph g = DatabaseAccess.getTransactionalGraph();
      try {
        OrientVertex vUser = AccessUtils.getUserByLogin(user, g);
        String userId = vUser.getProperty(DataModel.Properties.id);
        OrientVertex vImage = AccessUtils.getNodeById(imageId, g);
        // Check write rights
        if (!AccessRights.canWrite(vUser, vImage, g)) {
          throw new AccessForbiddenException(user, imageId);
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

        changes.add(vImage.getProperty(DataModel.Properties.id));
        changes.add(vROI.getProperty(DataModel.Properties.id));
        changes.add(vArea.getProperty(DataModel.Properties.id));
        changes.add(vPerim.getProperty(DataModel.Properties.id));
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
    return changes;
  }

  public static List<String> createPointOfInterest(String imageId, Integer x, Integer y, String name, String user) throws AccessForbiddenException {
    if(name == null) {
      name = CreatorUtils.generateName("PoI ");
    }
    
    List<String> changes = new LinkedList<>();
    boolean retry = true;
    while (retry) {
      retry = false;
      OrientBaseGraph g = DatabaseAccess.getTransactionalGraph();
      try {
        OrientVertex vUser = AccessUtils.getUserByLogin(user, g);
        OrientVertex vImage = AccessUtils.getNodeById(imageId, g);
        // Check write rights
        if (!AccessRights.canWrite(vUser, vImage, g)) {
          throw new AccessForbiddenException(user, imageId);
        }
        // Create point of interest
        OrientVertex vPoI = CreatorUtils.createPointOfInterest(x, y, name, g);
        UpdateUtils.addCreator(vPoI, vUser, g);
        AccessRights.grantAccessRights(vUser, vPoI, DataModel.Enums.AccessRights.WRITE, g);

        // Link point of interest to image
        UpdateUtils.linkPointOfInterestToImage(vImage, vPoI, (String) vUser.getProperty(DataModel.Properties.id), g);

        g.commit();
        
        changes.add(vImage.getProperty(DataModel.Properties.id));
        changes.add(vPoI.getProperty(DataModel.Properties.id));
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
    return changes;
  }

  /**
   * Unit must be mm, cm, m, in
   *
   * @param pathId
   * @param value
   * @param unit
   * @param name
   * @param user
   * @return
   * @throws fr.recolnat.database.exceptions.AccessForbiddenException
   */
  public static List<String> addMeasureStandard(String measurementId, Double value, String unit, String name, String user) throws AccessForbiddenException {
    List<String> changes = new LinkedList<>();
    boolean retry = true;
    while (retry) {
      retry = false;
      OrientBaseGraph g = DatabaseAccess.getTransactionalGraph();
      try {
        OrientVertex vUser = AccessUtils.getUserByLogin(user, g);
        OrientVertex vMeasurement = AccessUtils.getNodeById(measurementId, g);
        // User must have write rights on image
        if (!AccessRights.canWrite(vUser, vMeasurement, g)) {
          throw new AccessForbiddenException(user, measurementId);
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
        
        changes.add(vMeasurement.getProperty(DataModel.Properties.id));
        changes.add(vStandard.getProperty(DataModel.Properties.id));
        // In this case the grandparent image has changed as well
        OrientVertex vTrail = AccessUtils.findLatestVersion(vMeasurement.getVertices(Direction.IN, DataModel.Links.hasMeasurement).iterator(), g);
        OrientVertex vImage = AccessUtils.findLatestVersion(vTrail.getVertices(Direction.IN, DataModel.Links.toi).iterator(), g);
        changes.add(vImage.getProperty(DataModel.Properties.id));
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

    return changes;
  }

  public static List<String> createTrailOfInterest(String parent, String name, Double length, JSONArray pathVertices, String user) throws JSONException, AccessForbiddenException {
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

    List<String> changes = new ArrayList<>();
    boolean retry = true;
    while (retry) {
      retry = false;
      OrientBaseGraph g = DatabaseAccess.getTransactionalGraph();
      try {
        OrientVertex vUser = AccessUtils.getUserByLogin(user, g);
        OrientVertex vImage = AccessUtils.getNodeById(parent, g);
        // Check write rights on image
        if (!AccessRights.canWrite(vUser, vImage, g)) {
          throw new AccessForbiddenException(user, parent);
        }

        String userId = vUser.getProperty(DataModel.Properties.id);

        // Create trailOfInterest
        OrientVertex vPath = CreatorUtils.createTrailOfInterest(path, name, g);

        // Create measure
        OrientVertex mRefPx = CreatorUtils.createMeasurement(length, DataModel.Enums.Measurement.LENGTH, g);

        // Link user to trailOfInterest & measure as creator
        UpdateUtils.addCreator(vPath, vUser, g);
        UpdateUtils.addCreator(mRefPx, vUser, g);

        // Link measure to trailOfInterest
        UpdateUtils.link(vPath, mRefPx, DataModel.Links.hasMeasurement, userId, g);
//        UpdateUtils.linkAnnotationToEntity(vPath, mRefPx, g);

        // Link trailOfInterest to parent entity
        UpdateUtils.linkTrailOfInterestToImage(vImage, vPath, userId, g);

        // Grant creator rights on trailOfInterest
        AccessRights.grantAccessRights(vUser, vPath, DataModel.Enums.AccessRights.WRITE, g);

        // Grant creator rights on measure
        AccessRights.grantAccessRights(vUser, mRefPx, DataModel.Enums.AccessRights.WRITE, g);

        g.commit();
        
        changes.add(vImage.getProperty(DataModel.Properties.id));
        changes.add(vPath.getProperty(DataModel.Properties.id));
        changes.add(mRefPx.getProperty(DataModel.Properties.id));
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
    return changes;
  }

  public static List<String> createAngleOfInterest(String parent, String name, Double length, JSONArray angleVertices, String user) throws JSONException, AccessForbiddenException {
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
    
    List<String> changes = new LinkedList<>();
    boolean retry = true;
    while (retry) {
      retry = false;
      OrientBaseGraph g = DatabaseAccess.getTransactionalGraph();
      try {

        OrientVertex vUser = AccessUtils.getUserByLogin(user, g);
        OrientVertex vImage = AccessUtils.getNodeById(parent, g);
        // Check write rights on image
        if (!AccessRights.canWrite(vUser, vImage, g)) {
          throw new AccessForbiddenException(user, parent);
        }

        String userId = vUser.getProperty(DataModel.Properties.id);

        // Create angleOfInterest
        OrientVertex vAngle = CreatorUtils.createAngleOfInterest(name, vertices, g);

        // Create measure
        OrientVertex mRefDeg = CreatorUtils.createMeasurement(length, DataModel.Enums.Measurement.ANGLE, g);

        // Link user to angleOfInterest & measure as creator
        UpdateUtils.addCreator(vAngle, vUser, g);
        UpdateUtils.addCreator(mRefDeg, vUser, g);

        // Link measure to angleOfInterest
        UpdateUtils.link(vAngle, mRefDeg, DataModel.Links.hasMeasurement, userId, g);
//        UpdateUtils.linkAnnotationToEntity(vPath, mRefPx, g);

        // Link angleOfInterest to parent entity
        UpdateUtils.linkAngleOfInterestToImage(vImage, vAngle, userId, g);

        // Grant creator rights on angleOfInterest
        AccessRights.grantAccessRights(vUser, vAngle, DataModel.Enums.AccessRights.WRITE, g);

        // Grant creator rights on measure
        AccessRights.grantAccessRights(vUser, mRefDeg, DataModel.Enums.AccessRights.WRITE, g);

        g.commit();
        
        changes.add(vImage.getProperty(DataModel.Properties.id));
        changes.add(vAngle.getProperty(DataModel.Properties.id));
        changes.add(mRefDeg.getProperty(DataModel.Properties.id));
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
    return changes;
  }

}
