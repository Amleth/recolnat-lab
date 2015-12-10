package org.dicen.recolnat.services.conf;


import com.fasterxml.jackson.annotation.JsonProperty;
import io.dropwizard.Configuration;
import org.hibernate.validator.constraints.NotEmpty;

/**
 * Created by hector on 31/07/15.
 */
public class TestConfiguration extends Configuration {
    @NotEmpty
    private String userUUID;
    
    @NotEmpty
    private String testTGT;

    @NotEmpty
    private String defaultWorkbench;
    
    @NotEmpty
    private String specialSessionID;

    @JsonProperty
    public String getUserUUID() {
        return this.userUUID;
    }

    @JsonProperty
    public void setUserUUID(String userUUID) {
        this.userUUID = userUUID;
    }

    @JsonProperty
    public String getDefaultWorkbench() {
        return defaultWorkbench;
    }

    @JsonProperty
    public void setDefaultWorkbench(String defaultWorkbench) {
        this.defaultWorkbench = defaultWorkbench;
    }

    @JsonProperty
    public String getSpecialSessionID() {
        return specialSessionID;
    }

    @JsonProperty
    public void setSpecialSessionID(String specialSessionID) {
        this.specialSessionID = specialSessionID;
    }

    @JsonProperty
  public String getTestTGT() {
    return testTGT;
  }

  @JsonProperty
  public void setTestTGT(String testTGT) {
    this.testTGT = testTGT;
  }
    
    
    
}
