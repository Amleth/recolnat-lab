/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package org.dicen.recolnat.services.core.actions;

import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;

/**
 * Collection of static methods to build simple responses.
 * 
 * @author dmitri
 */
public class ResponseBuilder {

  public static JSONObject error(String description, Status status) throws JSONException {
    JSONObject error = new JSONObject();
    error.put("error", description);
    error.put("status", status.getStatusCode());
    return error;
  }
  
  public static JSONObject ok() throws JSONException {
    JSONObject ok = new JSONObject();
    ok.put("status", Status.OK);
    return ok;
  }
}
