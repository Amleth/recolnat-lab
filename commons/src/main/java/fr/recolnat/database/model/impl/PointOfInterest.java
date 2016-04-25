package fr.recolnat.database.model.impl;

import com.tinkerpop.blueprints.impls.orient.OrientGraph;
import com.tinkerpop.blueprints.impls.orient.OrientVertex;
import fr.recolnat.database.model.DataModel;
import fr.recolnat.database.utils.AccessRights;
import fr.recolnat.database.utils.DeleteUtils;
import java.nio.file.AccessDeniedException;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;

/**
 * Created by hector on 03/08/15.
 */
public class PointOfInterest extends AbstractObject {

  public PointOfInterest(OrientVertex vPoint, OrientVertex vUser, OrientGraph g) throws AccessDeniedException {
    super(vPoint, vUser, g);
    if (!AccessRights.canRead(vUser, vPoint, g)) {
      throw new AccessDeniedException((String) vPoint.getProperty(DataModel.Properties.id));
    }
    
    this.userCanDelete = DeleteUtils.canUserDeleteSubGraph(vPoint, vUser, g);
  }

  @Override
  public JSONObject toJSON() throws JSONException {
    JSONObject ret = super.toJSON();

    return ret;
  }
}
