package fr.recolnat.database.model;

/**
 * Created by Dmitri Voitsekhovitch (dvoitsekh@gmail.com) on 23/03/15.
 */
public class DataModel {
  public static class Classes {
    public static final String externBaseEntity = "ExternalEntity";
//      public static final String abstractEntity = "Entity";
      
//      public static final String leafEntity = "LeafEntity";
      public static final String relationship = "Relationship";
//      public static final String compositeEntity = "CompositeEntity";
      public static final String opinion = "Opinion";
//      public static final String socialEntity = "SocialEntity";
   

      // A Tag is the definition of a tag in the database. The TagAssociation is an intermediate node between the tag and the tagged object.
      // This distinction exists in order for each to be able to have different sharing and ownership status.
      // For example a Tag may be public, however a user may choose to keep private that he has associated the Tag with another object (for example if the user is uncertain).
      public static final String tag = "Tag";
      public static final String tagging = "TagAssociation";
      
      public static final String comment = "Comment";
//      public static final String transcription = "Transcription";
//      public static final String determination = "Determination";
//      public static final String vernacularName = "VernacularName";
//      public static final String coordinates = "GeographicCoordinates";
      public static final String message = "Message";
      public static final String regionOfInterest = "RegionOfInterest";
      public static final String pointOfInterest = "PointOfInterest";
      public static final String trailOfInterest = "TrailOfInterest";
      public static final String measurement = "Measurement";
      public static final String measureStandard = "MeasureStandard";
      public static final String image = "Image";
      
//      public static final String organisation = "Organisation";
      public static final String user = "User";
      public static final String group = "Group";
//      public static final String virtualTour = "VirtualTour";
//      public static final String herbarium = "Herbarium";
//      public static final String herbariumSheet = "Sheet";
//      public static final String curator = "Curator";
//      public static final String harvester = "Harvester";
      public static final String specimen = "Specimen";
//      public static final String harvest = "Harvest";
//      public static final String collection = "Collection";
//      public static final String sheetPart = "SheetPart";
//      public static final String mission = "Mission";
      public static final String discussion = "Discussion";
      public static final String set = "Set";
      public static final String setView = "SetView";
      public static final String study = "Study";
      
  }

  public static class Links {
    // isAbout && relatedEntities (generic links)
    // Unused ?
//    public static final String isLinkedTo = "isLinkedTo";
    //static String relatedEntities = "relatedEntitites";
    //static String isAbout = "isAbout";
    // containers && containedEntities (containment links)
    // set -> containsSubSet -> set
    public static final String containsSubSet = "containsSubSet";
    // set -> containsItem -> entity
    public static final String containsItem = "containsItem";
//    public static final String hasChild = "hasChild";
    // set -> hasView -> view
    public static final String hasView = "hasView";
    // view -> displays -> item in set
    public static final String displays = "displays";
    // When a node is forked for a user to work on it
    public static final String isForkedAs = "isForkedAs";
    // Management of version evolution for nodes
    public static final String hasNewerVersion = "hasNewerVersion";
    // other
    public static final String createdBy = "createdBy";
    public static final String hasOriginalSource = "hasOriginalSource";
    // specimen -> hasImage -> image
    public static final String hasImage = "hasImage";
    // user -> studies -> study
    public static final String studies = "studies";
    // study -> hasCoreSet -> set
    public static final String hasCoreSet = "hasCoreSet";
    // Unused ?
//    public static final String importedAs = "importedAs";
    public static final String roi = "hasRegionOfInterest";
    public static final String poi = "hasPointOfInterest";
    public static final String path = "hasTrailOfInterest";
    public static final String hasAnnotation = "hasAnnotation";
    public static final String hasMeasurement = "hasMeasurement";
    public static final String hasScalingData = "hasScalingData";
    public static final String hasAccessRights = "hasAccessRights";
    public static final String isMemberOfGroup = "isMemberOfGroup";
    // Tags
    public static final String hasDefinition = "hasDefinition";
    public static final String isTagged = "isTagged";
    // Discussions
    // entity -> hasDiscussion -> discussion
    public static final String hasDiscussion = "hasDiscussion";
    // discussion -> hasMessage -> message
    public static final String hasMessage = "hasMessage";
  }

  // Property 'id' is reserved by OrientDB. Use something else.
  public static class Properties {
    public static final String origin = "origin";
    public static final String type = "type";
    public static final String id = "uid";
    public static final String login = "login";
    public static final String content = "content";
    public static final String creationDate = "creationDate";
    public static final String createdInModule = "createdInModule";
    public static final String name = "name";
    public static final String coordX = "x";
    public static final String coordY = "y";
    public static final String coordZ = "z";
    public static final String role = "role";
    public static final String imageUrl = "url";
    public static final String thumbUrl = "thumbnail";
    public static final String recolnatId = "reColNatId";
    public static final String mnhnCatalogNumber = "catalogNum";
    public static final String vertices = "polygonVertices";
    public static final String text = "text";
    public static final String color = "color";
    public static final String symbol = "symbol";
    public static final String length = "length";
    public static final String unit = "unit";
    public static final String pxValue = "valueInPx";
    public static final String opacity = "opacity";
    public static final String letters = "letters";
    public static final String accessRights = "accessRights";
    public static final String creator = "creator";
    // Edge-only property which gives the id of an updated version (if it exists)
    public static final String nextVersionId = "nextVersionId";
  }
  
  public static class Globals {
    public static final String PUBLIC_GROUP_ID = "PUBLIC";
    public static final String ROOT_SET_ROLE = "SET_ROOT";
    public static final String SET_ROLE = "SET";
    public static final String DEFAULT_VIEW = "DEFAULT_VIEW";
    /**
     * @deprecated 
     */
    public static final String PUBLIC_USER_ID = "PUBLIC";
  }

  public static class Enums {
    //OpinionTypeEnum
    public static enum OpinionPolarity {
      POSITIVE (1),
      NEUTRAL (0),
      NEGATIVE (-1);

      private final int value;
      OpinionPolarity(int value) {
        this.value = value;
      }

      private int value() {return value;}
    }

    //ModuleIdEnum
    public static enum Modules {
      VIRTUAL_VISIT,
      COLLABORATORY,
      HERBONAUTS
    }

    // RelationshipTypeEnum
    public static enum Relationships {

    }

    // MeasurementTypeEnum
    public static enum Measurement {
      AREA (100),
      PERIMETER (101),
      LENGTH (102);

      private final int value;

      Measurement(int value) {this.value = value;}

      Measurement(Integer value) {this.value = value.intValue();}

      public int value() {return value;}

      public String toFrString() {
        switch(this.value) {
          case 100: return "Aire";
          case 101: return "Perimetre";
          case 102: return "Longueur";
          default: return "Inconnu";
        }
      }
    }

    public static enum AccessRights {
      NONE (0),
      READ (1),
      WRITE (2);

      private final int value;

      AccessRights(int value) {this.value = value;}

      public boolean canRead() {
        return this.value >= READ.value;
      }

      public boolean canWrite() {
        return this.value >= WRITE.value;
      }
      
      public int value() {
        return this.value;
      }
      
      public static AccessRights fromInt(int value) {
        switch(value) {
          case 0:
            return NONE;
          case 1:
            return READ;
          case 2: 
            return WRITE;
        }
        return NONE;
      }
    }
  }


}
