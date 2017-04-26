/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package fr.recolnat.database;

import java.io.File;
import java.io.IOException;
import java.util.Iterator;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;
import org.apache.commons.io.FileUtils;
import org.mapdb.DB;
import org.mapdb.DBMaker;
import org.mapdb.Serializer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author dmitri
 */
public class ExportsDatabase {

  private DB database = null;
  private String dbLocation = null;
  private static final Logger log = LoggerFactory.getLogger(ExportsDatabase.class);
  private static final Lock lock = new ReentrantLock();

  public ExportsDatabase(String dbLocation) {
    log.info("Exports database at " + dbLocation);
    this.dbLocation = dbLocation;
    this.database = DBMaker.fileDB(dbLocation).fileMmapEnable().transactionEnable().closeOnJvmShutdown().make();
  }

  public List<String[]> listUserExports(String user) {
    if (log.isDebugEnabled()) {
      log.debug("Entering listUserExports(user=" + user + ")");
    }
    if (user == null) {
      throw new NullPointerException("User is null");
    }
    while (this.database.isClosed()) {
      log.warn("Exports database is closed, waiting 500ms");
      try {
        Thread.sleep(500);
      } catch (InterruptedException ex) {
        log.info("Received SIGINT.");
        return null;
      }
    }

    if (log.isDebugEnabled()) {
      log.debug("Opening user exports");
    }
    Map<String, String> userFiles = this.database.treeMap(user, Serializer.STRING, Serializer.STRING).createOrOpen();
    if (log.isDebugEnabled()) {
      log.debug("Building exports list");
    }
    List<String[]> ret = new LinkedList<>();

    Iterator<String> itFileNames = userFiles.keySet().iterator();
    if (log.isDebugEnabled()) {
      log.debug("Got key set iterator");
    }
    while (itFileNames.hasNext()) {
      String fileName = itFileNames.next();
      String fileUrl = (String) userFiles.get(fileName);
      if (log.isDebugEnabled()) {
        log.debug("Adding " + fileName + " " + fileUrl);
      }
      ret.add(new String[]{fileName, fileUrl});
    }

    if (log.isDebugEnabled()) {
      log.debug("Returning " + ret.toString());
    }
    
    // This commit is called because createOrOpen is used earlier.
    this.database.commit();
    
    return ret;
  }

  public void addUserExport(String user, String fileName, String url) {
    if(log.isDebugEnabled()) {
      log.debug("Entering addUserExport(user=" + user + ", fileName=" + fileName + ", url=" + url + ")");
    }
    while (database.isClosed()) {
      log.warn("Exports database closed. Waiting 500ms for retry.");
      try {
        Thread.sleep(500);
      } catch (InterruptedException ex) {
        log.info("Sleep interrupted: SIGINT");
        return;
      }
    }
    Map<String,String> userFiles = database.treeMap(user, Serializer.STRING, Serializer.STRING).createOrOpen();
    if(log.isDebugEnabled()) {
      log.debug("Got user exports map");
    }
    userFiles.put(fileName, url);
    this.database.commit();
  }

  public void removeUserExport(String user, String fileName) {
    while (database.isClosed()) {
      try {
        Thread.sleep(500);
      } catch (InterruptedException ex) {
        return;
      }
    }
    Map userFiles = database.treeMap(user).createOrOpen();
    userFiles.remove(fileName);
    database.commit();
  }

  public void cleanup(String exportsPath) {
    while (database.isClosed()) {
      try {
        Thread.sleep(500);
      } catch (InterruptedException ex) {
        return;
      }
    }
    File exportDir = new File(exportsPath);
    File[] exportFiles = exportDir.listFiles();
    Iterator<String> itUsersWithExports = database.getAllNames().iterator();
    while (itUsersWithExports.hasNext()) {
      String user = itUsersWithExports.next();
      Map userFiles = database.treeMap(user).createOrOpen();
      Iterator<String> itFileNames = userFiles.keySet().iterator();
      while (itFileNames.hasNext()) {
        String fileName = itFileNames.next();
        for (File ef : exportFiles) {
          if (ef.getName().equals(fileName)) {
            ef.delete();
            itFileNames.remove();
          }
        }
      }
    }
    database.commit();
  }

  public void backup(String destFile) throws IOException {
    database.close();
    FileUtils.copyFile(new File(this.dbLocation), new File(destFile));
    this.database = DBMaker.fileDB(dbLocation).fileMmapEnable().transactionEnable().make();
  }

  public void shutdown() {
    database.close();
  }
}
