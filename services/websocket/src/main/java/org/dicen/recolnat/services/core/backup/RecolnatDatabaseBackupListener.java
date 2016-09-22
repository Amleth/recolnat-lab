/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package org.dicen.recolnat.services.core.backup;

import com.orientechnologies.orient.core.command.OCommandOutputListener;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author dmitri
 */
public class RecolnatDatabaseBackupListener implements OCommandOutputListener {

  private static final Logger log = LoggerFactory.getLogger(RecolnatDatabaseBackupListener.class);

  @Override
  public void onMessage(String arg0) {
    log.info(arg0);
  }
}
