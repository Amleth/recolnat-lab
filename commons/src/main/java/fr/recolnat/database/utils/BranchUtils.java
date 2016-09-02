/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package fr.recolnat.database.utils;

import com.tinkerpop.blueprints.Direction;
import com.tinkerpop.blueprints.Vertex;
import com.tinkerpop.blueprints.impls.orient.OrientBaseGraph;
import com.tinkerpop.blueprints.impls.orient.OrientVertex;
import fr.recolnat.database.model.DataModel;
import java.util.Iterator;
import java.util.List;
import org.apache.commons.lang.NotImplementedException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Creates a fork of the given start element and all of its auto-forkable sub-elements. 
 * Grants user write access on all nodes of the resulting tree.
 * @author dmitri
 */
public class BranchUtils {

  private static final Logger log = LoggerFactory.getLogger(BranchUtils.class);

  public static OrientVertex branchSubTree(OrientVertex vStart, OrientVertex vUser, OrientBaseGraph g) {
    if (!AccessRights.canRead(vUser, vStart, g)) {
      return null;
    }
    OrientVertex vBranch = null;
    Iterator<Vertex> itLinks = null;
    switch ((String) vStart.getProperty("@class")) {
      case DataModel.Classes.annotation:
        // Do not branch
        return null;
      case DataModel.Classes.discussion:
        // Do not branch
        return null;
      case DataModel.Classes.originalSource:
        // Do not branch
        return null;
      case DataModel.Classes.group:
        // Do not branch
        return null;
      case DataModel.Classes.image:
        // Do branch!
        // Create new image, link it as fork, set properties
        vBranch = BranchUtils.branchImage(vStart, vUser, g);
        // Links to process: none
        break;
      case DataModel.Classes.measureStandard:
        vBranch = BranchUtils.branchMeasureStandard(vStart, vUser, g);
        // Links to process: 
        break;
      case DataModel.Classes.measurement:
        vBranch = BranchUtils.branchMeasurement(vStart, vUser, g);
        // Links to process: definedAsMeasureStandard
        itLinks = vStart.getVertices(Direction.OUT, DataModel.Links.definedAsMeasureStandard).iterator();
        while (itLinks.hasNext()) {
          OrientVertex vStandard = (OrientVertex) itLinks.next();
          if (AccessUtils.isLatestVersion(vStandard)) {
            if (AccessRights.canRead(vUser, vStandard, g)) {
              OrientVertex vNewStandard = BranchUtils.branchSubTree(vStandard, vUser, g);
              UpdateUtils.link(vBranch, vNewStandard, DataModel.Links.definedAsMeasureStandard, null, g);
            }
          }
        }
        break;
      case DataModel.Classes.message:
        // Do not branch
        return null;
      case DataModel.Classes.opinion:
        // Do not branch
        return null;
      case DataModel.Classes.trailOfInterest:
        vBranch = BranchUtils.branchTrailOfInterest(vStart, vUser, g);
        // Links to process: Measurements
        itLinks = vStart.getVertices(Direction.OUT, DataModel.Links.hasMeasurement).iterator();
        while (itLinks.hasNext()) {
          OrientVertex vMeasurement = (OrientVertex) itLinks.next();
          if (AccessUtils.isLatestVersion(vMeasurement)) {
            if (AccessRights.canRead(vUser, vMeasurement, g)) {
              OrientVertex vNewMeasurement = BranchUtils.branchSubTree(vMeasurement, vUser, g);
              UpdateUtils.link(vBranch, vNewMeasurement, DataModel.Links.hasMeasurement, null, g);
            }
          }
        }
        break;
      case DataModel.Classes.pointOfInterest:
        vBranch = BranchUtils.branchPointOfInterest(vStart, vUser, g);
        // Links to process: none
        break;
      case DataModel.Classes.regionOfInterest:
        vBranch = BranchUtils.branchRegionOfInterest(vStart, vUser, g);
        // Links to process: Measurements
        itLinks = vStart.getVertices(Direction.OUT, DataModel.Links.hasMeasurement).iterator();
        while (itLinks.hasNext()) {
          OrientVertex vAnnotation = (OrientVertex) itLinks.next();
          if (AccessUtils.isLatestVersion(vAnnotation)) {
            if (AccessRights.canRead(vUser, vAnnotation, g)) {
              OrientVertex vMeasurement = BranchUtils.branchSubTree(vAnnotation, vUser, g);
              UpdateUtils.link(vBranch, vMeasurement, DataModel.Links.hasMeasurement, null, g);
            }
          }
        }
        break;
      case DataModel.Classes.relationship:
        throw new NotImplementedException();
      case DataModel.Classes.set:
        vBranch = BranchUtils.branchSet(vStart, vUser, g);
        // Links to process : SubSet, Item
        itLinks = vStart.getVertices(Direction.OUT, DataModel.Links.containsSubSet).iterator();
        while (itLinks.hasNext()) {
          OrientVertex vSubset = (OrientVertex) itLinks.next();
          if (AccessUtils.isLatestVersion(vSubset)) {
            if (AccessRights.canRead(vUser, vSubset, g)) {
              OrientVertex vBranchedSubset = BranchUtils.branchSubTree(vSubset, vUser, g);
              UpdateUtils.link(vBranch, vBranchedSubset, DataModel.Links.containsSubSet, (String) vUser.getProperty(DataModel.Properties.id), g);
            }
          }
        }

        itLinks = vStart.getVertices(Direction.OUT, DataModel.Links.containsItem).iterator();
        while (itLinks.hasNext()) {
          OrientVertex vItem = (OrientVertex) itLinks.next();
          if (AccessUtils.isLatestVersion(vItem)) {
            if (AccessRights.canRead(vUser, vItem, g)) {
              OrientVertex vBranchedItem = BranchUtils.branchSubTree(vItem, vUser, g);
              UpdateUtils.link(vBranch, vBranchedItem, DataModel.Links.containsItem, (String) vUser.getProperty(DataModel.Properties.id), g);
            }
          }
        }
        break;
      case DataModel.Classes.setView:
        return null;
      case DataModel.Classes.specimen:
        vBranch = BranchUtils.branchSpecimen(vStart, vUser, g);
        // Links to process: Image
        itLinks = vStart.getVertices(Direction.OUT, DataModel.Links.hasImage).iterator();
        while (itLinks.hasNext()) {
          OrientVertex vImage = (OrientVertex) itLinks.next();
          if (AccessUtils.isLatestVersion(vImage)) {
            if (AccessRights.canRead(vUser, vImage, g)) {
              OrientVertex vBranchedImage = BranchUtils.branchSubTree(vImage, vUser, g);
              UpdateUtils.link(vBranch, vBranchedImage, DataModel.Links.hasImage, null, g);
            }
          }
        }
        break;
      case DataModel.Classes.study:
        vBranch = BranchUtils.branchStudy(vStart, vUser, g);
        // Links to process: CoreSet
        itLinks = vStart.getVertices(Direction.OUT, DataModel.Links.hasCoreSet).iterator();
        while (itLinks.hasNext()) {
          OrientVertex vSet = (OrientVertex) itLinks.next();
          if (AccessUtils.isLatestVersion(vSet)) {
            // if you can read the study, you can read its set
            OrientVertex vBranchedSet = BranchUtils.branchSubTree(vSet, vUser, g);
            UpdateUtils.link(vBranch, vBranchedSet, DataModel.Links.hasCoreSet, null, g);
          }
        }
        break;
      case DataModel.Classes.tag:
        throw new NotImplementedException();
      case DataModel.Classes.tagging:
        throw new NotImplementedException();
      case DataModel.Classes.user:
        // Human cloning forbidden by law :(
        return null;
      default:
        throw new NotImplementedException("Handler not implemented for " + (String) vStart.getProperty("@class"));
    }

    AccessRights.grantAccessRights(vUser, vBranch, DataModel.Enums.AccessRights.WRITE, g);
    return vBranch;
  }
  
