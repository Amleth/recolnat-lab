package org.dicen.recolnat.services;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileReader;
import java.io.InputStream;
import java.util.Map;
import org.dicen.recolnat.services.resources.VirtualWorkbenchSocket;
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
    Integer port = (Integer) dbConf.get("port");
    String dbName = (String) dbConf.get("dbName");
    String dbUser = (String) dbConf.get("dbUser");
    String dbPass = (String) dbConf.get("password");
    VirtualWorkbenchSocket.initDatabase(host, port, dbName, dbUser, dbPass);
    
    final Server server = new Server("localhost", 8888, "/websockets", null, VirtualWorkbenchSocket.class);

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
