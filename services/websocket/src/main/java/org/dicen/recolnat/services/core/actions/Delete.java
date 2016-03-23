package org.dicen.recolnat.services.core.actions;

import com.tinkerpop.blueprints.impls.orient.OrientGraph;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;

/**
 * Created by Dmitri Voitsekhovitch (dvoitsekh@gmail.com) on 07/04/15.
 *
 * User deletes an item or link from the currently displayed workbench.
 */
public class Delete extends WorkbenchAction {
  private  TargetType targetType;
  //private  String workbench;
  private  String targetId;

  public Delete(String object, TargetType type, String workbench) {
    this.targetId = object;
    this.targetType = type;
    this.setId = workbench;
  }

  @Override
  public int getActionType() {
    return ActionType.DELETE;
  }

  @Override
  public TargetType getTargetType() {
    return targetType;
  }

  @Override
  public WorkbenchAction runActionOverDatabase(OrientGraph graph) {
    System.err.println("Not implemented");
    return null;
  }

  @Override
  public JSONObject toJSON() throws JSONException {
    return null;
  }
}
