package org.dicen.recolnat.services.core.data;

import com.orientechnologies.orient.core.command.traverse.OTraverse;
import com.orientechnologies.orient.core.exception.OConcurrentModificationException;
import com.tinkerpop.blueprints.Direction;
import com.tinkerpop.blueprints.Vertex;
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
import fr.recolnat.database.model.impl.ColaboratoryImage;
import fr.recolnat.database.model.impl.RegionOfInterest;
import fr.recolnat.database.model.impl.SetView;
import fr.recolnat.database.model.impl.Specimen;
import fr.recolnat.database.model.impl.ColaboratorySet;
import fr.recolnat.database.model.impl.Tag;
import fr.recolnat.database.model.impl.TagDefinition;
import fr.recolnat.database.model.impl.TrailOfInterest;
import fr.recolnat.database.utils.AccessRights;
import fr.recolnat.database.utils.AccessUtils;
import fr.recolnat.database.utils.CreatorUtils;
import fr.recolnat.database.utils.DatabaseUtils;
import fr.recolnat.database.utils.DeleteUtils;
import fr.recolnat.database.utils.UpdateUtils;
import java.nio.file.AccessDeniedException;
import java.util.ArrayList;
import java.util.Date;
import java.util.Iterator;
import java.util.LinkedList;
import java.util.List;
import java.util.Set;
import org.codehaus.jettison.json.JSONException;

