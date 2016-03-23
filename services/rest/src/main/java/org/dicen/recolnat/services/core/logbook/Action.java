/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package org.dicen.recolnat.services.core.logbook;

import com.tinkerpop.blueprints.Direction;
import com.tinkerpop.blueprints.Edge;
import com.tinkerpop.blueprints.impls.orient.OrientGraph;
import com.tinkerpop.blueprints.impls.orient.OrientVertex;
import fr.recolnat.database.model.DataModel;
import fr.recolnat.database.utils.AccessRights;
import fr.recolnat.database.utils.AccessUtils;
import java.nio.file.AccessDeniedException;
import java.util.Date;
import javax.validation.constraints.NotNull;
import javax.xml.crypto.dsig.TransformException;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.dicen.recolnat.services.resources.UserProfileResource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author dmitri
 */
public class Action implements Comparable<Action> {
  // Two kinds of actions, one where the result is the same as the action (ex: granting rights), 
  // and another where it is not the same (ex: link annotations)
  // Ex: 'Bob' has been given 'AccessRights' on 'target'
  // Ex: 'Bob' has created 'Annotation' (data='NewAnnotationId') on target='SomeSheetId' 
  private String actor = null;
  private String action = null;
  private String target = null;
  private String data = null;
  
  // Date of the action
  private Long date = null;

  // Identified the action as an edge, to find it later if need be
  private String edgeId = null;

  private final static Logger log = LoggerFactory.getLogger(Action.class);

  private Action() {

  }

  public Action(OrientVertex v, Edge e, OrientVertex linkedVertex, OrientVertex user, OrientGraph g) throws AccessDeniedException, TransformException {
    if (AccessRights.getAccessRights(user, v, g).value() < DataModel.Enums.AccessRights.READ.value()) {
      throw new AccessDeniedException("User not allowed to access vertex");
    }
    String edgeClass = e.getLabel();
    this.edgeId = e.getProperty(DataModel.Properties.id);
    
    // Filter by edge class. Use only labels which can link an actor (i.e. user) to something else
    switch (edgeClass) {
      case DataModel.Links.createdBy:
        // v (user) has created linkedVertex (target)
        this.actor = v.getProperty(DataModel.Properties.id);
        this.action = "Creation";
        this.data = linkedVertex.getProperty(DataModel.Properties.id);
        this.date = e.getProperty(DataModel.Properties.creationDate);
        // Sort action by type, find target if necessary
        switch((String) linkedVertex.getProperty("@class")) {
          case DataModel.Classes.comment:
            this.action = "Comment";
            break;
            case DataModel.Classes.coordinates:
              this.action = "Coordinates";
            break;
            case DataModel.Classes.determination:
              this.action = "Determination";
            break;
            case DataModel.Classes.measureReference:
              this.action = "ScaleData";
              this.target = linkedVertex.getVertices(Direction.IN, DataModel.Links.hasScalingData).iterator().next().getProperty(DataModel.Properties.id);
            break;
            case DataModel.Classes.measurement:
              this.action = "Measurement";
            break;
            case DataModel.Classes.message:
              this.action = "Message";
            break;
            case DataModel.Classes.trailOfInterest:
              this.action = "Path";
              this.target = linkedVertex.getVertices(Direction.IN, DataModel.Links.path).iterator().next().getProperty(DataModel.Properties.id);
            break;
            case DataModel.Classes.pointOfInterest:
              this.action = "Point";
              this.target = linkedVertex.getVertices(Direction.IN, DataModel.Links.poi).iterator().next().getProperty(DataModel.Properties.id);
            break;
            case DataModel.Classes.regionOfInterest:
              this.action = "Region";
              this.target = linkedVertex.getVertices(Direction.IN, DataModel.Links.roi).iterator().next().getProperty(DataModel.Properties.id);
            break;
            case DataModel.Classes.transcription:
              this.action = "Transcription";
            break;
            case DataModel.Classes.vernacularName:
              this.action = "VernacularName";
            break;
        }
        break;
      case DataModel.Links.hasAccessRights:
        // v (user) has received access rights to linkedVertex
        this.actor = v.getProperty(DataModel.Properties.id);
        this.action = "Access";
        this.target = linkedVertex.getProperty(DataModel.Properties.id);
        this.date = e.getProperty(DataModel.Properties.creationDate);
        break;
      case DataModel.Links.hasAnnotation:
        // v has received annotation linkedVertex
        this.actor = linkedVertex.getVertices(Direction.IN, DataModel.Links.createdBy).iterator().next().getProperty(DataModel.Properties.id);
        this.action = "Annotation";
        this.target = v.getProperty(DataModel.Properties.id);
        this.data = linkedVertex.getProperty(DataModel.Properties.id);
        this.date = e.getProperty(DataModel.Properties.creationDate);
        break;
      case DataModel.Links.hasChild:
        // linkedvertex (target=collection) has received a v (data=child), user is given by edge
        this.actor = e.getProperty(DataModel.Properties.creator);
        this.action = "Child";
        this.target = linkedVertex.getProperty(DataModel.Properties.id);
        this.data = v.getProperty(DataModel.Properties.id);
        this.date = e.getProperty(DataModel.Properties.creationDate);
        break;
      case DataModel.Links.hasOriginalSource:
        // v has been marked as coming from external resource linkedVertex
        this.actor = e.getProperty(DataModel.Properties.creator);
        this.action = "OriginalSource";
        this.target = v.getProperty(DataModel.Properties.id);
        this.data = linkedVertex.getProperty(DataModel.Properties.id);
        this.date = e.getProperty(DataModel.Properties.creationDate);
        break;
      case DataModel.Links.hasScalingData:
        // v has been given a new scale linkedVertex by creator of linkedVertex
        this.actor = linkedVertex.getVertices(Direction.IN, DataModel.Links.createdBy).iterator().next().getProperty(DataModel.Properties.id);
        this.action = "ScaleData";
        this.target = v.getProperty(DataModel.Properties.id);
        this.data = linkedVertex.getProperty(DataModel.Properties.id);
        this.date = e.getProperty(DataModel.Properties.creationDate);
        break;
//      case DataModel.Links.importedAs:
//        // Not an action
//        break;
//      case DataModel.Links.isLinkedTo:
//        // v has been linked to linkedVertex
//        this.actor = e.getProperty(DataModel.Properties.creator);
//        this.action = "Link";
//        this.target = v.getProperty(DataModel.Properties.id);
//        this.data = linkedVertex.getProperty(DataModel.Properties.id);
//        this.date = e.getProperty(DataModel.Properties.creationDate);
//        break;
      case DataModel.Links.isMemberOfGroup:
        // v (user) has been made a member of linkedVertex (group)
        this.actor = v.getProperty(DataModel.Properties.id);
        this.action = "Membership";
        this.target = linkedVertex.getProperty(DataModel.Properties.id);
        this.date = e.getProperty(DataModel.Properties.creationDate);
        break;
      case DataModel.Links.path:
        // v (image) has been given a new trailOfInterest linkedVertex
        this.actor = AccessUtils.getCreatorId(linkedVertex, g);
        this.action = "Path";
        this.target = v.getProperty(DataModel.Properties.id);
        this.date = e.getProperty(DataModel.Properties.creationDate);
        this.data = linkedVertex.getProperty(DataModel.Properties.id);
        break;
      case DataModel.Links.poi:
        // v (image) has been given a new point of interest linkedVertex
        this.actor = AccessUtils.getCreatorId(linkedVertex, g);
        this.action = "Point";
        this.target = v.getProperty(DataModel.Properties.id);
        this.date = e.getProperty(DataModel.Properties.creationDate);
        this.data = linkedVertex.getProperty(DataModel.Properties.id);
        break;
      case DataModel.Links.roi:
        // v (image) has been given a new region of interest linkedVertex
        this.actor = AccessUtils.getCreatorId(linkedVertex, g);
        this.action = "Region";
        this.target = v.getProperty(DataModel.Properties.id);
        this.date = e.getProperty(DataModel.Properties.creationDate);
        this.data = linkedVertex.getProperty(DataModel.Properties.id);
        break;
      default:
        break;
    }

    if(this.date == null) {
      log.warn("Date not available for action around edge "  + edgeId + ". Generating default.");
      this.date = new Long(0);
    }
    if(this.actor == null || this.action == null || (this.target == null && this.data == null)) {
    if (log.isInfoEnabled()) {
      log.info("Class " + edgeClass + " cannot be cast into an Action");
    }
    throw new TransformException("Not an action");
    }
  }

