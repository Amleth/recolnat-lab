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
import fr.recolnat.database.exceptions.ObsoleteDataException;
import fr.recolnat.database.model.DataModel;
import fr.recolnat.database.utils.AccessRights;
import fr.recolnat.database.utils.AccessUtils;
import fr.recolnat.database.utils.DeleteUtils;
import fr.recolnat.database.utils.UpdateUtils;
import java.util.LinkedList;
import java.util.List;
import org.codehaus.jettison.json.JSONException;

/**
 * Methods to operate on Views.
 * @author dmitri
 */
public class ViewResource {
  /**
   * Places an entity in a View. It is assumed the entity is not already in the View, as this method does not check for presence (allowing to duplicate the same entity multiple times in multiple places of the same View). No checks are made to ensure the entity is also in the Set.
   * @param viewId UID of the View
   * @param entityId UID of the entity
   * @param x x-coordinate
   * @param y y-coordinate
   * @param user User login
   * @return List of changes (id of view and entity)
   * @throws JSONException
   * @throws AccessForbiddenException 
   */
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
          if (!AccessRights.canWrite(vUser, vView, g, DatabaseAccess.rightsDb)) {
            throw new AccessForbiddenException(user, viewId);
          }
          if (!AccessRights.canRead(vUser, vEntity, g, DatabaseAccess.rightsDb)) {
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

  /**
   * Changes the location of an entity in a View. The entity is already placed in the View (a link exists between both).
   * @param viewId UID of the View
   * @param linkId UID of the link between View and entity
   * @param entityId UID of the entity
   * @param x x-coordinate to move to
   * @param y y-coordinate to move to
   * @param user User login
   * @return List of changes (id of view and entity)
   * @throws JSONException
   * @throws AccessForbiddenException 
   */
  public static List<String> moveEntityInView(String viewId, String linkId, String entityId, Integer x, Integer y, String user) throws JSONException, AccessForbiddenException {
    List<String> changes = new LinkedList<>();
    OrientBaseGraph g = DatabaseAccess.getReaderWriterGraph();
    try {
      OrientVertex vUser = AccessUtils.getUserByLogin(user, g);
      OrientVertex vView = AccessUtils.getView(viewId, g);
      OrientVertex vEntity = AccessUtils.getNodeById(entityId, g);
      OrientEdge eLink = AccessUtils.getEdgeById(linkId, g);

      if (!AccessRights.canWrite(vUser, vView, g, DatabaseAccess.rightsDb)) {
        throw new AccessForbiddenException(user, viewId);
      }
      if (!AccessRights.canRead(vUser, vEntity, g, DatabaseAccess.rightsDb)) {
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

  /**
   * Changes the display size of an entity in a View.
   * @param viewId UID of the View
   * @param linkId UID of the link between View and entity
   * @param entityId UID of the entity
   * @param width New width of the entity
   * @param height New height of the entity
   * @param user User login
   * @return id of View and entity
   * @throws JSONException
   * @throws AccessForbiddenException 
   */
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

        if (!AccessRights.canWrite(vUser, vView, g, DatabaseAccess.rightsDb)) {
          throw new AccessForbiddenException(user, viewId);
        }
        if (!AccessRights.canRead(vUser, vEntity, g, DatabaseAccess.rightsDb)) {
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
  
  /**
   * Removes an item from the View (but not from the associated Set). Internally this creates a new version of the View and removes the new version of the link.
   * @param linkViewToElementId Link between view and entity to remove
   * @param user User login
   * @return ids of everything linked to the entity and the view.
   * @throws AccessForbiddenException
   * @throws ObsoleteDataException 
   */
  public static List<String> deleteElementFromView(String linkViewToElementId, String user) throws AccessForbiddenException, ObsoleteDataException {
    List<String> changes = new LinkedList<>();

    boolean retry = true;
    while (retry) {
      retry = false;
      OrientBaseGraph g = DatabaseAccess.getReaderWriterGraph();
      try {
        OrientVertex vUser = AccessUtils.getUserByLogin(user, g);
        // Permissions checked internally
        List<String> deleted = DeleteUtils.unlinkItemFromView(linkViewToElementId, vUser, g, DatabaseAccess.rightsDb);
        g.commit();

        changes.addAll(deleted);
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
