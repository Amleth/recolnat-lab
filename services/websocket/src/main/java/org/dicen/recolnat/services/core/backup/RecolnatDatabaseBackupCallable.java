/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package org.dicen.recolnat.services.core.backup;

import java.util.concurrent.Callable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author dmitri
 */
public class RecolnatDatabaseBackupCallable implements Callable<Object> {

  private static final Logger log = LoggerFactory.getLogger(RecolnatDatabaseBackupCallable.class);

  @Override
  public Object call() throws Exception {
    log.info("Database locked for backup");
    return null;
  }

}
