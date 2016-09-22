/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package org.dicen.recolnat.services.core.backup;

import java.util.TimerTask;
import org.dicen.recolnat.services.core.data.DatabaseAccess;

/**
 *
 * @author dmitri
 */
public class BackupTask extends TimerTask {

  @Override
  public void run() {
    DatabaseAccess.backup();
  }
}
