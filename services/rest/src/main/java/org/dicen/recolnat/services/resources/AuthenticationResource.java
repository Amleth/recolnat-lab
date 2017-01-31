package org.dicen.recolnat.services.resources;

import com.codahale.metrics.annotation.Timed;
import com.tinkerpop.blueprints.Vertex;
import com.tinkerpop.blueprints.impls.orient.OrientBaseGraph;
import com.tinkerpop.blueprints.impls.orient.OrientVertex;
import fr.recolnat.authentication.CASAuthentication;
import fr.recolnat.database.model.DataModel;
import fr.recolnat.database.utils.AccessUtils;
import fr.recolnat.database.utils.CreatorUtils;
import fr.recolnat.database.utils.DatabaseUtils;
import java.io.IOException;
import java.net.ConnectException;
import java.nio.file.AccessDeniedException;
import javax.servlet.http.HttpServletRequest;
import org.codehaus.jettison.json.JSONException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.ws.rs.*;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.NewCookie;
import javax.ws.rs.core.Response;
import org.codehaus.jettison.json.JSONObject;
import org.dicen.recolnat.services.core.SessionManager;

/**
 * Created by Dmitri Voitsekhovitch (dvoitsekh@gmail.com) on 08/07/15.
 */
@Path("/authentication")
@Produces(MediaType.APPLICATION_JSON)
public class AuthenticationResource {

  private final static Logger log = LoggerFactory.getLogger(AuthenticationResource.class);

  @POST
  @Consumes(MediaType.APPLICATION_JSON)
  @Path("/post")
  @Timed
  public Response post(final String input, @QueryParam("pgtIou") String pgtIou, @QueryParam("pgtId") String pgtId) throws JSONException {
    if (log.isTraceEnabled()) {
      log.trace(pgtId);
      log.trace(pgtIou);
      log.trace(input);
    }
    return Response.ok().build();
  }

  @POST
  @Consumes(MediaType.APPLICATION_JSON)
  @Path("/post-protected")
  @Timed
  public Response postProtected(final String input) throws JSONException {
    return Response.ok().build();
  }

