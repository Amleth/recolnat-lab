package org.dicen.recolnat.services.resources;

import fr.recolnat.authentication.CASAuthentication;
import fr.recolnat.database.exceptions.AccessForbiddenException;
import fr.recolnat.database.exceptions.ObsoleteDataException;
import fr.recolnat.database.model.impl.AbstractObject;
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
import org.codehaus.jettison.json.JSONArray;
import org.dicen.recolnat.services.core.data.DatabaseResource;
import org.dicen.recolnat.services.core.data.ImageEditorResource;
import org.dicen.recolnat.services.core.data.SetResource;
import org.dicen.recolnat.services.core.data.ViewResource;
import fr.recolnat.database.exceptions.ResourceNotExistsException;
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
  public void onMessage(String message, Session session) throws JSONException, InterruptedException {
    if (log.isInfoEnabled()) {
      log.info("Message received by server: " + message);
    }

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

    Integer messageId;
    try {
      messageId = jsonIn.getInt("messageId");
    } catch (JSONException ex) {
      messageId = null;
    }

    try {
      int action = jsonIn.getInt("action");
      List<String> modified = null;
      // Shared variables that must be declared here otherwise compiler complains
      String entityId, viewId, imageId;
      String name;
      JSONObject payload;
      String elementToCopyId, futureParentId;
      Integer x, y;

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
              Double area = jsonIn.getDouble("area");
              Double perimeter = jsonIn.getDouble("perimeter");
              JSONArray vertices = jsonIn.getJSONArray("polygon");
              try {
                name = jsonIn.getString("name"); // Optional
              } catch (JSONException ex) {
                name = null;
              }
              modified = ImageEditorResource.createRegionOfInterest(imageId, name, area, perimeter, vertices, userLogin);
              break;
            case "create-poi":
              imageId = jsonIn.getString("parent");
              x = jsonIn.getInt("x");
              y = jsonIn.getInt("y");
              try {
                name = jsonIn.getString("name");
              } catch (JSONException ex) {
                name = null;
              }
              modified = ImageEditorResource.createPointOfInterest(imageId, x, y, name, userLogin);
              break;
            case "create-toi":
              imageId = jsonIn.getString("parent");
              Double length = jsonIn.getDouble("length");
              JSONArray pathVertices = jsonIn.getJSONArray("path");
              try {
                name = jsonIn.getString("name");
              } catch (JSONException ex) {
                name = null;
              }
              modified = ImageEditorResource.createTrailOfInterest(imageId, name, length, pathVertices, userLogin);
              break;
            case "create-aoi":
              imageId = jsonIn.getString("parent");
              length = jsonIn.getDouble("measure");
              JSONArray angleVertices = jsonIn.getJSONArray("vertices");
              try {
                name = jsonIn.getString("name");
              } catch (JSONException ex) {
                name = null;
              }
              modified = ImageEditorResource.createAngleOfInterest(imageId, name, length, angleVertices, userLogin);
              break;
            case "add-measure-standard":
              String pathId = jsonIn.getString("path");
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
              String linkId = jsonIn.getString("link");
              modified = SetResource.deleteElementFromSet(linkId, userLogin);
              break;
            case "link":
              elementToCopyId = jsonIn.getString("target");
              futureParentId = jsonIn.getString("destination");
              modified = SetResource.link(elementToCopyId, futureParentId, userLogin);
              break;
            case "copy":
              elementToCopyId = jsonIn.getString("target");
              futureParentId = jsonIn.getString("destination");
              modified = SetResource.copy(elementToCopyId, futureParentId, userLogin);
              break;
            case "cutpaste":
              String currentParentToElementLinkId = jsonIn.getString("link");
              futureParentId = jsonIn.getString("destination");
              modified = SetResource.cutPaste(currentParentToElementLinkId, futureParentId, userLogin);
              break;
            case "import-recolnat-specimen":
              parentSetId = jsonIn.getString("set");
              name = jsonIn.getString("name");
              String recolnatSpecimenUuid = jsonIn.getString("recolnatSpecimenUuid");
              JSONArray images = jsonIn.getJSONArray("images");
              modified = SetResource.importRecolnatSpecimen(parentSetId, name, recolnatSpecimenUuid, images, userLogin);
              break;
            case "import-external-image":
              parentSetId = jsonIn.getString("set");
              String url = jsonIn.getString("url");
              name = jsonIn.getString("name");
              modified = SetResource.importExternalImage(parentSetId, url, name, userLogin);
              break;
            case "place":
              viewId = jsonIn.getString("view");
              entityId = jsonIn.getString("entity");
              x = jsonIn.getInt("x");
              y = jsonIn.getInt("y");
              modified = ViewResource.placeEntityInView(viewId, entityId, x, y, userLogin);
              break;
            case "move":
              viewId = jsonIn.getString("view");
              linkId = jsonIn.getString("link");
              entityId = jsonIn.getString("entity");
              x = jsonIn.getInt("x");
              y = jsonIn.getInt("y");
              modified = ViewResource.moveEntityInView(viewId, linkId, entityId, x, y, userLogin);
              break;
            case "resize":
              viewId = jsonIn.getString("view");
              linkId = jsonIn.getString("link");
              entityId = jsonIn.getString("entity");
              Integer width = jsonIn.getInt("width");
              Integer height = jsonIn.getInt("height");
              modified = ViewResource.resizeEntityInView(viewId, linkId, entityId, width, height, userLogin);
              break;
            case "get-recent-activity":
              log.error("Call to get-recent-activity occurred where it should not have");
              break;
            case "get-data":
              log.error("Call to get-data should no longer happen in WebSocket");
              break;
            case "remove":
              entityId = jsonIn.getString("id");
              modified = DatabaseResource.remove(entityId, userLogin);
              break;
            case "get-change-log":
              break;
            case "add-annotation":
              entityId = jsonIn.getString("entity");
              String annotationText = jsonIn.getString("text");
              modified = DatabaseResource.addAnnotation(entityId, annotationText, userLogin);
              break;
            case "edit-properties":
              entityId = jsonIn.getString("entity");
              JSONArray properties = jsonIn.getJSONArray("properties");
              modified = DatabaseResource.editProperties(entityId, properties, userLogin);
              break;
          }
          break;
        default:
          log.error("Unhandled action type " + action);
          break;
      }
      // If we are here, no errors occurred, therefore inform client of operation success.
      JSONObject done = new JSONObject();
      done.put("action", Action.ServerActionType.DONE);
      done.put("id", messageId);
      done.put("request", jsonIn);
      session.getAsyncRemote().sendText(done.toString());
      // If the operation modified any resources, inform all listening clients.
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
      forbidden.put("id", messageId);
      forbidden.put("request", jsonIn);
      session.getAsyncRemote().sendText(forbidden.toString());
    } catch (ObsoleteDataException ex) {
      JSONObject obsolete = new JSONObject();
      obsolete.put("action", Action.ServerActionType.DENIED);
      obsolete.put("obsolete", ex.getObsoleteIdsAsJSON());
      obsolete.put("id", messageId);
      obsolete.put("request", jsonIn);
      session.getAsyncRemote().sendText(obsolete.toString());
    } catch (ResourceNotExistsException ex) {
      JSONObject inputError = new JSONObject();
      inputError.put("action", Action.ServerActionType.DENIED);
      inputError.put("input", ex.getMessage());
      inputError.put("id", messageId);
      inputError.put("request", jsonIn);
      session.getAsyncRemote().sendText(inputError.toString());
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
    // Client opens connection
    // Get login status from CAS
    log.info("Opening new websocket session " + session.getId());
//    if (!config.getUserProperties().containsKey("CASTGC")) {
//      session.close(new CloseReason(CloseReason.CloseCodes.getCloseCode(1008), "Authentication token not found."));
//      return;
//    }
    String tgt = (String) config.getUserProperties().get("CASTGC");
    String user = null;
    try {
      user = CASAuthentication.getCASUserLogin(tgt);
    } catch (ConnectException ex) {
      session.close(new CloseReason(CloseReason.CloseCodes.getCloseCode(1008), "Authentication token  validation failed."));
      log.warn("Socket closed due to connection exception to CAS", ex);
      return;
    } catch (IOException ex) {
      session.close(new CloseReason(CloseReason.CloseCodes.getCloseCode(1008), "Authentication token  validation failed."));
      log.warn("Socket closed due to I/O exception reading CAS response", ex);
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

    if (log.isDebugEnabled()) {
      log.debug("Sending resource on subscription " + response.toString());
    }

    session.getAsyncRemote().sendText(response.toString());
  }

  private void broadcastModifications(Collection<String> resourcesModified) throws IOException, JSONException {
    for (String resourceId : resourcesModified) {
      ColaboratorySocket.mapAccessLock.lock();
      try {
        Collection<String> listeners = (Collection<String>) ColaboratorySocket.resourceToSessions.get(resourceId);
        if (listeners != null) {
          Iterator<String> itListeners = listeners.iterator();
          while (itListeners.hasNext()) {
            String sessionId = itListeners.next();
            Session session = ColaboratorySocket.sessionIdToSession.get(sessionId);
            if (session == null) {
              log.error("Session " + sessionId + " is listed as listening to a resource but is not mapped to an existing session");
              continue;
            }

            String userLogin = ColaboratorySocket.sessionIdToUser.get(sessionId);
            JSONObject message = new JSONObject();

            try {
              JSONObject metadata = DatabaseResource.getData(resourceId, userLogin);

              message.put("action", Action.ServerActionType.RESOURCE);
              message.put("timestamp", new Date().getTime());
              message.put("resource", metadata);
            } catch (AccessForbiddenException ex) {
              message.put("forbidden", resourceId);
              message.put("action", Action.ServerActionType.RESOURCE);
            }

            session.getAsyncRemote().sendText(message.toString());
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
