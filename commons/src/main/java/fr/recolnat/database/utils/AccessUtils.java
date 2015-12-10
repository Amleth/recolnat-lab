package fr.recolnat.database.utils;

import com.tinkerpop.blueprints.Direction;
import com.tinkerpop.blueprints.Edge;
import com.tinkerpop.blueprints.Vertex;
import com.tinkerpop.blueprints.impls.orient.OrientGraph;
import com.tinkerpop.blueprints.impls.orient.OrientVertex;
import fr.recolnat.database.model.DataModel;

import java.util.Iterator;

/**
 * Created by Dmitri Voitsekhovitch (dvoitsekh@gmail.com) on 21/04/15.
 */
public class AccessUtils {
  public static Vertex getWorkbench(String workbenchId, OrientGraph graph) {
    Iterator<Vertex> itWb = graph.getVertices(DataModel.Classes.CompositeTypes.workbench, new String[]{DataModel.Properties.id}, new Object[]{workbenchId}).iterator();
    if(itWb.hasNext()) {
      return itWb.next();
    }
    return null;
  }

  /**
   * Retrieves the given user's root workbench. If none exists, creates a new one and links it to the user.
   * @param user
   * @param graph
   * @return
   */
  public static Vertex getRootWorkbench(Vertex user, OrientGraph graph) {
    // Get user's direct-link workbench iterator
    Iterator<Edge> edgeIt = user.getEdges(Direction.IN, DataModel.Links.createdBy).iterator();
    // Return the right workbench
    while(edgeIt.hasNext()) {
      Vertex vCreated = edgeIt.next().getVertex(Direction.OUT);
      if("workbench-root".equals(vCreated.getProperty(DataModel.Properties.role))) {
        return vCreated;
      }
    }
    // Or create one if it does not exist
    OrientVertex rootWb = CreatorUtils.createWorkbenchContent("Espaces de travail", "workbench-root", graph);
    UpdateUtils.addCreator(rootWb, (OrientVertex) user, graph);
    return rootWb;
  }

  public static Vertex getUserByUUID(String user, OrientGraph graph) {
    Iterator<Vertex> itUs = graph.getVertices(DataModel.Classes.CompositeTypes.user, new String [] {DataModel.Properties.id}, new Object[] {user}).iterator();
    if(itUs.hasNext()) {
      return itUs.next();
    }
    return null;
  }
  
  public static Vertex getUserByLogin(String user, OrientGraph graph) {
    Iterator<Vertex> itUs = graph.getVertices(DataModel.Classes.CompositeTypes.user, new String [] {DataModel.Properties.login}, new Object[] {user}).iterator();
    if(itUs.hasNext()) {
      return itUs.next();
    }
    return null;
  }

  public static Vertex getNodeById(String id, OrientGraph graph) {
    Iterator<Vertex> itWb = graph.getVertices(DataModel.Properties.id, id).iterator();
    if(itWb.hasNext()) {
      return itWb.next();
    }
    return null;
  }
  
  public static Edge getEdgeById(String id, OrientGraph graph) {
    Iterator<Edge> itWb = graph.getEdges(DataModel.Properties.id, id).iterator();
    if(itWb.hasNext()) {
      return itWb.next();
    }
    return null;
  }

  public static Edge getEdgeBetweenVertices(Vertex parent, Vertex child, String label, OrientGraph graph) {
    Iterator<Edge> itEdge = parent.getEdges(Direction.OUT, label).iterator();

    while(itEdge.hasNext()) {
      Edge candidate = itEdge.next();
      if(candidate.getVertex(Direction.IN).equals(child)) {
        return candidate;
      }
    }
    return null;
  }

  public static OrientVertex getCreator(OrientVertex vertex, OrientGraph g) {
    OrientVertex creator = (OrientVertex) vertex.getVertices(Direction.IN, DataModel.Links.createdBy).iterator().next();
    return creator;
  }
  
  public static String getCreatorId(OrientVertex vertex, OrientGraph g) {
    return AccessUtils.getCreator(vertex, g).getProperty(DataModel.Properties.id);
  }
}
