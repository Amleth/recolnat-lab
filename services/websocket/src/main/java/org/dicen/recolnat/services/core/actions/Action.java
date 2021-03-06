package org.dicen.recolnat.services.core.actions;

/**
 * Defines Service and Client action types for the websocket. Each code here defines a generic action type which can then be further specified by message content.
 * 
 * Created by Dmitri Voitsekhovitch (dvoitsekh@gmail.com) on 07/04/15.
 */
public class Action {

  public static class ClientActionType {
    // Client calls to establish connection
    public static final int CONNECT = 0;
    // Clients calls to subsrcibe to a specific resource. Respond with current data and inform of any data changes.
    public static final int SUBSCRIBE = 10;
    // Client calls to unsubscribe from a specific resource.
    public static final int UNSUBSCRIBE = 11;
    // Client calls to change properties of a specific resource. Modify and broadcast new values. Provide answer to client with DONE or DENIED.
    public static final int UPDATE = 12;
    // Clients calls to subsrcibe to the logs (activity) of a specific resource.
    public static final int SUBSCRIBE_LOG = 13;
    // Client calls to unsubscribe from the logs (activity) of a specific resource.
    public static final int UNSUBSCRIBE_LOG = 14;
    // Client calls to receive computed information about a resource, but not subscribe to its changes (for example list of downloads)
    public static final int GET = 15;
    // Client calls to post a feedback message from a user, no response is expected
    public static final int FEEDBACK = 16;
    // Client wants to run a task which will not finish quickly (e.g. prepare files for download).
    public static final int ORDER = 17;
  }
  
  public static class ServerActionType {
    // Server sends resource information to one or more clients.
    public static final int RESOURCE = 21;
    // Client request accepted and executed. If any data must be sent back it will be sent with a RESOURCE message
    public static final int DONE = 22;
    // Client request denied (for any reason). Include reason with response.
    public static final int DENIED = 23;
  }
}
