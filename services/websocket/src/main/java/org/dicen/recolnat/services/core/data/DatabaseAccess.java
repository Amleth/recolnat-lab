package org.dicen.recolnat.services.core.data;

import com.orientechnologies.orient.core.db.ODatabase;
import com.orientechnologies.orient.core.exception.ODatabaseException;
import com.tinkerpop.blueprints.impls.orient.OrientBaseGraph;
import com.tinkerpop.blueprints.impls.orient.OrientGraphFactory;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import org.dicen.recolnat.services.core.backup.RecolnatDatabaseBackupCallable;
import org.dicen.recolnat.services.core.backup.RecolnatDatabaseBackupListener;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Created by Dmitri Voitsekhovitch (dvoitsekh@gmail.com) on 21/05/15.
 */
public class DatabaseAccess {
//  private static String host;
//  private static Integer port;

  private static String dbPath;
  private static String dbUser;
  private static String dbPass;
  private static String backupDir;
  private static Integer minConnectorPoolSize;
  private static Integer maxConnectorPoolSize;
  
  private static SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd-HH:mm:ss");

  public static OrientGraphFactory readerFactory = null;
  public static OrientGraphFactory writerFactory = null;

  private static final Logger log = LoggerFactory.getLogger(DatabaseAccess.class);

  public static void configure(String dbPath, String dbUser, String dbPass, Integer minPoolSize, Integer maxPoolSize, String backupDir) {
    DatabaseAccess.dbPath = dbPath;
    DatabaseAccess.dbUser = dbUser;
    DatabaseAccess.dbPass = dbPass;
    DatabaseAccess.minConnectorPoolSize = minPoolSize;
    DatabaseAccess.maxConnectorPoolSize = maxPoolSize;
    DatabaseAccess.backupDir = backupDir;

//    DatabaseAccess.factory = new OrientGraphFactory("remote:" + host + ":" + port + "/" + dbName, dbUser, dbPass).setupPool(minPoolSize, maxPoolSize);
    DatabaseAccess.readerFactory = new OrientGraphFactory("plocal:" + dbPath, dbUser, dbPass).setupPool(minPoolSize, maxPoolSize);
    DatabaseAccess.writerFactory = new OrientGraphFactory("plocal:" + dbPath, dbUser, dbPass).setupPool(minPoolSize, maxPoolSize);
  }

  /**
   * 
   * @param isWriter Indicates if this graph is to be used to write, in which case it comes from a separate pool.
   * @return 
   */
  public static OrientBaseGraph getTransactionalGraph(boolean isWriter) {
    if(isWriter) {
      return DatabaseAccess.getReaderWriterGraph();
    }
    else {
      return DatabaseAccess.getReadOnlyGraph();
    }
  }
  
  public static OrientBaseGraph getReadOnlyGraph() {
    try {
      if (log.isDebugEnabled()) {
        log.debug("getTransactionalGraph status " + readerFactory.getAvailableInstancesInPool() + " available, " + readerFactory.getCreatedInstancesInPool() + " created");
      }
      return (OrientBaseGraph) DatabaseAccess.readerFactory.getTx();
    } catch (ODatabaseException e) {
      log.error("Database exception getting new reader graph", e);
//      DatabaseAccess.factory = new OrientGraphFactory("remote:" + host + ":" + port + "/" + dbName, dbUser, dbPass).setupPool(minConnectorPoolSize, maxConnectorPoolSize);
      DatabaseAccess.readerFactory = new OrientGraphFactory("plocal:" + dbPath, dbUser, dbPass).setupPool(minConnectorPoolSize, maxConnectorPoolSize);
      return (OrientBaseGraph) DatabaseAccess.readerFactory.getTx();
    }
  }
  
  public static OrientBaseGraph getReaderWriterGraph() {
    try {
      if (log.isDebugEnabled()) {
        log.debug("getTransactionalGraph status " + writerFactory.getAvailableInstancesInPool() + " available, " + writerFactory.getCreatedInstancesInPool() + " created");
      }
      return (OrientBaseGraph) DatabaseAccess.writerFactory.getTx();
    } catch (ODatabaseException e) {
      log.error("Database exception getting new transactional graph", e);
//      DatabaseAccess.factory = new OrientGraphFactory("remote:" + host + ":" + port + "/" + dbName, dbUser, dbPass).setupPool(minConnectorPoolSize, maxConnectorPoolSize);
      DatabaseAccess.writerFactory = new OrientGraphFactory("plocal:" + dbPath, dbUser, dbPass).setupPool(minConnectorPoolSize, maxConnectorPoolSize);
      return (OrientBaseGraph) DatabaseAccess.writerFactory.getTx();
    }
  }
  
  public static void backup() {
    log.info("Beginning database backup.");
    FileOutputStream backupFile = null;
    ODatabase database = DatabaseAccess.readerFactory.getDatabase();
    String backupFilePath = DatabaseAccess.backupDir + "/" + database.getName() +"-" + dateFormat.format(new Date());
    try {
      backupFile = new FileOutputStream(backupFilePath);
      Map<String, Object> options = new HashMap<>();
      database.backup(backupFile, options, new RecolnatDatabaseBackupCallable(), new RecolnatDatabaseBackupListener(), 0, 4096);
    } catch (FileNotFoundException ex) {
      log.error("Backup failed. Could not open file " + backupFilePath);
    } catch (IOException ex) {
      log.error("Backup failed. Encountered exception", ex);
    } finally {
      try {
        backupFile.close();
      } catch (IOException ex) {
        log.error("Backup failed. Could not close file " + backupFilePath);
      } catch (NullPointerException ex) {
        log.warn("Backup failed. Tried to close null file " + backupFilePath);
      }
    }
    
    log.info("Database backup finished.");
  }
}
