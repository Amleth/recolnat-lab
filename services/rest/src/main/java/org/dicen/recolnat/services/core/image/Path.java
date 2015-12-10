package org.dicen.recolnat.services.core.image;

import com.tinkerpop.blueprints.Direction;
import com.tinkerpop.blueprints.Vertex;
import com.tinkerpop.blueprints.impls.orient.OrientGraph;
import com.tinkerpop.blueprints.impls.orient.OrientVertex;
import fr.recolnat.database.model.DataModel;
import fr.recolnat.database.utils.AccessRights;
import java.nio.file.AccessDeniedException;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;

import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response;
import java.util.ArrayList;
import java.util.Date;
import java.util.Iterator;
import java.util.List;
import org.dicen.recolnat.services.core.Globals;

/**
 * Created by dmitri on 10/08/15.
 */
public class Path {
  private String id;
  private Long date;
//  private Integer length;
  private List<List<Integer>> vertices = new ArrayList<List<Integer>>();
  private List<Annotation> linkedAnnotations = new ArrayList<Annotation>();

  public Path(OrientVertex vPath, OrientVertex vUser, OrientGraph g) throws AccessDeniedException {
    if(AccessRights.getAccessRights(vUser, vPath, g) == DataModel.Enums.AccessRights.NONE) {
      throw new AccessDeniedException((String) vPath.getProperty(DataModel.Properties.id));
    }

    this.vertices = vPath.getProperty(DataModel.Properties.vertices);
    this.id = vPath.getProperty(DataModel.Properties.id);
    this.date = vPath.getProperty(DataModel.Properties.creationDate);
//    this.length = vPath.getProperty(DataModel.Properties.length);

    Iterator<Vertex> itAnnot = vPath.getVertices(Direction.OUT, DataModel.Links.hasAnnotation).iterator();
    while(itAnnot.hasNext()) {
      try {
        linkedAnnotations.add(new Annotation(itAnnot.next(), vUser, g));
      }
      catch(AccessDeniedException e) {
        // Access denied, move to next path
      }
    }
  }

  public JSONObject toJSON() throws JSONException {
    JSONObject ret = new JSONObject();
    ret.put(Globals.ExchangeModel.ObjectProperties.id, this.id);
    ret.put(Globals.ExchangeModel.ObjectProperties.creationDate, this.date);
//    ret.put(Globals.ExchangeModel.ObjectProperties.length, this.length);
    ret.put(Globals.ExchangeModel.ObjectProperties.vertices, this.vertices);

    JSONArray jAnnot = new JSONArray();
    Iterator<Annotation> itAnnot = linkedAnnotations.iterator();
    while(itAnnot.hasNext()) {
      jAnnot.put(itAnnot.next().toJSON());
    }
    ret.put("annotations", jAnnot);

    return ret;
  }
}
