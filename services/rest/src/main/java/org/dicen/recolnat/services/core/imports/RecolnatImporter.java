/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package org.dicen.recolnat.services.core.imports;

import java.util.logging.Level;
import java.util.logging.Logger;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;

/**
 *
 * @author dmitri
 */
public class RecolnatImporter {
  private static class RecolnatKeys {
  public static String occurrence = "occurrenceid";
  public static String catalog = "catalognumber";
  public static String creationDate = "created";
  public static String modificationDate = "modified";
  public static String basisOfRecord = "basisofrecord";
  public static String collection = "collectioncode";
  public static String institution = "institutioncode";
  public static String hasCoordinates = "hascoordinates";
  public static String hasMedia = "hasmedia";
  public static String dwcaid = "dwcaid";
  public static String source = "sourcefield";
}
//  public static ImportedSpecimen read(JSONObject data) {
//    try {
//      String catalogRef = data.getString(RecolnatKeys.catalog);
//      String originalSource = null;
//      JSONArray links = data.getJSONArray("links");
//      for(int i = 0; i < links.length(); ++i) {
//        JSONObject link = links.getJSONObject(i);
//        String name = link.getString("rel");
//        if(name.equals("self")) {
//          
//        }
//        else if(name.equals("images")) {
//          
//        }
//        else if(name.equals("determinations")) {
//          
//        }
//      }
//    } catch (JSONException ex) {
//      return null;
//    }
//  }
}
