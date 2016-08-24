package org.dicen.recolnat.services.resources;

import com.tinkerpop.blueprints.impls.orient.OrientGraph;
import com.tinkerpop.blueprints.impls.orient.OrientVertex;
import fr.recolnat.authentication.CASAuthentication;
import fr.recolnat.database.RemoteDatabaseConnector;
import fr.recolnat.database.exceptions.AccessForbiddenException;
import fr.recolnat.database.exceptions.ObsoleteDataException;
import fr.recolnat.database.model.impl.AbstractObject;
import fr.recolnat.database.utils.AccessUtils;
import org.apache.commons.collections.map.MultiValueMap;
import org.apache.commons.collections.MultiMap;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.dicen.recolnat.services.core.actions.Action;

import javax.websocket.*;
import javax.websocket.server.ServerEndpoint;
import java.io.IOException;
import java.net.ConnectException;
import java.util.*;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;
import java.util.logging.Level;
import javassist.NotFoundException;
import org.codehaus.jettison.json.JSONArray;
import org.dicen.recolnat.services.core.data.DatabaseResource;
import org.dicen.recolnat.services.core.data.ImageEditorResource;
import org.dicen.recolnat.services.core.data.SetResource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Created by Dmitri Voitsekhovitch (dvoitsekh@gmail.com) on 09/04/15.
 */
@ServerEndpoint(value = "/colaboratory",
    configurator = ColaboratorySocketConfigurator.class)
public class ColaboratorySocket {

  // Map resource (by id) to sessions (by id) which have subscribed to it
  private static final MultiMap resourceToSessions = new MultiValueMap();
  // Map session (by id) to resources (by id) the session has subscribed to
  private static final MultiMap sessionIdToResources = new MultiValueMap();
  // Map session (by id) to user (by login)
  private static final Map<String, String> sessionIdToUser = new HashMap<String, String>();
  // Map session (by id) to session data
  private static final Map<String, Session> sessionIdToSession = new HashMap<String, Session>();
  // Lock when writing to any map
  private static final Lock mapAccessLock = new ReentrantLock(false);

  private static final Logger log = LoggerFactory.getLogger(ColaboratorySocket.class);

