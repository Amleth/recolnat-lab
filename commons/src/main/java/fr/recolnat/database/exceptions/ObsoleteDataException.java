/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package fr.recolnat.database.exceptions;

import java.util.HashSet;
import java.util.Set;
import org.codehaus.jettison.json.JSONArray;

/**
 *
 * @author dmitri
 */
public class ObsoleteDataException extends Exception {
  private Set<String> obsoleteIds = new HashSet<>();
  
  private ObsoleteDataException() {
    
  }
  
  public ObsoleteDataException(String... ids) {
    for(String id: ids) {
      obsoleteIds.add(id);
    }
  }
  
  public JSONArray getObsoleteIdsAsJSON() {
    JSONArray ret = new JSONArray();
    for(String id: obsoleteIds) {
      ret.put(id);
    }
    
    return ret;
  }
  
  
}
