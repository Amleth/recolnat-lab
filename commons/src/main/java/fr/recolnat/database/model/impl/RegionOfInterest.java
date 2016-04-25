package org.dicen.recolnat.services.core.image;

import com.tinkerpop.blueprints.Direction;
import com.tinkerpop.blueprints.Vertex;
import com.tinkerpop.blueprints.impls.orient.OrientGraph;
import com.tinkerpop.blueprints.impls.orient.OrientVertex;
import fr.recolnat.database.model.DataModel;
import fr.recolnat.database.utils.AccessRights;
import fr.recolnat.database.utils.AccessUtils;
import fr.recolnat.database.utils.DeleteUtils;
import java.nio.file.AccessDeniedException;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;

import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import org.dicen.recolnat.services.core.Globals;

/**
 * Created by Dmitri Voitsekhovitch (dvoitsekh@gmail.com) on 11/06/15.
 */
public class RegionOfInterest {

  private List<List<Integer>> vertices = new ArrayList<List<Integer>>();
  private String id;
  private String name = null;
  private boolean userCanDelete = false;
  private List<Annotation> linkedAnnotations = new ArrayList<Annotation>();

  public RegionOfInterest(OrientVertex vRoi, OrientVertex vUser, OrientGraph g) throws AccessDeniedException {
    if (AccessRights.getAccessRights(vUser, vRoi, g) == DataModel.Enums.AccessRights.NONE) {
      throw new AccessDeniedException((String) vRoi.getProperty(DataModel.Properties.id));
    }

    this.vertices = vRoi.getProperty(DataModel.Properties.vertices);
    this.id = vRoi.getProperty(DataModel.Properties.id);
    this.name = vRoi.getProperty(DataModel.Properties.name);
    this.userCanDelete = DeleteUtils.canUserDeleteSubGraph(vRoi, vUser, g);
    Iterator<Vertex> itAnnot = vRoi.getVertices(Direction.OUT, DataModel.Links.hasAnnotation).iterator();
    while (itAnnot.hasNext()) {
      try {
        linkedAnnotations.add(new Annotation((OrientVertex) itAnnot.next(), vUser, g));
      } catch (AccessDeniedException e) {
        // Do nothing
      }
    }
  }

  public JSONObject toJSON() throws JSONException {
    JSONObject ret = new JSONObject();
    ret.put("vertices", this.vertices);
    ret.put("id", this.id);
    ret.put(Globals.ExchangeModel.ObjectProperties.userCanDelete, this.userCanDelete);
    if(this.name != null) {
      ret.put("name", this.name);
    }

    JSONArray jAnnot = new JSONArray();
    Iterator<Annotation> itAnnot = linkedAnnotations.iterator();
    while (itAnnot.hasNext()) {
      jAnnot.put(itAnnot.next().toJSON());
    }
    ret.put("annotations", jAnnot);

    return ret;
  }
}
