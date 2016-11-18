package org.dicen.recolnat.services.resources;

import org.apache.commons.collections.map.MultiValueMap;
import org.apache.commons.collections.MultiMap;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.dicen.recolnat.services.core.actions.Action;

import javax.websocket.*;
import javax.websocket.server.ServerEndpoint;
import java.io.IOException;
import java.util.*;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;
import org.dicen.recolnat.services.core.data.DatabaseResource;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.dicen.recolnat.services.configuration.Authentication;
import org.dicen.recolnat.services.core.MessageProcessorThread;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Created by Dmitri Voitsekhovitch (dvoitsekh@gmail.com) on 09/04/15.
 */
@ServerEndpoint(value = "/colaboratory",
    configurator = ColaboratorySocketConfigurator.class)
public class ColaboratorySocket {

  // Map resource (by id) to sessions (by id) which have subscribed to it
  public static final MultiMap resourceToSessions = new MultiValueMap();
  // Map session (by id) to resources (by id) the session has subscribed to
  public static final MultiMap sessionIdToResources = new MultiValueMap();
  // Map session (by id) to user (by login)
  public static final Map<String, String> sessionIdToUser = new HashMap<String, String>();
  // Map session (by id) to session data
  public static final Map<String, Session> sessionIdToSession = new HashMap<String, Session>();
  // Lock when writing to any map
  public static final Lock mapAccessLock = new ReentrantLock(false);

  public static final Logger log = LoggerFactory.getLogger(ColaboratorySocket.class);

  // Executor for concurrency-heavy and intensive tasks (such as import or delete)
  private final ExecutorService heavyExecutor = Executors.newSingleThreadExecutor();

  // Executor for short and not too concurrent tasks
  private final ExecutorService lightExecutor = Executors.newFixedThreadPool(4);

  // Executor for read-only actions and operations with no concurrency issues
  private final ExecutorService roExecutor = Executors.newFixedThreadPool(10);

  @OnMessage
  public void onMessage(String message, Session session) throws JSONException, InterruptedException {
    if (log.isInfoEnabled()) {
      log.info("Message received by server: " + message);
    }

    if (message.equals("PING")) {
      session.getAsyncRemote().sendText("PONG");
      return;
    }
//
    JSONObject jsonIn = null;
    try {
      jsonIn = new JSONObject(message);
    } catch (JSONException e) {
      log.error("Could not convert input message to JSON : " + message);
      return;
    }
//
    String sessionId = null;
    String userLogin = null;
    mapAccessLock.lock();
    try {
      sessionId = session.getId();
      userLogin = sessionIdToUser.get(sessionId);
      if (userLogin == null) {
        // @TODO We need to clean up too. Close session, stuff like that.
        session.getAsyncRemote().sendText("You do not exist");
        session.close();
        log.error("Message received from client with no corresponding user (OnMessage before OnOpen)");
        return;
      }
    } catch (IOException ex) {
      log.error("Exception when trying to close session when non-connected client sends a message", ex);
      return;
    } finally {
      mapAccessLock.unlock();
    }

    MessageProcessorThread t = new MessageProcessorThread(session, jsonIn, userLogin);

    int action = jsonIn.getInt("action");

    switch (action) {
      case Action.ClientActionType.CONNECT:
        log.error("Received a connect request in a place where it should not happen in practice. " + message);
        break;
      case Action.ClientActionType.SUBSCRIBE:
        roExecutor.submit(t);
        return;
      case Action.ClientActionType.UNSUBSCRIBE:
        roExecutor.submit(t);
        return;
      case Action.ClientActionType.UPDATE:
        String updateType = jsonIn.getString("actionDetail");
        switch (updateType) {
          case "get-image":
            log.error("Call to get-image should no longer happen in WebSocket");
            break;
          case "get-specimen":
            log.error("Call to get-specimen should no longer happen in WebSocket");
            break;
          case "create-roi":
            lightExecutor.submit(t);
            return;
          case "create-poi":
            lightExecutor.submit(t);
            return;
          case "create-toi":
            lightExecutor.submit(t);
            return;
          case "create-aoi":
            lightExecutor.submit(t);
            return;
          case "add-measure-standard":
            lightExecutor.submit(t);
            return;
          case "get-set":
            log.error("Call to get-set should no longer happen in WebSocket");
            break;
          case "create-set":
            lightExecutor.submit(t);
            return;
          case "delete-element-from-set":
            heavyExecutor.submit(t);
            return;
          case "link":
            lightExecutor.submit(t);
            return;
          case "copy":
            lightExecutor.submit(t);
            return;
          case "cutpaste":
            heavyExecutor.submit(t);
            return;
          case "import-recolnat-specimen":
            heavyExecutor.submit(t);
            return;
          case "import-external-image":
            heavyExecutor.submit(t);
            return;
          case "place":
            heavyExecutor.submit(t);
            return;
          case "move":
            lightExecutor.submit(t);
            return;
          case "resize":
            lightExecutor.submit(t);
            return;
          case "get-recent-activity":
            log.error("Call to get-recent-activity occurred where it should not have");
            break;
          case "get-data":
            log.error("Call to get-data should no longer happen in WebSocket");
            break;
          case "remove":
            heavyExecutor.submit(t);
            return;
          case "get-change-log":
            break;
          case "add-annotation":
            lightExecutor.submit(t);
            return;
          case "edit-properties":
            lightExecutor.submit(t);
            return;
        }
        break;
      case Action.ClientActionType.GET:
        String actionDetail = jsonIn.getString("actionDetail");
        switch (actionDetail) {
          case "get-annotations-of-entity":
            roExecutor.submit(t);
            return;
        }
        break;
      case Action.ClientActionType.FEEDBACK:
        roExecutor.submit(t);
        return;
      default:
        log.error("Unhandled action type " + action);
        break;
    }
  }

