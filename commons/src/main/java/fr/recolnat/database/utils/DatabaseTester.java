package fr.recolnat.database.utils;

import com.tinkerpop.blueprints.impls.orient.OrientGraph;
import com.tinkerpop.blueprints.impls.orient.OrientVertex;
import fr.recolnat.database.model.DataModel;
import fr.recolnat.database.utils.CreatorUtils;
import fr.recolnat.database.utils.UpdateUtils;

import java.util.Date;
import java.util.UUID;

/**
 * Created by Dmitri Voitsekhovitch (dvoitsekh@gmail.com) on 10/04/15.
 */
public class DatabaseTester {
  public static void createTestWorkbench(OrientGraph g) {
    OrientVertex user = CreatorUtils.createUser("Robert LeRouge", g);

    OrientVertex rootWb = CreatorUtils.createWorkbenchContent("Espaces de travail", "workbench-root", g);
    OrientVertex springWb = CreatorUtils.createWorkbenchContent("collection printemps", "workbench", g);
    OrientVertex summerWb = CreatorUtils.createWorkbenchContent("collection été", "workbench", g);
    OrientVertex aprilWb = CreatorUtils.createWorkbenchContent("poissons d'avril", "workbench", g);
    OrientVertex mayWb = CreatorUtils.createWorkbenchContent("poissons de mai", "workbench", g);
    OrientVertex otherWb = CreatorUtils.createWorkbenchContent("les autres poissons dont je ne savais pas quoi faire", "workbench", g);
    OrientVertex poetry1Wb = CreatorUtils.createWorkbenchContent("les sanglots longs des violons de l'automne", "workbench", g);
    OrientVertex poetry2Wb = CreatorUtils.createWorkbenchContent("blessent mon coeur d'une langueur monotone", "workbench", g);
    OrientVertex bugTestWb = CreatorUtils.createWorkbenchContent("test visionneuse avec images à problème", "workbench", g);
    OrientVertex batchBluestone2Wb = CreatorUtils.createWorkbenchContent("Batch Bluestone 2", "workbench", g);

    OrientVertex daGagnepSheet = CreatorUtils.createHerbariumSheet("Ficus da Gagnep", "http://dsiphoto.mnhn.fr/sonnera2/LAPI/scanR/R20130424/P06875744.jpg", "B916E509EC6A462AB242FC65017213D6", "P06875744", g);
    OrientVertex oligodonSheet = CreatorUtils.createHerbariumSheet("Ficus oligodon", "http://sonneratphoto.mnhn.fr/2012/11/13/1/P06879807.jpg", "12F406B96C424911A429E52EFCDE8600", "P06879807", g);
    OrientVertex capreSheet = CreatorUtils.createHerbariumSheet("Ficus capreifolia", "http://sonneratphoto.mnhn.fr/2012/11/12/1/P06760858.jpg", "769C54AF12D9485092E0FED190648980", "P06760858", g);
    OrientVertex leucanSheet = CreatorUtils.createHerbariumSheet("Ficus leucantatoma", "http://sonneratphoto.mnhn.fr/2012/11/12/4/P06762660.jpg", "F635DC08762949FDAB4D8568F19F87C2", "P06762660", g);
    OrientVertex caricaSheet = CreatorUtils.createHerbariumSheet("Ficus carica", "http://sonneratphoto.mnhn.fr/2012/11/08/7/P06862730.jpg", "7F5F0DF3549C44CCB219387EFBA74870", "P06862730", g);
    OrientVertex bugNa1015Sheet = CreatorUtils.createHerbariumSheet("Afrique du Nord n°1015", "http://51.254.101.229/recolnat-images/MPU002487_b.jpg", "No ReColNatId", "MPU002487_b", g);
    OrientVertex bugCyperLepidoSheet = CreatorUtils.createHerbariumSheet("Cyperaceae Lepidosperma", "http://51.254.101.229/recolnat-images/MPU026713.jpg", "No ReColNatId", "MPU026713", g);
    OrientVertex bugCyperUnreadSheet = CreatorUtils.createHerbariumSheet("Cyperaceae -Illisible-", "http://51.254.101.229/recolnat-images/MPU026715.jpg", "No ReColNatId", "MPU026715", g);
    OrientVertex bugIsotypusSheet = CreatorUtils.createHerbariumSheet("Isotypus Puccinellia distans", "http://51.254.101.229/recolnat-images/MPU028363.jpg", "No ReColNatId", "MPU028363", g);
    OrientVertex bugHeliauSheet = CreatorUtils.createHerbariumSheet("Heliauthemum", "http://51.254.101.229/recolnat-images/MPU028394.jpg", "No ReColNatId", "MPU028394", g);
    OrientVertex bugHeliau2Sheet = CreatorUtils.createHerbariumSheet("Heliauthemum (l'autre)", "http://51.254.101.229/recolnat-images/MPU028399.jpg", "No ReColNatId", "MPU028399", g);

    OrientVertex batch2142424Sheet = CreatorUtils.createHerbariumSheet("CLF142424", "http://51.254.101.229/recolnat-images/CLF142424.jpg", "No ReColNatId", "CLF142424", g);
    OrientVertex batch2142429Sheet = CreatorUtils.createHerbariumSheet("CLF142429", "http://51.254.101.229/recolnat-images/CLF142429.jpg", "No ReColNatId", "CLF142429", g);
    OrientVertex batch2142480Sheet = CreatorUtils.createHerbariumSheet("CLF142480", "http://51.254.101.229/recolnat-images/CLF142480.jpg", "No ReColNatId", "CLF142480", g);
    OrientVertex batch2142761Sheet = CreatorUtils.createHerbariumSheet("CLF142761", "http://51.254.101.229/recolnat-images/CLF142761.jpg", "No ReColNatId", "CLF142761", g);
    OrientVertex batch2142771Sheet = CreatorUtils.createHerbariumSheet("CLF142771", "http://51.254.101.229/recolnat-images/CLF142771.jpg", "No ReColNatId", "CLF142771", g);
    OrientVertex batch2142775Sheet = CreatorUtils.createHerbariumSheet("CLF142775", "http://51.254.101.229/recolnat-images/CLF142775.jpg", "No ReColNatId", "CLF142775", g);
    OrientVertex batch2142853Sheet = CreatorUtils.createHerbariumSheet("CLF142853", "http://51.254.101.229/recolnat-images/CLF142853.jpg", "No ReColNatId", "CLF142853", g);
    OrientVertex batch2142900Sheet = CreatorUtils.createHerbariumSheet("CLF142900", "http://51.254.101.229/recolnat-images/CLF142900.jpg", "No ReColNatId", "CLF142900", g);
    OrientVertex batch2142965Sheet = CreatorUtils.createHerbariumSheet("CLF142965", "http://51.254.101.229/recolnat-images/CLF142965.jpg", "No ReColNatId", "CLF142965", g);
    OrientVertex batch2142993Sheet = CreatorUtils.createHerbariumSheet("CLF142993", "http://51.254.101.229/recolnat-images/CLF142993.jpg", "No ReColNatId", "CLF142993", g);

    UpdateUtils.addWorkbenchToWorkbench(rootWb, springWb, user, g);
    UpdateUtils.addWorkbenchToWorkbench(rootWb, summerWb, user, g);
    UpdateUtils.addWorkbenchToWorkbench(rootWb, bugTestWb, user, g);
    UpdateUtils.addWorkbenchToWorkbench(rootWb, batchBluestone2Wb, user, g);

    UpdateUtils.addWorkbenchToWorkbench(springWb, aprilWb, user, g);
    UpdateUtils.addWorkbenchToWorkbench(springWb, mayWb, user, g);
    UpdateUtils.addWorkbenchToWorkbench(springWb, otherWb, user, g);
    UpdateUtils.addWorkbenchToWorkbench(springWb, daGagnepSheet, user, g);
    UpdateUtils.addWorkbenchToWorkbench(springWb, caricaSheet, user, g);

    UpdateUtils.addWorkbenchToWorkbench(summerWb, poetry1Wb, user, g);
    UpdateUtils.addWorkbenchToWorkbench(summerWb, poetry2Wb, user, g);
    UpdateUtils.addWorkbenchToWorkbench(summerWb, mayWb, user, g);
    UpdateUtils.addWorkbenchToWorkbench(summerWb, oligodonSheet, user, g);
    UpdateUtils.addWorkbenchToWorkbench(summerWb, caricaSheet, user, g);

    UpdateUtils.addWorkbenchToWorkbench(aprilWb, springWb, user, g);
    UpdateUtils.addWorkbenchToWorkbench(caricaSheet, poetry1Wb, user, g);

    UpdateUtils.addWorkbenchToWorkbench(mayWb, capreSheet, user, g);

    UpdateUtils.addWorkbenchToWorkbench(otherWb, capreSheet, user, g);
    UpdateUtils.addWorkbenchToWorkbench(otherWb, leucanSheet, user, g);

    UpdateUtils.addWorkbenchToWorkbench(poetry1Wb, daGagnepSheet, user, g);
    UpdateUtils.addWorkbenchToWorkbench(poetry1Wb, leucanSheet, user, g);
    UpdateUtils.addWorkbenchToWorkbench(poetry1Wb, caricaSheet, user, g);
    UpdateUtils.addWorkbenchToWorkbench(poetry1Wb, aprilWb, user, g);

    UpdateUtils.addWorkbenchToWorkbench(poetry2Wb, daGagnepSheet, user, g);

    UpdateUtils.addWorkbenchToWorkbench(bugTestWb, bugNa1015Sheet, user, g);
    UpdateUtils.addWorkbenchToWorkbench(bugTestWb, bugCyperLepidoSheet, user, g);
    UpdateUtils.addWorkbenchToWorkbench(bugTestWb, bugCyperUnreadSheet, user, g);
    UpdateUtils.addWorkbenchToWorkbench(bugTestWb, bugIsotypusSheet, user, g);
    UpdateUtils.addWorkbenchToWorkbench(bugTestWb, bugHeliauSheet, user, g);
    UpdateUtils.addWorkbenchToWorkbench(bugTestWb, bugHeliau2Sheet, user, g);

    UpdateUtils.addWorkbenchToWorkbench(batchBluestone2Wb, batch2142424Sheet, user, g);
    UpdateUtils.addWorkbenchToWorkbench(batchBluestone2Wb, batch2142429Sheet, user, g);
    UpdateUtils.addWorkbenchToWorkbench(batchBluestone2Wb, batch2142480Sheet, user, g);
    UpdateUtils.addWorkbenchToWorkbench(batchBluestone2Wb, batch2142761Sheet, user, g);
    UpdateUtils.addWorkbenchToWorkbench(batchBluestone2Wb, batch2142771Sheet, user, g);
    UpdateUtils.addWorkbenchToWorkbench(batchBluestone2Wb, batch2142775Sheet, user, g);
    UpdateUtils.addWorkbenchToWorkbench(batchBluestone2Wb, batch2142853Sheet, user, g);
    UpdateUtils.addWorkbenchToWorkbench(batchBluestone2Wb, batch2142900Sheet, user, g);
    UpdateUtils.addWorkbenchToWorkbench(batchBluestone2Wb, batch2142965Sheet, user, g);
    UpdateUtils.addWorkbenchToWorkbench(batchBluestone2Wb, batch2142993Sheet, user, g);

    UpdateUtils.addCreator(rootWb, user, g);
    UpdateUtils.addCreator(springWb, user, g);
    UpdateUtils.addCreator(summerWb, user, g);
    UpdateUtils.addCreator(aprilWb, user, g);
    UpdateUtils.addCreator(mayWb, user, g);
    UpdateUtils.addCreator(otherWb, user, g);
    UpdateUtils.addCreator(poetry1Wb, user, g);
    UpdateUtils.addCreator(poetry2Wb, user, g);
  }
}
