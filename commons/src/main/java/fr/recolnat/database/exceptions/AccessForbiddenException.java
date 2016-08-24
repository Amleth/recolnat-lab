/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package fr.recolnat.database.exceptions;

/**
 *
 * @author dmitri
 */
public class AccessForbiddenException extends Exception {
  private String userId = null;
  private String resourceId = null;
  
  private AccessForbiddenException() {
    
  }
  
  public AccessForbiddenException(String userId, String resourceId) {
    super();
    this.userId = userId;
    this.resourceId = resourceId;
  }

  @Override
  public String getMessage() {
    return "User " + this.userId + " is not allowed to access resource " + this.resourceId;
  }
  
  
}
