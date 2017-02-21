/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package org.dicen.recolnat.services.core.data;

import com.orientechnologies.orient.core.exception.OConcurrentModificationException;
import com.tinkerpop.blueprints.Vertex;
import com.tinkerpop.blueprints.impls.orient.OrientBaseGraph;
import com.tinkerpop.blueprints.impls.orient.OrientVertex;
import fr.recolnat.database.exceptions.AccessForbiddenException;
import fr.recolnat.database.model.DataModel;
import fr.recolnat.database.utils.AccessRights;
import fr.recolnat.database.utils.AccessUtils;
import fr.recolnat.database.utils.TagUtils;
import java.util.Iterator;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.Response;
import org.apache.commons.lang.NotImplementedException;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.dicen.recolnat.services.core.actions.ActionResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author dmitri
 */
public class TagResource {
  private final static Logger log = LoggerFactory.getLogger(TagResource.class);
  
  public static ActionResult listTags(String user) throws JSONException {
    ActionResult res = new ActionResult();
    
    boolean retry = true;
    while(retry) {
      retry = false;
      OrientBaseGraph g = DatabaseAccess.getReadOnlyGraph();
      try {
        OrientVertex vUser = AccessUtils.getUserByLogin(user, g);
        Iterator<Vertex> itTags = g.getVerticesOfClass(DataModel.Classes.tag).iterator();
        JSONArray jTags = new JSONArray();
        while(itTags.hasNext()) {
          OrientVertex vTag = (OrientVertex) itTags.next();
          if(AccessUtils.isLatestVersion(vTag)) {
            if(AccessRights.canRead(vUser, vTag, g, DatabaseAccess.rightsDb)) {
              jTags.put((String) vTag.getProperty(DataModel.Properties.id));
            }
          }
        }
        res.setResponse("tags", jTags);
      } finally {
        g.rollback();
        g.shutdown();
      }
    }
    
    return res;
  }
  
  public static ActionResult linkTagToEntity(String tagDefId, String entityId, String user) throws AccessForbiddenException, JSONException {
    ActionResult res = new ActionResult();
    
    boolean retry = true;
    while(retry) {
      retry = false;
      OrientBaseGraph g = DatabaseAccess.getReaderWriterGraph();
      try {
        OrientVertex vTagDefinition = TagUtils.getTagDefinition(tagDefId, g);
        OrientVertex vEntity = AccessUtils.getNodeById(entityId, g);
        OrientVertex vUser = AccessUtils.getUserByLogin(user, g);
        if(!AccessRights.canRead(vUser, vEntity, g, DatabaseAccess.rightsDb)) {
          throw new AccessForbiddenException(user, entityId);
        }
        if(!AccessRights.canRead(vUser, vTagDefinition, g, DatabaseAccess.rightsDb)) {
          throw new AccessForbiddenException(user, tagDefId);
        }
        
        OrientVertex vTag = TagUtils.tagEntity(vEntity, vTagDefinition, vUser.getProperty(DataModel.Properties.id), g);
        g.commit();
        
        AccessRights.grantAccessRights(vUser, vTag, DataModel.Enums.AccessRights.WRITE, DatabaseAccess.rightsDb);
        
        res.addModifiedId(tagDefId);
        res.addModifiedId(entityId);
        res.addModifiedId(vTag.getProperty(DataModel.Properties.id));
        res.setResponse("id", vTag.getProperty(DataModel.Properties.id));
      } catch (OConcurrentModificationException e) {
        log.warn("Database busy, retrying operation");
        retry = true;
      } finally {
        g.rollback();
        g.shutdown();
      }
    }
    
    return res;
  }
  
  public static ActionResult createTagDefinition(String key, String value, String user) throws JSONException {
    ActionResult res = new ActionResult();
    
    boolean retry = true;
    while(retry) {
      retry = false;
      OrientBaseGraph g = DatabaseAccess.getReaderWriterGraph();
      try {
        OrientVertex vUser = AccessUtils.getUserByLogin(user, g);
        OrientVertex vTagDef = TagUtils.createTagDefinition(key, value, user, g);
        g.commit();
        
        AccessRights.grantAccessRights(vUser, vTagDef, DataModel.Enums.AccessRights.WRITE, DatabaseAccess.rightsDb);
        
        res.setResponse("id", vTagDef.getProperty(DataModel.Properties.id));
      } catch (OConcurrentModificationException e) {
        log.warn("Database busy, retrying operation");
        retry = true;
      } finally {
        g.rollback();
        g.shutdown();
      }
    }
    
    return res;
  }
}
