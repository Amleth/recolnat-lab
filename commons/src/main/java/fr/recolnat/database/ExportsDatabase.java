/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package fr.recolnat.database;

import fr.recolnat.database.model.DataModel;
import java.io.File;
import java.io.IOException;
import java.util.Iterator;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;
import java.util.logging.Level;
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
    log.info("Rights management database at " + dbLocation);
    this.dbLocation = dbLocation;
    this.database = DBMaker.fileDB(dbLocation).fileMmapEnable().transactionEnable().make();
  }
  
  public List<String[]> listUserExports(String user) {
    if(user == null) {
      throw new NullPointerException("User is null");
    }
    while(database.isClosed()) {
      try {
        Thread.sleep(500);
      } catch (InterruptedException ex) {
        return null;
      }
    }
    Map userFiles = database.treeMap(user).createOrOpen();
    List<String[]> ret = new LinkedList<>();
    
    Iterator<String> itFileNames = userFiles.keySet().iterator();
    while(itFileNames.hasNext()) {
      String fileName = itFileNames.next();
      String fileUrl = (String) userFiles.get(fileName);
      ret.add(new String[] {fileName, fileUrl});
    }
    
    return ret;
  }
  
  public void addUserExport(String user, String fileName, String url) {
    while(database.isClosed()) {
      try {
        Thread.sleep(500);
      } catch (InterruptedException ex) {
        return;
      }
    }
    Map userFiles = database.treeMap(user).createOrOpen();
    userFiles.put(fileName, url);
    database.commit();
  }
  
  public void removeUserExport(String user, String fileName) {
    while(database.isClosed()) {
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
    while(database.isClosed()) {
      try {
        Thread.sleep(500);
      } catch (InterruptedException ex) {
        return;
      }
    }
    File exportDir = new File(exportsPath);
    File[] exportFiles = exportDir.listFiles();
    Iterator<String> itUsersWithExports = database.getAllNames().iterator();
    while(itUsersWithExports.hasNext()) {
      String user = itUsersWithExports.next();
      Map userFiles = database.treeMap(user).createOrOpen();
      Iterator<String> itFileNames = userFiles.keySet().iterator();
      while(itFileNames.hasNext()) {
        String fileName = itFileNames.next();
        for(File ef : exportFiles) {
          if(ef.getName().equals(fileName)) {
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
