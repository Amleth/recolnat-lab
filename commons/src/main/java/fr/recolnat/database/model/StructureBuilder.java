package fr.recolnat.database.model;

import com.orientechnologies.orient.core.exception.OSchemaException;
import com.tinkerpop.blueprints.impls.orient.OrientGraphNoTx;
import com.tinkerpop.blueprints.impls.orient.OrientVertex;
import com.tinkerpop.blueprints.impls.orient.OrientVertexType;

import java.lang.reflect.Field;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Created by Dmitri Voitsekhovitch (dvoitsekh@gmail.com) on 23/03/15.
 */
public class StructureBuilder {
  private static final Logger log = LoggerFactory.getLogger(StructureBuilder.class);
  
  public static void createRecolnatDataModel(OrientGraphNoTx graph) throws IllegalAccessException {

    Field[] fields = DataModel.Classes.class.getDeclaredFields();
    addFieldsAsChildrenOfClass(null, fields, graph);

//    OrientVertexType abstractEntity = graph.getVertexType(DataModel.Classes.BaseTypes.abstractEntity);
//    fields = DataModel.Classes.LevelOneHeirTypes.class.getDeclaredFields();
//    addFieldsAsChildrenOfClass(abstractEntity, fields, graph);
//
//    OrientVertexType abstractLeafEntity = graph.getVertexType(DataModel.Classes.LevelOneHeirTypes.leafEntity);
//    fields = DataModel.Classes.LeafTypes.class.getDeclaredFields();
//    addFieldsAsChildrenOfClass(abstractLeafEntity, fields, graph);
//
//    OrientVertexType relationshipEntity = graph.getVertexType(DataModel.Classes.LevelOneHeirTypes.relationship);
//    fields = DataModel.Classes.RelationshipTypes.class.getDeclaredFields();
//    addFieldsAsChildrenOfClass(relationshipEntity, fields, graph);
//
//    OrientVertexType compositeEntity = graph.getVertexType(DataModel.Classes.LevelOneHeirTypes.compositeEntity);
//    fields = DataModel.Classes.CompositeTypes.class.getDeclaredFields();
//    addFieldsAsChildrenOfClass(compositeEntity, fields, graph);

    Field[] links = DataModel.Links.class.getDeclaredFields();
    for(Field link : links) {
      try {
        graph.createEdgeType(link.get(null).toString());
      }
      catch (OSchemaException e) {
        // Happens when already exists
        continue;
      }
    }

  }
  
  public static void createDefaultNodes(OrientGraphNoTx graph) {
    OrientVertex groupPublic = graph.addVertex("class:" + DataModel.Classes.group);
    groupPublic.setProperty(DataModel.Properties.id, DataModel.Globals.PUBLIC_GROUP_ID);
  }

  private static void addFieldsAsChildrenOfClass(OrientVertexType parent, Field[] children, OrientGraphNoTx graph) throws IllegalAccessException {
    for (Field field : children){
      try {
        if(log.isInfoEnabled()) {
          log.info("Adding vertex type " + field.get(null));
        }
        if(parent != null) {
          graph.createVertexType(field.get(null).toString(), parent);
        }
        else {
          graph.createVertexType(field.get(null).toString());
        }
      }
      catch (OSchemaException e) {
        // Happens when already exists, no error here
        if(log.isErrorEnabled()) {
          log.error("Error while adding vertex type " + field.get(null), e);
        }
      }
    }
  }
}
