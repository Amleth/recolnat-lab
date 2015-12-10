package fr.recolnat.database.exceptions;

/**
 * Created by Dmitri Voitsekhovitch (dvoitsekh@gmail.com) on 26/03/15.
 */
public class AlreadyExistsException extends Exception {
  private String [] conflictingFieldNames;

  public AlreadyExistsException(String[] conflictingFields) {
    this.conflictingFieldNames = conflictingFields;
  }

  public String[] getConflictingNames() {
    return conflictingFieldNames;
  }

  public boolean conflicts (String fieldName) {
    for(String field : conflictingFieldNames) {
      if(field.equals(fieldName)) {
        return true;
      }
    }
    return false;
  }
}
