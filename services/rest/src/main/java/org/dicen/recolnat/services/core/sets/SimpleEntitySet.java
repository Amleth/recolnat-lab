package org.dicen.recolnat.services.core.sets;

import com.tinkerpop.blueprints.Vertex;
import com.tinkerpop.blueprints.impls.orient.OrientGraph;
import com.tinkerpop.blueprints.impls.orient.OrientVertex;
import fr.recolnat.database.model.DataModel;
import fr.recolnat.database.utils.AccessRights;
import fr.recolnat.database.utils.DeleteUtils;
import java.nio.file.AccessDeniedException;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;

/**
 * Simple representation of a Set using only its id, name, and if the user is able to delete it.
 * @creator Created by Dmitri Voitsekhovitch (dvoitsekh@gmail.com) on 24/09/15.
 */
public class SimpleEntitySet implements Comparable<SimpleEntitySet> {
  private String id = null;
  private String name = null;
  private boolean userCanDelete = false;

  public SimpleEntitySet(OrientVertex vWb, OrientVertex vUser, OrientGraph g) throws AccessDeniedException {
    if (AccessRights.getAccessRights(vUser, vWb, g) == DataModel.Enums.AccessRights.NONE) {
      throw new AccessDeniedException((String) vWb.getProperty(DataModel.Properties.id));
    }
    
    this.id = vWb.getProperty(DataModel.Properties.id);
    this.name = vWb.getProperty(DataModel.Properties.name);
    this.userCanDelete = DeleteUtils.canUserDeleteSubGraph(vWb, vUser, g);
  }

  public JSONObject toJSON() throws JSONException {
    JSONObject ret = new JSONObject();

    ret.put("id", this.id);
    ret.put("name", this.name);
    ret.put("deletable", this.userCanDelete);

    return ret;
  }

  @Override
  public int compareTo(SimpleEntitySet o) {
    return this.id.compareTo(o.id);
  }
}
