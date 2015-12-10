package fr.recolnat.database.utils;

import com.tinkerpop.blueprints.impls.orient.OrientEdge;
import com.tinkerpop.blueprints.impls.orient.OrientGraph;
import com.tinkerpop.blueprints.impls.orient.OrientVertex;
import fr.recolnat.database.model.DataModel;
import java.util.Date;

/**
 * Created by Dmitri Voitsekhovitch (dvoitsekh@gmail.com) on 26/03/15.
 */
public class UpdateUtils {
  public static OrientEdge addCreator(OrientVertex item, OrientVertex creator, OrientGraph graph) {
    OrientEdge edge = graph.addEdge("class:" + DataModel.Links.createdBy, item, creator, DataModel.Links.createdBy);
    edge.setProperty(DataModel.Properties.id, CreatorUtils.newEdgeUUID(graph));
    edge.setProperty(DataModel.Properties.creationDate, (new Date()).getTime());
    return edge;
  }

//  public static void linkParentToChild(OrientVertex parent, OrientVertex child, OrientGraph g) {
//    throw new NotImplementedException("Operation not implemented yet.");
//  }

  public static OrientEdge addItemToWorkbench(OrientVertex item, String workbench, OrientVertex user, OrientGraph g) {
    OrientVertex vWb = (OrientVertex) AccessUtils.getWorkbench(workbench, g);
    return UpdateUtils.addItemToWorkbench(item, vWb, user, g);
  }

  public static OrientEdge addItemToWorkbench(OrientVertex item, OrientVertex workbench, OrientVertex user, OrientGraph g) {
    OrientEdge hasChild = g.addEdge("class:" + DataModel.Links.hasChild, workbench, item, DataModel.Links.hasChild);
    hasChild.setProperty(DataModel.Properties.id, CreatorUtils.newEdgeUUID(g));
    hasChild.setProperty(DataModel.Properties.creationDate, (new Date()).getTime());
    hasChild.setProperty(DataModel.Properties.creator, user.getProperty(DataModel.Properties.id));

    String role = item.getProperty(DataModel.Properties.role);
    if(role != null) {
        hasChild.setProperty(DataModel.Properties.coordX, 10);
        hasChild.setProperty(DataModel.Properties.coordY, 10);
        hasChild.setProperty(DataModel.Properties.coordZ, 0);
    }
    return hasChild;
  }

  public static void addWorkbenchToWorkbench(OrientVertex parent, OrientVertex child, OrientVertex user, OrientGraph g) {
    OrientEdge e = g.addEdge("class:" + DataModel.Links.hasChild, parent, child, DataModel.Links.hasChild);
    e.setProperty(DataModel.Properties.id, CreatorUtils.newEdgeUUID(g));
    e.setProperty(DataModel.Properties.creationDate, (new Date()).getTime());
    e.setProperty(DataModel.Properties.creator, user.getProperty(DataModel.Properties.id));
  }

  public static void addWorkbenchToWorkbench(String parent, OrientVertex child, OrientVertex user, OrientGraph g) {
    OrientVertex vParent = (OrientVertex) AccessUtils.getWorkbench(parent, g);
    UpdateUtils.addWorkbenchToWorkbench(vParent, child, user, g);
  }

  public static OrientEdge linkRegionOfInterestToEntity(String entity, OrientVertex regionOfInterest, OrientGraph g) {
    OrientVertex vEntity = (OrientVertex) AccessUtils.getNodeById(entity, g);
    OrientEdge link = g.addEdge("class:" + DataModel.Links.roi, vEntity, regionOfInterest, DataModel.Links.roi);
    link.setProperty(DataModel.Properties.id, CreatorUtils.newEdgeUUID(g));
    link.setProperty(DataModel.Properties.creationDate, (new Date()).getTime());

    return link;
  }

  public static OrientEdge linkPointOfInterestToEntity(String entity, OrientVertex pointOfInterest, OrientGraph g) {
    OrientVertex vEntity = (OrientVertex) AccessUtils.getNodeById(entity, g);
    OrientEdge link = g.addEdge("class:" + DataModel.Links.poi, vEntity, pointOfInterest, DataModel.Links.poi);
    link.setProperty(DataModel.Properties.id, CreatorUtils.newEdgeUUID(g));
    link.setProperty(DataModel.Properties.creationDate, (new Date()).getTime());

    return link;
  }

  public static OrientEdge linkPathToEntity(String entity, OrientVertex path, OrientGraph g) {
    OrientVertex vEntity = (OrientVertex) AccessUtils.getNodeById(entity, g);
    OrientEdge link = g.addEdge("class:" + DataModel.Links.path, vEntity, path, DataModel.Links.path);
    link.setProperty(DataModel.Properties.id, CreatorUtils.newEdgeUUID(g));
    link.setProperty(DataModel.Properties.creationDate, (new Date()).getTime());

    return link;
  }

  public static OrientEdge linkAnnotationToEntity(String entityId, OrientVertex annotation, OrientGraph g) {
    OrientVertex vEntity = (OrientVertex) AccessUtils.getNodeById(entityId, g);
    return UpdateUtils.linkAnnotationToEntity(vEntity, annotation, g);
  }

  public static OrientEdge linkAnnotationToEntity(OrientVertex entity, OrientVertex annotation, OrientGraph g) {
    OrientEdge link = g.addEdge("class:" + DataModel.Links.hasAnnotation, entity, annotation, DataModel.Links.hasAnnotation);
    link.setProperty(DataModel.Properties.id, CreatorUtils.newEdgeUUID(g));
    link.setProperty(DataModel.Properties.creationDate, (new Date()).getTime());

    return link;
  }

  public static OrientEdge addRegionOfInterestToWorkbench(String roiId, String workbenchId, OrientVertex user, OrientGraph g) {
    OrientVertex vRoi = (OrientVertex) AccessUtils.getNodeById(roiId, g);
    OrientVertex vWb = (OrientVertex) AccessUtils.getWorkbench(workbenchId, g);

    OrientEdge link = UpdateUtils.addItemToWorkbench(vRoi, vWb, user, g);
    link.setProperty(DataModel.Properties.opacity, 1.0);
    return link;
  }

  public static OrientEdge linkScalingData(String sheetId, OrientVertex reference, OrientGraph g) {
    OrientVertex vSheet = (OrientVertex) AccessUtils.getNodeById(sheetId, g);
    OrientEdge link = g.addEdge("class:" + DataModel.Links.hasScalingData, vSheet, reference, DataModel.Links.hasScalingData);
    link.setProperty(DataModel.Properties.creationDate, (new Date()).getTime());
    return link;
  }
  
  public static OrientEdge addOriginalSource(OrientVertex destination, OrientVertex source, OrientVertex user, OrientGraph g) {
    OrientEdge e = g.addEdge("class:" + DataModel.Links.hasOriginalSource, destination, source, DataModel.Links.hasOriginalSource);
    e.setProperty(DataModel.Properties.creationDate, (new Date()).getTime());
    e.setProperty(DataModel.Properties.creator, user.getProperty(DataModel.Properties.id));
    return e;
  }
}
