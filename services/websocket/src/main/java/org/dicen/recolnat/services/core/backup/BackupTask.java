/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package org.dicen.recolnat.services.core.backup;

import java.io.IOException;
import java.util.TimerTask;
import java.util.logging.Level;
import java.util.logging.Logger;
import org.dicen.recolnat.services.configuration.Configuration;
import org.dicen.recolnat.services.core.data.DatabaseAccess;

/**
 *
 * @author dmitri
 */
public class BackupTask extends TimerTask {

  @Override
  public void run() {
    try {
      DatabaseAccess.backup();
      DatabaseAccess.exportsDb.cleanup(Configuration.Exports.DIRECTORY);
    } catch (IOException ex) {
      Logger.getLogger(BackupTask.class.getName()).log(Level.SEVERE, null, ex);
    }
  }
}
