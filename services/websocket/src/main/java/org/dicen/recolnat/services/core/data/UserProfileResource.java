/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package org.dicen.recolnat.services.core.data;

import com.tinkerpop.blueprints.impls.orient.OrientGraph;
import fr.recolnat.database.exceptions.AccessForbiddenException;
import fr.recolnat.database.logbook.Log;
import org.codehaus.jettison.json.JSONException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author dmitri
 */
public class UserProfileResource {

  private final static Logger log = LoggerFactory.getLogger(UserProfileResource.class);

  /**
   * Returns the actions made by the user or user group.
   *
   * @param requestedUser May contain user login (may be a group), begin date, end date
   * identification
   * @param beginDate
   * @param endDate
   * @param user
   * @return
   * @throws JSONException
   * @throws fr.recolnat.database.exceptions.AccessForbiddenException
   */
  public String getRecentActivity(String requestedUser, Long beginDate, Long endDate, String user) throws JSONException, AccessForbiddenException {
    if(beginDate == null) {
      beginDate = Long.MIN_VALUE;
    }
    
    if(endDate == null) {
      endDate = Long.MAX_VALUE;
    }
    
    if(log.isDebugEnabled()) {
      log.debug("begin=" + beginDate + " end=" + endDate);
    }
    
    OrientGraph g = DatabaseAccess.getTransactionalGraph();
    try {
        Log l = new Log(requestedUser, beginDate, endDate, user, g);
        return l.toJSON().toString();
    } finally {
      g.rollback();
      g.shutdown();
    }
  }
  
  
}
