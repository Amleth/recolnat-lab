package org.dicen.recolnat.services.resources;

import com.codahale.metrics.annotation.Timed;
import com.google.common.base.Optional;
import com.orientechnologies.orient.core.exception.OConcurrentModificationException;
import com.tinkerpop.blueprints.Direction;
import com.tinkerpop.blueprints.Vertex;
import com.tinkerpop.blueprints.impls.orient.OrientEdge;
import com.tinkerpop.blueprints.impls.orient.OrientGraph;
import com.tinkerpop.blueprints.impls.orient.OrientVertex;
import fr.recolnat.database.model.DataModel;
import fr.recolnat.database.model.impl.Study;
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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import java.util.Iterator;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.Response;
import org.dicen.recolnat.services.core.SessionManager;

/**
 * Created by Dmitri Voitsekhovitch (dvoitsekh@gmail.com) on 24/04/15.
 */
@Path("/study")
@Produces(MediaType.APPLICATION_JSON)
public class StudyResource {

  private final static Logger log = LoggerFactory.getLogger(StudyResource.class);

  public StudyResource() {
    if (log.isTraceEnabled()) {
      log.trace("New resource created");
    }
  }
  
  @GET
  @Path("/list-user-studies")
  @Timed
  public Response listUserStudies(@Context HttpServletRequest request) throws JSONException {
    String session = SessionManager.getSessionId(request, true);
    String user = SessionManager.getUserLogin(session);
    
    JSONArray listOfStudies = new JSONArray();
    OrientGraph g = DatabaseAccess.getTransactionalGraph();
    try {
      OrientVertex vUser = AccessUtils.getUserByLogin(user, g);
      
      Iterator<Vertex> itStudies = vUser.getVertices(Direction.OUT, DataModel.Links.studies).iterator();
      while(itStudies.hasNext()) {
        OrientVertex vStudy = (OrientVertex) itStudies.next();
        try {
        Study study = new Study(vStudy, vUser, g);
        listOfStudies.put(study.toJSON());
        } catch (AccessDeniedException ex) {
          // Do nothing, move on to next study
        }
      }
    }
    finally {
      g.rollback();
      g.shutdown();
    }
    
    return Response.ok(listOfStudies.toString(), MediaType.APPLICATION_JSON_TYPE).build();
  }
  
  @GET
  @Path("/get-study")
  @Timed
  public Response getStudy(@QueryParam("id") Optional<String> id, @Context HttpServletRequest request) throws JSONException {
    String session = SessionManager.getSessionId(request, true);
    String user = SessionManager.getUserLogin(session);
    String studyId = id.orNull();
    
    OrientGraph g = DatabaseAccess.getTransactionalGraph();
    Study study = null;
    try {
      OrientVertex vUser = AccessUtils.getUserByLogin(user, g);
      OrientVertex vStudy = AccessUtils.getNodeById(studyId, g);
      
      if(vStudy == null) {
        throw new WebApplicationException(Response.Status.NOT_FOUND);
      }
      
      study = new Study(vStudy, vUser, g);
    }
    catch (AccessDeniedException ex) {
      if(log.isDebugEnabled()) {
        log.debug("User " + user + " not authorized to access resource " + studyId);
        throw new WebApplicationException(Response.Status.FORBIDDEN);
      }
    }    
    finally {
      g.rollback();
      g.shutdown();
    }
    
    if(study == null) {
      throw new WebApplicationException(Response.Status.INTERNAL_SERVER_ERROR);
    }
    return Response.ok(study.toJSON().toString(), MediaType.APPLICATION_JSON_TYPE).build();
  }
  
  @POST
  @Path("/create-study")
  @Consumes(MediaType.APPLICATION_JSON)
  @Timed
  public Response createStudy(final String input, @Context HttpServletRequest request) throws JSONException {
    JSONObject params = new JSONObject(input);
    String session = SessionManager.getSessionId(request, true);
    String user = SessionManager.getUserLogin(session);
    String name = (String) params.get("name");
    JSONObject ret = new JSONObject();
   
    boolean retry = true;
    while(retry) {
      retry = false;
      OrientGraph g = DatabaseAccess.getTransactionalGraph();
      try {
        OrientVertex vUser = AccessUtils.getUserByLogin(user, g);
        String userId = (String) vUser.getProperty(DataModel.Properties.id);
        OrientVertex vStudy = CreatorUtils.createStudy(name, vUser, g);
        OrientVertex vCoreSet = CreatorUtils.createSet(name, DataModel.Globals.SET_ROLE, g);
        
        UpdateUtils.link(vStudy, vCoreSet, DataModel.Links.hasCoreSet, userId, g);
        UpdateUtils.addCreator(vCoreSet, vUser, g);
        AccessRights.grantAccessRights(vUser, vCoreSet, DataModel.Enums.AccessRights.WRITE, g);
        
        ret.put("study", (String) vStudy.getProperty(DataModel.Properties.id));
        ret.put("coreSet", (String) vCoreSet.getProperty(DataModel.Properties.id));
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
    
    return Response.ok(ret.toString(), MediaType.APPLICATION_JSON_TYPE).build();
  }
}
