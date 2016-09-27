/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package org.dicen.recolnat.services.core.data;

import com.orientechnologies.orient.core.exception.OConcurrentModificationException;
import com.tinkerpop.blueprints.impls.orient.OrientEdge;
import com.tinkerpop.blueprints.impls.orient.OrientBaseGraph;
import com.tinkerpop.blueprints.impls.orient.OrientVertex;
import fr.recolnat.database.exceptions.AccessForbiddenException;
import fr.recolnat.database.model.DataModel;
import fr.recolnat.database.utils.AccessRights;
import fr.recolnat.database.utils.AccessUtils;
import fr.recolnat.database.utils.UpdateUtils;
import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;

/**
 *
 * @author dmitri
 */
public class ViewResource {
  public static List<String> placeEntityInView(String viewId, String entityId, Integer x, Integer y, String user) throws JSONException, AccessForbiddenException {
    List<String> changes = new LinkedList<>();

      boolean retry = true;
      while (retry) {
        retry = false;
        OrientBaseGraph g = DatabaseAccess.getReaderWriterGraph();
        try {
          OrientVertex vUser = AccessUtils.getUserByLogin(user, g);
          OrientVertex vView = AccessUtils.getView(viewId, g);
          OrientVertex vEntity = AccessUtils.getNodeById(entityId, g);
          if (!AccessRights.canWrite(vUser, vView, g)) {
            throw new AccessForbiddenException(user, viewId);
          }
          if (!AccessRights.canRead(vUser, vEntity, g)) {
            throw new AccessForbiddenException(user, entityId);
          }

          OrientEdge eLink = UpdateUtils.showItemInView(x, y, vEntity, vView, vUser, g);
          g.commit();

          changes.add(viewId);
          changes.add(entityId);
        } catch (OConcurrentModificationException e) {
          retry = true;
        } finally {
          g.rollback();
          g.shutdown();
        }
      
    }
    return changes;
  }

  public static List<String> moveEntityInView(String viewId, String linkId, String entityId, Integer x, Integer y, String user) throws JSONException, AccessForbiddenException {
    List<String> changes = new LinkedList<>();
    OrientBaseGraph g = DatabaseAccess.getReaderWriterGraph();
    try {
      OrientVertex vUser = AccessUtils.getUserByLogin(user, g);
      OrientVertex vView = AccessUtils.getView(viewId, g);
      OrientVertex vEntity = AccessUtils.getNodeById(entityId, g);
      OrientEdge eLink = AccessUtils.getEdgeById(linkId, g);

      if (!AccessRights.canWrite(vUser, vView, g)) {
        throw new AccessForbiddenException(user, viewId);
      }
      if (!AccessRights.canRead(vUser, vEntity, g)) {
        throw new AccessForbiddenException(user, entityId);
      }

      eLink.setProperties(DataModel.Properties.coordX, x, DataModel.Properties.coordY, y);
      g.commit();
      changes.add(viewId);
      changes.add(entityId);
    } catch (OConcurrentModificationException e) {
      // Do nothing, element was moved before already, so cancel move
    } finally {
      g.rollback();
      g.shutdown();
    }

    return changes;
  }

  public static List<String> resizeEntityInView(String viewId, String linkId, String entityId, Integer width, Integer height, String user) throws JSONException, AccessForbiddenException {
    List<String> changes = new LinkedList<>();
    if(height < 0 || width < 0) {
      return changes;
    }
    
    boolean retry = true;
    while (retry) {
      retry = false;
      OrientBaseGraph g = DatabaseAccess.getReaderWriterGraph();
      try {
        OrientVertex vUser = AccessUtils.getUserByLogin(user, g);
        OrientVertex vView = AccessUtils.getView(viewId, g);
        OrientVertex vEntity = AccessUtils.getNodeById(entityId, g);
        OrientEdge eLink = AccessUtils.getEdgeById(linkId, g);

        if (!AccessRights.canWrite(vUser, vView, g)) {
          throw new AccessForbiddenException(user, viewId);
        }
        if (!AccessRights.canRead(vUser, vEntity, g)) {
          throw new AccessForbiddenException(user, entityId);
        }

        eLink.setProperties(DataModel.Properties.width, width, DataModel.Properties.height, height);
        g.commit();
        
        changes.add(viewId);
        changes.add(entityId);
      } catch (OConcurrentModificationException e) {
        retry = true;
      } finally {
        g.rollback();
        g.shutdown();
      }
    }

    return changes;
  }
}
