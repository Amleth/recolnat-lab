/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package org.dicen.recolnat.services.core.exceptions;

/**
 *
 * @author dmitri
 */
public class ResourceNotExistsException extends Exception {
  private String id = null;
  
  private ResourceNotExistsException() {
    
  }
  
  public ResourceNotExistsException(String id) {
    super();
    this.id = id;
  }

  @Override
  public String getMessage() {
    return "Resource does not exist " + this.id;
  }
  
  
}
