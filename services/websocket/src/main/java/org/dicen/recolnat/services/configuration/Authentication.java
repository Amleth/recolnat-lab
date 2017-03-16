/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package org.dicen.recolnat.services.configuration;

import fr.recolnat.authentication.CASAuthentication;
import java.io.IOException;
import java.net.ConnectException;
import java.util.Map;
import javax.websocket.CloseReason;
import javax.websocket.EndpointConfig;
import org.apache.commons.lang.NotImplementedException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Static methods for authenticating a user into the application. Currently supports only CAS authentication.
 * @author dmitri
 */
public class Authentication {

  private static final Logger log = LoggerFactory.getLogger(Authentication.class);
  /**
   * 0 = not configured 1 = direct 2 = CAS
   */
  public static int authenticationMethod = 0;

  public static class CASConfiguration {

    public static String ticketUrl = "";
    public static String serviceValidateUrl = "";
  }

  public static String authenticate(EndpointConfig conf) {
    switch (Authentication.authenticationMethod) {
      case 0:
        log.error("Authentication not configured");
        return null;
      case 1:
        throw new NotImplementedException();
      case 2:
        return Authentication.authenticateWithCAS(conf.getUserProperties());
      default:
        log.error("Authentication method unknown " + authenticationMethod);
        return null;
    }
  }

  public static String authenticateWithCAS(Map<String, Object> userProps) {
    String tgt = (String) userProps.get("CASTGC");
    if(log.isDebugEnabled()) {
      log.debug("Got TGT=" + tgt);
    }
    try {
      return CASAuthentication.getCASUserLogin(tgt, CASConfiguration.ticketUrl, CASConfiguration.serviceValidateUrl);
    } catch (ConnectException ex) {
      if (log.isWarnEnabled()) {
        log.warn("Connection exception to CAS");
      }
      if (log.isDebugEnabled()) {
        log.debug("Exception details.", ex);
      }
      return null;
    } catch (IOException ex) {
      if (log.isWarnEnabled()) {
        log.warn("I/O exception reading CAS response", ex);
      }
      return null;
    }
  }
}
