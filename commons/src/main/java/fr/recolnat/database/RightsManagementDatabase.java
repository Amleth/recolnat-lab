/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package fr.recolnat.database;

import fr.recolnat.database.model.DataModel;
import java.io.File;
import java.io.IOException;
import java.util.Map;
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
public class RightsManagementDatabase {
  private DB database = null;
  private String dbLocation = null;
  private static final Logger log = LoggerFactory.getLogger(RightsManagementDatabase.class);
  private static final Lock lock = new ReentrantLock();
  
  public RightsManagementDatabase(String dbLocation) {
    log.info("Rights management database at " + dbLocation);
    this.dbLocation = dbLocation;
    this.database = DBMaker.fileDB(dbLocation).fileMmapEnable().transactionEnable().make();
  }
  
  public DataModel.Enums.AccessRights getAccessRights(String user, String node) {
    if(user == null) {
      throw new NullPointerException("User is null");
    }
    if(node == null) {
      throw new NullPointerException("Node id is null");
    }
    while(database.isClosed()) {
      try {
        Thread.sleep(500);
      } catch (InterruptedException ex) {
        return null;
      }
    }
    log.debug("getAccessRights " + user + " " + node);
    Map<String, Integer> userRights = database.treeMap(user, Serializer.STRING, Serializer.INTEGER).createOrOpen();
    Integer rights = userRights.get(node);
    // This commit is called because createOrOpen is used earlier.
    database.commit();
    if(rights != null) {
      return DataModel.Enums.AccessRights.fromInt(rights);
    }
    else {
      return DataModel.Enums.AccessRights.NONE;
    }
  }
  
  public void setAccessRights(String user, String node, DataModel.Enums.AccessRights rights) {
    while(database.isClosed()) {
      try {
        Thread.sleep(500);
      } catch (InterruptedException ex) {
        return;
      }
    }
    Map<String, Integer> userRights = database.treeMap(user, Serializer.STRING, Serializer.INTEGER).createOrOpen();
    userRights.put(node, rights.value());
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
