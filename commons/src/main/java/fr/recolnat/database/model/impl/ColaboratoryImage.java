package fr.recolnat.database.model.impl;

import com.drew.imaging.ImageMetadataReader;
import com.drew.imaging.ImageProcessingException;
import com.drew.metadata.Directory;
import com.drew.metadata.Metadata;
import com.drew.metadata.Tag;
import com.tinkerpop.blueprints.Direction;
import com.tinkerpop.blueprints.Vertex;
import com.tinkerpop.blueprints.impls.orient.OrientBaseGraph;
import com.tinkerpop.blueprints.impls.orient.OrientVertex;
import fr.recolnat.database.RightsManagementDatabase;
import fr.recolnat.database.exceptions.AccessForbiddenException;
import fr.recolnat.database.model.DataModel;
import fr.recolnat.database.model.DataModel.Enums;
import fr.recolnat.database.utils.AccessRights;
import fr.recolnat.database.utils.AccessUtils;
import fr.recolnat.database.utils.DeleteUtils;
import org.apache.commons.io.FileUtils;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Set;

/**
 * Created by Dmitri Voitsekhovitch (dvoitsekh@gmail.com) on 22/05/15.
 */
public class ColaboratoryImage extends AbstractObject {
  
  private Set<String> specimensReferencingThisImage = new HashSet<>();
  private Set<String> anglesOfInterest = new HashSet<>();
  private Set<String> regionsOfInterest = new HashSet<>();
  private Set<String> pointsOfInterest = new HashSet<>();
  private Set<String> trailsOfInterest = new HashSet<>();
  private Set<String> measureStandards = new HashSet<>();
  private Metadata rawImageMetadata = null;
  private String source = null;
  private final Set<String> containedInSets = new HashSet<>();
  
  private final static Logger log = LoggerFactory.getLogger(ColaboratoryImage.class);
  