  public static boolean isMainBranch(OrientVertex v, OrientBaseGraph g) {
    // NPE means database is screwed up, node is missing branch status
    return v.getProperty(DataModel.Properties.branch).equals(DataModel.Globals.BRANCH_MAIN);
  }

  private static OrientVertex branchImage(OrientVertex vOriginalImage, OrientVertex vUser, OrientBaseGraph g) {
    String name = vOriginalImage.getProperty(DataModel.Properties.name);
    String imageUrl = vOriginalImage.getProperty(DataModel.Properties.imageUrl);
    String thumbUrl = vOriginalImage.getProperty(DataModel.Properties.thumbUrl);
    int width = vOriginalImage.getProperty(DataModel.Properties.width);
    int height = vOriginalImage.getProperty(DataModel.Properties.height);
    OrientVertex vImageFork = CreatorUtils.createImage(name, imageUrl, width, height, thumbUrl, g);
    vImageFork.setProperty(DataModel.Properties.branch, DataModel.Globals.BRANCH_SIDE);

    UpdateUtils.link(vOriginalImage, vImageFork, DataModel.Links.isForkedAs, (String) vUser.getProperty(DataModel.Properties.id), g);

    AccessRights.grantAccessRights(vUser, vImageFork, DataModel.Enums.AccessRights.WRITE, g);

    return vImageFork;
  }

