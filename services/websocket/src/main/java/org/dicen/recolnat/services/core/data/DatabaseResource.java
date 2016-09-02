package org.dicen.recolnat.services.core.data;

import com.orientechnologies.orient.core.exception.OConcurrentModificationException;
import com.tinkerpop.blueprints.impls.orient.OrientBaseGraph;
import com.tinkerpop.blueprints.impls.orient.OrientEdge;
import com.tinkerpop.blueprints.impls.orient.OrientBaseGraph;
import com.tinkerpop.blueprints.impls.orient.OrientVertex;
import fr.recolnat.database.exceptions.AccessForbiddenException;
import fr.recolnat.database.exceptions.ResourceNotExistsException;
import fr.recolnat.database.model.DataModel;
import fr.recolnat.database.model.impl.AbstractObject;
import fr.recolnat.database.model.impl.AngleOfInterest;
import fr.recolnat.database.model.impl.Annotation;
import fr.recolnat.database.model.impl.ColaboratoryUser;
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
import fr.recolnat.database.utils.DeleteUtils;
import fr.recolnat.database.utils.UpdateUtils;
import java.nio.file.AccessDeniedException;
import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;
import org.codehaus.jettison.json.JSONException;

import javax.ws.rs.core.Response;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONObject;
import org.dicen.recolnat.services.core.actions.ResponseBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class DatabaseResource {

  private static final Logger log = LoggerFactory.getLogger(DatabaseResource.class);
  
  public static JSONObject getUserData(String userLogin) throws JSONException {
    OrientBaseGraph g = DatabaseAccess.getTransactionalGraph();
    try {
      OrientVertex vUser = (OrientVertex) AccessUtils.getUserByLogin(userLogin, g);
      ColaboratoryUser user = new ColaboratoryUser(vUser, vUser, g);
      return user.toJSON();
    } finally {
      g.rollback();
      g.shutdown();
    }
  }

  public static JSONObject getData(String entityId, String user) throws JSONException, AccessForbiddenException {
    JSONObject entity = new JSONObject();
    OrientBaseGraph g = DatabaseAccess.getTransactionalGraph();
    try {
      OrientVertex vUser = (OrientVertex) AccessUtils.getUserByLogin(user, g);
      OrientVertex v = (OrientVertex) AccessUtils.getNodeById(entityId, g);
      if (v != null) {
        if (!AccessRights.canRead(vUser, v, g)) {
          log.info("User " + user + " is not authorized to access data " + entityId);
          throw new AccessForbiddenException(user, entityId);
        }
        entity = DatabaseResource.getVertexMetadata(v, vUser, g).toJSON();

      } else {
        OrientEdge e = (OrientEdge) AccessUtils.getEdgeById(entityId, g);
        // Perhaps we should check access rights on both sides of the edge ?
        if (e != null) {
          entity = DatabaseResource.getEdgeMetadata(e, vUser, g).toJSON();
        } else {
          log.info("Entity not found in vertices and edges : " + entityId);
          return ResponseBuilder.error("Entity not found " + entityId, Response.Status.NOT_FOUND);
        }
      }
    } catch (AccessDeniedException ex) {
      log.error("Unsuitable access rights. This error should not happen here as rights were checked beforehand");
    } finally {
      g.rollback();
      g.shutdown();
    }

    return entity;
  }

  /**
   * To be deletable: - the user must have write access to the object; - sheets
   * are not deletable; - the object must not be shared with a group or with
   * PUBLIC.
   *
   * @param entityId
   * @param user
   * @return
   */
  public static List<String> remove(final String entityId, final String user) throws JSONException, ResourceNotExistsException, AccessForbiddenException {
    List<String> modified = new LinkedList<>();
    boolean retry = true;
    while (retry) {
      retry = false;
      OrientBaseGraph g = DatabaseAccess.getTransactionalGraph();
      try {
        OrientVertex vUser = (OrientVertex) AccessUtils.getUserByLogin(user, g);

        // Checking deletability is relegated to the method
        modified = DeleteUtils.delete(entityId, vUser, g);
        g.commit();
      } catch (OConcurrentModificationException e) {
        log.warn("Database busy, retrying operation");
        retry = true;
      } finally {
        g.rollback();
        g.shutdown();
      }
    }

    return modified;
  }

  public static List<String> addAnnotation(final String parentObjectId, final String annotationText, final String user) throws JSONException, AccessForbiddenException {
    List<String> changes = new ArrayList<>();
    boolean retry = true;
    while (retry) {
      retry = false;
      OrientBaseGraph g = DatabaseAccess.getTransactionalGraph();
      try {
        OrientVertex vUser = AccessUtils.getUserByLogin(user, g);
        OrientVertex vEntity = AccessUtils.getNodeById(parentObjectId, g);
        // Check write rights
        if (!AccessRights.canWrite(vUser, vEntity, g)) {
          log.info("User not allowed to add annotation to " + parentObjectId);
          throw new AccessForbiddenException(user, parentObjectId);
        }
        // Create annotation of the right type
        OrientVertex vAnnotation = CreatorUtils.createAnnotation(annotationText, g);
        // Link annotation to polygon
        UpdateUtils.linkAnnotationToEntity(vAnnotation, vEntity, (String) vUser.getProperty(DataModel.Properties.id), g);
        // Link annotation to creator user
        UpdateUtils.addCreator(vAnnotation, vUser, g);
        // Grant creator rights
        AccessRights.grantAccessRights(vUser, vAnnotation, DataModel.Enums.AccessRights.WRITE, g);
        g.commit();
        
        changes.add(parentObjectId);
        changes.add((String) vAnnotation.getProperty(DataModel.Properties.id));
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

  public static List<String> editProperties(String entityId, JSONArray properties, String user) throws JSONException, AccessForbiddenException {
    List<String> changes = new LinkedList<>();
    boolean retry = true;
    while (retry) {
      retry = false;
      OrientBaseGraph g = DatabaseAccess.getTransactionalGraph();
      try {
        OrientVertex vUser = AccessUtils.getUserByLogin(user, g);
        OrientVertex vEntity = AccessUtils.getNodeById(entityId, g);
        // Check write rights
        if (!AccessRights.canWrite(vUser, vEntity, g)) {
          log.error("User does not have edit rights on entity " + entityId);
          throw new AccessForbiddenException(user, entityId);
        }

        OrientVertex vNewEntityVersion = UpdateUtils.createNewVertexVersion(vEntity, (String) vUser.getProperty(DataModel.Properties.id), g);
        for (int i = 0; i < properties.length(); ++i) {
          vNewEntityVersion.setProperty(properties.getJSONObject(i).getString("key"), properties.getJSONObject(i).getString("value"));
        }
        g.commit();
        
        changes.add(entityId);
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

  private static AbstractObject getVertexMetadata(OrientVertex v, OrientVertex vUser, OrientBaseGraph g) throws JSONException, AccessDeniedException, AccessForbiddenException {
    String cl = v.getProperty("@class");
    switch (cl) {
      case DataModel.Classes.set:
        return new StudySet(v, vUser, g);
      case DataModel.Classes.originalSource:
        return new OriginalSource(v, vUser, g);
      case DataModel.Classes.angleOfInterest:
        return new AngleOfInterest(v, vUser, g);
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
      case DataModel.Classes.user:
        return new ColaboratoryUser(vUser, vUser, g);
      default:
        log.warn("No specific handler for extracting metadata from vertex class " + cl);
        return new AbstractObject(v, vUser, g);
    }
  }

  private static AbstractObject getEdgeMetadata(OrientEdge e, OrientVertex vUser, OrientBaseGraph g) {
    String cl = e.getProperty("@class");
    switch (cl) {
      default:
        log.warn("No specific handler for extracting metadata from edge class " + cl);
        return new AbstractObject(e, vUser, g);
    }
  }
}
