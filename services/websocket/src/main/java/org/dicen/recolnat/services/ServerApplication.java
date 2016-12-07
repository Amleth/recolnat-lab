package org.dicen.recolnat.services;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Timer;
import org.apache.commons.lang.time.DateUtils;
import org.dicen.recolnat.services.configuration.Configuration;
import org.dicen.recolnat.services.core.backup.BackupTask;
import org.dicen.recolnat.services.core.data.DatabaseAccess;
import org.dicen.recolnat.services.resources.ColaboratorySocket;
import org.glassfish.tyrus.server.Server;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Created by Dmitri Voitsekhovitch (dvoitsekh@gmail.com) on 09/04/15.
 */
public class ServerApplication {
  private static final Logger log = LoggerFactory.getLogger(ServerApplication.class);

  public static void main(String[] args) throws Exception {
    
    String configurationFileName = args[0];
    Configuration.loadConfiguration(configurationFileName);
    Configuration.configureDatabases();
    Configuration.configureUserAuthentication();
    
    // Start server
    final Server server = new Server("localhost", Configuration.Server.PORT, "/websockets", null, ColaboratorySocket.class);

    server.start();
    
    // Configure periodic backup
    Timer backupTimer = new Timer();
    SimpleDateFormat dateParser = new SimpleDateFormat("u-HH:mm");
    
    Date firstBackupDate = dateParser.parse(Configuration.Databases.Backup.FIRST_EXECUTION);
    Date now = dateParser.parse(dateParser.format(new Date()));
    long delay = firstBackupDate.getTime() - now.getTime();
    if(delay < 0) {
      delay += 7*DateUtils.MILLIS_PER_DAY;
    }
    
    log.info("Backups will begin in " + delay + " milliseconds");
    log.info("Backup will run every " + Configuration.Databases.Backup.FREQUENCY + " days");
    
    backupTimer.scheduleAtFixedRate(new BackupTask(), delay, Configuration.Databases.Backup.FREQUENCY * DateUtils.MILLIS_PER_DAY);
    
    Runtime.getRuntime().addShutdownHook(new Thread() {
      @Override
      public void run() {
        server.stop();
        backupTimer.cancel();
        DatabaseAccess.rightsDb.shutdown();
      }
    });
    
    

    while(true) {
      Thread.sleep(1000);
    }
  }
}