  @OnMessage
  public void onMessage(String message, Session session) throws JSONException {
    System.out.println("Message: " + message);
    if (message.equals("PING")) {
      session.getAsyncRemote().sendText("PONG");
      return;
    }

    JSONObject jsonIn = null;
    try {
      jsonIn = new JSONObject(message);
    } catch (JSONException e) {
      log.error("Could not convert input message to JSON : " + message);
      return;
    }

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

    try {
      int action = jsonIn.getInt("action");
      List<AbstractObject> modified = null;
      // Shared variables that must be declared here otherwise compiler complains
      String entityId;
      String imageId;
      String name;
      JSONObject payload;

      switch (action) {
        case Action.ClientActionType.CONNECT:
          log.error("Received a connect request in a place where it should not happen in practice. " + message);
          break;
        case Action.ClientActionType.SUBSCRIBE:
          entityId = jsonIn.getString("id");
          // Get resource data, and check the user has access
          JSONObject entityData = DatabaseResource.getData(entityId, userLogin);
          this.subscribe(session, entityId);
          this.sendResource(entityData, session);
          break;
        case Action.ClientActionType.UNSUBSCRIBE:
          entityId = jsonIn.getString("id");
          this.unsubscribe(session, entityId);
          break;
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
              imageId = jsonIn.getString("image");
              payload = jsonIn.getJSONObject("payload");
              Double area = payload.getDouble("area");
              Double perimeter = payload.getDouble("perimeter");
              JSONArray vertices = payload.getJSONArray("polygon");
              try {
                name = payload.getString("name"); // Optional
              } catch (JSONException ex) {
                name = null;
              }
              modified = ImageEditorResource.createRegionOfInterest(imageId, name, area, perimeter, vertices, userLogin);
              break;
            case "create-poi":
              imageId = jsonIn.getString("parent");
              payload = jsonIn.getJSONObject("payload");
              Integer x = payload.getInt("x");
              Integer y = payload.getInt("y");
              try {
                name = payload.getString("name");
              } catch (JSONException ex) {
                name = null;
              }
              modified = ImageEditorResource.createPointOfInterest(imageId, x, y, name, userLogin);
              break;
            case "create-toi":
              imageId = jsonIn.getString("parent");
              payload = jsonIn.getJSONObject("payload");
              Double length = payload.getDouble("length");
              JSONArray pathVertices = payload.getJSONArray("path");
              try {
                name = payload.getString("name");
              } catch (JSONException ex) {
                name = null;
              }
              modified = ImageEditorResource.createTrailOfInterest(imageId, name, length, pathVertices, userLogin);
              break;
            case "create-aoi":
              imageId = jsonIn.getString("parent");
              payload = jsonIn.getJSONObject("payload");
              length = payload.getDouble("measure");
              JSONArray angleVertices = payload.getJSONArray("vertices");
              try {
                name = payload.getString("name");
              } catch (JSONException ex) {
                name = null;
              }
              modified = ImageEditorResource.createAngleOfInterest(imageId, name, length, angleVertices, userLogin);
              break;
            case "add-measure-standard":
              String pathId = jsonIn.getString("pathId");
              Double value = jsonIn.getDouble("value");
              String unit = jsonIn.getString("unit");
              name = jsonIn.getString("name");
              modified = ImageEditorResource.addMeasureStandard(pathId, value, unit, name, userLogin);
              break;
            case "get-set":
              log.error("Call to get-set should no longer happen in WebSocket");
              break;
            case "create-set":
              name = jsonIn.getString("name");
              String parentSetId;
              try {
                parentSetId = jsonIn.getString("parent");
              } catch (JSONException ex) {
                parentSetId = null;
              }
              modified = SetResource.createSet(parentSetId, name, userLogin);
              break;
            case "delete-element-from-set":
              String linkId = jsonIn.getString("linkId");
              modified = SetResource.deleteElementFromSet(linkId, userLogin);
              break;
            case "link":
              String elementToCopyId = jsonIn.getString("target");
              String futureParentId = jsonIn.getString("destination");
              modified = SetResource.link(elementToCopyId, futureParentId, userLogin);
              break;
            case "copy":
              break;
            case "cutpaste":
              break;
            case "import-recolnat-specimen":
              break;
            case "import-external-images":
              break;
            case "place":
              break;
            case "move":
              break;
            case "resize":
              break;
            case "get-recent-activity":
              break;
            case "get-data":
              log.error("Call to get-data should no longer happen in WebSocket");
              break;
            case "remove":
              break;
            case "get-change-log":
              break;
            case "add-annotation":
              break;
            case "edit-properties":
              break;
          }
          break;
        default:
          log.error("Unhandled action type " + action);
          break;
      }
      JSONObject done = new JSONObject();
      done.put("action", Action.ServerActionType.DONE);
      session.getAsyncRemote().sendText(done.toString());
      if (modified != null) {
        this.broadcastModifications(modified);
      }
    } catch (IOException e) {
      log.error("I/O exception.", e);
      this.sendInternalServerError(session);
    } catch (AccessForbiddenException ex) {
      JSONObject forbidden = new JSONObject();
      forbidden.put("forbidden", ex.getMessage());
      forbidden.put("action", Action.ServerActionType.DENIED);
      session.getAsyncRemote().sendText(forbidden.toString());
    } catch (ObsoleteDataException ex) {
      JSONObject obsolete = new JSONObject();
      obsolete.put("action", Action.ServerActionType.DENIED);
      obsolete.put("obsolete", ex.getObsoleteIdsAsJSON());
      session.getAsyncRemote().sendText(obsolete.toString());
    }
  }

  @OnClose
  public void onClose(Session session, CloseReason reason) {
    log.info("Closing websocket session " + session.getId() + " due to: " + reason.getReasonPhrase());
    ColaboratorySocket.mapAccessLock.lock();
    try {
      Collection<String> resourceIds = (Collection<String>) ColaboratorySocket.sessionIdToResources.get(session.getId());
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
      ColaboratorySocket.sessionIdToResources.remove(session.getId());
      ColaboratorySocket.sessionIdToUser.remove(session.getId());
      ColaboratorySocket.sessionIdToSession.remove(session.getId());
    } finally {
      ColaboratorySocket.mapAccessLock.unlock();
    }
  }

  @OnError
  public void onError(Session session, Throwable t) {
    log.error("Error in session " + session.getId() + " : " + t.getMessage());
  }

  @OnOpen
  public void onConnect(Session session, EndpointConfig config) throws SessionException, IOException {
    // Client opens connection
    // Get login status from CAS
    System.out.println("Opening new websocket session " + session.getId());
    if (!config.getUserProperties().containsKey("CASTGC")) {
      session.close(new CloseReason(CloseReason.CloseCodes.getCloseCode(1008), "Authentication token not found."));
      return;
    }
    String tgt = (String) config.getUserProperties().get("CASTGC");
    String user = null;
    try {
      user = CASAuthentication.getCASUserLogin(tgt);
    } catch (ConnectException ex) {
      session.close(new CloseReason(CloseReason.CloseCodes.getCloseCode(1008), "Authentication token  validation failed."));
      return;
    } catch (IOException ex) {
      session.close(new CloseReason(CloseReason.CloseCodes.getCloseCode(1008), "Authentication token  validation failed."));
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

  private void sendResource(JSONObject resource, Session session) throws JSONException {
    JSONObject response = new JSONObject();
    response.put("action", Action.ServerActionType.RESOURCE);
    response.put("resource", resource);
    response.put("timestamp", new Date().getTime());

    session.getAsyncRemote().sendText(response.toString());
  }

  private void broadcastModifications(Collection<AbstractObject> resourcesModified) throws IOException, JSONException {
    for (AbstractObject resource : resourcesModified) {
      String resourceId = resource.getUUID();
      JSONObject message = new JSONObject();
      message.put("action", Action.ServerActionType.RESOURCE);
      message.put("resource", resource.toJSON());
      message.put("timestamp", new Date().getTime());

      ColaboratorySocket.mapAccessLock.lock();
      try {
        Collection<String> listeners = (Collection<String>) ColaboratorySocket.resourceToSessions.get(resourceId);
        Iterator<String> itListeners = listeners.iterator();
        while (itListeners.hasNext()) {
          String sessionId = itListeners.next();
          Session session = ColaboratorySocket.sessionIdToSession.get(sessionId);
          if (session != null) {
            session.getAsyncRemote().sendText(message.toString());
          } else {
            log.error("Session " + sessionId + " is listed as listening to a resource but is not mapped to an existing session");
          }
        }
      } finally {
        mapAccessLock.unlock();
      }
    }
  }

  private boolean subscribe(Session session, String entityId) {
    ColaboratorySocket.mapAccessLock.lock();
    try {
      ColaboratorySocket.sessionIdToResources.put(session.getId(), entityId);
      ColaboratorySocket.resourceToSessions.put(entityId, session.getId());
    } finally {
      ColaboratorySocket.mapAccessLock.unlock();
    }
    return true;
  }

  private boolean unsubscribe(Session session, String entityId) {
    ColaboratorySocket.mapAccessLock.lock();
    try {
      Collection mapping = (Collection) ColaboratorySocket.resourceToSessions.get(entityId);
      Iterator<String> itSess = mapping.iterator();
      while (itSess.hasNext()) {
        String sessionId = itSess.next();
        if (sessionId.equals(session.getId())) {
          itSess.remove();
        }
      }

      mapping = (Collection) ColaboratorySocket.sessionIdToResources.get(session.getId());
      Iterator<String> itResources = mapping.iterator();
      while (itResources.hasNext()) {
        String resource = itResources.next();
        if (resource.equals((entityId))) {
          itResources.remove();
        }
      }
    } finally {
      ColaboratorySocket.mapAccessLock.unlock();
    }
    return true;
  }

  private void sendInternalServerError(Session session) {
    session.getAsyncRemote().sendText("500");
  }
}
