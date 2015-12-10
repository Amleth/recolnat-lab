package fr.recolnat.database;

import com.tinkerpop.blueprints.impls.orient.OrientGraph;
import com.tinkerpop.blueprints.impls.orient.OrientVertex;
import fr.recolnat.database.model.DataModel;
import fr.recolnat.database.model.StructureBuilder;
import fr.recolnat.database.utils.CreatorUtils;

import java.util.Date;
import java.util.Iterator;

/**
 * Created by Dmitri Voitsekhovitch (dvoitsekh@gmail.com) on 25/03/15.
 */
public class UtilTester {

  public static void printVertexProperties(OrientVertex v) {
    Iterator<String> vIt = v.getPropertyKeys().iterator();
    System.out.println("Reading " + v.getId().toString() + " " + v.getBaseClassName());
    while(vIt.hasNext()) {
      String propKey = vIt.next();
      Object propValue = v.getProperty(propKey);
      System.out.println("  - " + propKey + " = " + propValue.toString());
    }
  }

//  public static void main(String[] args) throws IllegalAccessException {
//    StructureBuilder.createRecolnatDataModel();
//
//    OrientGraph g = DatabaseConnector.getTransactionalGraph();
//    try {
//      OrientVertex ficus77 = CreatorUtils.createRecolnatAbstractEntity("ficus77", DataModel.Enums.Modules.COLLABORATORY, new Date(), g);
//  printVertexProperties(ficus77);
//      ficus77 = CreatorUtils.createAbstractLeafEntity("ficus77", null, null, g);
//      printVertexProperties(ficus77);
//      g.commit();
//    }
//    finally {
//      g.rollback();
//      g.shutdown(false);
//    }
//  }
}
