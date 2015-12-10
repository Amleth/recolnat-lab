package org.dicen.recolnat.services.resources;

import com.tinkerpop.blueprints.impls.orient.OrientGraph;
import com.tinkerpop.blueprints.impls.orient.OrientVertex;
import fr.recolnat.authentication.CASAuthentication;
import fr.recolnat.database.RemoteDatabaseConnector;
import fr.recolnat.database.utils.AccessUtils;
import java.io.BufferedReader;
import org.apache.commons.collections.map.MultiValueMap;
import org.apache.commons.collections.MultiMap;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.dicen.recolnat.services.core.actions.Move;
import org.dicen.recolnat.services.core.actions.WorkbenchAction;
import org.dicen.recolnat.services.core.state.Workbench;

import javax.websocket.*;
import javax.websocket.server.ServerEndpoint;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.ConnectException;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.file.AccessDeniedException;
import java.util.*;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;
import java.util.logging.Level;
import java.util.logging.Logger;
import javassist.NotFoundException;
import javax.ws.rs.core.MediaType;


/**
 * Created by Dmitri Voitsekhovitch (dvoitsekh@gmail.com) on 09/04/15.
 */

@ServerEndpoint(value = "/virtual-workbench",
    configurator = VirtualWorkbenchSocketConfigurator.class)
public class VirtualWorkbenchSocket {
  // Workbench id -> session id
  private static final MultiMap workbenchToSessions = new MultiValueMap();
  private static final Map<String, String> sessionIdToWorkbench = new HashMap<String, String>();
  private static final Map<String, Session> sessionIdToSession = new HashMap<String, Session>();
  private static final Map<String, String> sessionIdToUser = new HashMap<String, String>();
  private static final Lock mapAccessLock = new ReentrantLock(false);
//  private static final RemoteDatabaseConnector conn = new RemoteDatabaseConnector("localhost", 2480, "ReColNatPlus", "root", "d54b3ebxthupbcer");
  private static final RemoteDatabaseConnector conn = new RemoteDatabaseConnector("localhost", 2480, "ReColNatTest", "root", "root");

  @OnMessage
  public void onMessage(String message, Session session) throws NotFoundException, IllegalAccessException {
    System.out.println("Message: " + message);
    JSONObject jsonIn = null;
    try {
      jsonIn = new JSONObject(message);
    } catch (JSONException e) {
      System.err.println("Could not convert input message to JSON");
      e.printStackTrace();
      return;
    }
    
    try {
      int action = jsonIn.getInt("action");
      String sessionId = jsonIn.getString("sender");
      if(sessionId == null) {
        System.err.println("Client failed to send a session id");
        throw new IOException("No session id");
      }
      mapAccessLock.lock();
      String user = null;
      try {
        user = sessionIdToUser.get(sessionId);
        if(user == null) {
          // @TODO We need to clean up too. Close session, stuff like that.
          throw new IOException("Session has no corresponding user");
        }
      }
      finally {
        mapAccessLock.unlock();
      }
      String workbenchId = null;
      switch(action) {
        case WorkbenchAction.ActionType.GETALL:
          workbenchId = jsonIn.getString("workbench");
          Workbench wb = this.getWorkbench(workbenchId, user);
          JSONObject jsonOut = this.buildResponseWorkbench(wb);
          sendResponse(jsonOut, sessionId, workbenchId);
          break;
        case WorkbenchAction.ActionType.ADD:
          break;
        case WorkbenchAction.ActionType.CONNECT:
          System.err.println("Received a connect request in a place where it should not happen in practice. " + message);
          break;
        case WorkbenchAction.ActionType.DELETE:
          break;
        case WorkbenchAction.ActionType.MOVE:
          workbenchId = jsonIn.getString("workbench");
          String targetId = jsonIn.getString("object");
          int coordX = jsonIn.getInt("x");
          int coordY = jsonIn.getInt("y");
          Move graphAction = new Move(targetId, workbenchId, coordX, coordY, user);
          WorkbenchAction result = this.executeMove(graphAction);
          this.broadcastWorkbenchAction(result.toJSON(), workbenchId);
          break;
        default:
          System.err.println("Unhandled action type " + action);
          break;
      }
    } catch (JSONException e) {
      e.printStackTrace();
      return;
    } catch (IOException e) {
      System.err.println("IO Exception");
      e.printStackTrace();
      return;
    }
  }

