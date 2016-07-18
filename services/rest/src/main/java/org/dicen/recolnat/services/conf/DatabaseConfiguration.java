package org.dicen.recolnat.services.conf;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.dropwizard.Configuration;
import org.hibernate.validator.constraints.NotEmpty;

/**
 * Created by Dmitri Voitsekhovitch (dvoitsekh@gmail.com) on 23/07/15.
 */
public class DatabaseConfiguration extends Configuration {
  @NotEmpty
  private String host;

  @NotEmpty
  private Integer port;

  @NotEmpty
  private String dbName;

  @NotEmpty
  private String dbUser;

  @NotEmpty
  private String password;
  
  @NotEmpty 
  private Integer minConnectorPoolSize;
  
  @NotEmpty
  private Integer maxConnectorPoolSize;

  @JsonProperty
  public String getHost() {
    return host;
  }

  @JsonProperty
  public void setHost(String host) {
    this.host = host;
  }

  @JsonProperty
  public Integer getPort() {
    return port;
  }

  @JsonProperty
  public void setPort(Integer port) {
    this.port = port;
  }

  @JsonProperty
  public String getDbName() {
    return dbName;
  }

  @JsonProperty
  public void setDbName(String dbName) {
    this.dbName = dbName;
  }

  @JsonProperty
  public String getDbUser() {
    return dbUser;
  }

  @JsonProperty
  public void setDbUser(String dbUser) {
    this.dbUser = dbUser;
  }

  @JsonProperty
  public String getPassword() {
    return password;
  }

  @JsonProperty
  public void setPassword(String password) {
    this.password = password;
  }
  
  @JsonProperty
  public Integer getMinConnectorPoolSize() {
    return minConnectorPoolSize;
  }
  
  @JsonProperty
  public Integer setMinConnectorPoolSize() {
    return minConnectorPoolSize;
  }
  
  @JsonProperty
  public Integer getMaxConnectorPoolSize() {
    return maxConnectorPoolSize;
  }
  
  @JsonProperty
  public Integer setMaxConnectorPoolSize() {
    return maxConnectorPoolSize;
  }
}
