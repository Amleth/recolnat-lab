package org.dicen.recolnat.services.core.image;

import com.drew.imaging.ImageMetadataReader;
import com.drew.imaging.ImageProcessingException;
import com.drew.metadata.Directory;
import com.drew.metadata.Metadata;
import com.drew.metadata.Tag;
import com.tinkerpop.blueprints.Direction;
import com.tinkerpop.blueprints.Vertex;
import com.tinkerpop.blueprints.impls.orient.OrientGraph;
import com.tinkerpop.blueprints.impls.orient.OrientVertex;
import fr.recolnat.database.model.DataModel;
import fr.recolnat.database.utils.AccessRights;
import fr.recolnat.database.utils.AccessUtils;
import org.apache.commons.io.FileUtils;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response;
import java.io.File;
import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;
import java.nio.file.AccessDeniedException;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

/**
 * Created by Dmitri Voitsekhovitch (dvoitsekh@gmail.com) on 22/05/15.
 */
public class RecolnatImage {

  private String url = null;
  private String thumburl = null;
  private String id = null;
  private String name = null;
  private List<RegionOfInterest> regionsOfInterest = new ArrayList<RegionOfInterest>();
  private List<PointOfInterest> pointsOfInterest = new ArrayList<PointOfInterest>();
  private List<Path> paths = new ArrayList<Path>();
  private List<ScalingData> scalingDataRefs = new ArrayList<ScalingData>();
  private Metadata rawImageMetadata = null;
  private OriginalSourceItem source = null;

  private final static Logger log = LoggerFactory.getLogger(RecolnatImage.class);

  public RecolnatImage(String id, OrientVertex user, OrientGraph g) throws AccessDeniedException {
    this.id = id;
    OrientVertex vImage = (OrientVertex) AccessUtils.getNodeById(id, g);
    if (vImage == null) {
      log.warn("Client requested image that does not exist " + id);
      return;
    }
    this.url = (String) vImage.getProperty(DataModel.Properties.imageUrl);
    this.thumburl = (String) vImage.getProperty(DataModel.Properties.thumbUrl);
    this.name = (String) vImage.getProperty(DataModel.Properties.name);

    if (AccessRights.getAccessRights(user, vImage, g) == DataModel.Enums.AccessRights.NONE) {
      throw new AccessDeniedException(id);
    }
    
    Iterator<Vertex> itOriginalSource = vImage.getVertices(Direction.OUT, DataModel.Links.hasOriginalSource).iterator();
    if(itOriginalSource.hasNext()) {
      OrientVertex vOriginalSource = (OrientVertex) itOriginalSource.next();
      source = new OriginalSourceItem(vOriginalSource, g);
    }

    Iterator<Vertex> itRois = vImage.getVertices(Direction.OUT, DataModel.Links.roi).iterator();
    while (itRois.hasNext()) {
      OrientVertex vRoi = (OrientVertex) itRois.next();
      try {
        RegionOfInterest roi = new RegionOfInterest(vRoi, user, g);
        this.regionsOfInterest.add(roi);
      } catch (AccessDeniedException e) {
        // Do nothing
      }
    }

    Iterator<Vertex> itPois = vImage.getVertices(Direction.OUT, DataModel.Links.poi).iterator();
    while (itPois.hasNext()) {
      OrientVertex vPoi = (OrientVertex) itPois.next();
      try {
        PointOfInterest poi = new PointOfInterest(vPoi, user, g);
        this.pointsOfInterest.add(poi);
      } catch (AccessDeniedException e) {
        // Do nothing
      }
    }

    Iterator<Vertex> itPaths = vImage.getVertices(Direction.OUT, DataModel.Links.path).iterator();
    while (itPaths.hasNext()) {
      OrientVertex vPath = (OrientVertex) itPaths.next();
      try {
        Path path = new Path(vPath, user, g);
        this.paths.add(path);
      } catch (AccessDeniedException e) {
        // Do nothing
      }
    }

    Iterator<Vertex> itScales = vImage.getVertices(Direction.OUT, DataModel.Links.hasScalingData).iterator();
    while (itScales.hasNext()) {
      OrientVertex vScale = (OrientVertex) itScales.next();
      try {
        ScalingData scale = new ScalingData(vScale, user, g);
        this.scalingDataRefs.add(scale);
      } catch (AccessDeniedException e) {
        // Do nothing
      }
    }

    if (this.url != null) {
      try {
        URL imageUrl = new URL(this.url);
        File imageFile = File.createTempFile("image", ".tmp");
        FileUtils.copyURLToFile(imageUrl, imageFile);
        Metadata imageMetadata = ImageMetadataReader.readMetadata(imageFile);
        this.rawImageMetadata = imageMetadata;
      } catch (MalformedURLException e) {
        log.warn("EXIF failed, URL malformed " + this.url, e);
      } catch (IOException e) {
        log.error("EXIF failed, could not create temporary file", e);
      } catch (ImageProcessingException e) {
        log.warn("EXIF failed, could not read metadata " + this.url, e);
      }
    }
  }

  public JSONObject toJSON() throws JSONException {
    JSONObject ret = new JSONObject();
    ret.put("name", this.name);
    ret.put("id", this.id);
    ret.put("url", this.url);
    
    if(this.source != null) {
      ret.put("linkToSource", this.source.toJSON());
    }

    JSONArray jRois = new JSONArray();
    Iterator<RegionOfInterest> itRois = this.regionsOfInterest.iterator();
    while (itRois.hasNext()) {
      jRois.put(itRois.next().toJSON());
    }
    ret.put("rois", jRois);

    JSONArray jPois = new JSONArray();
    Iterator<PointOfInterest> itPois = this.pointsOfInterest.iterator();
    while (itPois.hasNext()) {
      jPois.put(itPois.next().toJSON());
    }
    ret.put("pois", jPois);

    JSONArray jPaths = new JSONArray();
    Iterator<Path> itPaths = this.paths.iterator();
    while (itPaths.hasNext()) {
      jPaths.put(itPaths.next().toJSON());
    }
    ret.put("paths", jPaths);

    JSONArray jScales = new JSONArray();
    Iterator<ScalingData> itScales = this.scalingDataRefs.iterator();
    while (itScales.hasNext()) {
      jScales.put(itScales.next().toJSON());
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
      ret.put("metadata", jMetadata);
    }
    
    if(this.thumburl != null) {
      ret.put("thumburl", this.thumburl);
    }
    
    if (log.isTraceEnabled()) {
      log.trace(ret.toString());
    }

    return ret;
  }
}
