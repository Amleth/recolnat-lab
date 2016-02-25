/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package org.dicen.recolnat.services.core.metadata;

import com.tinkerpop.blueprints.impls.orient.OrientGraph;
import com.tinkerpop.blueprints.impls.orient.OrientVertex;
import fr.recolnat.database.utils.DeleteUtils;
import java.util.Iterator;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author dmitri
 */
public class WorkbenchMetadata extends AbstractObjectMetadata {
  private final String type = "Workbench";

  private static final Logger log = LoggerFactory.getLogger(WorkbenchMetadata.class);

  public WorkbenchMetadata(OrientVertex vWorkbench, OrientVertex vUser, OrientGraph g) throws JSONException {
    super(vWorkbench, vUser, g);
    
    this.userCanDelete = DeleteUtils.canUserDeleteSubGraph(vWorkbench, vUser, g);
    // Now manage links to various things 
    // children, parents, access rights, sharing status
  }

  public JSONObject toJSON() throws JSONException {
    JSONObject ret = super.toJSON();
    ret.put("type", this.type);
    
    return ret;
  }
}
