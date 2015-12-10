package org.dicen.recolnat.services.core.workbench;

import com.tinkerpop.blueprints.Vertex;
import com.tinkerpop.blueprints.impls.orient.OrientGraph;
import fr.recolnat.database.model.DataModel;
import fr.recolnat.database.utils.AccessRights;
import java.nio.file.AccessDeniedException;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;

/**
 * Created by Dmitri Voitsekhovitch (dvoitsekh@gmail.com) on 24/09/15.
 */
public class Workbench implements Comparable<Workbench> {
  private String id = null;
  private String name = null;

  public Workbench(Vertex vWb, Vertex vUser, OrientGraph g) throws AccessDeniedException {
    if (AccessRights.getAccessRights(vUser, vWb, g) == DataModel.Enums.AccessRights.NONE) {
      throw new AccessDeniedException((String) vWb.getProperty(DataModel.Properties.id));
    }
    
    this.id = vWb.getProperty(DataModel.Properties.id);
    this.name = vWb.getProperty(DataModel.Properties.name);
  }

  public JSONObject toJSON() throws JSONException {
    JSONObject ret = new JSONObject();

    ret.put("id", this.id);
    ret.put("name", this.name);

    return ret;
  }

  public int compareTo(Workbench o) {
    return this.id.compareTo(o.id);
  }
}
