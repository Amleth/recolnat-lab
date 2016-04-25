package org.dicen.recolnat.services;

import io.dropwizard.Application;
import io.dropwizard.setup.Bootstrap;
import io.dropwizard.setup.Environment;
import org.dicen.recolnat.services.core.DatabaseAccess;
import org.dicen.recolnat.services.resources.AuthenticationResource;
import org.dicen.recolnat.services.resources.DatabaseResource;
import org.dicen.recolnat.services.resources.ImageEditorRESTResource;
import org.dicen.recolnat.services.resources.StudyResource;
import org.eclipse.jetty.servlets.CrossOriginFilter;

import javax.servlet.DispatcherType;
import javax.servlet.FilterRegistration;
import java.util.EnumSet;
import org.dicen.recolnat.services.resources.SetResource;
import org.dicen.recolnat.services.resources.UserProfileResource;

/**
 * Created by Dmitri Voitsekhovitch (dvoitsekh@gmail.com) on 24/04/15.
 */
public class VirtualWorkbenchRESTService extends Application<VirtualWorkbenchRESTServiceConfiguration> {

  public static void main(String[] args) throws Exception {
    VirtualWorkbenchRESTService app = new VirtualWorkbenchRESTService();
    app.run(args);
  }

  @Override
  public java.lang.String getName() {
    return "virtual-workbench-rest-service";
  }

  @Override
  public void initialize(Bootstrap<VirtualWorkbenchRESTServiceConfiguration> bootstrap) {
//    super.initialize(bootstrap);
  }

  @Override
  public void run(VirtualWorkbenchRESTServiceConfiguration configuration, Environment environment) throws Exception {
    DatabaseAccess.configure(configuration.getDbConf());
    DatabaseAccess.configure(configuration.getTest());
    final StudyResource rStudy = new StudyResource();
    final ImageEditorRESTResource editor = new ImageEditorRESTResource();
    final AuthenticationResource test = new AuthenticationResource();
    final DatabaseResource db = new DatabaseResource();
    final UserProfileResource profile = new UserProfileResource();
    final SetResource rSet = new SetResource();

    configureCors(environment);

    environment.jersey().register(rSet);
    environment.jersey().register(rStudy);
    environment.jersey().register(editor);
    environment.jersey().register(test);
    environment.jersey().register(db);
    environment.jersey().register(profile);
  }

  private void configureCors(Environment environment) {
    FilterRegistration.Dynamic filter = environment.servlets().addFilter("CORS", CrossOriginFilter.class);
    filter.addMappingForUrlPatterns(EnumSet.allOf(DispatcherType.class), true, "/*");
    filter.setInitParameter(CrossOriginFilter.ALLOWED_METHODS_PARAM, "GET,PUT,POST,DELETE,OPTIONS");
    filter.setInitParameter(CrossOriginFilter.ALLOWED_ORIGINS_PARAM, "http://localhost:8089");
    filter.setInitParameter(CrossOriginFilter.ACCESS_CONTROL_ALLOW_ORIGIN_HEADER, "http://localhost:8089");
    filter.setInitParameter("allowedHeaders", "Content-Type,Authorization,X-Requested-With,Content-Length,Accept,Origin");
    filter.setInitParameter("allowCredentials", "true");
  }
}
