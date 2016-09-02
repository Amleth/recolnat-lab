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
import java.nio.file.AccessDeniedException;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Set;
import java.util.logging.Level;

/**
 * Created by Dmitri Voitsekhovitch (dvoitsekh@gmail.com) on 22/05/15.
 */
public class RecolnatImage extends AbstractObject {
  
  private Set<String> specimensReferencingThisImage = new HashSet<>();
  private Set<String> anglesOfInterest = new HashSet<>();
  private Set<String> regionsOfInterest = new HashSet<>();
  private Set<String> pointsOfInterest = new HashSet<>();
  private Set<String> trailsOfInterest = new HashSet<>();
  private Set<String> measureStandards = new HashSet<>();
  private Metadata rawImageMetadata = null;
  private String source = null;
  
  private final static Logger log = LoggerFactory.getLogger(RecolnatImage.class);
  
  public RecolnatImage(OrientVertex vImage, OrientVertex vUser, OrientBaseGraph g) throws AccessForbiddenException {
    super(vImage, vUser, g);
    
    if (!AccessRights.canRead(vUser, vImage, g)) {
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
        if (AccessRights.canRead(vUser, vSpecimen, g)) {
          this.specimensReferencingThisImage.add((String) vSpecimen.getProperty(DataModel.Properties.id));
        }
      }
    }
    
    Iterator<Vertex> itRois = vImage.getVertices(Direction.OUT, DataModel.Links.roi).iterator();
    while (itRois.hasNext()) {
      OrientVertex vRoi = (OrientVertex) itRois.next();
      if (AccessUtils.isLatestVersion(vRoi)) {
        if (AccessRights.canRead(vUser, vRoi, g)) {
          this.regionsOfInterest.add((String) vRoi.getProperty(DataModel.Properties.id));
        }
      }
    }
    
    Iterator<Vertex> itAois = vImage.getVertices(Direction.OUT, DataModel.Links.aoi).iterator();
    while (itAois.hasNext()) {
      OrientVertex vAoi = (OrientVertex) itAois.next();
      if (AccessUtils.isLatestVersion(vAoi)) {
        if (AccessRights.canRead(vUser, vAoi, g)) {
          this.anglesOfInterest.add((String) vAoi.getProperty(DataModel.Properties.id));
        }
      }
    }
    
    Iterator<Vertex> itPois = vImage.getVertices(Direction.OUT, DataModel.Links.poi).iterator();
    while (itPois.hasNext()) {
      OrientVertex vPoi = (OrientVertex) itPois.next();
      if (AccessUtils.isLatestVersion(vPoi)) {
        if (AccessRights.canRead(vUser, vPoi, g)) {
          this.pointsOfInterest.add((String) vPoi.getProperty(DataModel.Properties.id));
        }
      }
    }

    // Manage trails and associated measure standards, which are technically image-wide properties
    Iterator<Vertex> itTois = vImage.getVertices(Direction.OUT, DataModel.Links.toi).iterator();
    while (itTois.hasNext()) {
      OrientVertex vTrail = (OrientVertex) itTois.next();
      if (AccessRights.isLatestVersionAndHasRights(vUser, vTrail, Enums.AccessRights.READ, g)) {
        this.trailsOfInterest.add((String) vTrail.getProperty(DataModel.Properties.id));
        Iterator<Vertex> itTrailMeasurements = vTrail.getVertices(Direction.OUT, DataModel.Links.hasMeasurement).iterator();
        while (itTrailMeasurements.hasNext()) {
          OrientVertex trailMeasurement = (OrientVertex) itTrailMeasurements.next();
          if (AccessRights.isLatestVersionAndHasRights(vUser, trailMeasurement, Enums.AccessRights.READ, g)) {
            Iterator<Vertex> itStandards = trailMeasurement.getVertices(Direction.OUT, DataModel.Links.definedAsMeasureStandard).iterator();
            while (itStandards.hasNext()) {
              OrientVertex vStandard = (OrientVertex) itStandards.next();
              if (AccessRights.isLatestVersionAndHasRights(vUser, trailMeasurement, Enums.AccessRights.READ, g)) {
                this.measureStandards.add((String) vStandard.getProperty(DataModel.Properties.id));
              }
            }
          }
        }
      }
    }
    
    String url = (String) this.properties.get(DataModel.Properties.imageUrl);
    File imageFile = null;
    if (url != null) {
      try {
        URL imageUrl = new URL(url);
        imageFile = File.createTempFile("image", ".tmp");
        FileUtils.copyURLToFile(imageUrl, imageFile, 50, 200);
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
    
    this.userCanDelete = DeleteUtils.canUserDeleteSubGraph(vImage, vUser, g);
  }
  
  @Override
  public JSONObject toJSON() throws JSONException {
    JSONObject ret = super.toJSON();
    
    if (this.source != null) {
      ret.put("originalSource", this.source);
    }
    
    JSONArray jSpecimens = new JSONArray();
    Iterator<String> itSpecimens = this.specimensReferencingThisImage.iterator();
    while(itSpecimens.hasNext()) {
      jSpecimens.put(itSpecimens.next());
    }
    ret.put("specimens", jSpecimens);
    
    JSONArray jRois = new JSONArray();
    Iterator<String> itRois = this.regionsOfInterest.iterator();
    while (itRois.hasNext()) {
      jRois.put(itRois.next());
    }
    ret.put("rois", jRois);
    
    JSONArray jAois = new JSONArray();
    Iterator<String> itAois = this.anglesOfInterest.iterator();
    while (itAois.hasNext()) {
      jAois.put(itAois.next());
    }
    ret.put("aois", jAois);
    
    JSONArray jPois = new JSONArray();
    Iterator<String> itPois = this.pointsOfInterest.iterator();
    while (itPois.hasNext()) {
      jPois.put(itPois.next());
    }
    ret.put("pois", jPois);
    
    JSONArray jPaths = new JSONArray();
    Iterator<String> itPaths = this.trailsOfInterest.iterator();
    while (itPaths.hasNext()) {
      jPaths.put(itPaths.next());
    }
    ret.put("tois", jPaths);
    
    JSONArray jScales = new JSONArray();
    Iterator<String> itScales = this.measureStandards.iterator();
    while (itScales.hasNext()) {
      jScales.put(itScales.next());
    }
    ret.put("scales", jScales);
    
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
