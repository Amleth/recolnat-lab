# Le Collaboratoire
## Sous-projets
colaboratory -> l'IHM du Collaboratoire (JS, React, Semantic-UI, d3)
commons -> méthodes et algorithmes génériques pour accéder à la base de données OrientDB (Java)
reporting -> simple page de reporting sur l'état des serveurs (JS)
services -> les APIs WebSocket et REST permettant d'accéder à la base (Java)

## API
Nécessite Maven & Java 8+.

Deux version sont disponibles pour le moment. Les branches "master" et "production" permettent d'obtenir un package JAR. La branche "tomcat" permet d'obtenir un WAR.

commons -> `mvn clean package install`
services/websocket -> `mvn clean package`, dépend de commons
services/rest -> pas maintenu

### JAR
Le script `upload.sh` permet de copier vers le bon serveur (dev, test, vm). Lancement du jar via la commande `java -jar colaboratory-socket.jar colaboratory-socket.yml` après vérification de la configuration dans le fichier YAML mentionné.

### WAR
Modifier le script `upload.sh` pour que la destination corresponde au répertoire de déploiement des wars.

Le service attend une variable d'environnement COLABORATORY_HOME qui doit pointer vers un répertoire contenant le fichier de configuration `colaboratory-socket.yml`.

### Configuration WebSocket (colaboratory-socket.yml)
Un squelette de configuration est disponible dans `websocket/src/main/resources/colaboratory-socket.yml`

#### Bases de données
Le Collaboratoire repose sur une base de données OrientDB directement intégrée dans le service. La gestion des accès et des exports se fait via des bases MapDB. La configuration de toutes ces bases se fait dans la partie "databases" du fichier.

- dbPath: Chemin vers la base OrientDB (doit pointer vers un répertoire). Si elle n'existe pas elle sera créée par le service.
- pathToUserAccessDatabase: Chemin vers la base MapDB de gestion des accès (fichier). Si elle n'existe pas elle sera créée.
- pathToUserExportsDatabase: Chemin vers la base MapDB de gestion des exports utilisateur (fichier). Si elle n'existe pas elle sera créée.
- exportsDirectory: Chemin vers un répertoire où le service va copier les fichiers pour que l'utilisateur puisse les télécharger directement.
- dbUser: login de l'utilisateur de la base OrientDB.
- password: mot de passe de la base OrientDB.
- minConnectorPoolSize & maxConnectorPoolSize: indique le nombre de connexions simultanées vers la base OrientDB. Ces connexions sont partagées entre tous les utilisateurs.
  - backup: informations pour la sauvegarde périodique des bases de données
  - directory: répertoire où les sauvegardes sont créées
  - firstExecutionDate: jour et heure où la sauvegarde est effectuée
  - frequency: fréquence des sauvegardes (en jours)

#### Performances
Des options de tuning sont disponibles pour gérer les performances du service dans la section "performance".
Chaque utilisateur dispose de 3 pools de threads pour ses requêtes selon le niveau de concurrence de la requête.

- readThreadsPerUser: Pool de threads en lecture seule (donc sans problèmes de concurrence).
- lowConcurrencyWriteThreadsPerUser: Pool de threads pour les requêtes ayant peu de chances d'interblocage (par exemple ajout de données et création d'entités).
- highConcurrencyWriteThreadsPerUser: Pool de threads pour les requêtes à fort taux d'interblocage (par exemple suppression). Augmenter la taille de ce pool au-delà de 1 peut fortement réduire les performances.

#### Authentification
La section "authentication" permet de configurer le système d'authentification utilisé. Pour l'instant seul CAS est disponible.

- ticketUrl: URL du service d'obtention de tickets
- serviceValidateUrl: URL du service de validation de tickets

#### Server
La section "server" sert à configurer les informations du serveur quand l'application tourne en mode stand-alone. Cette section n'est pas utilisée quand l'application tourne sur un conteneur applicatif (type Tomcat ou Glassfish).

#### Logging
La section "logging" permet de configurer le contenu des fichiers de log (qui sont stockés dans `$COLABORATORY_HOME/logs`. Voir la documentation de slf4j.

## IHM
Nécessite npm.

Editer le fichier gulpfile.js pour spécifier les URLs de déploiement.

Si nécessaire, éditer les fichiers du répertoire /conf/ (tout changement doit être fait avant le packaging).

"npm i" pour télécharger les dépendences (nécessaire seulement la première fois ou en cas de changement des dépendences).
"npm run <server>" pour packaging et upload sur le bon serveur, parmi dev (local), ddev (serveur dev ReColNat), test (serveur test ReColNat), prod-vm (serveur pré-prod ReColNat)

### Déploiement manuel
Pour un déploiement manuel, lancer la commande `npm run build`.

Ceci va génerer du contenu dans le répertoire /dist/. Copier tout le contenu de ce répertoire vers le serveur de contenu web.

## Notes
Pour l'instant pas d'option pour lancer en local suite aux restrictions sur le nom de domaine pour l'authentification.