/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package fr.recolnat.database.utils;

import com.tinkerpop.blueprints.impls.orient.OrientEdge;
import com.tinkerpop.blueprints.impls.orient.OrientGraph;
import com.tinkerpop.blueprints.impls.orient.OrientVertex;
import fr.recolnat.database.model.DataModel;
import java.util.Date;

/**
 *
 * @author dmitri
 */
public class TagUtils {
  public static OrientVertex createTag(String text, String hexColor, OrientGraph g) {
    OrientVertex vTag = g.addVertex("class:" + DataModel.Classes.tag);
    vTag.setProperty(DataModel.Properties.id, CreatorUtils.newVertexUUID(g));
    vTag.setProperty(DataModel.Properties.text, text);
    vTag.setProperty(DataModel.Properties.color, hexColor);
    vTag.setProperty(DataModel.Properties.creationDate, (new Date()).getTime());
    
    return vTag;
  }
  
  public static OrientVertex tagEntity(OrientVertex vEntity, OrientVertex vTag, OrientGraph g) {
    OrientVertex vAssociation = g.addVertex("class:" + DataModel.Classes.tagging);
    vAssociation.setProperty(DataModel.Properties.id, CreatorUtils.newVertexUUID(g));
    vAssociation.setProperty(DataModel.Properties.creationDate, (new Date()).getTime());
    
    OrientEdge eEntityToAssoc = g.addEdge("class:" + DataModel.Links.isTagged, vEntity, vAssociation, DataModel.Links.isTagged);
    OrientEdge eAssocToTagdef = g.addEdge("class:" + DataModel.Links.hasDefinition, vAssociation, vTag, DataModel.Links.hasDefinition);
    
    return vAssociation;
  }
}
