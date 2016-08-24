package org.dicen.recolnat.services;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileReader;
import java.io.InputStream;
import java.util.Map;
import org.dicen.recolnat.services.core.data.DatabaseAccess;
import org.dicen.recolnat.services.resources.ColaboratorySocket;
import org.glassfish.tyrus.server.Server;
import org.yaml.snakeyaml.Yaml;

/**
 * Created by Dmitri Voitsekhovitch (dvoitsekh@gmail.com) on 09/04/15.
 */
public class ServerApplication {

  public static void main(String[] args) throws Exception {
    
    String configurationFileName = args[0];
    Yaml yaml = new Yaml();
    InputStream input = new FileInputStream(new File(configurationFileName));
    Map conf = (Map) yaml.load(input);
    Map dbConf = (Map) conf.get("database");
    String host = (String) dbConf.get("host");
    Integer dbPort = (Integer) dbConf.get("port");
    String dbName = (String) dbConf.get("dbName");
    String dbUser = (String) dbConf.get("dbUser");
    String dbPass = (String) dbConf.get("password");
    Integer minPool = (Integer) dbConf.get("minConnectorPoolSize");
    Integer maxPool = (Integer) dbConf.get("maxConnectorPoolSize");
    DatabaseAccess.configure(host, dbPort, dbName, dbUser, dbPass, minPool, maxPool);
    
    Map serverConf = (Map) conf.get("server");
    Integer srvPort = (Integer) serverConf.get("port");
    
    final Server server = new Server("localhost", srvPort, "/websockets", null, ColaboratorySocket.class);

    server.start();
    Runtime.getRuntime().addShutdownHook(new Thread() {
      @Override
      public void run() {
        server.stop();
      }
    });

    while(true) {
      Thread.sleep(1000);
    }
  }
}
