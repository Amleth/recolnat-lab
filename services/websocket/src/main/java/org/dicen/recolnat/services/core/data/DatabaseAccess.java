package org.dicen.recolnat.services.core.data;

import com.orientechnologies.orient.core.Orient;
import com.orientechnologies.orient.core.db.ODatabase;
import com.orientechnologies.orient.core.exception.ODatabaseException;
import com.orientechnologies.orient.core.intent.OIntent;
import com.tinkerpop.blueprints.impls.orient.OrientBaseGraph;
import com.tinkerpop.blueprints.impls.orient.OrientGraphFactory;
import fr.recolnat.database.ExportsDatabase;
import fr.recolnat.database.RightsManagementDatabase;
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
  
  public static RightsManagementDatabase rightsDb = null;
  public static ExportsDatabase exportsDb = null;
  
  private static boolean shutdown = false;

  private static final Logger log = LoggerFactory.getLogger(DatabaseAccess.class);

  public static void configure(String dbPath, String dbUser, String dbPass, Integer minPoolSize, Integer maxPoolSize, String backupDir) {
    DatabaseAccess.dbPath = dbPath;
    DatabaseAccess.dbUser = dbUser;
    DatabaseAccess.dbPass = dbPass;
    DatabaseAccess.minConnectorPoolSize = minPoolSize;
    DatabaseAccess.maxConnectorPoolSize = maxPoolSize;
    DatabaseAccess.backupDir = backupDir;
    
    DatabaseAccess.readerFactory = new OrientGraphFactory("plocal:" + dbPath, dbUser, dbPass).setupPool(minPoolSize, maxPoolSize);
    DatabaseAccess.writerFactory = new OrientGraphFactory("plocal:" + dbPath, dbUser, dbPass).setupPool(minPoolSize, maxPoolSize);
  }
  
  public static void configureRightsDatabase(String dbPath) {
    rightsDb = new RightsManagementDatabase(dbPath);
  }
  
  public static void configureExportsDatabase(String dbPath) {
    exportsDb = new ExportsDatabase(dbPath);
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
    if(shutdown) {
      return null;
    }
    try {
      if (log.isDebugEnabled()) {
        log.debug("getTransactionalGraph status " + readerFactory.getAvailableInstancesInPool() + " available, " + readerFactory.getCreatedInstancesInPool() + " created");
      }
      return (OrientBaseGraph) DatabaseAccess.readerFactory.getTx();
    } catch (ODatabaseException e) {
      log.error("Database exception getting new reader graph", e);
      DatabaseAccess.readerFactory = new OrientGraphFactory("plocal:" + dbPath, dbUser, dbPass).setupPool(minConnectorPoolSize, maxConnectorPoolSize);
      return (OrientBaseGraph) DatabaseAccess.readerFactory.getTx();
    }
  }
  
  public static OrientBaseGraph getReaderWriterGraph() {
    if(shutdown) {
      return null;
    }
    try {
      if (log.isDebugEnabled()) {
        log.debug("getTransactionalGraph status " + writerFactory.getAvailableInstancesInPool() + " available, " + writerFactory.getCreatedInstancesInPool() + " created");
      }
      return (OrientBaseGraph) DatabaseAccess.writerFactory.getTx();
    } catch (ODatabaseException e) {
      log.error("Database exception getting new transactional graph", e);
      DatabaseAccess.writerFactory = new OrientGraphFactory("plocal:" + dbPath, dbUser, dbPass).setupPool(minConnectorPoolSize, maxConnectorPoolSize);
      return (OrientBaseGraph) DatabaseAccess.writerFactory.getTx();
    }
  }
  
  public static void backup() throws IOException {
    if(shutdown) {
      return;
    }
    log.info("Beginning database backup.");
    FileOutputStream backupFile = null;
    ODatabase database = DatabaseAccess.readerFactory.getDatabase();
    String formattedDate = dateFormat.format(new Date());
    String backupFilePath = DatabaseAccess.backupDir + "/" + database.getName() +"-" + formattedDate;
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
    
    String uacBackupFilePath = DatabaseAccess.backupDir + "/" + database.getName() + "-UAC-" + formattedDate;
    rightsDb.backup(uacBackupFilePath);
    
    String exportBackupFilePath = DatabaseAccess.backupDir + "/" + database.getName() + "-EXPORTS-" + formattedDate;
    rightsDb.backup(exportBackupFilePath);
    
    log.info("Database backup finished.");
  }
  
  public static void shutdown() {
    
    DatabaseAccess.shutdown = true;
    DatabaseAccess.readerFactory.getDatabase().close();
    DatabaseAccess.writerFactory.getDatabase().close();
    
    DatabaseAccess.readerFactory.close();
    DatabaseAccess.writerFactory.close();
    Orient.instance().shutdown();
    Orient.instance().closeAllStorages();
    DatabaseAccess.rightsDb.shutdown();
    DatabaseAccess.exportsDb.shutdown();
    
  }
}