import javax.ws.rs.core.Response;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONObject;
import org.dicen.recolnat.services.core.actions.ActionResult;
import org.dicen.recolnat.services.core.actions.ResponseBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class DatabaseResource {

  private static final Logger log = LoggerFactory.getLogger(DatabaseResource.class);

  public static JSONObject getUserData(String userLogin) throws JSONException {
    OrientBaseGraph g = DatabaseAccess.getReaderWriterGraph();
    boolean retry = true;
    while (retry) {
      retry = false;
      try {
        OrientVertex vUser = (OrientVertex) AccessUtils.getUserByLogin(userLogin, g);
        if (vUser == null) {
          // Create user
          vUser = CreatorUtils.createNewUserAndUserData(userLogin, g, DatabaseAccess.rightsDb);
          DatabaseUtils.createTestWorkbench(vUser, g, DatabaseAccess.rightsDb);
          g.commit();
        }
        ColaboratoryUser user = new ColaboratoryUser(vUser, vUser, g, DatabaseAccess.rightsDb);
        return user.toJSON();
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

  public static JSONObject getData(String entityId, String user) throws JSONException, AccessForbiddenException {
    if(log.isDebugEnabled()) {
      log.debug("Entering getData " + entityId + ", " + user);
    }
    JSONObject entity = new JSONObject();
    OrientBaseGraph g = DatabaseAccess.getReadOnlyGraph();
    try {
      OrientVertex vUser = (OrientVertex) AccessUtils.getUserByLogin(user, g);
      OrientVertex v = (OrientVertex) AccessUtils.getNodeById(entityId, g);
      if (v != null) {
        if (!AccessRights.canRead(vUser, v, g, DatabaseAccess.rightsDb)) {
          log.info("User " + user + " is not authorized to access data " + entityId);
          throw new AccessForbiddenException(user, entityId);
        }
        if(log.isDebugEnabled()) {
      log.debug("Accessing vertex metadata for " + entityId + ", " + user);
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
   * @throws org.codehaus.jettison.json.JSONException
   * @throws fr.recolnat.database.exceptions.ResourceNotExistsException
   * @throws fr.recolnat.database.exceptions.AccessForbiddenException
   */
  public static ActionResult remove(final String entityId, final String user) throws JSONException, ResourceNotExistsException, AccessForbiddenException {
    ActionResult res = new ActionResult();
//    List<String> modified = new LinkedList<>();
    boolean retry = true;
    while (retry) {
      retry = false;
      OrientBaseGraph g = DatabaseAccess.getReaderWriterGraph();
      try {
        OrientVertex vUser = (OrientVertex) AccessUtils.getUserByLogin(user, g);
        // Checking deletability is relegated to the method
        Set<String> modified = DeleteUtils.delete(entityId, vUser, g, DatabaseAccess.rightsDb);
        g.commit();
        for(String s: modified) {
          res.addModifiedId(s);
        }
      } catch (OConcurrentModificationException e) {
        log.warn("Database busy, retrying operation");
        retry = true;
      } finally {
        g.rollback();
        g.shutdown();
      }
    }

    return res;
  }

  public static List<String> addAnnotation(final String parentObjectId, final String annotationText, final String user) throws JSONException, AccessForbiddenException {
    List<String> changes = new ArrayList<>();
    boolean retry = true;
    while (retry) {
      retry = false;
      OrientBaseGraph g = DatabaseAccess.getReaderWriterGraph();
      try {
        OrientVertex vUser = AccessUtils.getUserByLogin(user, g);
        OrientVertex vEntity = AccessUtils.getNodeById(parentObjectId, g);
        // Check write rights
        if (!AccessRights.canWrite(vUser, vEntity, g, DatabaseAccess.rightsDb)) {
          log.info("User not allowed to add annotation to " + parentObjectId);
          throw new AccessForbiddenException(user, parentObjectId);
        }
        // Create annotation of the right type
        OrientVertex vAnnotation = CreatorUtils.createAnnotation(annotationText, g);
        // Link annotation to polygon
        UpdateUtils.linkAnnotationToEntity(vAnnotation, vEntity, (String) vUser.getProperty(DataModel.Properties.id), g);
        // Link annotation to creator user
        UpdateUtils.addCreator(vAnnotation, vUser, g, DatabaseAccess.rightsDb);
        g.commit();
        
        // Grant creator rights
        AccessRights.grantAccessRights(vUser, vAnnotation, DataModel.Enums.AccessRights.WRITE, DatabaseAccess.rightsDb);

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
      OrientBaseGraph g = DatabaseAccess.getReaderWriterGraph();
      try {
        OrientVertex vUser = AccessUtils.getUserByLogin(user, g);
        OrientVertex vEntity = AccessUtils.getNodeById(entityId, g);
        // Check write rights
        if (!AccessRights.canWrite(vUser, vEntity, g, DatabaseAccess.rightsDb)) {
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

  public static ActionResult getAnnotationsOfEntity(String entityId, String user) throws JSONException, AccessForbiddenException {
    ActionResult res = new ActionResult();
    JSONArray annotations = new JSONArray();

    boolean retry = true;
    while (retry) {
      retry = false;
      OrientBaseGraph g = DatabaseAccess.getReadOnlyGraph();
      try {
        OrientVertex vUser = AccessUtils.getUserByLogin(user, g);
        OrientVertex vEntity = AccessUtils.getNodeById(entityId, g);
        if (!AccessRights.canRead(vUser, vEntity, g, DatabaseAccess.rightsDb)) {
          log.error("User does not have edit rights on entity " + entityId);
          throw new AccessForbiddenException(user, entityId);
        }
        // Identify entity type and find sub-entities and their annotations
        switch ((String) vEntity.getProperty("@class")) {
          case DataModel.Classes.set:
            DatabaseResource.addAnnotations(vEntity, entityId, null, null, vUser, annotations, g);
            Iterator<Vertex> itContent = vEntity.getVertices(Direction.OUT, DataModel.Links.containsItem).iterator();
            while (itContent.hasNext()) {
              OrientVertex vSetContent = (OrientVertex) itContent.next();
              if (AccessUtils.isLatestVersion(vSetContent)) {
                if (AccessRights.canRead(vUser, vSetContent, g, DatabaseAccess.rightsDb)) {
                  String specimenId = (String) vSetContent.getProperty(DataModel.Properties.id);
                  DatabaseResource.addAnnotations(vSetContent, entityId, specimenId, null, vUser, annotations, g);
                  Iterator<Vertex> it = vSetContent.getVertices(Direction.OUT, DataModel.Links.hasImage).iterator();
                  while (it.hasNext()) {
                    OrientVertex vImage = (OrientVertex) it.next();
                    if (AccessUtils.isLatestVersion(vImage)) {
                      if (AccessRights.canRead(vUser, vImage, g, DatabaseAccess.rightsDb)) {
                        String imageId = (String) vImage.getProperty(DataModel.Properties.id);
                        DatabaseResource.addAnnotations(vImage, entityId, specimenId, imageId, vUser, annotations, g);
                        Iterator<Vertex> itImageElements = vImage.getVertices(Direction.OUT, DataModel.Links.aoi, DataModel.Links.roi, DataModel.Links.poi, DataModel.Links.toi).iterator();
                        while (itImageElements.hasNext()) {
                          OrientVertex vImageElement = (OrientVertex) itImageElements.next();
                          if (AccessUtils.isLatestVersion(vImageElement)) {
                            if (AccessRights.canRead(vUser, vImageElement, g, DatabaseAccess.rightsDb)) {
                              DatabaseResource.addAnnotations(vImageElement, entityId, specimenId, imageId, vUser, annotations, g);
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }

            break;
          case DataModel.Classes.specimen:
            String specimenId = (String) vEntity.getProperty(DataModel.Properties.id);
            DatabaseResource.addAnnotations(vEntity, entityId, specimenId, null, vUser, annotations, g);
            Iterator<Vertex> it = vEntity.getVertices(Direction.OUT, DataModel.Links.hasImage).iterator();
            while (it.hasNext()) {
              OrientVertex vImage = (OrientVertex) it.next();
              if (AccessUtils.isLatestVersion(vImage)) {
                if (AccessRights.canRead(vUser, vImage, g, DatabaseAccess.rightsDb)) {
                  String imageId = (String) vImage.getProperty(DataModel.Properties.id);
                  DatabaseResource.addAnnotations(vImage, entityId, specimenId, imageId, vUser, annotations, g);
                  Iterator<Vertex> itImageElements = vImage.getVertices(Direction.OUT, DataModel.Links.aoi, DataModel.Links.roi, DataModel.Links.poi, DataModel.Links.toi).iterator();
                  while (itImageElements.hasNext()) {
                    OrientVertex vImageElement = (OrientVertex) itImageElements.next();
                    if (AccessUtils.isLatestVersion(vImageElement)) {
                      if (AccessRights.canRead(vUser, vImageElement, g, DatabaseAccess.rightsDb)) {
                        DatabaseResource.addAnnotations(vImageElement, entityId, specimenId, imageId, vUser, annotations, g);
                      }
                    }
                  }
                }
              }
            }
            break;
          case DataModel.Classes.image:
            DatabaseResource.addAnnotations(vEntity, null, null, entityId, vUser, annotations, g);
            // If image is accessible, its specimen is accessible as well. However for images not tied to a specimen this cannot be provided.
            specimenId = null;
            Iterator<Vertex> itSpecimens = vEntity.getVertices(Direction.IN, DataModel.Links.hasImage).iterator();
            if(itSpecimens.hasNext()) {
              specimenId = itSpecimens.next().getProperty(DataModel.Properties.id);
            }
            
            Iterator<Vertex> itImageElements = vEntity.getVertices(Direction.OUT, DataModel.Links.aoi, DataModel.Links.roi, DataModel.Links.poi, DataModel.Links.toi).iterator();
            while (itImageElements.hasNext()) {
              OrientVertex vImageElement = (OrientVertex) itImageElements.next();
              if (AccessUtils.isLatestVersion(vImageElement)) {
                if (AccessRights.canRead(vUser, vImageElement, g, DatabaseAccess.rightsDb)) {
                  DatabaseResource.addAnnotations(vImageElement, null, specimenId, entityId, vUser, annotations, g);
                }
              }
            }
            break;
        }
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

    res.setResponse("annotations", annotations);
    return res;
  }

  private static void addAnnotations(OrientVertex v, String parentSet, String parentSpecimen, String parentImage, OrientVertex vUser, JSONArray annotations, OrientBaseGraph g) throws JSONException {
    Iterator<Vertex> itAnnots = v.getVertices(Direction.OUT, DataModel.Links.hasAnnotation, DataModel.Links.hasMeasurement).iterator();
    while (itAnnots.hasNext()) {
      OrientVertex vAnnot = (OrientVertex) itAnnots.next();
      if (AccessRights.canRead(vUser, vAnnot, g, DatabaseAccess.rightsDb)) {
        if (AccessUtils.isLatestVersion(vAnnot)) {
          JSONObject jAnnot = new JSONObject();
          jAnnot.put("uid", (String) vAnnot.getProperty(DataModel.Properties.id));
          jAnnot.put("title", (String) v.getProperty(DataModel.Properties.name));
          jAnnot.put("created", (Long) v.getProperty(DataModel.Properties.creationDate));
          jAnnot.put("inEntity", (String) v.getProperty(DataModel.Properties.id));
          jAnnot.put("inImage", parentImage);
          jAnnot.put("inSpecimen", parentSpecimen);
          jAnnot.put("inSet", parentSet);

          Integer mType = (Integer) vAnnot.getProperty(DataModel.Properties.measureType);
          if (mType == null) {
            // This is an annotation
            jAnnot.put("value", (String) vAnnot.getProperty(DataModel.Properties.content));
            jAnnot.put("type", "Text");
          } else {
            // This is a measurement, so we need to work with value in px
            Double pxValue = (Double) vAnnot.getProperty(DataModel.Properties.pxValue);
            if(pxValue == 0) {
              // This is caused by a bad versioning on older databases.
              return;
            }
            jAnnot.put("value", pxValue);
            switch ((Integer) vAnnot.getProperty(DataModel.Properties.measureType)) {
              case 100:
                jAnnot.put("type", "Area");
                break;
              case 101:
                jAnnot.put("type", "Perimeter");
                break;
              case 102:
                jAnnot.put("type", "Length");
                break;
              case 103:
                jAnnot.put("type", "Angle");
                break;
              default:
                jAnnot.put("type", "Unknown");
                break;
            }
          }
          annotations.put(jAnnot);
        }
      }
    }
  }

  private static AbstractObject getVertexMetadata(OrientVertex v, OrientVertex vUser, OrientBaseGraph g) throws JSONException, AccessDeniedException, AccessForbiddenException {
    String cl = v.getProperty("@class");
    switch (cl) {
      case DataModel.Classes.set:
        return new ColaboratorySet(v, vUser, g, DatabaseAccess.rightsDb);
      case DataModel.Classes.originalSource:
        return new OriginalSource(v, vUser, g, DatabaseAccess.rightsDb);
      case DataModel.Classes.angleOfInterest:
        return new AngleOfInterest(v, vUser, g, DatabaseAccess.rightsDb);
      case DataModel.Classes.pointOfInterest:
        return new PointOfInterest(v, vUser, g, DatabaseAccess.rightsDb);
      case DataModel.Classes.regionOfInterest:
        return new RegionOfInterest(v, vUser, g, DatabaseAccess.rightsDb);
      case DataModel.Classes.trailOfInterest:
        return new TrailOfInterest(v, vUser, g, DatabaseAccess.rightsDb);
      case DataModel.Classes.annotation:
        String content = v.getProperty(DataModel.Properties.content);
        switch(content) {
          case DataModel.Classes.measureStandard:
            return new MeasureStandard(v, vUser, g, DatabaseAccess.rightsDb);
          default:
            return new Annotation(v, vUser, g, DatabaseAccess.rightsDb);
        }
      case DataModel.Classes.image:
        return new ColaboratoryImage(v, vUser, g, DatabaseAccess.rightsDb);
      case DataModel.Classes.specimen:
        return new Specimen(v, vUser, g, DatabaseAccess.rightsDb);
      case DataModel.Classes.setView:
        return new SetView(v, vUser, g, DatabaseAccess.rightsDb);
      case DataModel.Classes.user:
        return new ColaboratoryUser(vUser, vUser, g, DatabaseAccess.rightsDb);
      case DataModel.Classes.tag:
        return new TagDefinition(v, vUser, g, DatabaseAccess.rightsDb);
      case DataModel.Classes.tagging:
        return new Tag(v, vUser, g, DatabaseAccess.rightsDb);
      default:
        log.warn("No specific handler for extracting metadata from vertex class " + cl);
        return new AbstractObject(v, vUser, g, DatabaseAccess.rightsDb);
    }
  }

  private static AbstractObject getEdgeMetadata(OrientEdge e, OrientVertex vUser, OrientBaseGraph g) {
    String cl = e.getProperty("@class");
    switch (cl) {
      default:
        log.warn("No specific handler for extracting metadata from edge class " + cl);
        return new AbstractObject(e, vUser, g, DatabaseAccess.rightsDb);
    }
  }
}
