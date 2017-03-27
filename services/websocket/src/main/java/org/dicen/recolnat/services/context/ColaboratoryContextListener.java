/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package org.dicen.recolnat.services.context;

import com.orientechnologies.orient.core.config.OGlobalConfiguration;
import java.io.File;
import java.io.FileNotFoundException;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Timer;
import javax.servlet.ServletContextEvent;
import javax.servlet.ServletContextListener;
import javax.servlet.annotation.WebListener;
import org.apache.commons.lang.time.DateUtils;
import org.dicen.recolnat.services.configuration.Configuration;
import org.dicen.recolnat.services.core.backup.BackupTask;
import org.dicen.recolnat.services.core.data.DatabaseAccess;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * ContextListener implementation for loading and unloading resources (configuration, databases) when the WAR is deployed or undeployed. OrientDB memory cleanup is performed here.
 * @author dmitri
 */
@WebListener
public class ColaboratoryContextListener implements ServletContextListener {
  private static final Logger LOG = LoggerFactory.getLogger(ColaboratoryContextListener.class);
  
  private static final Timer BACKUP_TIMER = new Timer();

  @Override
  public void contextInitialized(ServletContextEvent sce) {
    
    OGlobalConfiguration.RID_BAG_EMBEDDED_TO_SBTREEBONSAI_THRESHOLD.setValue(-1);
    String homeDir = System.getenv("COLABORATORY_HOME");
    if(homeDir == null) {
      sce.getServletContext().log("ERROR. No COLABORATORY_HOME environment variable. Application will fail.");
      return;
    }
    sce.getServletContext().log("COLABORATORY_HOME=" + homeDir);
    sce.getServletContext().log("Looking for configuration file colaboratory-socket.yml in COLABORATORY_HOME");
    
    String configurationFileName = homeDir + File.separator + "colaboratory-socket.yml";
    try {
      Configuration.loadConfiguration(configurationFileName, sce.getServletContext());
    } catch (FileNotFoundException ex) {
      sce.getServletContext().log("Unable to load configuration file.");
      return;
    }
    
    LOG.info("Configuring databases");
//    Orient.instance().startup();
//    Orient.instance().removeShutdownHook();
    Configuration.configureDatabases();
    LOG.info("Configuring authentication methods");
    Configuration.configureUserAuthentication();
    
    // Configure periodic backup
    LOG.info("Setting up automatic backup");
    SimpleDateFormat dateParser = new SimpleDateFormat("u-HH:mm");
    
    Date firstBackupDate;
    try {
      firstBackupDate = dateParser.parse(Configuration.Databases.Backup.FIRST_EXECUTION);
    } catch (ParseException ex) {
      LOG.error("Unable to parse first backup execution date. Expected format is 'u-HH:mm'. Databases will NOT be backed up.");
      return;
    }
    Date now;
    try {
      now = dateParser.parse(dateParser.format(new Date()));
    } catch (ParseException ex) {
      LOG.error("Unable to parse current date. Perhaps a Java version (expected 8) problem? Databases will NOT be backed up.");
      return;
    }
    long delay = firstBackupDate.getTime() - now.getTime();
    if(delay < 0) {
      delay += 7*DateUtils.MILLIS_PER_DAY;
    }
    
    LOG.info("Backups will begin in " + delay + " milliseconds");
    LOG.info("Backup will run every " + Configuration.Databases.Backup.FREQUENCY + " days");
    
    BACKUP_TIMER.scheduleAtFixedRate(new BackupTask(), delay, Configuration.Databases.Backup.FREQUENCY * DateUtils.MILLIS_PER_DAY);
  }

  @Override
  public void contextDestroyed(ServletContextEvent sce) {
    LOG.info("Shutting down database backup processes.");
    BACKUP_TIMER.cancel();
    LOG.info("Shutting down databases.");
    DatabaseAccess.shutdown();
//    Orient.instance().shutdown();
  }
  
}