  public ColaboratoryImage(OrientVertex vImage, OrientVertex vUser, OrientBaseGraph g, RightsManagementDatabase rightsDb) throws AccessForbiddenException {
    super(vImage, vUser, g, rightsDb);
    
    if (!AccessRights.canRead(vUser, vImage, g, rightsDb)) {
      throw new AccessForbiddenException((String) vUser.getProperty(DataModel.Properties.id), (String) vImage.getProperty(DataModel.Properties.id));
    }
    
    Iterator<Vertex> itOriginalSource = vImage.getVertices(Direction.OUT, DataModel.Links.hasOriginalSource).iterator();
    OrientVertex vOriginalSource = AccessUtils.findLatestVersion(itOriginalSource, g);
    if (vOriginalSource != null) {
      this.source = vOriginalSource.getProperty(DataModel.Properties.id);
    }
    
    Iterator<Vertex> itSpecimens = vImage.getVertices(Direction.IN, DataModel.Links.hasImage).iterator();
    while (itSpecimens.hasNext()) {
      OrientVertex vSpecimen = (OrientVertex) itSpecimens.next();
      if (AccessUtils.isLatestVersion(vSpecimen)) {
        if (AccessRights.canRead(vUser, vSpecimen, g, rightsDb)) {
          this.specimensReferencingThisImage.add((String) vSpecimen.getProperty(DataModel.Properties.id));
        }
      }
    }
    
    Iterator<Vertex> itRois = vImage.getVertices(Direction.OUT, DataModel.Links.roi).iterator();
    while (itRois.hasNext()) {
      OrientVertex vRoi = (OrientVertex) itRois.next();
      if (AccessUtils.isLatestVersion(vRoi)) {
        if (AccessRights.canRead(vUser, vRoi, g, rightsDb)) {
          this.regionsOfInterest.add((String) vRoi.getProperty(DataModel.Properties.id));
        }
      }
    }
    
    Iterator<Vertex> itAois = vImage.getVertices(Direction.OUT, DataModel.Links.aoi).iterator();
    while (itAois.hasNext()) {
      OrientVertex vAoi = (OrientVertex) itAois.next();
      if (AccessUtils.isLatestVersion(vAoi)) {
        if (AccessRights.canRead(vUser, vAoi, g, rightsDb)) {
          this.anglesOfInterest.add((String) vAoi.getProperty(DataModel.Properties.id));
        }
      }
    }
    
    Iterator<Vertex> itPois = vImage.getVertices(Direction.OUT, DataModel.Links.poi).iterator();
    while (itPois.hasNext()) {
      OrientVertex vPoi = (OrientVertex) itPois.next();
      if (AccessUtils.isLatestVersion(vPoi)) {
        if (AccessRights.canRead(vUser, vPoi, g, rightsDb)) {
          this.pointsOfInterest.add((String) vPoi.getProperty(DataModel.Properties.id));
        }
      }
    }

    // Manage trails and associated measure standards, which are technically image-wide properties
    Iterator<Vertex> itTois = vImage.getVertices(Direction.OUT, DataModel.Links.toi).iterator();
    while (itTois.hasNext()) {
      OrientVertex vTrail = (OrientVertex) itTois.next();
      if (AccessRights.isLatestVersionAndHasRights(vUser, vTrail, Enums.AccessRights.READ, g, rightsDb)) {
        this.trailsOfInterest.add((String) vTrail.getProperty(DataModel.Properties.id));
        Iterator<Vertex> itTrailMeasurements = vTrail.getVertices(Direction.OUT, DataModel.Links.hasMeasurement).iterator();
        while (itTrailMeasurements.hasNext()) {
          OrientVertex trailMeasurement = (OrientVertex) itTrailMeasurements.next();
          if (AccessRights.isLatestVersionAndHasRights(vUser, trailMeasurement, Enums.AccessRights.READ, g, rightsDb)) {
            Iterator<Vertex> itStandards = trailMeasurement.getVertices(Direction.OUT, DataModel.Links.definedAsMeasureStandard).iterator();
            while (itStandards.hasNext()) {
              OrientVertex vStandard = (OrientVertex) itStandards.next();
              if (AccessRights.isLatestVersionAndHasRights(vUser, trailMeasurement, Enums.AccessRights.READ, g, rightsDb)) {
                this.measureStandards.add((String) vStandard.getProperty(DataModel.Properties.id));
              }
            }
          }
        }
      }
    }
    
    // Get parent sets
    Iterator<Vertex> itParentSets = vImage.getVertices(Direction.IN, DataModel.Links.containsItem).iterator();
    while(itParentSets.hasNext()) {
      OrientVertex vSet = (OrientVertex) itParentSets.next();
      if(AccessRights.isLatestVersionAndHasRights(vUser, vSet, DataModel.Enums.AccessRights.READ, g, rightsDb)) {
        this.containedInSets.add((String) vSet.getProperty(DataModel.Properties.id));
      }
    }
    
    String url = (String) this.properties.get(DataModel.Properties.imageUrl);
    File imageFile = null;
    if (url != null) {
      try {
        URL imageUrl = new URL(url);
        imageFile = File.createTempFile("image", ".tmp");
        FileUtils.copyURLToFile(imageUrl, imageFile, 250, 1000);
        Metadata imageMetadata = ImageMetadataReader.readMetadata(imageFile);
        this.rawImageMetadata = imageMetadata;
        imageFile.delete();
      } catch (MalformedURLException e) {
        log.warn("EXIF failed, URL malformed " + url, e);
      } catch (IOException e) {
        log.error("EXIF failed, could not create/delete temporary file", e);
      } catch (ImageProcessingException ex) {
        log.warn("Unable to read image metadata from " + url, ex);
      } finally {
        if (imageFile != null) {
          imageFile.delete();
        }
      }
    }
    
    this.userCanDelete = DeleteUtils.canUserDeleteSubGraph(vImage, vUser, g, rightsDb);
  }
  
  @Override
  public JSONObject toJSON() throws JSONException {
    JSONObject ret = super.toJSON();
    
    if (this.source != null) {
      ret.put("originalSource", this.source);
    }
    
    ret.put("specimens", this.specimensReferencingThisImage);
    ret.put("rois", this.regionsOfInterest);
    ret.put("aois", this.anglesOfInterest);
    ret.put("pois", this.pointsOfInterest);
    ret.put("tois", this.trailsOfInterest);
    ret.put("scales", this.measureStandards);
    ret.put("inSets", this.containedInSets);
    
    if (this.rawImageMetadata != null) {
      JSONObject jMetadata = new JSONObject();
      for (Directory dir : this.rawImageMetadata.getDirectories()) {
        for (Tag tag : dir.getTags()) {
//          JSONObject jTag = new JSONObject();
//          jTag.put(tag.getTagName(), tag.getDescription());
          jMetadata.put(tag.getTagName(), tag.getDescription());
        }
      }
      ret.put("exif", jMetadata);
    }
    
    if (log.isTraceEnabled()) {
      log.trace(ret.toString());
    }
    
    return ret;
  }
}