  private static OrientVertex branchMeasureStandard(OrientVertex vStandard, OrientVertex vUser, OrientBaseGraph g) {
    String name = vStandard.getProperty(DataModel.Properties.name);
    Double length = vStandard.getProperty(DataModel.Properties.length);
    OrientVertex vStandardFork = CreatorUtils.createMeasureStandard(length, "mm", name, g);
    vStandardFork.setProperty(DataModel.Properties.branch, DataModel.Globals.BRANCH_SIDE);

    UpdateUtils.link(vStandard, vStandardFork, DataModel.Links.isForkedAs, (String) vUser.getProperty(DataModel.Properties.id), g);

    AccessRights.grantAccessRights(vUser, vStandardFork, DataModel.Enums.AccessRights.WRITE, g);

    return vStandardFork;
  }

  private static OrientVertex branchMeasurement(OrientVertex vMeasurement, OrientVertex vUser, OrientBaseGraph g) {
    Double value = vMeasurement.getProperty(DataModel.Properties.pxValue);
    DataModel.Enums.Measurement measureType = vMeasurement.getProperty(DataModel.Properties.measureType);
    OrientVertex vMeasurementFork = CreatorUtils.createMeasurement(value, measureType, g);
    vMeasurementFork.setProperty(DataModel.Properties.branch, DataModel.Globals.BRANCH_SIDE);

    UpdateUtils.link(vMeasurement, vMeasurementFork, DataModel.Links.isForkedAs, (String) vUser.getProperty(DataModel.Properties.id), g);

    AccessRights.grantAccessRights(vUser, vMeasurementFork, DataModel.Enums.AccessRights.WRITE, g);

    return vMeasurementFork;
  }

  private static OrientVertex branchTrailOfInterest(OrientVertex vTrail, OrientVertex vUser, OrientBaseGraph g) {
    List<List<Integer>> coordinates = vTrail.getProperty(DataModel.Properties.vertices);
    String name = vTrail.getProperty(DataModel.Properties.name);
    OrientVertex vTrailFork = CreatorUtils.createTrailOfInterest(coordinates, name, g);
    vTrailFork.setProperty(DataModel.Properties.branch, DataModel.Globals.BRANCH_SIDE);

    UpdateUtils.link(vTrail, vTrailFork, DataModel.Links.isForkedAs, (String) vUser.getProperty(DataModel.Properties.id), g);

    AccessRights.grantAccessRights(vUser, vTrailFork, DataModel.Enums.AccessRights.WRITE, g);

    return vTrailFork;
  }

