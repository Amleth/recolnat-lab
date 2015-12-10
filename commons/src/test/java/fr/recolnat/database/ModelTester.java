package fr.recolnat.database;

import com.tinkerpop.blueprints.impls.orient.OrientGraphNoTx;
import fr.recolnat.database.model.StructureBuilder;

/**
 * Created by Dmitri Voitsekhovitch (dvoitsekh@gmail.com) on 10/04/15.
 */
public class ModelTester {

  public static void main(String[] args) throws IllegalAccessException {

    RemoteDatabaseConnector conn = new RemoteDatabaseConnector("localhost", 2480, "ReColNatTest", "root", "root");
    OrientGraphNoTx gntx = conn.getNonTransactionalGraph();
    StructureBuilder.createRecolnatDataModel(gntx);
  }
}
