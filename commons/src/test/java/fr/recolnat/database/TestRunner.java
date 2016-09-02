package fr.recolnat.database;

import com.tinkerpop.blueprints.impls.orient.OrientBaseGraph;
import com.tinkerpop.blueprints.impls.orient.OrientGraphNoTx;
import fr.recolnat.database.model.StructureBuilder;
import fr.recolnat.database.utils.DatabaseTester;

import java.io.IOException;

/**
 * Created by Dmitri Voitsekhovitch (dvoitsekh@gmail.com) on 10/04/15.
 */
public class TestRunner {

  public static void main(String[] args) throws IllegalAccessException, IOException {
    RemoteDatabaseConnector conn = new RemoteDatabaseConnector("localhost", 2480, "ReColNatTest", "root", "root");
    OrientGraphNoTx gntx = conn.getNonTransactionalGraph();
    StructureBuilder.createRecolnatDataModel(gntx);

    OrientBaseGraph g = conn.getTransactionalGraph();
    try {
//      DatabaseTester.createTestWorkbench(g);
      g.commit();
    }
    finally {
      g.rollback();
      g.shutdown(false);
    }
  }
}