  @OnClose
  public void onClose(Session session, CloseReason reason) {
    log.info("Closing websocket session " + session.getId() + " due to: " + reason.getReasonPhrase());
    ColaboratorySocket.mapAccessLock.lock();
    try {
      Collection<String> resourceIds = (Collection<String>) ColaboratorySocket.sessionIdToResources.get(session.getId());
      if (resourceIds != null) {
        Iterator<String> itResourceIds = resourceIds.iterator();
        while (itResourceIds.hasNext()) {
          String resourceId = itResourceIds.next();
          Collection<String> sessions = (Collection<String>) ColaboratorySocket.resourceToSessions.get(resourceId);
          Iterator<String> itSessions = sessions.iterator();
          while (itSessions.hasNext()) {
            String sessionId = itSessions.next();
            if (sessionId.equals(session.getId())) {
              itSessions.remove();
            }
          }
        }
      }
      ColaboratorySocket.sessionIdToResources.remove(session.getId());
      ColaboratorySocket.sessionIdToUser.remove(session.getId());
      ColaboratorySocket.sessionIdToSession.remove(session.getId());
    } finally {
      ColaboratorySocket.mapAccessLock.unlock();
    }
  }

  @OnError
  public void onError(Session session, Throwable t) {
    log.error("Error in session " + session.getId(), t);
  }

  @OnOpen
  public void onConnect(Session session, EndpointConfig config) throws SessionException, IOException {
    log.info("Opening new websocket session " + session.getId());
    // Check in configuration which authentication method to use
    String user = Authentication.authenticate(config);
    if (user == null) {
      session.close(new CloseReason(CloseReason.CloseCodes.getCloseCode(1008), "Authentication token validation failed."));
      return;
    }

    // User is now authenticated. Carry on as usual.
    String sessionId = session.getId();
    ColaboratorySocket.mapAccessLock.lock();
    try {
      ColaboratorySocket.sessionIdToSession.put(sessionId, session);
      ColaboratorySocket.sessionIdToUser.put(sessionId, user);
    } finally {
      ColaboratorySocket.mapAccessLock.unlock();
    }

    try {
      JSONObject data = DatabaseResource.getUserData(user);
      JSONObject response = new JSONObject();
      response.put("action", Action.ServerActionType.RESOURCE);
      response.put("resource", data);
      response.put("timestamp", new Date().getTime());
      session.getAsyncRemote().sendText(response.toString());
    } catch (JSONException ex) {
      log.error("JSON exception when sending user data on connection.");
    }
  }

  private void sendInternalServerError(Session session) {
    session.getAsyncRemote().sendText("500");
  }
}
