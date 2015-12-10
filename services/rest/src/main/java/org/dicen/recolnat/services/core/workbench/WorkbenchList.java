package org.dicen.recolnat.services.core.workbench;

import com.tinkerpop.blueprints.Direction;
import com.tinkerpop.blueprints.Vertex;
import com.tinkerpop.blueprints.impls.orient.OrientGraph;
import com.tinkerpop.blueprints.impls.orient.OrientVertex;
import fr.recolnat.database.model.DataModel;
import fr.recolnat.database.utils.AccessUtils;
import java.nio.file.AccessDeniedException;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Set;

/**
 * Created by Dmitri Voitsekhovitch (dvoitsekh@gmail.com) on 24/09/15.
 */
public class WorkbenchList {

  private Set<Workbench> workbenches = new HashSet<Workbench>();

  public WorkbenchList(Vertex user, OrientGraph g) {
    Vertex vRootWorkbench = AccessUtils.getRootWorkbench(user, g);
    
    try {
      workbenches.add(new Workbench(vRootWorkbench, user, g));
    } catch (AccessDeniedException e) {
      // Do nothing
    }
    this.recursivelyAddChildWorkbenches(vRootWorkbench, user, g);
  }

  private void recursivelyAddChildWorkbenches(Vertex vWb, Vertex vUser, OrientGraph g) {
    Iterator<Vertex> itChildren = vWb.getVertices(Direction.OUT, DataModel.Links.hasChild).iterator();
    while (itChildren.hasNext()) {
      Vertex child = itChildren.next();
      if (child.getProperty("@class").equals(DataModel.Classes.CompositeTypes.workbench)) {
        try {
          Workbench childWb = new Workbench(child, vUser, g);
          if (!this.workbenches.contains(childWb)) {
            this.workbenches.add(childWb);
            this.recursivelyAddChildWorkbenches(child, vUser, g);
          }
        } catch (AccessDeniedException e) {
          // Do nothing
        }
      }
    }
  }

  public JSONArray toJSON() throws JSONException {
    JSONArray ret = new JSONArray();
    Iterator<Workbench> itWorkbenches = this.workbenches.iterator();
    while (itWorkbenches.hasNext()) {
      ret.put(itWorkbenches.next().toJSON());
    }

    return ret;
  }
}
