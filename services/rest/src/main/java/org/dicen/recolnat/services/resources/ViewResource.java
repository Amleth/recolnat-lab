/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package org.dicen.recolnat.services.resources;

import com.codahale.metrics.annotation.Timed;
import com.orientechnologies.orient.core.exception.OConcurrentModificationException;
import com.tinkerpop.blueprints.impls.orient.OrientEdge;
import com.tinkerpop.blueprints.impls.orient.OrientGraph;
import com.tinkerpop.blueprints.impls.orient.OrientVertex;
import fr.recolnat.database.model.DataModel;
import fr.recolnat.database.utils.AccessRights;
import fr.recolnat.database.utils.AccessUtils;
import fr.recolnat.database.utils.UpdateUtils;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.dicen.recolnat.services.core.DatabaseAccess;
import org.dicen.recolnat.services.core.SessionManager;

/**
 *
 * @author dmitri
 */
@Path("/view")
@Produces(MediaType.APPLICATION_JSON)
public class ViewResource {

  @POST
  @Path("/place")
  @Timed
  public Response placeEntityInView(final String input, @Context HttpServletRequest request) throws JSONException {
    String session = SessionManager.getSessionId(request, true);
    String user = SessionManager.getUserLogin(session);

    JSONObject message = new JSONObject(input);
    String viewId = message.getString("view");
    String entityId = message.getString("entity");
    Integer x = message.getInt("x");
    Integer y = message.getInt("y");

    JSONObject ret = new JSONObject();
    ret.put("view", viewId);
    ret.put("entity", entityId);
    boolean retry = true;
    while (retry) {
      retry = false;
      OrientGraph g = DatabaseAccess.getTransactionalGraph();
      try {
        OrientVertex vUser = AccessUtils.getUserByLogin(user, g);
        OrientVertex vView = AccessUtils.getView(viewId, g);
        OrientVertex vEntity = AccessUtils.getNodeById(entityId, g);
        if (!AccessRights.canWrite(vUser, vView, g)) {
          throw new WebApplicationException(Status.FORBIDDEN);
        }
        if (!AccessRights.canRead(vUser, vEntity, g)) {
          throw new WebApplicationException(Status.FORBIDDEN);
        }

        OrientEdge eLink = UpdateUtils.showItemInView(x, y, vEntity, vView, vUser, g);
        g.commit();

        ret.put("x", x);
        ret.put("y", y);
        ret.put("link", (String) eLink.getProperty(DataModel.Properties.id));
      } catch (OConcurrentModificationException e) {
        retry = true;
      } finally {
        g.rollback();
        g.shutdown();
      }
    }

    return Response.ok(ret.toString(), MediaType.APPLICATION_JSON_TYPE).build();
  }

  @POST
  @Path("/move")
  @Timed
  public Response moveEntityInView(final String input, @Context HttpServletRequest request) throws JSONException {
    String session = SessionManager.getSessionId(request, true);
    String user = SessionManager.getUserLogin(session);

    JSONObject message = new JSONObject(input);
    String viewId = message.getString("view");
    String linkId = message.getString("link");
    String entityId = message.getString("entity");
    Integer x = message.getInt("x");
    Integer y = message.getInt("y");

    JSONObject ret = new JSONObject();
    ret.put("view", viewId);
    ret.put("link", linkId);
    ret.put("entity", entityId);
    OrientGraph g = DatabaseAccess.getTransactionalGraph();
    try {
      OrientVertex vUser = AccessUtils.getUserByLogin(user, g);
      OrientVertex vView = AccessUtils.getView(viewId, g);
      OrientVertex vEntity = AccessUtils.getNodeById(entityId, g);
      OrientEdge eLink = AccessUtils.getEdgeById(linkId, g);

      if (!AccessRights.canWrite(vUser, vView, g)) {
        throw new WebApplicationException(Status.FORBIDDEN);
      }
      if (!AccessRights.canRead(vUser, vEntity, g)) {
        throw new WebApplicationException(Status.FORBIDDEN);
      }

      eLink.setProperties(DataModel.Properties.coordX, x, DataModel.Properties.coordY, y);
      g.commit();
      ret.put("x", x);
      ret.put("y", y);
    } catch (OConcurrentModificationException e) {
      OrientEdge edge = AccessUtils.getEdgeById(linkId, g);
      ret.put("x", (Integer) edge.getProperty(DataModel.Properties.coordX));
      ret.put("y", (Integer) edge.getProperty(DataModel.Properties.coordY));
    } finally {
      g.rollback();
      g.shutdown();
    }

    return Response.ok(ret.toString(), MediaType.APPLICATION_JSON_TYPE).build();
  }

  @POST
  @Path("/resize")
  @Timed
  public Response resizeEntityInView(final String input, @Context HttpServletRequest request) throws JSONException {
    String session = SessionManager.getSessionId(request, true);
    String user = SessionManager.getUserLogin(session);

    JSONObject message = new JSONObject(input);
    String viewId = message.getString("view");
    String linkId = message.getString("link");
    String entityId = message.getString("entity");
    Integer width = message.getInt("width");
    Integer height = message.getInt("height");

    boolean retry = true;
    while (retry) {
      retry = false;
      OrientGraph g = DatabaseAccess.getTransactionalGraph();
      try {
        OrientVertex vUser = AccessUtils.getUserByLogin(user, g);
        OrientVertex vView = AccessUtils.getView(viewId, g);
        OrientVertex vEntity = AccessUtils.getNodeById(entityId, g);
        OrientEdge eLink = AccessUtils.getEdgeById(linkId, g);

        if (!AccessRights.canWrite(vUser, vView, g)) {
          throw new WebApplicationException(Status.FORBIDDEN);
        }
        if (!AccessRights.canRead(vUser, vEntity, g)) {
          throw new WebApplicationException(Status.FORBIDDEN);
        }

        eLink.setProperties(DataModel.Properties.width, width, DataModel.Properties.height, height);
        g.commit();
      } catch (OConcurrentModificationException e) {
        retry = true;
      } finally {
        g.rollback();
        g.shutdown();
      }
    }

    return Response.ok().build();
  }
}
