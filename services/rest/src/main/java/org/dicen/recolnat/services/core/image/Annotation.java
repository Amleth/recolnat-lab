package org.dicen.recolnat.services.core.image;

import com.tinkerpop.blueprints.Direction;
import com.tinkerpop.blueprints.Vertex;
import com.tinkerpop.blueprints.impls.orient.OrientGraph;
import com.tinkerpop.blueprints.impls.orient.OrientVertex;
import fr.recolnat.database.model.DataModel;
import fr.recolnat.database.utils.AccessRights;
import fr.recolnat.database.utils.DeleteUtils;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response;
import java.nio.file.AccessDeniedException;
import java.util.Date;
import java.util.Iterator;
import org.dicen.recolnat.services.core.Globals;

/**
 * Created by Dmitri Voitsekhovitch (dvoitsekh@gmail.com) on 22/05/15.
 */
public class Annotation {
  private String id = null;
  private String type = null;
  private Long date = null;
  private String textContent = null;
  private String author = null;
  private boolean userCanDelete = false;

  private final static Logger log = LoggerFactory.getLogger(Annotation.class);

  public Annotation(OrientVertex v, OrientVertex vUser, OrientGraph g) throws AccessDeniedException {
    if(AccessRights.getAccessRights(vUser, v, g) == DataModel.Enums.AccessRights.NONE) {
      throw new AccessDeniedException((String) v.getProperty(DataModel.Properties.id));
    }
    
    this.id = v.getProperty(DataModel.Properties.id);
    this.date = v.getProperty(DataModel.Properties.creationDate);
    this.userCanDelete = DeleteUtils.canUserDeleteSubGraph(v, vUser, g);
    Iterator<Vertex> itCreator = v.getVertices(Direction.OUT, DataModel.Links.createdBy).iterator();
    if(itCreator.hasNext()) {
      this.author = itCreator.next().getProperty(DataModel.Properties.name);
    }
    this.type = v.getProperty("@class");

    if(this.type.equals(DataModel.Classes.LeafTypes.measurement)) {
      DataModel.Enums.Measurement mType = null;
      Integer typeInt = (Integer) v.getProperty(DataModel.Properties.type);
      for(DataModel.Enums.Measurement m : DataModel.Enums.Measurement.values()) {
        if(m.value() == typeInt) {
          mType = m;
          break;
        }
      }
      String unit = "px";
      if(mType == DataModel.Enums.Measurement.AREA) {
        unit = "px²";
      }
      this.textContent = v.getProperty(DataModel.Properties.pxValue) + unit;
    }
    else if (this.type.equals(DataModel.Classes.LeafTypes.measureReference)) {
      this.textContent = v.getProperty(DataModel.Properties.length) + "mm";
    }
    else {
      this.textContent = v.getProperty(DataModel.Properties.content);
    }

  }

  public JSONObject toJSON() throws JSONException {
    JSONObject ret = new JSONObject();
    ret.put(Globals.ExchangeModel.ObjectProperties.id, this.id);
    ret.put(Globals.ExchangeModel.ObjectProperties.creationDate, this.date);
    ret.put(Globals.ExchangeModel.ObjectProperties.text, textContent);
    ret.put(Globals.ExchangeModel.ObjectProperties.creator, this.author);
    ret.put(Globals.ExchangeModel.ObjectProperties.userCanDelete, this.userCanDelete);
    if(this.type.equals(DataModel.Classes.LeafTypes.comment)) {
      ret.put(Globals.ExchangeModel.ObjectProperties.type, Globals.ExchangeModel.ImageEditorProperties.AnnotationTypes.note);
    }
    else if(this.type.equals(DataModel.Classes.LeafTypes.transcription)) {
      ret.put(Globals.ExchangeModel.ObjectProperties.type, Globals.ExchangeModel.ImageEditorProperties.AnnotationTypes.transcription);
    }
    else if(this.type.equals(DataModel.Classes.LeafTypes.measurement)) {
      ret.put(Globals.ExchangeModel.ObjectProperties.type, Globals.ExchangeModel.ImageEditorProperties.AnnotationTypes.measurement);
    }
    else {
      log.error("Annotation type not recognized " + this.type);
    }

    return ret;
  }
}
