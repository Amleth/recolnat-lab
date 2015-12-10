package org.dicen.recolnat.services.core.state;

import com.tinkerpop.blueprints.Vertex;
import com.tinkerpop.blueprints.impls.orient.OrientGraph;
import com.tinkerpop.blueprints.impls.orient.OrientVertex;

/**
 * Created by Dmitri Voitsekhovitch (dvoitsekh@gmail.com) on 07/04/15.
 */
public class WorkbenchLink {
  public static enum ItemScope {
    PRIVATE,
    WORKBENCH,
    GLOBAL
  }

  private ItemScope scope;
  private String label;
  private String originId;
  private String targetId;
  private String id;

  public WorkbenchLink(Vertex v, OrientVertex vUser, OrientGraph g) {

  }
}
