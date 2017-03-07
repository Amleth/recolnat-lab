/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package fr.recolnat.database.utils;

import com.tinkerpop.blueprints.Vertex;
import com.tinkerpop.blueprints.impls.orient.OrientEdge;
import com.tinkerpop.blueprints.impls.orient.OrientBaseGraph;
import com.tinkerpop.blueprints.impls.orient.OrientVertex;
import fr.recolnat.database.model.DataModel;
import java.util.Date;
import java.util.Iterator;

/**
 *
 * @author dmitri
 */
public class TagUtils {
  public static OrientVertex createTagDefinition(String key, String value, String creatorId, OrientBaseGraph g) {
    OrientVertex vTag = g.addVertex("class:" + DataModel.Classes.tag);
    vTag.setProperty(DataModel.Properties.id, "TAGDEF-" + CreatorUtils.newVertexUUID(g));
    vTag.setProperty(DataModel.Properties.key, key);
    vTag.setProperty(DataModel.Properties.value, value);
    vTag.setProperty(DataModel.Properties.creationDate, (new Date()).getTime());
    
    return vTag;
  }
  
  public static OrientVertex tagEntity(OrientVertex vEntity, OrientVertex vTag, String creatorId, OrientBaseGraph g) {
    OrientVertex vAssociation = g.addVertex("class:" + DataModel.Classes.tagging);
    vAssociation.setProperty(DataModel.Properties.id, "TAG-" + CreatorUtils.newVertexUUID(g));
    vAssociation.setProperty(DataModel.Properties.creationDate, (new Date()).getTime());
    
    UpdateUtils.link(vEntity, vAssociation, DataModel.Links.isTagged, creatorId, g);
    UpdateUtils.link(vAssociation, vTag, DataModel.Links.hasDefinition, creatorId, g);
    
    return vAssociation;
  }
  
  public static OrientVertex getTagDefinition(String uid, OrientBaseGraph g) {
    Iterator<Vertex> itTagDefs = g.getVertices(DataModel.Classes.tag, new String[] {DataModel.Properties.id}, new Object[]{uid}).iterator();
    return AccessUtils.findLatestVersion(itTagDefs, g);
  }
  
  public static OrientVertex findTag(String key, String value, OrientBaseGraph g) {
    Iterator<Vertex> itTagDefs = g.getVertices(DataModel.Classes.tag, new String[] {DataModel.Properties.key, DataModel.Properties.value}, new Object[] {key, value}).iterator();
    return AccessUtils.findLatestVersion(itTagDefs, g);
  }
  
  public static Iterable<Vertex> listTagsByKey(String key, OrientBaseGraph g) {
    return g.getVertices(DataModel.Classes.tag, new String[] {DataModel.Properties.key}, new Object[] {key});
  }
}
