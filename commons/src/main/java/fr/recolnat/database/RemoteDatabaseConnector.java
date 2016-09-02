package fr.recolnat.database;

import com.tinkerpop.blueprints.impls.orient.OrientBaseGraph;
import com.tinkerpop.blueprints.impls.orient.OrientGraphFactory;
import com.tinkerpop.blueprints.impls.orient.OrientGraphNoTx;

/**
 * Created by Dmitri Voitsekhovitch (dvoitsekh@gmail.com) on 23/03/15.
 */
public class RemoteDatabaseConnector {
  private OrientGraphFactory factory = null;

  private String dbHost = "localhost";
  private int dbPort = 2480;
  private String user = "root";
  private String pass = "root";
  private String dbName = "ReColNatTest";
  private String dbSvr = "remote://localhost:2480";
  private String dbUrl = dbSvr + "/" + dbName;


  public RemoteDatabaseConnector(String domain, int port, String database, String login, String password) {
    this.dbHost = domain;
    this.dbPort = port;
    this.dbSvr = "remote://" + domain + ":" + port;
    this.dbName = database;
    this.dbUrl = this.dbSvr + "/" + this.dbName;
    this.user = login;
    this.pass = password;

    
//    this.factory = new OrientGraphFactory(dbUrl, user, pass).setupPool(1,10);
    this.factory = new OrientGraphFactory("plocal:/apps/recolnat/lab/vm/databases/ReColNatPlusDev", this.user, this.pass).setupPool(1,10);
  }

  public OrientBaseGraph getTransactionalGraph() {
    OrientBaseGraph graph = factory.getTx();
    return graph;
  }

  public OrientGraphNoTx getNonTransactionalGraph() {
    OrientGraphNoTx graph = factory.getNoTx();
    return graph;
  }

  public void shutdown(){
    factory.close();

  }
}
