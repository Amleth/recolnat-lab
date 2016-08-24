package org.dicen.recolnat.services.core.actions;

import com.tinkerpop.blueprints.impls.orient.OrientGraph;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;

/**
 * Created by Dmitri Voitsekhovitch (dvoitsekh@gmail.com) on 08/04/15.
 *
 * Loads a workbench. On first connection only.
 */
public class Load extends Action{
  public Load(String set) {
    this.setId = set;
  }

  @Override
  public int getActionType() {
    return -1;
  }

  @Override
  public TargetType getTargetType() {
    return TargetType.NULL;
  }

  @Override
  public Action runActionOverDatabase(OrientGraph graph) {
    return null;
  }

  @Override
  public JSONObject toJSON() throws JSONException {
    return null;
  }
}
