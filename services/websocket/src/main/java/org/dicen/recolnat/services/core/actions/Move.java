package org.dicen.recolnat.services.core.actions;

import com.orientechnologies.orient.core.exception.OConcurrentModificationException;
import com.tinkerpop.blueprints.Direction;
import com.tinkerpop.blueprints.Edge;
import com.tinkerpop.blueprints.Vertex;
import com.tinkerpop.blueprints.impls.orient.OrientGraph;
import fr.recolnat.database.model.DataModel;
import fr.recolnat.database.utils.AccessRights;
import fr.recolnat.database.utils.AccessUtils;
import javassist.NotFoundException;
import javax.ws.rs.NotAuthorizedException;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;

/**
 * Created by Dmitri Voitsekhovitch (dvoitsekh@gmail.com) on 07/04/15.
 *
 * User moves an item inside the workbench. Links cannot be moved, only removed and added to something else..
 */
public class Move extends WorkbenchAction {
  private  TargetType targetType;
  private  int destinationX;
  private  int destinationY;
  private  String targetId;
  private String userLogin;

  private Move() {

  }

  public Move(String object, String workbench, int newPositionX, int newPositionY, String userLogin) {
    this.targetType = TargetType.NODE;
    this.destinationX = newPositionX;
    this.destinationY = newPositionY;
    this.workbench = workbench;
    this.targetId = object;
    this.userLogin = userLogin;
//    System.out.println("new Move with target=" + targetId + " x=" + destinationX + " y=" + destinationY + " wb=" + workbench);
  }

  @Override
  public int getActionType() {
    return ActionType.MOVE;
  }

  @Override
  public TargetType getTargetType() {
    return targetType;
  }

  @Override
  public Move runActionOverDatabase(OrientGraph graph) throws NotFoundException {
    try {
      Vertex vUser = AccessUtils.getUserByLogin(userLogin, graph);
      
      Vertex vWorkbench = AccessUtils.getWorkbench(this.workbench, graph);
      if(vWorkbench == null) {
        throw new NotFoundException("Workbench " + this.workbench + " not found in graph");
      }
      Vertex vTarget = AccessUtils.getNodeById(this.targetId, graph);
      if(vTarget == null) {
        throw new NotFoundException("Move target " + this.targetId + " not found in graph");
      }
      Edge edge = AccessUtils.getEdgeBetweenVertices(vWorkbench, vTarget, DataModel.Links.hasChild, graph);
      if(edge == null) {
        throw new NotFoundException("Edge between item " + this.targetId + " and workbench " + this.workbench + " not found in graph");
      }
      // User needs write rights on the workbench and on the item.
      if(AccessRights.getAccessRights(vUser, vWorkbench, graph).value() < DataModel.Enums.AccessRights.WRITE.value()) {
        throw new NotAuthorizedException("User " + this.userLogin + " not authorized to move objects in workbench " + this.workbench);
      }
      if(AccessRights.getAccessRights(vUser, vTarget, graph).value() < DataModel.Enums.AccessRights.WRITE.value()) {
        throw new NotAuthorizedException("User " + this.userLogin + " not authorized to move " + this.targetId + " in workbench " + this.workbench);
      }
      edge.setProperty(DataModel.Properties.coordX, this.destinationX);
      edge.setProperty(DataModel.Properties.coordY, this.destinationY);
      graph.commit();
    }
    catch(OConcurrentModificationException e) {
      Vertex vWorkbench = AccessUtils.getWorkbench(this.workbench, graph);
      Vertex vTarget = AccessUtils.getNodeById(this.targetId, graph);
      Edge edge = AccessUtils.getEdgeBetweenVertices(vWorkbench, vTarget, DataModel.Links.hasChild, graph);
      this.destinationX = edge.getProperty(DataModel.Properties.coordX);
      this.destinationY = edge.getProperty(DataModel.Properties.coordY);
    }
    finally {
      graph.rollback();
      graph.shutdown(false);
    }
    return this;
  }

  @Override
  public JSONObject toJSON() throws JSONException {
    JSONObject ret = new JSONObject();
    ret.put("workbench", this.workbench);
    ret.put("object", this.targetId);
    ret.put("action", this.getActionType());
    ret.put("x", this.destinationX);
    ret.put("y", this.destinationY);
    return ret;
  }
}
