package fr.recolnat.database.utils;

import com.tinkerpop.blueprints.impls.orient.OrientBaseGraph;
import com.tinkerpop.blueprints.impls.orient.OrientVertex;
import fr.recolnat.database.RightsManagementDatabase;
import fr.recolnat.database.model.DataModel;

/**
 * Created by Dmitri Voitsekhovitch (dvoitsekh@gmail.com) on 10/04/15.
 */
public class DatabaseUtils {

  public static void createTestWorkbench(OrientVertex user, OrientBaseGraph g, RightsManagementDatabase rightsDb) {
//    OrientVertex user = CreatorUtils.createUser("Robert LeRouge", g);
      String userId = user.getProperty(DataModel.Properties.id);
      OrientVertex rootSet = (OrientVertex) AccessUtils.getCoreSet(user, g);

      OrientVertex sampleSet = CreatorUtils.createSet("Set exemple", DataModel.Globals.SET_ROLE, g);
      OrientVertex defaultView = CreatorUtils.createView("Vue par défaut", DataModel.Globals.DEFAULT_VIEW, g);
      UpdateUtils.link(sampleSet, defaultView, DataModel.Links.hasView, userId, g);

//      OrientVertex sampleStudy = CreatorUtils.createStudy("Étude exemple", user, g);
//      UpdateUtils.link(sampleStudy, sampleSet, DataModel.Links.hasCoreSet, userId, g);

      OrientVertex scirpusSpecimen = CreatorUtils.createSpecimen("Spécimen 1", g);
      OrientVertex scirpusImage = CreatorUtils.createImage(CreatorUtils.generateName("Image "), "http://mediaphoto.mnhn.fr/media/1447490476437bXB6YuApRzu492vJ", 3398, 5072, "http://mediaphoto.mnhn.fr/media/1447490476437bXB6YuApRzu492vJ", g);
      UpdateUtils.link(scirpusSpecimen, scirpusImage, DataModel.Links.hasImage, userId, g);

      OrientVertex festucaSpecimen = CreatorUtils.createSpecimen("Spécimen 2", g);
      OrientVertex festucaImage = CreatorUtils.createImage(CreatorUtils.generateName("Image "), "http://mediaphoto.mnhn.fr/media/1447454498797Bl43ewSCZVRde1xP", 3586, 5132, "http://mediaphoto.mnhn.fr/media/1447454498797Bl43ewSCZVRde1xP", g);
      UpdateUtils.link(festucaSpecimen, festucaImage, DataModel.Links.hasImage, userId, g);

//    OrientVertex ophiloSpecimen = CreatorUtils.createSpecimen("Spécimen 3", g);
      OrientVertex ophiloImage = CreatorUtils.createImage("Wikipedia festuca cinerea", "https://upload.wikimedia.org/wikipedia/commons/8/8d/Festuca_cinerea_a1.jpg", 1280, 960, "https://upload.wikimedia.org/wikipedia/commons/8/8d/Festuca_cinerea_a1.jpg", g);

//      OrientVertex scripusSheet = CreatorUtils.createHerbariumSheet("Scirpus michelianus L.", "http://mediaphoto.mnhn.fr/media/1447490476437bXB6YuApRzu492vJ", "N/A", "N/A", g);
//      OrientVertex festucaSheet = CreatorUtils.createHerbariumSheet("Festuca halleri All.", "http://mediaphoto.mnhn.fr/media/1447454498797Bl43ewSCZVRde1xP", "N/A", "N/A", g);
//      OrientVertex ophiloSheet = CreatorUtils.createHerbariumSheet("Ophioglossum vulgatum L.", "http://mediaphoto.mnhn.fr/media/1447469332090PytvVT4rdo6PZIIO", "N/A", "N/A", g);
      UpdateUtils.addSubsetToSet(rootSet, sampleSet, user, g);
      UpdateUtils.addItemToSet(scirpusSpecimen, sampleSet, user, g);
      UpdateUtils.addItemToSet(festucaSpecimen, sampleSet, user, g);
      UpdateUtils.addItemToSet(ophiloImage, sampleSet, user, g);
      
      // Place images
      UpdateUtils.showItemInView(-1000, -1000, scirpusImage, defaultView, user, g);
      UpdateUtils.showItemInView(5000, -1000, festucaImage, defaultView, user, g);
      UpdateUtils.showItemInView(2000, 6000, ophiloImage, defaultView, user, g);

//      UpdateUtils.addCreator(sampleStudy, user, g);
      UpdateUtils.addCreator(sampleSet, user, g, rightsDb);
      UpdateUtils.addCreator(defaultView, user, g, rightsDb);
      UpdateUtils.addCreator(scirpusSpecimen, user, g, rightsDb);
      UpdateUtils.addCreator(festucaSpecimen, user, g, rightsDb);
      UpdateUtils.addCreator(scirpusImage, user, g, rightsDb);
      UpdateUtils.addCreator(festucaImage, user, g, rightsDb);
      UpdateUtils.addCreator(ophiloImage, user, g, rightsDb);
      
//      AccessRights.grantAccessRights(user, sampleStudy, DataModel.Enums.AccessRights.WRITE, g);
      AccessRights.grantAccessRights(user, sampleSet, DataModel.Enums.AccessRights.WRITE, rightsDb);
      AccessRights.grantAccessRights(user, defaultView, DataModel.Enums.AccessRights.WRITE, rightsDb);
      AccessRights.grantAccessRights(user, scirpusSpecimen, DataModel.Enums.AccessRights.WRITE, rightsDb);
      AccessRights.grantAccessRights(user, festucaSpecimen, DataModel.Enums.AccessRights.WRITE, rightsDb);
      AccessRights.grantAccessRights(user, ophiloImage, DataModel.Enums.AccessRights.WRITE, rightsDb);
      AccessRights.grantAccessRights(user, festucaImage, DataModel.Enums.AccessRights.WRITE, rightsDb);
      AccessRights.grantAccessRights(user, scirpusImage, DataModel.Enums.AccessRights.WRITE, rightsDb);
  }
}
