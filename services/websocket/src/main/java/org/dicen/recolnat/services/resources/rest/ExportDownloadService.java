/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package org.dicen.recolnat.services.resources.rest;

import java.io.File;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import org.dicen.recolnat.services.configuration.Configuration;

/**
 *
 * @author dmitri
 */
@Path("/downloads")
public class ExportDownloadService {
  @GET
  @Path("/exports")
  @Produces(MediaType.APPLICATION_OCTET_STREAM)
  public Response getExport(@QueryParam("file") String fileName) {
    String filePath = Configuration.Exports.DIRECTORY + "/" + fileName;
    File f = new File(filePath);
    Response.ResponseBuilder response = Response.ok((Object) f);
    response.header("Content-Disposition", "attachment; filename=" + fileName);
    return response.build();
  }
}
