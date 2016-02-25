/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package org.dicen.recolnat.services.resources;

import com.codahale.metrics.annotation.Timed;
import com.tinkerpop.blueprints.impls.orient.OrientGraph;
import java.nio.file.AccessDeniedException;
import java.util.Calendar;
import java.util.Date;
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
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.dicen.recolnat.services.core.DatabaseAccess;
import org.dicen.recolnat.services.core.SessionManager;
import org.dicen.recolnat.services.core.logbook.Log;
import org.joda.time.DateTime;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author dmitri
 */
@Path("/user-profile")
@Produces(MediaType.APPLICATION_JSON)
public class UserProfileResource {

  private final static Logger log = LoggerFactory.getLogger(UserProfileResource.class);

  /**
   * Returns the actions made by the user or user group.
   *
   * @param input May contain user login (may be a group), begin date, end date
   * identification
   * @param request
   * @return
   * @throws JSONException
   */
  @POST
  @Consumes(MediaType.APPLICATION_JSON)
  @Path("/get-recent-activity")
  @Timed
  public String getRecentActivity(final String input, @Context HttpServletRequest request) throws JSONException {
    String session = SessionManager.getSessionId(request, true);
    String user = SessionManager.getUserLogin(session);
    String requestedUser = SessionManager.getUserId(session);
    Long beginDate = Long.MIN_VALUE;
    Long endDate = Long.MAX_VALUE;

    JSONObject params = null;
    try {
      params = new JSONObject(input);
    } catch (JSONException e) {
      // Optional parameters not found. Continue.
    }

    if (params != null) {
      try {
        requestedUser = params.getString("user");
      } catch (JSONException e) {
        // Optional parameters not found. Continue.
      }

      try {
        beginDate = params.getLong("begin");
      } catch (JSONException e) {
        // Optional parameters not found. Continue.
      }

      try {
        endDate = params.getLong("end");
      } catch (JSONException e) {
        // Optional parameters not found. Continue.
      }
    }
    
    if(log.isDebugEnabled()) {
      log.debug("begin=" + beginDate + " end=" + endDate);
    }
    
    OrientGraph g = DatabaseAccess.getTransactionalGraph();
    try {
      try {
        Log l = new Log(requestedUser, beginDate, endDate, user, g);
        return l.toJSON().toString();
      } catch (AccessDeniedException ex) {
        log.info("Access denied to user", ex);
        throw new WebApplicationException("Access denied", Response.Status.UNAUTHORIZED);
      }
    } finally {
      g.rollback();
      g.shutdown();
    }
  }
  
  
}
