package org.dicen.recolnat.services;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Map;
import java.util.Timer;
import org.apache.commons.lang.time.DateUtils;
import org.dicen.recolnat.services.core.backup.BackupTask;
import org.dicen.recolnat.services.core.data.DatabaseAccess;
import org.dicen.recolnat.services.resources.ColaboratorySocket;
import org.glassfish.tyrus.server.Server;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.yaml.snakeyaml.Yaml;

/**
 * Created by Dmitri Voitsekhovitch (dvoitsekh@gmail.com) on 09/04/15.
 */
public class ServerApplication {
  private static final Logger log = LoggerFactory.getLogger(ServerApplication.class);

  public static void main(String[] args) throws Exception {
    
    String configurationFileName = args[0];
    Yaml yaml = new Yaml();
    InputStream input = new FileInputStream(new File(configurationFileName));
    Map conf = (Map) yaml.load(input);
    Map dbConf = (Map) conf.get("database");
    String dbPath = (String) dbConf.get("dbPath");
    String dbUser = (String) dbConf.get("dbUser");
    String dbPass = (String) dbConf.get("password");
    Map backupConf = (Map) dbConf.get("backup");
    String dbBackupDirectory = (String) backupConf.get("directory");
    String dbBackupFirstExecute = (String) backupConf.get("firstExecutionDate");
    Integer dbBackupFrequency = (Integer) backupConf.get("frequency");
    Integer minPool = (Integer) dbConf.get("minConnectorPoolSize");
    Integer maxPool = (Integer) dbConf.get("maxConnectorPoolSize");
    DatabaseAccess.configure(dbPath, dbUser, dbPass, minPool, maxPool, dbBackupDirectory);
    
    Map serverConf = (Map) conf.get("server");
    Integer srvPort = (Integer) serverConf.get("port");
    
    final Server server = new Server("localhost", srvPort, "/websockets", null, ColaboratorySocket.class);

    server.start();
    
    Timer backupTimer = new Timer();
    SimpleDateFormat dateParser = new SimpleDateFormat("u-HH:mm");
    
    Date firstBackupDate = dateParser.parse(dbBackupFirstExecute);
    Date now = dateParser.parse(dateParser.format(new Date()));
    long delay = firstBackupDate.getTime() - now.getTime();
    if(delay < 0) {
      delay += 7*DateUtils.MILLIS_PER_DAY;
    }
    
    log.info("Backups will begin in " + delay + " milliseconds");
    log.info("Backup will run every " + dbBackupFrequency + " days");
    
    backupTimer.scheduleAtFixedRate(new BackupTask(), delay, dbBackupFrequency * DateUtils.MILLIS_PER_DAY);
    
    Runtime.getRuntime().addShutdownHook(new Thread() {
      @Override
      public void run() {
        server.stop();
        backupTimer.cancel();
      }
    });
    
    

    while(true) {
      Thread.sleep(1000);
    }
  }
}
