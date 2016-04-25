package org.dicen.recolnat.services;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.dropwizard.Configuration;
import org.dicen.recolnat.services.conf.DatabaseConfiguration;
import org.dicen.recolnat.services.conf.TestConfiguration;

import javax.validation.constraints.NotNull;

/**
 * Created by Dmitri Voitsekhovitch (dvoitsekh@gmail.com) on 24/04/15.
 */
public class VirtualWorkbenchRESTServiceConfiguration extends Configuration {
  @NotNull
  private DatabaseConfiguration dbConf;

  @NotNull
  private TestConfiguration test;

  @JsonProperty
  public DatabaseConfiguration getDbConf() {
    return dbConf;
  }

  @JsonProperty
  public void setDbConf(DatabaseConfiguration dbConf) {
    this.dbConf = dbConf;
  }

  @JsonProperty
  public TestConfiguration getTest() {
    return test;
  }

  @JsonProperty
  public void setTest(TestConfiguration test) {
    this.test = test;
  }
}