  @GET
  @Path("/is-user-authenticated")
  @Timed
  public Response isUserAuthenticated(@Context HttpServletRequest request) {
    if (log.isTraceEnabled()) {
      log.trace(request.toString());
    }

    // Does session cookie and session exist ?
    String session = SessionManager.getSessionId(request, false);
    String tgt = CASAuthentication.getCASTGT(request.getCookies());
    String userId = null;

    if (session != null) {
      String user = SessionManager.getUserLogin(session);
      if (user != null) {
        // Check CASTGC existence to see if user logged with CAS (check ticket expiration as well)
        if (tgt != null) {
          try {
            CASAuthentication.getCASUserLogin(tgt);
          } catch (AccessDeniedException ex) {
            if(log.isInfoEnabled()) {
              log.info("Authentication denied by CAS");
            }
            return Response.status(Response.Status.FORBIDDEN).build();
//            throw new WebApplicationException("Authentication denied by CAS.", Response.Status.FORBIDDEN);
          } catch (ConnectException ex) {
            if(log.isInfoEnabled()) {
              log.info("No authentication provided.");
            }
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).build();
//            throw new WebApplicationException("Server error while authenticating with CAS.", Response.Status.INTERNAL_SERVER_ERROR);
          } catch (IOException ex) {
            log.error("I/O Error while reading CAS response.", ex);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).build();
//            throw new WebApplicationException("Server error while reading CAS I/O.", Response.Status.INTERNAL_SERVER_ERROR);
          }
          userId = SessionManager.getUserId(session);

          JSONObject response = new JSONObject();
          try {
            response.put("userLogin", user);
            response.put("userId", userId);
          } catch (JSONException ex) {
            log.error("Unable to create JSON for some reason", ex);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).build();
//            throw new WebApplicationException("Server error while preparing response", Response.Status.INTERNAL_SERVER_ERROR);
          }

          return Response.ok(response.toString(), MediaType.APPLICATION_JSON_TYPE).build();
        }
        SessionManager.expireSession(session);
        log.info("CAS session expired.");
        return Response.status(Response.Status.UNAUTHORIZED).build();
//        throw new WebApplicationException("Session has expired with CAS. New login required.", Response.Status.UNAUTHORIZED);
      }
    }

    // No session.
    if (log.isTraceEnabled()) {
      log.trace("No session found.");
    }

    // Check CASTGC and call CAS to verify authenticity
    if (tgt == null) {
      log.info("No CAS cookie found");
      return Response.status(Response.Status.UNAUTHORIZED).build();
//      throw new WebApplicationException("Not logged with CAS.", Response.Status.UNAUTHORIZED);
    }

    String user = null;
    try {
      user = CASAuthentication.getCASUserLogin(tgt);
    } catch (AccessDeniedException ex) {
      if(log.isInfoEnabled()) {
        log.info("Error while authenticating with CAS.");
      }
      return Response.status(Response.Status.FORBIDDEN).build();
//      throw new WebApplicationException("Authentication denied by CAS.", Response.Status.FORBIDDEN);
    } catch (ConnectException ex) {
      if(log.isInfoEnabled()) {
        log.info("Error while authenticating with CAS.");
      }
      return Response.status(Response.Status.FORBIDDEN).build();
//      throw new WebApplicationException("Server error while authenticating with CAS.", Response.Status.INTERNAL_SERVER_ERROR);
    } catch (IOException ex) {
      log.error("I/O Error while reading CAS response.", ex);
      return Response.status(Response.Status.INTERNAL_SERVER_ERROR).build();
//      throw new WebApplicationException("Server error while reading CAS I/O.", Response.Status.INTERNAL_SERVER_ERROR);
    }

    // Add user session
    session = SessionManager.newSession(userId, user);

    // A cookie for a year, HTTP-Only, secure
    NewCookie sessionCookie = new NewCookie("labSessionId",
        session,
        "/",
        "",
        "Collaboratory session Id",
        NewCookie.DEFAULT_MAX_AGE,
        false,
        true);

    JSONObject response = new JSONObject();
    try {
      response.put("authorized", true);
    } catch (JSONException ex) {
      log.error("Unable to create JSON for some reason", ex);
      throw new WebApplicationException("Server error while preparing response", Response.Status.INTERNAL_SERVER_ERROR);
    }

//    if(log.isTraceEnabled()) {
//      log.trace("Returning response " + response.toString());
//    }
    return Response.ok(response.toString(), MediaType.APPLICATION_JSON_TYPE).cookie(sessionCookie).build();
  }

  @GET
  @Path("/get-token")
  @Timed
  public Response getToken(@Context HttpServletRequest request) throws JSONException {
    String session = SessionManager.getSessionId(request, true);
    String token = SessionManager.getOneUseSecurityToken(session);

    JSONObject response = new JSONObject();
    response.put("token", token);

    return Response.ok(response.toString(), MediaType.APPLICATION_JSON_TYPE).build();
  }

  @POST
  @Consumes(MediaType.APPLICATION_JSON)
  @Path("/check-token")
  @Timed
  public Response checkToken(final String input, @Context HttpServletRequest request) throws JSONException, IllegalAccessException {
    String session = SessionManager.getSessionId(request, true);
    JSONObject params = new JSONObject(input);
    String token = params.getString("token");

    if (!SessionManager.useSecurityToken(session, token)) {
      throw new IllegalAccessException("Token not authorized " + token);
    }

    String user = SessionManager.getUserLogin(session);

    JSONObject response = new JSONObject();
    response.put("user", user);

    return Response.ok(response.toString(), MediaType.APPLICATION_JSON_TYPE).build();
  }
}
