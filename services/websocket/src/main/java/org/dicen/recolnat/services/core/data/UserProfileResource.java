/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package org.dicen.recolnat.services.core.data;

import com.tinkerpop.blueprints.impls.orient.OrientBaseGraph;
import fr.recolnat.database.exceptions.AccessForbiddenException;
import fr.recolnat.database.logbook.Log;
import java.io.File;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;
import org.apache.commons.httpclient.HttpClient;
import org.apache.commons.httpclient.methods.GetMethod;
import org.apache.commons.io.FileUtils;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Not used. Old code used a long time ago to build the user's logbook. May not work anymore.
 * @author dmitri
 */
public class UserProfileResource {

  private final static Logger log = LoggerFactory.getLogger(UserProfileResource.class);

  private final static SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd-HH:mm:ss");

  /**
   * Returns the actions made by the user or user group. Not used anywhere at the moment and may no longer work as intended.
   * @param requestedUser Login of the user whose log is requested
   * @param beginDate Begin listing events from this date
   * @param endDate End listing events at this date
   * @param user Requesting user login
   * @return
   * @throws JSONException
   * @throws fr.recolnat.database.exceptions.AccessForbiddenException
   */
  public String getRecentActivity(String requestedUser, Long beginDate, Long endDate, String user) throws JSONException, AccessForbiddenException {
    if (beginDate == null) {
      beginDate = Long.MIN_VALUE;
    }

    if (endDate == null) {
      endDate = Long.MAX_VALUE;
    }

    if (log.isDebugEnabled()) {
      log.debug("begin=" + beginDate + " end=" + endDate);
    }

    OrientBaseGraph g = DatabaseAccess.getReadOnlyGraph();
    try {
      Log l = new Log(requestedUser, beginDate, endDate, user, g, DatabaseAccess.rightsDb);
      return l.toJSON().toString();
    } finally {
      g.rollback();
      g.shutdown();
    }
  }

  /**
   * Save a message from the user (feedback about the application) in a local directory.
   * @param feedbackType Short type description of the feedback type (for example: bug, suggestion)
   * @param message Text of the message
   * @param rsvp If the user would like a response by mail to his request.
   * @param userLogin Login of the user providing the feedback.
   * @throws IOException
   * @throws JSONException 
   */
  public static void postFeedback(String feedbackType, String message, Boolean rsvp, String userLogin) throws IOException, JSONException {
    File output = new File("./feedback/" + userLogin + "-" + dateFormat.format(new Date()));
    FileUtils.touch(output);

    FileUtils.writeStringToFile(output, feedbackType + System.getProperty("line.separator"));
    FileUtils.writeStringToFile(output, message + System.getProperty("line.separator"), true);
    if (rsvp) {
      FileUtils.writeStringToFile(output, "RSVP" + System.getProperty("line.separator"), true);
    }
  }

}
