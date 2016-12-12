/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package org.dicen.recolnat.services.configuration;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.InputStream;
import java.util.Map;
import org.codehaus.plexus.util.FileUtils;
import org.dicen.recolnat.services.core.data.DatabaseAccess;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.yaml.snakeyaml.Yaml;

/**
 *
 * @author dmitri
 */
public class Configuration {

  private static final Logger log = LoggerFactory.getLogger(Configuration.class);
  
  public static class Server {
    public static Integer PORT = null;
  }

  public static class Databases {

    public static class Main {

      public static String PATH = null;
      public static String USER = null;
      public static String PASSWORD = null;

      public static Integer CONNECTOR_MIN_POOL_SIZE = null;
      public static Integer CONNECTOR_MAX_POOL_SIZE = null;
    }

    public static class UserAccess {

      public static String PATH = null;
    }

    public static class UserExports {

      public static String PATH = null;
    }

    public static class Backup {

      public static String DIRECTORY = null;
      public static String FIRST_EXECUTION = null;
      public static Integer FREQUENCY = null;
    }
  }

  public static class Exports {

    public static String DIRECTORY = null;
  }

  public static class Authentication {

    public static Integer AUTH_METHOD = null;

    public static class CAS {

      public static String TICKET_URL = null;
      public static String SERVICE_VALIDATE_URL = null;
    }
  }

  public static void loadConfiguration(String configurationFileName) throws FileNotFoundException {
    Yaml yaml = new Yaml();
    InputStream input = new FileInputStream(new File(configurationFileName));
    Map conf = (Map) yaml.load(input);
    Map dbConf = (Map) conf.get("database");
    Databases.UserAccess.PATH = (String) dbConf.get("pathToUserAccessDatabase");
    Databases.UserExports.PATH = (String) dbConf.get("pathToUserExportsDatabase");
    
    Databases.Main.PATH = (String) dbConf.get("dbPath");
    Databases.Main.USER = (String) dbConf.get("dbUser");
    Databases.Main.PASSWORD = (String) dbConf.get("password");
    Databases.Main.CONNECTOR_MIN_POOL_SIZE = (Integer) dbConf.get("minConnectorPoolSize");
    Databases.Main.CONNECTOR_MAX_POOL_SIZE = (Integer) dbConf.get("maxConnectorPoolSize");
    Map backupConf = (Map) dbConf.get("backup");
    Databases.Backup.DIRECTORY = (String) backupConf.get("directory");
    Databases.Backup.FIRST_EXECUTION = (String) backupConf.get("firstExecutionDate");
    Databases.Backup.FREQUENCY = (Integer) backupConf.get("frequency");
    
    Exports.DIRECTORY = (String) dbConf.get("exportsDirectory");
    new File(Exports.DIRECTORY).mkdirs();

    Map authConf = (Map) conf.get("authentication");
    Map cas = (Map) authConf.get("cas");
    if (cas != null) {
      log.info("Service configured to authenticate with CAS");
      Authentication.CAS.TICKET_URL = (String) cas.get("ticketUrl");
      Authentication.CAS.SERVICE_VALIDATE_URL = (String) cas.get("serviceValidateUrl");
      log.info("ticketUrl=" + Authentication.CAS.TICKET_URL);
      log.info("serviceValidateUrl=" + Authentication.CAS.SERVICE_VALIDATE_URL);
      Authentication.AUTH_METHOD = 2;

    }

    Map serverConf = (Map) conf.get("server");
    Server.PORT = (Integer) serverConf.get("port");

    // configure logging
    Map logConf = (Map) conf.get("logging");
    System.setProperty("org.slf4j.simpleLogger.defaultLogLevel", (String) logConf.get("level"));
    Map fineLoggersConf = (Map) logConf.get("loggers");
    for (Object logClass : fineLoggersConf.keySet()) {
      log.info((String) logClass + " set to " + (String) fineLoggersConf.get(logClass));
      System.setProperty("org.slf4j.simpleLogger.log." + (String) logClass, (String) fineLoggersConf.get(logClass));
    }
  }

  public static void configureDatabases() {
    DatabaseAccess.configure(Databases.Main.PATH, Databases.Main.USER, Databases.Main.PASSWORD, Databases.Main.CONNECTOR_MIN_POOL_SIZE, Databases.Main.CONNECTOR_MAX_POOL_SIZE, Databases.Backup.DIRECTORY);
    DatabaseAccess.configureRightsDatabase(Databases.UserAccess.PATH);
    DatabaseAccess.configureExportsDatabase(Databases.UserExports.PATH);
  }

  public static void configureUserAuthentication() {
    switch (Authentication.AUTH_METHOD) {
      case 2:
        org.dicen.recolnat.services.configuration.Authentication.authenticationMethod = 2;
        org.dicen.recolnat.services.configuration.Authentication.CASConfiguration.ticketUrl = Authentication.CAS.TICKET_URL;
        org.dicen.recolnat.services.configuration.Authentication.CASConfiguration.serviceValidateUrl = Authentication.CAS.SERVICE_VALIDATE_URL;
        break;
    }
  }
}