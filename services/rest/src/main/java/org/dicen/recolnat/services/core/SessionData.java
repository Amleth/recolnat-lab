package org.dicen.recolnat.services.core;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

/**
 * Created by Dmitri Voitsekhovitch (dvoitsekh@gmail.com) on 19/11/15.
 */
public class SessionData {
  public String userUUID;
  public String userLogin;
  public String sessionId;
  private final Set<String> singleUseTokens = new HashSet<String>();

  public SessionData(String userId, String userLogin, String session) {
    this.userUUID = userId;
    this.userLogin = userLogin;
    this.sessionId = session;
  }
  
  public String getToken() {
    String token = UUID.randomUUID().toString();
    
    while(!singleUseTokens.add(token)) {
      token = UUID.randomUUID().toString();
    }
    
    return token;
  }
  
  public boolean useToken(String token) {
    return singleUseTokens.remove(token);
  }
}
