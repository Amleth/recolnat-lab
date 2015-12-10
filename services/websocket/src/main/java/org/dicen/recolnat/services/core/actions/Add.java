package org.dicen.recolnat.services.core.actions;

import com.tinkerpop.blueprints.impls.orient.OrientGraph;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;

/**
 * Created by Dmitri Voitsekhovitch (dvoitsekh@gmail.com) on 07/04/15.
 *
 * User adds an item to the currently displayed workbench
 */
public class Add extends WorkbenchAction {
  private  TargetType targetType;
  //private  String workbench;
  private  String targetId;
  private  String parentId;

  /**
   * Add an item to workbench.
   * @param object
   * @param workbench
   */
  public Add(String object, String workbench) {
    this.targetId = object;
    this.targetType = TargetType.NODE;
    this.workbench = workbench;

    this.parentId = null;
  }

  /**
   * Add a link to workbench between two items.
   * @param object
   * @param workbench
   * @param parent
   */
  public Add(String object, String workbench, String parent) {
    this.targetId = object;
    this.targetType = TargetType.LINK;
    this.workbench = workbench;
    this.parentId = parent;
  }

  @Override
  public int getActionType() {
    return ActionType.ADD;
  }

  @Override
  public TargetType getTargetType() {
    return targetType;
  }

  @Override
  public Add runActionOverDatabase(OrientGraph graph) {
    System.err.println("Not implemented");
    return this;
  }

  @Override
  public JSONObject toJSON() throws JSONException {
    return null;
  }
}
