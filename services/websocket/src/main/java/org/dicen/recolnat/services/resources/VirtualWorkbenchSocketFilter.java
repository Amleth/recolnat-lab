/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package org.dicen.recolnat.services.resources;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.annotation.WebFilter;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletRequestWrapper;

/**
 *
 * @author dmitri
 */
@WebFilter("/virtual-workbench")
public class VirtualWorkbenchSocketFilter implements Filter {

  @Override
  public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
    HttpServletRequest httpRequest = (HttpServletRequest) request;
    final Map<String, String[]> props = new HashMap<String, String[]>();

    if (httpRequest.getCookies() != null) {
      for (int i = 0; i < httpRequest.getCookies().length; ++i) {
        Cookie c = httpRequest.getCookies()[i];
        if (c.getName().equals("TOKEN")) {
          props.put("TOKEN", new String[]{c.getValue()});
          break;
        }
      }
    }

    HttpServletRequestWrapper wrappedRequest = new HttpServletRequestWrapper(httpRequest) {
      @Override
      public Map<String, String[]> getParameterMap() {
        return props;
      }
    };

    chain.doFilter(wrappedRequest, response);
  }
  
  @Override
  public void destroy() {
    
  }
  
  @Override
  public void init(FilterConfig arg0) throws ServletException {
    
  }
}
