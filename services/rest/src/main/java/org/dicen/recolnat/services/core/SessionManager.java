package org.dicen.recolnat.services.core;

import org.dicen.recolnat.services.conf.TestConfiguration;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response;
import org.dicen.recolnat.services.resources.AuthenticationResource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Created by Dmitri Voitsekhovitch (dvoitsekh@gmail.com) on 19/11/15.
 */
public class SessionManager {

  private static final Map<String, SessionData> sessionToSessionData = new ConcurrentHashMap<String, SessionData>();
  private final static Logger log = LoggerFactory.getLogger(SessionManager.class);

  public static String newSession(String userId, String userLogin) {
    String sessionId = UUID.randomUUID().toString();
    while (sessionToSessionData.containsKey(sessionId)) {
      sessionId = UUID.randomUUID().toString();
    }
    sessionToSessionData.put(sessionId, new SessionData(userId, userLogin, sessionId));
    return sessionId;
  }

  public static void newSpecialSession(String session) {
    sessionToSessionData.put(session, new SessionData(session, session, session));
  }
  
  public static SessionData getSessionDate(String session) {
    return sessionToSessionData.get(session);
  }

  public static String getUserLogin(String sessionId) {
    SessionData data = sessionToSessionData.get(sessionId);
    if (data == null) {
      return null;
    }
    return data.userLogin;
  }
  
  public static String getUserId(String sessionId) {
    SessionData data = sessionToSessionData.get(sessionId);
    if (data == null) {
      return null;
    }
    return data.userUUID;
  }

  public static void expireSession(String session) {
    sessionToSessionData.remove(session);
  }

  /**
   * Retrieves session corresponding to the session cookie set in input request.
   * 
   * @param request
   * @param exceptionWhenNoSession throw an exception when no session id is available instead of returning null
   * @throws WebApplicationException if required cookie is not found and exceptionWhenNoSession is true.
   * @return 
   */
  public static String getSessionId(HttpServletRequest request, boolean exceptionWhenNoSession) {
    Cookie[] cookies = request.getCookies();
    if (cookies != null) {
      for (int i = 0; i < cookies.length; ++i) {
        Cookie c = cookies[i];
        log.debug(c.getName());
        if (c.getName().equals("labSessionId")) {
//          if (c.getSecure()) {
//            if (c.isHttpOnly()) {
              return c.getValue();
//            }
//          }
        }
      }
    }
    if(exceptionWhenNoSession) {
      throw new WebApplicationException("Session cookie not found. User is not authenticated.", Response.Status.UNAUTHORIZED);
    }
    return null;
  }
  
  public static String getOneUseSecurityToken(String session) {
    SessionData data = sessionToSessionData.get(session);
    String token = data.getToken();
//    sessionToSessionData.put(session, data);
    return token;
  }
  
  public static boolean useSecurityToken(String session, String token) {
    SessionData data = sessionToSessionData.get(session);
    boolean authorized = data.useToken(token);
//    sessionToSessionData.put(session, data);
    return authorized;
  }
}