  private static OrientVertex branchPointOfInterest(OrientVertex vPoint, OrientVertex vUser, OrientBaseGraph g) {
    Integer x = vPoint.getProperty(DataModel.Properties.coordX);
    Integer y = vPoint.getProperty(DataModel.Properties.coordY);
    String name = vPoint.getProperty(DataModel.Properties.name);
    OrientVertex vPointFork = CreatorUtils.createPointOfInterest(x, y, name, g);
    vPointFork.setProperty(DataModel.Properties.branch, DataModel.Globals.BRANCH_SIDE);

    UpdateUtils.link(vPoint, vPointFork, DataModel.Links.isForkedAs, (String) vUser.getProperty(DataModel.Properties.id), g);

    AccessRights.grantAccessRights(vUser, vPointFork, DataModel.Enums.AccessRights.WRITE, g);

    return vPointFork;
  }

  private static OrientVertex branchRegionOfInterest(OrientVertex vRegion, OrientVertex vUser, OrientBaseGraph g) {
    List<List<Integer>> coordinates = vRegion.getProperty(DataModel.Properties.vertices);
    String name = vRegion.getProperty(DataModel.Properties.name);
    OrientVertex vRegionFork = CreatorUtils.createRegionOfInterest(name, coordinates, g);
    vRegionFork.setProperty(DataModel.Properties.branch, DataModel.Globals.BRANCH_SIDE);

    UpdateUtils.link(vRegion, vRegionFork, DataModel.Links.isForkedAs, (String) vUser.getProperty(DataModel.Properties.id), g);

    AccessRights.grantAccessRights(vUser, vRegionFork, DataModel.Enums.AccessRights.WRITE, g);

    return vRegionFork;
  }

  private static OrientVertex branchSet(OrientVertex vSet, OrientVertex vUser, OrientBaseGraph g) {
    String name = vSet.getProperty(DataModel.Properties.name);
    OrientVertex vSetFork = CreatorUtils.createSet(name, "bag", g);
    vSetFork.setProperty(DataModel.Properties.branch, DataModel.Globals.BRANCH_SIDE);

    UpdateUtils.link(vSet, vSetFork, DataModel.Links.isForkedAs, (String) vUser.getProperty(DataModel.Properties.id), g);

    AccessRights.grantAccessRights(vUser, vSetFork, DataModel.Enums.AccessRights.WRITE, g);

    return vSetFork;
  }

  private static OrientVertex branchSpecimen(OrientVertex vSpecimen, OrientVertex vUser, OrientBaseGraph g) {
    String name = vSpecimen.getProperty(DataModel.Properties.name);
    OrientVertex vSpecimenFork = CreatorUtils.createSpecimen(name, g);
    vSpecimenFork.setProperty(DataModel.Properties.branch, DataModel.Globals.BRANCH_SIDE);

    UpdateUtils.link(vSpecimen, vSpecimenFork, DataModel.Links.isForkedAs, (String) vUser.getProperty(DataModel.Properties.id), g);

    AccessRights.grantAccessRights(vUser, vSpecimenFork, DataModel.Enums.AccessRights.WRITE, g);

    return vSpecimenFork;
  }

  private static OrientVertex branchStudy(OrientVertex vStudy, OrientVertex vUser, OrientBaseGraph g) {
    String name = vStudy.getProperty(DataModel.Properties.name);
    // Rights granted internally
    OrientVertex vStudyFork = CreatorUtils.createStudy(name, vUser, g);
    vStudyFork.setProperty(DataModel.Properties.branch, DataModel.Globals.BRANCH_SIDE);

    UpdateUtils.link(vStudy, vStudyFork, DataModel.Links.isForkedAs, (String) vUser.getProperty(DataModel.Properties.id), g);

    return vStudyFork;
  }
  
  public static OrientVertex getMainBranchAncestor(OrientVertex v, OrientBaseGraph g) {
    if(BranchUtils.isMainBranch(v, g)) {
      return v;
    }
    Iterator<Vertex> itForkAncestors = v.getVertices(Direction.IN, DataModel.Links.isForkedAs).iterator();
    while(itForkAncestors.hasNext()) {
      OrientVertex vAncestor = (OrientVertex) itForkAncestors.next();
      OrientVertex vMainAncestor = BranchUtils.getMainBranchAncestor(vAncestor, g);
      if(vMainAncestor != null) {
        return vMainAncestor;
      }
    }
    
    log.error("No main branch ancestor found for element " + v.toString() + " This must never happen!");
    return null;
  }
}
