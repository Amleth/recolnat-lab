package org.dicen.recolnat.services.core;

import com.orientechnologies.orient.core.exception.ODatabaseException;
import com.tinkerpop.blueprints.impls.orient.OrientGraph;
import fr.recolnat.database.RemoteDatabaseConnector;
import org.dicen.recolnat.services.conf.DatabaseConfiguration;
import org.dicen.recolnat.services.conf.TestConfiguration;

/**
 * Created by Dmitri Voitsekhovitch (dvoitsekh@gmail.com) on 21/05/15.
 */
public class DatabaseAccess {
  public static String defaultRootWorkbenchId = "root";
  public static String defaultTestUser = "254c7660-8a7e-4274-8b32-5cac207c9ee1";
  public static RemoteDatabaseConnector databaseConnector = new RemoteDatabaseConnector("localhost", 2480, "ReColNatTest", "root", "root");
  public static String specialSessionId = "";
  public static String testTGT = "";
  private static DatabaseConfiguration configuration;

  public static void configure(DatabaseConfiguration conf) {
    DatabaseAccess.databaseConnector = new RemoteDatabaseConnector(conf.getHost(), conf.getPort(), conf.getDbName(), conf.getDbUser(), conf.getPassword());
    DatabaseAccess.configuration = conf;
  }

  public static void configure(TestConfiguration conf) {
    DatabaseAccess.defaultRootWorkbenchId = conf.getDefaultWorkbench();
    DatabaseAccess.defaultTestUser = conf.getUserUUID();
    DatabaseAccess.specialSessionId = conf.getSpecialSessionID();
    DatabaseAccess.testTGT = conf.getTestTGT();
    SessionManager.newSpecialSession(DatabaseAccess.specialSessionId);
  }

  public static OrientGraph getTransactionalGraph(){
    try
    {
      return DatabaseAccess.databaseConnector.getTransactionalGraph();
    }
    catch(ODatabaseException e) {
      DatabaseAccess.databaseConnector = new RemoteDatabaseConnector(configuration.getHost(), configuration.getPort(), configuration
              .getDbName(), configuration.getDbUser(), configuration.getPassword());
      return DatabaseAccess.databaseConnector.getTransactionalGraph();
    }
  }
}
