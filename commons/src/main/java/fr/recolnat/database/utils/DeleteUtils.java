package fr.recolnat.database.utils;

import com.tinkerpop.blueprints.Direction;
import com.tinkerpop.blueprints.Edge;
import com.tinkerpop.blueprints.Vertex;
import com.tinkerpop.blueprints.impls.orient.OrientGraph;
import fr.recolnat.database.model.DataModel;

import java.util.Iterator;

/**
 * Created by Dmitri Voitsekhovitch (dvoitsekh@gmail.com) on 29/04/15.
 */
public class DeleteUtils {
  public static String removeParentChildLink(String linkId, String childId, String parentId, OrientGraph graph) {
    Vertex vParent = AccessUtils.getWorkbench(parentId, graph);
    Vertex vChild = AccessUtils.getNodeById(childId, graph);
    Edge eLink = graph.getEdges(DataModel.Properties.id, linkId).iterator().next();
    String childRole = vChild.getProperty(DataModel.Properties.role);

    if("workbench-root".equals(childRole)) {
      return "Operation not allowed: deleting root workbench";
    }

    DeleteUtils.removeParentChildLink(eLink, vChild, vParent, graph);

    return null;
  }

  private static void removeParentChildLink(Edge link, Vertex child, Vertex parent, OrientGraph graph) {
    String childRole = child.getProperty(DataModel.Properties.role);
    if("workbench-root".equals(childRole)) {
      return;
    }

    graph.removeEdge(link);

    if(childRole == null) {
      // Not a workbench, do not delete. Operation finished
      return;
    }
    Iterator<Edge> itParents = child.getEdges(Direction.IN, DataModel.Links.hasChild).iterator();
    if(itParents.hasNext()) {
      // Element still has parents and does not need to be deleted. Operation finished
      return;
    }

    // Recursively remove child's children
    Iterator<Edge> itChildEdge = child.getEdges(Direction.OUT, DataModel.Links.hasChild).iterator();
    while(itChildEdge.hasNext()) {
      Edge childEdge = itChildEdge.next();
      DeleteUtils.removeParentChildLink(childEdge, childEdge.getVertex(Direction.IN), child, graph);
    }

    // Finally remove the child itself. Previous checks must have ensured it is an orphan.
    graph.removeVertex(child);
    return;
  }
}
