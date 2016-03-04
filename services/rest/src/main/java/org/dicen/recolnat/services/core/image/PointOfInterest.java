package org.dicen.recolnat.services.core.image;

import com.tinkerpop.blueprints.Direction;
import com.tinkerpop.blueprints.Vertex;
import com.tinkerpop.blueprints.impls.orient.OrientGraph;
import com.tinkerpop.blueprints.impls.orient.OrientVertex;
import fr.recolnat.database.model.DataModel;
import fr.recolnat.database.utils.AccessRights;
import fr.recolnat.database.utils.DeleteUtils;
import java.nio.file.AccessDeniedException;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;

import java.util.ArrayList;
import java.util.Date;
import java.util.Iterator;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;
import org.dicen.recolnat.services.core.Globals;

/**
 * Created by hector on 03/08/15.
 */
public class PointOfInterest {

  private String id;
  private Long date;
  private Integer x;
  private Integer y;
  private String symbol;
  private String letters;
  private String color;
  private String text;
  private String name = null;
  private boolean userCanDelete = false;
  private List<Annotation> linkedAnnotations = new ArrayList<Annotation>();

  public PointOfInterest(OrientVertex vPoint, OrientVertex vUser, OrientGraph g) throws AccessDeniedException {
    if (AccessRights.getAccessRights(vUser, vPoint, g) == DataModel.Enums.AccessRights.NONE) {
      throw new AccessDeniedException((String) vPoint.getProperty(DataModel.Properties.id));
    }
    this.id = vPoint.getProperty(DataModel.Properties.id);
    this.date = vPoint.getProperty(DataModel.Properties.creationDate);
    this.x = vPoint.getProperty(DataModel.Properties.coordX);
    this.y = vPoint.getProperty(DataModel.Properties.coordY);
    this.letters = vPoint.getProperty(DataModel.Properties.letters);
    this.color = vPoint.getProperty(DataModel.Properties.color);
    this.text = vPoint.getProperty(DataModel.Properties.text);
    this.name = this.text;
    this.userCanDelete = DeleteUtils.canUserDeleteSubGraph(vPoint, vUser, g);
    Iterator<Vertex> itAnnot = vPoint.getVertices(Direction.OUT, DataModel.Links.hasAnnotation).iterator();
    while (itAnnot.hasNext()) {
      try {
        linkedAnnotations.add(new Annotation((OrientVertex) itAnnot.next(), vUser, g));
      } catch (AccessDeniedException ex) {
        // Do nothing
      }
    }
  }

  public JSONObject toJSON() throws JSONException {
    JSONObject ret = new JSONObject();
    ret.put(Globals.ExchangeModel.ObjectProperties.id, this.id);
    ret.put(Globals.ExchangeModel.ObjectProperties.creationDate, this.date);
    ret.put(Globals.ExchangeModel.ObjectProperties.x, this.x);
    ret.put(Globals.ExchangeModel.ObjectProperties.y, this.y);
//        ret.put(Globals.ExchangeModel.ObjectProperties.shape, this.symbol);
    ret.put(Globals.ExchangeModel.ObjectProperties.color, this.color);
    ret.put(Globals.ExchangeModel.ObjectProperties.text, this.text);
    ret.put(Globals.ExchangeModel.ObjectProperties.name, this.name);
    ret.put(Globals.ExchangeModel.ObjectProperties.letters, this.letters);
    ret.put(Globals.ExchangeModel.ObjectProperties.userCanDelete, this.userCanDelete);

    JSONArray jAnnot = new JSONArray();
    Iterator<Annotation> itAnnot = linkedAnnotations.iterator();
    while (itAnnot.hasNext()) {
      jAnnot.put(itAnnot.next().toJSON());
    }
    ret.put("annotations", jAnnot);

    return ret;
  }
}
