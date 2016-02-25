/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package org.dicen.recolnat.services.core.metadata;

import com.tinkerpop.blueprints.Direction;
import com.tinkerpop.blueprints.Vertex;
import com.tinkerpop.blueprints.impls.orient.OrientGraph;
import com.tinkerpop.blueprints.impls.orient.OrientVertex;
import fr.recolnat.database.model.DataModel;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author dmitri
 */
public class SheetMetadata extends AbstractObjectMetadata {
  private final String type = "Sheet";
  
  private OriginalSourceMetadata originalSource = null;

  private final Logger log = LoggerFactory.getLogger(WorkbenchMetadata.class);

  public SheetMetadata(OrientVertex vSheet, OrientVertex vUser, OrientGraph g) throws JSONException {
    super(vSheet, vUser, g);
    // Now manage links to various things 
    // original source
    Iterator<Vertex> itSources = vSheet.getVertices(Direction.OUT, DataModel.Links.hasOriginalSource).iterator();
    if(itSources.hasNext()) {
      OrientVertex vSource = (OrientVertex) itSources.next();
      this.originalSource = new OriginalSourceMetadata(vSource, vUser, g);
    }
  }

  @Override
  public JSONObject toJSON() throws JSONException {
    JSONObject ret = super.toJSON();
    ret.put("type", type);
    
    if(this.originalSource != null) {
      ret.put("originalSource", this.originalSource.toJSON());
    }
    return ret;
  }
}
