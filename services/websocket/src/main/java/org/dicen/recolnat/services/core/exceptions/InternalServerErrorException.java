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
public class InternalServerErrorException extends Exception {
  private String details = null;

  public InternalServerErrorException() {
  }
  
  public InternalServerErrorException(String details) {
    this.details = details;
  }

  @Override
  public String getMessage() {
    return details;
  }
  
  
}