  @OnClose
  public void onClose(CloseReason reason) {
    System.out.println("Closing websocket due to: " + reason.getReasonPhrase());
  }

  @OnError
  public void onError(Session session, Throwable t) {
    System.out.println("Error in session " + session.getId() + " : " + t.getMessage());
  }

  @OnOpen
  public void onConnect(Session session, EndpointConfig config) throws SessionException, IOException {
    System.out.println("Connect: " + session.getId());
    if(!config.getUserProperties().containsKey("CASTGC")) {
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
    VirtualWorkbenchSocket.mapAccessLock.lock();
    try {
      JSONObject response = new JSONObject();
      try {
        response.put("action", WorkbenchAction.ActionType.CONNECT);
        response.put("session", sessionId);
        System.out.println("New connection has been sent session id " + response.toString());
        session.getAsyncRemote().sendText(response.toString());
      } catch (JSONException e) {
        e.printStackTrace();
        System.err.println("Unable to serialze JSON on new client connection. Connection dropped.");
        return;
      }

      VirtualWorkbenchSocket.sessionIdToSession.put(sessionId, session);
      VirtualWorkbenchSocket.sessionIdToUser.put(sessionId, user);
    }
    finally {
      VirtualWorkbenchSocket.mapAccessLock.unlock();
    }
  }

  private Workbench getWorkbench(String workbench, String user) throws IllegalAccessException {
    OrientGraph graph = conn.getTransactionalGraph();
    OrientVertex vUser = (OrientVertex) AccessUtils.getUserByLogin(user, graph);
    Workbench wb = new Workbench(workbench, vUser, graph);
    graph.rollback();
    return wb;
  }

  private WorkbenchAction executeMove(WorkbenchAction action) throws NotFoundException {
    OrientGraph graph = conn.getTransactionalGraph();
    WorkbenchAction result = null;

    result = action.runActionOverDatabase(graph);

    return result;
  }

  private JSONObject buildResponseWorkbench(Workbench wb) throws JSONException {
    JSONObject ret = new JSONObject();
    ret.put("action", WorkbenchAction.ActionType.GETALL);
    ret.put("timestamp", (new Date()).getTime());
    ret.put("workbench", wb.toJSON());
    return ret;
  }

  private void sendResponse(JSONObject response, String sessionId, String workbenchId) throws IOException {
    VirtualWorkbenchSocket.mapAccessLock.lock();
    try {
      System.out.println("Sending response to client " + sessionId);
      // Was this session previously associated with another workbench ? If so, remove association.
      String previousWorkbenchId = VirtualWorkbenchSocket.sessionIdToWorkbench.get(sessionId);
      if(previousWorkbenchId != null) {
        VirtualWorkbenchSocket.workbenchToSessions.remove(previousWorkbenchId, sessionId);
      }
      VirtualWorkbenchSocket.workbenchToSessions.put(workbenchId, sessionId);
      VirtualWorkbenchSocket.sessionIdToWorkbench.put(sessionId, workbenchId);

      Session session = VirtualWorkbenchSocket.sessionIdToSession.get(sessionId);
      if(session != null) {
        // How do we deal with this stuff when it is null?
        session.getAsyncRemote().sendText(response.toString());
      }

    }
    finally {
      VirtualWorkbenchSocket.mapAccessLock.unlock();
    }

  }

  private void broadcastWorkbenchAction(JSONObject response, String workbenchId) throws IOException, JSONException {
    response.put("timestamp", new Date().getTime());
    VirtualWorkbenchSocket.mapAccessLock.lock();
    try {
      System.out.println("Broadcasting " + response.toString());
      Object o = VirtualWorkbenchSocket.workbenchToSessions.get(workbenchId);
      if (o != null) {
        Collection<String> sessionIds = (Collection<String>) o;
        Iterator<String> itSessions = sessionIds.iterator();
        while (itSessions.hasNext()) {
          String sessionId = itSessions.next();
          Session session = VirtualWorkbenchSocket.sessionIdToSession.get(sessionId);
          if(session == null) {
            System.out.println("No such session " + sessionId);
          }
          else if (!session.isOpen()) {
            System.out.println("Session no longer active " + sessionId);
            itSessions.remove();
          }
          else {
            session.getAsyncRemote().sendText(response.toString());
          }
        }
      }
    }
    finally {
      VirtualWorkbenchSocket.mapAccessLock.unlock();
    }
  }
}
