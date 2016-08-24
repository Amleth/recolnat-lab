/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package org.dicen.recolnat.services.core.data;

import com.orientechnologies.orient.core.exception.OConcurrentModificationException;
import com.tinkerpop.blueprints.impls.orient.OrientEdge;
import com.tinkerpop.blueprints.impls.orient.OrientGraph;
import com.tinkerpop.blueprints.impls.orient.OrientVertex;
import fr.recolnat.database.exceptions.AccessForbiddenException;
import fr.recolnat.database.model.DataModel;
import fr.recolnat.database.utils.AccessRights;
import fr.recolnat.database.utils.AccessUtils;
import fr.recolnat.database.utils.UpdateUtils;
import java.util.ArrayList;
import java.util.List;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;

/**
 *
 * @author dmitri
 */
public class ViewResource {
  public List<String> placeEntityInView(JSONArray entitiesPositions, String user) throws JSONException, AccessForbiddenException {
    List<String> changes = new ArrayList<>();
    for (int i = 0; i < entitiesPositions.length(); ++i) {
      JSONObject data = entitiesPositions.getJSONObject(i);

      String viewId = data.getString("view");
      String entityId = data.getString("entity");
      Integer x = data.getInt("x");
      Integer y = data.getInt("y");

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
            throw new AccessForbiddenException(user, viewId);
          }
          if (!AccessRights.canRead(vUser, vEntity, g)) {
            throw new AccessForbiddenException(user, entityId);
          }

          OrientEdge eLink = UpdateUtils.showItemInView(x, y, vEntity, vView, vUser, g);
          g.commit();

          changes.add(viewId);
          changes.add(entityId);
          changes.add((String) eLink.getProperty(DataModel.Properties.id));
        } catch (OConcurrentModificationException e) {
          retry = true;
        } finally {
          g.rollback();
          g.shutdown();
        }
      }
    }
    return changes;
  }

  public List<String> moveEntityInView(String viewId, String linkId, String entityId, Integer x, Integer y, String user) throws JSONException, AccessForbiddenException {
    List<String> changes = new ArrayList<>();
    OrientGraph g = DatabaseAccess.getTransactionalGraph();
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
      changes.add(linkId);
      changes.add(entityId);
    } catch (OConcurrentModificationException e) {
      // Do nothing, element was moved before already, so cancel move
    } finally {
      g.rollback();
      g.shutdown();
    }

    return changes;
  }

  public List<String> resizeEntityInView(String viewId, String linkId, String entityId, Integer width, Integer height, String user) throws JSONException, AccessForbiddenException {
    List<String> changes = new ArrayList<>();
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
