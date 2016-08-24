/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package fr.recolnat.database.logbook;

import com.tinkerpop.blueprints.Direction;
import com.tinkerpop.blueprints.Edge;
import com.tinkerpop.blueprints.impls.orient.OrientGraph;
import com.tinkerpop.blueprints.impls.orient.OrientVertex;
import fr.recolnat.database.exceptions.AccessForbiddenException;
import fr.recolnat.database.model.DataModel;
import fr.recolnat.database.utils.AccessRights;
import fr.recolnat.database.utils.AccessUtils;
import java.nio.file.AccessDeniedException;
import java.util.Date;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Set;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.xml.crypto.dsig.TransformException;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;

/**
 *
 * @author dmitri
 */
public class Log {

  private Set<Action> actorActions = new HashSet<Action>();
  private String focus = null;

  private Log() {

  }

  public Log(String focus, Long begin, Long end, String user, OrientGraph g) throws AccessForbiddenException {
    OrientVertex vUser = (OrientVertex) AccessUtils.getUserByLogin(user, g);
    OrientVertex vTarget = (OrientVertex) AccessUtils.getNodeById(focus, g);
    // @TODO find a check to see if 'actor' is a valid actor (perhaps SocialEntity ?)
    if (AccessRights.getAccessRights(vUser, vTarget, g).value() < DataModel.Enums.AccessRights.READ.value()) {
      throw new AccessForbiddenException(user, focus);
    }
    this.focus = focus;

    Iterator<Edge> itLinks = vTarget.getEdges(Direction.OUT).iterator();
    while (itLinks.hasNext()) {
      Edge e = itLinks.next();
      OrientVertex linkedEntity = (OrientVertex) e.getVertex(Direction.IN);
      try {
        Action a = new Action(vTarget, e, linkedEntity, vUser, g);
        if(a.isInInterval(begin, end)) {
          actorActions.add(a);
        }
      } catch (AccessDeniedException | TransformException ex) {

      }
    }

    itLinks = vTarget.getEdges(Direction.IN).iterator();
    while (itLinks.hasNext()) {
      Edge e = itLinks.next();
      OrientVertex linkedEntity = (OrientVertex) e.getVertex(Direction.OUT);
      try {
        Action a = new Action(vTarget, e, linkedEntity, vUser, g);
        if(a.isInInterval(begin, end)) {
          actorActions.add(a);
        }
      } catch (AccessDeniedException | TransformException ex) {

      }
    }
    
    // If focus is a user, also take into account edges where user is creator.
    itLinks = g.getEdges(DataModel.Properties.creator, focus).iterator();
    while(itLinks.hasNext()) {
      Edge e = itLinks.next();
      OrientVertex inEntity = (OrientVertex) e.getVertex(Direction.IN);
      OrientVertex outEntity = (OrientVertex) e.getVertex(Direction.OUT);
      try {
        Action a = new Action(inEntity, e, outEntity, vUser, g);
        if(a.isInInterval(begin, end)) {
          actorActions.add(a);
        }
      } catch (AccessDeniedException | TransformException ex) {
        
      }
    }
  }
  
  public JSONObject toJSON() throws JSONException {
    JSONObject ret = new JSONObject();
    ret.put("actor", this.focus);
    
    JSONArray actions = new JSONArray();
    Iterator<Action> itActions = this.actorActions.iterator();
    while(itActions.hasNext()) {
      Action a = itActions.next();
      actions.put(a.toJSON());
    }
    ret.put("actions", actions);
    
    return ret;
  }
}
