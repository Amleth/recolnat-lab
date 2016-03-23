/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package fr.recolnat.database.utils;

import com.tinkerpop.blueprints.Direction;
import com.tinkerpop.blueprints.Vertex;
import com.tinkerpop.blueprints.impls.orient.OrientGraph;
import com.tinkerpop.blueprints.impls.orient.OrientVertex;
import fr.recolnat.database.model.DataModel;
import java.util.Iterator;
import org.apache.commons.lang.NotImplementedException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author dmitri
 */
public class BranchUtils {
  private final Logger log = LoggerFactory.getLogger(BranchUtils.class);

  public static OrientVertex branchSubTree(OrientVertex vStart, OrientVertex vUser, OrientGraph g) {
    if (!AccessRights.canRead(vUser, vStart, g)) {
      return null;
    }
    OrientVertex vBranch = null;
    Iterator<Vertex> itLinks = null;
    switch ((String) vStart.getProperty("@class")) {
      case DataModel.Classes.comment:
        // Do not branch
        return null;
      case DataModel.Classes.discussion:
        // Do not branch
        return null;
      case DataModel.Classes.externBaseEntity:
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
        // Links to process: none
        break;
      case DataModel.Classes.measurement:
        vBranch = BranchUtils.branchMeasurement(vStart, vUser, g);
        // Links to process: none
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
        itLinks = vStart.getVertices(Direction.OUT, DataModel.Links.hasAnnotation).iterator();
        while (itLinks.hasNext()) {
          OrientVertex vAnnotation = (OrientVertex) itLinks.next();
          if (AccessUtils.isLatestVersion(vAnnotation)) {
            if (DataModel.Classes.measurement.equals(vAnnotation.getProperty("@class"))) {
              OrientVertex vMeasurement = BranchUtils.branchSubTree(vAnnotation, vUser, g);
              UpdateUtils.link(vBranch, vMeasurement, DataModel.Links.hasAnnotation, null, g);
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
        itLinks = vStart.getVertices(Direction.OUT, DataModel.Links.hasAnnotation).iterator();
        while (itLinks.hasNext()) {
          OrientVertex vAnnotation = (OrientVertex) itLinks.next();
          if (DataModel.Classes.measurement.equals(vAnnotation.getProperty("@class"))) {
            if (AccessUtils.isLatestVersion(vAnnotation)) {
              OrientVertex vMeasurement = BranchUtils.branchSubTree(vAnnotation, vUser, g);
              UpdateUtils.link(vBranch, vMeasurement, DataModel.Links.hasAnnotation, null, g);
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
            OrientVertex vBranchedSubset = BranchUtils.branchSubTree(vSubset, vUser, g);
            UpdateUtils.link(vBranch, vBranchedSubset, DataModel.Links.containsSubSet, (String) vUser.getProperty(DataModel.Properties.id), g);
          }
        }

        itLinks = vStart.getVertices(Direction.OUT, DataModel.Links.containsItem).iterator();
        while (itLinks.hasNext()) {
          OrientVertex vItem = (OrientVertex) itLinks.next();
          if (AccessUtils.isLatestVersion(vItem)) {
            OrientVertex vBranchedItem = BranchUtils.branchSubTree(vItem, vUser, g);
            UpdateUtils.link(vBranch, vBranchedItem, DataModel.Links.containsItem, (String) vUser.getProperty(DataModel.Properties.id), g);
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
            OrientVertex vBranchedImage = BranchUtils.branchSubTree(vImage, vUser, g);
            UpdateUtils.link(vBranch, vBranchedImage, DataModel.Links.hasImage, null, g);
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

    return vBranch;
  }

  public static OrientVertex branchImage(OrientVertex vOriginalImage, OrientVertex vUser, OrientGraph g) {
    String name = vOriginalImage.getProperty(DataModel.Properties.name);
    String imageUrl = vOriginalImage.getProperty(DataModel.Properties.imageUrl);
    String thumbUrl = vOriginalImage.getProperty(DataModel.Properties.thumbUrl);
    OrientVertex vImageFork = CreatorUtils.createImage(name, imageUrl, thumbUrl, g);

    UpdateUtils.link(vOriginalImage, vImageFork, DataModel.Links.isForkedAs, (String) vUser.getProperty(DataModel.Properties.id), g);

    AccessRights.grantAccessRights(vUser, vImageFork, DataModel.Enums.AccessRights.WRITE, g);

    return vImageFork;
  }
  
  public static OrientVertex branchMeasureStandard(OrientVertex vStandard, OrientVertex vUser, OrientGraph g) {
    String name = vStandard.getProperty(DataModel.Properties.name);
    Double length = vStandard.getProperty(DataModel.Properties.length);
    OrientVertex vStandardFork = CreatorUtils.createMeasureStandard(length, "mm", name, g);
    
    UpdateUtils.link(vStandard, vStandardFork, DataModel.Links.isForkedAs, (String) vUser.getProperty(DataModel.Properties.id), g);
    
    AccessRights.grantAccessRights(vUser, vStandardFork, DataModel.Enums.AccessRights.WRITE, g);
    
    return vStandardFork;
  }

  public static OrientVertex branchMeasurement(OrientVertex vMeasurement, OrientVertex vUser, OrientGraph g) {
    Double value = vMeasurement.getProperty(DataModel.Properties.pxValue);
    DataModel.Enums.Measurement type = vMeasurement.getProperty(DataModel.Properties.type);
    OrientVertex vMeasurementFork = CreatorUtils.createMeasurement(value, type, g);
    
    UpdateUtils.link(vMeasurement, vMeasurementFork, DataModel.Links.isForkedAs, (String) vUser.getProperty(DataModel.Properties.id), g);
    
    AccessRights.grantAccessRights(vUser, vMeasurementFork, DataModel.Enums.AccessRights.WRITE, g);
    
    return vMeasurementFork;
  }

  public static OrientVertex branchTrailOfInterest(OrientVertex vStart, OrientVertex vUser, OrientGraph g) {
    throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
  }

  public static OrientVertex branchPointOfInterest(OrientVertex vStart, OrientVertex vUser, OrientGraph g) {
    throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
  }

  public static OrientVertex branchRegionOfInterest(OrientVertex vStart, OrientVertex vUser, OrientGraph g) {
    throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
  }

  public static OrientVertex branchSet(OrientVertex vStart, OrientVertex vUser, OrientGraph g) {
    throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
  }

  public static OrientVertex branchSpecimen(OrientVertex vStart, OrientVertex vUser, OrientGraph g) {
    throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
  }

  public static OrientVertex branchStudy(OrientVertex vStart, OrientVertex vUser, OrientGraph g) {
    throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
  }
}
