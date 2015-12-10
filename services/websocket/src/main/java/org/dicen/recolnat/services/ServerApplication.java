package org.dicen.recolnat.services;

import org.dicen.recolnat.services.resources.VirtualWorkbenchSocket;
import org.glassfish.tyrus.server.Server;

/**
 * Created by Dmitri Voitsekhovitch (dvoitsekh@gmail.com) on 09/04/15.
 */
public class ServerApplication {

  public static void main(String[] args) throws Exception {
    final Server server = new Server("localhost", 8888, "/websockets", null, VirtualWorkbenchSocket.class);

    server.start();
    Runtime.getRuntime().addShutdownHook(new Thread() {
      @Override
      public void run() {
        server.stop();
      }
    });

    while(true) {
      Thread.sleep(1000);
    }
  }
}
