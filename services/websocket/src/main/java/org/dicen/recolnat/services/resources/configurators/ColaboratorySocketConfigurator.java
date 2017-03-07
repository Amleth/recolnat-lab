/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package org.dicen.recolnat.services.resources.configurators;

import java.net.HttpCookie;
import java.util.List;
import javax.servlet.http.HttpSession;
import javax.websocket.HandshakeResponse;
import javax.websocket.server.HandshakeRequest;
import javax.websocket.server.ServerEndpointConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author dmitri
 */
public class ColaboratorySocketConfigurator extends ServerEndpointConfig.Configurator {
  private static final Logger LOG = LoggerFactory.getLogger(ColaboratorySocketConfigurator.class);
  
  @Override
  public void modifyHandshake(ServerEndpointConfig config, HandshakeRequest request, HandshakeResponse response) {
    List<String> cookiesStr = request.getHeaders().get("Cookie");
    LOG.trace("Listing cookies as strings");
    for(int i = 0; i < cookiesStr.size(); ++i) {
      LOG.trace(cookiesStr.get(i));
    }
    
    String token = null;
    String [] cookieStrArray = cookiesStr.get(0).split(";");
    LOG.trace("Listing cookies");
    for(int i = 0; i < cookieStrArray.length; ++i) {
      List<HttpCookie> cookies = HttpCookie.parse(cookieStrArray[i]);
      HttpCookie c = cookies.get(0);
      LOG.trace(c.getName() + "=" + c.getValue());
      if(c.getName().equals("CASTGC")) {
        token = c.getValue();
        break;
      
    }
    }
    
    if(token == null) {
      LOG.info("No CASTGC cookie found");
    }
    else {
      LOG.debug("Token found " + token);
      config.getUserProperties().put("CASTGC", token);
    }
  }
  
}
