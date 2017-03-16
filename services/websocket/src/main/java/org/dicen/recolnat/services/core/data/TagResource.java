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
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.dicen.recolnat.services.core.actions.ActionResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Static function to operate on tags.
 * @author dmitri
 */
public class TagResource {
  private final static Logger log = LoggerFactory.getLogger(TagResource.class);

  /**
   * Creates a link (TagAssociation) between an entity and a TagDefinition, effectively tagging a resource.
   * @param tagDefId UID of the tag definition
   * @param entityId UID of the entity
   * @param user Login of the user
   * @return Result contains the id of the TagAssociation (id). Modified ids : tag definition, entity, tag association
   * @throws AccessForbiddenException
   * @throws JSONException 
   */
  public static ActionResult linkTagToEntity(String tagDefId, String entityId, String user) throws AccessForbiddenException, JSONException {
    ActionResult res = new ActionResult();

    boolean retry = true;
    while (retry) {
      retry = false;
      OrientBaseGraph g = DatabaseAccess.getReaderWriterGraph();
      try {
        OrientVertex vTagDefinition = TagUtils.getTagDefinition(tagDefId, g);
        OrientVertex vEntity = AccessUtils.getNodeById(entityId, g);
        OrientVertex vUser = AccessUtils.getUserByLogin(user, g);
        if (!AccessRights.canRead(vUser, vEntity, g, DatabaseAccess.rightsDb)) {
          throw new AccessForbiddenException(user, entityId);
        }
        if (!AccessRights.canRead(vUser, vTagDefinition, g, DatabaseAccess.rightsDb)) {
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

  /**
   * Creates a new tag definition based on a key-value pair. If the pair already exists WITH THE SAME EXACT WRITING (including capitalisation) this returns the existing definition and no indication that the pair already existed.
   * All TagDefinitions are created with public read access (no private tags).
   * @param key Left-hand side of the tag
   * @param value Optional Right hand-side of the tag
   * @param user Login of the user
   * @return Result includes the id of the new definition. No existing ids are modified in this operation.
   * @throws JSONException 
   */
  public static ActionResult createTagDefinition(String key, String value, String user) throws JSONException {
    ActionResult res = new ActionResult();

    boolean retry = true;
    while (retry) {
      retry = false;
      OrientBaseGraph g = DatabaseAccess.getReaderWriterGraph();
      try {
        OrientVertex vUser = AccessUtils.getUserByLogin(user, g);
        OrientVertex vTagDef = TagUtils.findTag(key, value, g);

        if (vTagDef == null) {
          vTagDef = TagUtils.createTagDefinition(key, value, user, g);
          g.commit();

          AccessRights.grantPublicAccessRights(vTagDef, DataModel.Enums.AccessRights.READ, DatabaseAccess.rightsDb);
        }

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
