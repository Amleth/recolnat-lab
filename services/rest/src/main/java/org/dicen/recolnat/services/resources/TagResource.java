/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package org.dicen.recolnat.services.resources;

import com.codahale.metrics.annotation.Timed;
import com.tinkerpop.blueprints.impls.orient.OrientGraph;
import com.tinkerpop.blueprints.impls.orient.OrientVertex;
import fr.recolnat.database.model.DataModel;
import fr.recolnat.database.utils.AccessRights;
import fr.recolnat.database.utils.AccessUtils;
import java.util.logging.Level;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.Consumes;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;
import org.apache.commons.lang.NotImplementedException;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.dicen.recolnat.services.core.DatabaseAccess;
import org.dicen.recolnat.services.core.SessionManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author dmitri
 */
@Path("/tags")
@Produces(MediaType.APPLICATION_JSON)
public class TagResource {
  private final static Logger log = LoggerFactory.getLogger(TagResource.class);
  
  @POST
  @Consumes(MediaType.APPLICATION_JSON)
  @Path("/get-entity-tags")
  @Timed
  public Response getEntityTags(final JSONObject input, @Context HttpServletRequest request) {
    String session = SessionManager.getSessionId(request, true);
    String user = SessionManager.getUserLogin(session);
    
    String id;
    try {
      id = input.getString("id");
    } catch (JSONException ex) {
      log.warn("Unable to retrieve 'id' from query", ex);
      throw new WebApplicationException("Input query does not have 'id' key.", Status.NOT_ACCEPTABLE);
    }
    
    OrientGraph g = DatabaseAccess.getTransactionalGraph();
    try {
      
      
      
      
    }
    finally {
      g.shutdown(false, false);
    }
    
    throw new NotImplementedException();
  }
  
  @POST
  @Consumes(MediaType.APPLICATION_JSON)
  @Path("/list")
  @Timed
  public Response listTags(final JSONObject input, @Context HttpServletRequest request) {
    throw new NotImplementedException();
  }
  
  @POST
  @Consumes(MediaType.APPLICATION_JSON)
  @Path("/link-tag")
  @Timed
  public Response linkTag(final JSONObject input, @Context HttpServletRequest request) {
    throw new NotImplementedException();
  }
  
  @POST
  @Consumes(MediaType.APPLICATION_JSON)
  @Path("/create-tag")
  @Timed
  public Response createTag(final JSONObject input, @Context HttpServletRequest request) {
    throw new NotImplementedException();
  }
  
  @POST
  @Consumes(MediaType.APPLICATION_JSON)
  @Path("/get-tag")
  @Timed
  public Response getTag(final JSONObject input, @Context HttpServletRequest request) {
    throw new NotImplementedException();
  }
}