  public boolean isInInterval(@NotNull Long begin, @NotNull Long end) {
    if (this.date == null) {
      log.error("Node " + this.target + " does not have a creation date!");
      // A node without a creation date is technically an error.
      return true;
    }
    return this.date >= begin && this.date < end;
  }

  public JSONObject toJSON() throws JSONException {
    JSONObject ret = new JSONObject();

    ret.put("user", this.actor);
    ret.put("action", this.action);
    if(this.target != null) {
    ret.put("target", this.target);
    }
    if(this.data != null) {
      ret.put("data", this.data);
    }
    ret.put("date", this.date);
    
    ret.put("edgeId", this.edgeId);

    return ret;
  }

  @Override
  public int compareTo(Action o) {
    return this.hashCode() - o.hashCode();
  }

  @Override
  public int hashCode() {
    int hash = 1;
    hash = hash * 17 + this.actor.hashCode();
    hash = hash * 31 + this.action.hashCode();
    if(this.target != null) {
    hash = hash * 13 + this.target.hashCode();
    }
    if (this.date != null) {
      hash = hash * 19 + this.date.hashCode();
    }
    if(this.data != null) {
      hash = hash*23 + this.data.hashCode();
    }
    return hash;
  }

  @Override
  public boolean equals(Object obj) {
    if (this == obj) {
      return true;
    }
    if (obj == null) {
      return false;
    }
    if (getClass() != obj.getClass()) {
      return false;
    }
    final Action other = (Action) obj;
    if ((this.action == null) ? (other.action != null) : !this.action.equals(other.action)) {
      return false;
    }
    if ((this.target == null) ? (other.target != null) : !this.target.equals(other.target)) {
      return false;
    }
    if ((this.actor == null) ? (other.actor != null) : !this.actor.equals(other.actor)) {
      return false;
    }
    if ((this.data == null) ? (other.data != null) : !this.data.equals(other.data)) {
      return false;
    }
    return !(this.date != other.date && (this.date == null || !this.date.equals(other.date)));
  }
}
