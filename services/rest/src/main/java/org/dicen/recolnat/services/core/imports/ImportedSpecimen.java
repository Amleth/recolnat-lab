/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package org.dicen.recolnat.services.core.imports;

/**
 *
 * @author dmitri
 */
public class ImportedSpecimen {
  public String imageUrl;
  public String originalSourceUrl;
  public String recolnatId;
  public String catalogReferenceNumber;
  
  public ImportedSpecimen(String imageUrl, String sourceUrl, String recolnatId, String catalogRef) {
    this.imageUrl = imageUrl;
    this.originalSourceUrl = sourceUrl;
    this.recolnatId = recolnatId;
    this.catalogReferenceNumber = catalogRef;
  }
}
