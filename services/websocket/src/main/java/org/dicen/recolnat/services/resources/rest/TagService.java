/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package org.dicen.recolnat.services.resources.rest;

import com.tinkerpop.blueprints.Vertex;
import com.tinkerpop.blueprints.impls.orient.OrientBaseGraph;
import com.tinkerpop.blueprints.impls.orient.OrientVertex;
import fr.recolnat.database.model.DataModel;
import fr.recolnat.database.utils.TagUtils;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Set;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.dicen.recolnat.services.core.data.DatabaseAccess;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author dmitri
 */
@Path("/tags")
@Produces(MediaType.APPLICATION_JSON)
public class TagService {

  private final static Logger LOG = LoggerFactory.getLogger(TagService.class);

  @GET
  @Path("/query/key")
  public Response queryKey(@QueryParam("begin") String begin) throws JSONException {
    if (begin == null) {
      return Response.status(Response.Status.BAD_REQUEST).build();
    }
    JSONObject response = new JSONObject();
    response.put("success", true);

    Set<String> matches = new HashSet<>();
    JSONArray results = new JSONArray();

    OrientBaseGraph g = DatabaseAccess.getReadOnlyGraph();
    try {
      Iterator<Vertex> itTagDefs = g.getVerticesOfClass(DataModel.Classes.tag).iterator();
      while (itTagDefs.hasNext()) {
        OrientVertex vTagDef = (OrientVertex) itTagDefs.next();
        String key = vTagDef.getProperty(DataModel.Properties.key);
        String uid = (String) vTagDef.getProperty(DataModel.Properties.id);
        if (key.toLowerCase().startsWith(begin.toLowerCase()) && !matches.contains(uid)) {
          JSONObject proposal = new JSONObject();
          proposal.put("name", key);
          proposal.put("value", uid);
          proposal.put("text", key);
          results.put(proposal);
          matches.add(uid);
        }
      }
    } finally {
      g.shutdown();
    }

    response.put("results", results);

    return Response.ok(response.toString(), MediaType.APPLICATION_JSON_TYPE).build();
  }

  @GET
  @Path("/query/tag")
  public Response queryValue(@QueryParam("begin") String begin, @QueryParam("key") String key) throws JSONException {
    if (begin == null || key == null) {
      return Response.status(Response.Status.BAD_REQUEST).build();
    }
    JSONObject response = new JSONObject();
    response.put("success", true);

    Set<String> matches = new HashSet<>();
    JSONArray results = new JSONArray();

    OrientBaseGraph g = DatabaseAccess.getReadOnlyGraph();
    try {
    Iterator<Vertex> itTagDefs = TagUtils.listTagsByKey(key, g).iterator();
    while (itTagDefs.hasNext()) {
      OrientVertex vTagDef = (OrientVertex) itTagDefs.next();
      String value = vTagDef.getProperty(DataModel.Properties.value);
      String uid = (String) vTagDef.getProperty(DataModel.Properties.id);
      if (value.toLowerCase().startsWith(begin.toLowerCase()) && !matches.contains(uid)) {
        JSONObject proposal = new JSONObject();
        proposal.put("name", value);
        proposal.put("value", uid);
        proposal.put("text", value);
        results.put(proposal);
        matches.add(uid);
      }
    }
    }
    finally {
      g.shutdown();
    }

    response.put("results", results);

    return Response.ok(response.toString(), MediaType.APPLICATION_JSON_TYPE).build();
  }
}
