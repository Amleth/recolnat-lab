package fr.recolnat.database.model;

/**
 * Created by Dmitri Voitsekhovitch (dvoitsekh@gmail.com) on 23/03/15.
 */
public class DataModel {
  public static class Classes {
    public static class BaseTypes {
      public static final String externBaseEntity = "ScientificEntity";
      public static final String abstractEntity = "Entity";
    }

    public static class LevelOneHeirTypes {
      public static final String leafEntity = "LeafEntity";
      public static final String relationship = "Relationship";
      public static final String compositeEntity = "CompositeEntity";
      public static final String opinion = "Opinion";
      public static final String socialEntity = "SocialEntity";
    }

    public static class RelationshipTypes {
      public static final String tag = "Tag";
    }


    public static class LeafTypes {
      public static final String comment = "Comment";
      public static final String transcription = "Transcription";
      public static final String determination = "Determination";
      public static final String vernacularName = "VernacularName";
      public static final String coordinates = "GeographicCoordinates";
      public static final String message = "Message";
      public static final String regionOfInterest = "RegionOfInterest";
      public static final String pointOfInterest = "PointOfInterest";
      public static final String path = "Path";
      public static final String measurement = "Measurement";
      public static final String measureReference = "MeasureReference";
    }

    public static class CompositeTypes {
      public static final String organisation = "Organisation";
      public static final String user = "User";
      public static final String virtualTour = "VirtualTour";
      public static final String herbarium = "Herbarium";
      public static final String herbariumSheet = "Sheet";
      public static final String curator = "Curator";
      public static final String harvester = "Harvester";
      public static final String specimen = "BiologicalSpecimen";
      public static final String harvest = "Harvest";
      public static final String collection = "Collection";
      public static final String sheetPart = "SheetPart";
      public static final String mission = "Mission";
      public static final String discussion = "Discussion";
      public static final String workbench = "Workbench";
    }
  }

  public static class Links {
    // isAbout && relatedEntities (generic links)
    public static final String isLinkedTo = "isLinkedTo";
    //static String relatedEntities = "relatedEntitites";
    //static String isAbout = "isAbout";
    // containers && containedEntities (containment links)
    public static final String hasChild = "hasChild";
    // other
    public static final String createdBy = "createdBy";
    public static final String hasOriginalSource = "hasOriginalSource";
    public static final String importedAs = "importedAs";
    public static final String roi = "hasRegionOfInterest";
    public static final String poi = "hasPointOfInterest";
    public static final String path = "hasPath";
    public static final String hasAnnotation = "hasAnnotation";
    public static final String hasScalingData = "hasScalingData";
    public static final String hasAccessRights = "hasAccessRights";
    public static final String isMemberOfGroup = "isMemberOfGroup";
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
  }
  
  public static class Globals {
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
