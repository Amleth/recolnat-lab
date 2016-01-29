package org.dicen.recolnat.services.resources;

import com.codahale.metrics.annotation.Timed;
import com.tinkerpop.blueprints.Edge;
import com.tinkerpop.blueprints.impls.orient.OrientGraph;
import com.tinkerpop.blueprints.impls.orient.OrientGraphNoTx;
import com.tinkerpop.blueprints.impls.orient.OrientVertex;
import fr.recolnat.database.model.DataModel;
import fr.recolnat.database.model.StructureBuilder;
import fr.recolnat.database.utils.AccessRights;
import fr.recolnat.database.utils.AccessUtils;
import fr.recolnat.database.utils.DatabaseTester;
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
    if(log.isTraceEnabled()) {
      log.trace("Entering with id=" + id);
    }
    String session = SessionManager.getSessionId(request, true);
    String user = SessionManager.getUserLogin(session);
    JSONObject data = new JSONObject();
    
    OrientGraph g = DatabaseAccess.getTransactionalGraph();
    try {
      OrientVertex vUser = (OrientVertex) AccessUtils.getUserByLogin(user, g);
      OrientVertex v = (OrientVertex) AccessUtils.getNodeById(id, g);
      if(v != null) {
        if(AccessRights.getAccessRights(vUser, v, g).value() == DataModel.Enums.AccessRights.NONE.value()) {
          throw new WebApplicationException("User not authorized to access data", Response.Status.UNAUTHORIZED);
        }
        Iterator<String> itKeys = v.getPropertyKeys().iterator();
        while(itKeys.hasNext()) {
          String key = itKeys.next();
          Object value = v.getProperty(key);
          data.put(key, value);
        }
      }
      else {
        Edge e = AccessUtils.getEdgeById(id, g);
        // Perhaps we should check access rights on both sides of the edge ?
        if(e != null) {
        Iterator<String> itKeys = e.getPropertyKeys().iterator();
        while(itKeys.hasNext()) {
          String key = itKeys.next();
          Object value = e.getProperty(key);
          data.put(key, value);
        } 
        }
        else {
          throw new WebApplicationException("Object not found", Response.Status.NOT_FOUND);
        }
      }
    }
    catch (JSONException ex) {
      log.error("Unable to put element in JSON");
      throw new WebApplicationException("Server error while writing response", Response.Status.INTERNAL_SERVER_ERROR);
    }    finally {
      g.rollback();
      g.shutdown(false);
    }
    
    return Response.ok(data.toString(), MediaType.APPLICATION_JSON_TYPE).build();
  }
  
  @POST
  @Path("/remove")
  @Timed
  public Response remove(final String input, @Context HttpServletRequest request) {
    String session = SessionManager.getSessionId(request, true);
    String user = SessionManager.getUserLogin(session);
    String idOfElementToDelete = null;
    
    try {
      JSONObject jsonInput = new JSONObject(input);
      idOfElementToDelete = jsonInput.getString("id");
    } catch (JSONException ex) {
      log.error("Unable to serialize input data as JSON: " + input);
      throw new WebApplicationException("Input error", Response.Status.BAD_REQUEST);
    }
    
    OrientGraph g = DatabaseAccess.getTransactionalGraph();
    try {
    // Don't forget to check user's rights to delete (cannot delete if object is shared
    // The id may refer to an edge or a vertex requiring different approach.
    // If it is a vertex we must also do some filtering
    } finally {
      g.rollback();
      g.shutdown(false);
    }
    
    return Response.ok("", MediaType.APPLICATION_JSON_TYPE).build();
  }

//  @POST
//  @Path("/create-test-data")
//  @Timed
//  public String createTest(final String input) throws JSONException {
//    OrientGraph g = DatabaseAccess.getTransactionalGraph();
//    try {
//      DatabaseTester.createTestWorkbench(g);
//      g.commit();
//    }
//    finally {
//      g.rollback();
//      g.shutdown(false);
//    }
//    return Globals.OK;
//  }
}
