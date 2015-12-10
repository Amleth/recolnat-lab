//package org.dicen.recolnat.services.resources;
//
//import org.eclipse.jetty.websocket.servlet.WebSocketServlet;
//import org.eclipse.jetty.websocket.servlet.WebSocketServletFactory;
//
//import javax.servlet.ServletException;
//import javax.servlet.annotation.WebServlet;
//import javax.servlet.http.HttpServletRequest;
//import javax.servlet.http.HttpServletResponse;
//import java.io.IOException;
//import java.util.concurrent.TimeUnit;
//
///**
// * Created by Dmitri Voitsekhovitch (dvoitsekh@gmail.com) on 09/04/15.
// */
////@WebServlet(name = "WebSocket Servlet", urlPatterns = { "/virtual-workbench" })
//@WebServlet(name = "WebSocket Servlet", urlPatterns = { "/websocket/virtual-workbench" })
//public class VirtualWorkbenchServlet extends WebSocketServlet {
//  @Override
//  public void doGet(HttpServletRequest request,
//                    HttpServletResponse response) throws ServletException, IOException {
//    response.getWriter().println("HTTP GET method not implemented.");
//  }
//
//  @Override
//  public void configure(WebSocketServletFactory webSocketServletFactory) {
//    webSocketServletFactory.getPolicy().setIdleTimeout(TimeUnit.HOURS.toMillis(24));
//    webSocketServletFactory.register(VirtualWorkbenchSocket.class);
//  }
//}
