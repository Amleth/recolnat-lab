/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package org.dicen.recolnat.services.core.data;

import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.Response;
import org.apache.commons.lang.NotImplementedException;
import org.codehaus.jettison.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author dmitri
 */
public class TagResource {
  private final static Logger log = LoggerFactory.getLogger(TagResource.class);
  
  public Response getEntityTags(final JSONObject input, @Context HttpServletRequest request) {
    throw new NotImplementedException();
  }
  
  public Response listTags(final JSONObject input, @Context HttpServletRequest request) {
    throw new NotImplementedException();
  }
  
  public Response linkTag(final JSONObject input, @Context HttpServletRequest request) {
    throw new NotImplementedException();
  }
  
  public Response createTag(final JSONObject input, @Context HttpServletRequest request) {
    throw new NotImplementedException();
  }
  
  public Response getTag(final JSONObject input, @Context HttpServletRequest request) {
    throw new NotImplementedException();
  }
}
