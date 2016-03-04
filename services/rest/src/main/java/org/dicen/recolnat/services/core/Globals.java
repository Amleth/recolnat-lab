package org.dicen.recolnat.services.core;

/**
 * Created by Dmitri Voitsekhovitch (dvoitsekh@gmail.com) on 21/05/15.
 */
public class Globals {
  public static final String OK = "{\"response\": \"OK\"}";

  public class ExchangeModel {
    public class ImageEditorProperties {
      public class AnnotationTypes {
        public static final String transcription = "transcribe";
        public static final String measurement = "measure";
        public static final String note = "note";
      }
    }
    public class ObjectProperties {
      public static final String id = "id";
      public static final String type = "type";
      public static final String creationDate = "date";
      public static final String text = "text";
      public static final String name = "name";
      public static final String creator = "creator";
      public static final String x = "x";
      public static final String y = "y";
      public static final String shape = "shape";
      public static final String color = "color";
      public static final String length = "length";
      public static final String vertices = "vertices";
      public static final String letters = "letters";
      public static final String userCanDelete = "deletable";
    }
  }
}
