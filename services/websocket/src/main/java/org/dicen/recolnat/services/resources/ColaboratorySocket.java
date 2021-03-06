package org.dicen.recolnat.services.resources;

import org.apache.commons.collections.MultiMap;
import org.apache.commons.collections.map.MultiValueMap;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.dicen.recolnat.services.configuration.Authentication;
import org.dicen.recolnat.services.configuration.Configuration;
import org.dicen.recolnat.services.core.MessageProcessorThread;
import org.dicen.recolnat.services.core.actions.Action;
import org.dicen.recolnat.services.core.data.DatabaseResource;
import org.dicen.recolnat.services.resources.configurators.ColaboratorySocketConfigurator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.websocket.*;
import javax.websocket.server.ServerEndpoint;
import java.io.IOException;
import java.util.*;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;

/**
 * Main endpoint WebSocket message receiver for each user session. This annotated class receives messages from a single session, checks basic validity, and creates threads to process them.
 * <p>
 * Created by Dmitri Voitsekhovitch (dvoitsekh@gmail.com) on 09/04/15.
 */
@ServerEndpoint(value = "/colaboratory", configurator = ColaboratorySocketConfigurator.class)
public class ColaboratorySocket {

  // Map resource (by id) to sessions (by id) which have subscribed to it
  public static final MultiMap resourceToSessions = new MultiValueMap();
  // Map session (by id) to resources (by id) the session has subscribed to
  public static final MultiMap sessionIdToResources = new MultiValueMap();
  // Map session (by id) to user (by login)
  public static final Map<String, String> sessionIdToUser = new HashMap<>();
  // Map session (by id) to session data
  public static final Map<String, Session> sessionIdToSession = new HashMap<>();
  // Lock when writing to any map
  public static final Lock mapAccessLock = new ReentrantLock(false);

  public static final Logger log = LoggerFactory.getLogger(ColaboratorySocket.class);

  // Executor for concurrency-heavy and intensive tasks (such as delete)
  private final ExecutorService heavyExecutor = Executors.newFixedThreadPool(Configuration.Performance.HIGHCONC_WRITERS_PER_USER);

  // Executor for short and not too concurrent tasks (most of them)
  private final ExecutorService lightExecutor = Executors.newFixedThreadPool(Configuration.Performance.LOWCONC_WRITERS_PER_USER);

  // Executor for read-only actions and operations with no concurrency issues
  private final ExecutorService roExecutor = Executors.newFixedThreadPool(Configuration.Performance.READERS_PER_USER);

  @OnMessage
  public void onMessage(String message, Session session) throws JSONException, InterruptedException {
    if (log.isInfoEnabled()) {
      log.info("Message received by server: " + message);
    }

    if (message.equals("PING")) {
      this.sendMessage("PONG", session);
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
        // @TODO We need to clean up too. Close session, stuff like that. As this should never happen this code might not be useful.
        this.sendMessage("You do not exist", session);
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
          case "delete-element-from-view":
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
            lightExecutor.submit(t);
            return;
          case "import-external-image":
            lightExecutor.submit(t);
            return;
          case "place":
            lightExecutor.submit(t);
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
          case "create-tag-definition":
            lightExecutor.submit(t);
            return;
          case "tag-entity":
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
          case "list-user-downloads":
            roExecutor.submit(t);
            return;
        }
        break;
      case Action.ClientActionType.FEEDBACK:
        roExecutor.submit(t);
        return;
      case Action.ClientActionType.ORDER:
        updateType = jsonIn.getString("actionDetail");
        switch (updateType) {
          case "prepare-set-for-download":
            roExecutor.submit(t);
            break;
          default:
            log.error("Unhandled ORDER sub-type " + updateType);
            break;
        }
        return;
      default:
        log.error("Unhandled action type " + action);
        break;
    }
  }

  /**
   * When a session is closed. Remove session data from session maps.
   *
   * @param session
   * @param reason
   */
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

    heavyExecutor.shutdownNow();
    lightExecutor.shutdownNow();
    roExecutor.shutdownNow();
  }

  /**
   * Currently errors are only logged and not acted upon.
   *
   * @param session
   * @param t
   */
  @OnError
  public void onError(Session session, Throwable t) {
    log.error("Error in session " + session.getId(), t);
  }

  /**
   * When a new session tries to open, check user authentication. On failure close with code 1008. If successful, store session data and send user data.
   *
   * @param session
   * @param config
   * @throws SessionException
   * @throws IOException
   */
  @OnOpen
  public void onConnect(Session session, EndpointConfig config) throws SessionException, IOException {
    log.info("Opening new websocket session " + session.getId());

    String user;

    if (!Configuration.localdev) {
      // Check in configuration which authentication method to use
      user = Authentication.authenticate(config);
      if (user == null) {
        session.close(new CloseReason(CloseReason.CloseCodes.getCloseCode(1008), "Authentication token validation failed."));
        return;
      }
    } else {
      user = Configuration.localdevuser;
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
      this.sendMessage(response.toString(), session);
    } catch (JSONException ex) {
      log.error("JSON exception when sending user data on connection.");
    }
  }

  /**
   * Send message to a specific session.
   *
   * @param message
   * @param session
   */
  private void sendMessage(String message, Session session) {
    // If not synchronized sometimes frames can get randomly lost. No idea why. Behavior appears in Tomcat war but not in stand-alone jar.
    // Randomness is more frequent if not synchronized.
    // Randomness seems to come from using Async, so let's stick with Basic for now.
    synchronized (session) {
      try {
        session.getBasicRemote().sendText(message);
      } catch (IOException ex) {
        log.error("Could not send message to client", ex);
      }
    }
  }

  /**
   * Send internal server error to one session.
   *
   * @param session
   * @param messageId
   */
  private void sendInternalServerError(Session session, Integer messageId) {
    String error;
    if (messageId == null) {
      error = "{\"error\":500}";
    } else {
      error = "{\"error\":500,\"id\":" + messageId + "}";
    }

    this.sendMessage(error, session);
  }
}
