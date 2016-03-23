package org.dicen.recolnat.services.core.actions;

import com.tinkerpop.blueprints.impls.orient.OrientGraph;
import javassist.NotFoundException;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;

/**
 * Created by Dmitri Voitsekhovitch (dvoitsekh@gmail.com) on 07/04/15.
 */
public abstract class WorkbenchAction {
  String setId;

  public static class ActionType {
    public static final int CONNECT = 0;
    public static final int MOVE = 12;
    public static final int ADD = 11;
    public static final int DELETE = 13;
    public static final int GETALL = 10;
  }

  public static enum TargetType {
    NODE,
    LINK,
    NULL
  }

  public abstract int getActionType();

  public abstract TargetType getTargetType();

  public String getSetId() {
    return this.setId;
  };

  public abstract WorkbenchAction runActionOverDatabase(OrientGraph graph) throws NotFoundException;

  public abstract JSONObject toJSON() throws JSONException;
}
