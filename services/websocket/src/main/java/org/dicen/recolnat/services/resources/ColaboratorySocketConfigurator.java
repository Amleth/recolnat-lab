/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package org.dicen.recolnat.services.resources;

import java.net.HttpCookie;
import java.util.List;
import javax.servlet.http.HttpSession;
import javax.websocket.HandshakeResponse;
import javax.websocket.server.HandshakeRequest;
import javax.websocket.server.ServerEndpointConfig;

/**
 *
 * @author dmitri
 */
public class ColaboratorySocketConfigurator extends ServerEndpointConfig.Configurator {
  
  @Override
  public void modifyHandshake(ServerEndpointConfig config, HandshakeRequest request, HandshakeResponse response) {
    List<String> cookiesStr = request.getHeaders().get("Cookie");
    for(int i = 0; i < cookiesStr.size(); ++i) {
      System.out.println(cookiesStr.get(i));
    }
    
    String token = null;
    String [] cookieStrArray = cookiesStr.get(0).split(";");
    for(int i = 0; i < cookieStrArray.length; ++i) {
      List<HttpCookie> cookies = HttpCookie.parse(cookieStrArray[i]);
      HttpCookie c = cookies.get(0);
      System.out.println(c.getName() + "=" + c.getValue());
      if(c.getName().equals("CASTGC")) {
        token = c.getValue();
        break;
      
    }
    }
    
    if(token == null) {
      System.err.println("No CASTGC cookie found");
    }
    System.out.println("Token found " + token);
    config.getUserProperties().put("CASTGC", token);
  }
  
}
