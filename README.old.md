# Le Collaboratoire
## Sous-projets
colaboratory -> l'IHM du Collaboratoire (JS, React, Semantic-UI, d3)
commons -> méthodes et algorithmes génériques pour accéder à la base de données OrientDB (Java)
reporting -> simple page de reporting sur l'état des serveurs (JS)
services -> les APIs WebSocket et REST permettant d'accéder à la base (Java)

## API
Dépendences : 
  * Apache Maven >3.2.2
  * Java >8.

Deux version sont disponibles pour le moment. Les branches "master" et "production" permettent d'obtenir un package JAR. La branche "tomcat" permet d'obtenir un WAR.

### Packaging
La compilation et packaging (en JAR ou WAR) se fait via Maven, dans l'ordre :
  - commons -> `mvn clean package install`
  - services/websocket -> `mvn clean package`, dépend de commons

### JAR
Le script `upload.sh` permet de copier vers le bon serveur (dev, test, vm). Lancement du jar via la commande `java -jar colaboratory-socket.jar colaboratory-socket.yml` après vérification de la configuration dans le fichier YAML mentionné.

### WAR
Modifier le script `upload.sh` pour que la destination corresponde au répertoire de déploiement des wars.

Le service attend une variable d'environnement système COLABORATORY_HOME qui doit pointer vers un répertoire contenant le fichier de configuration `colaboratory-socket.yml`.

Cette variable est à définir au niveau du conteneur applicatif. Par exemple pour Tomcat, au moment du lancement du catalina.sh ou dans le script de lancement du daemon.

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

#### Serveur
La section "server" sert à configurer les informations du serveur quand l'application tourne en mode stand-alone. Cette section n'est pas utilisée quand l'application tourne sur un conteneur applicatif (type Tomcat ou Glassfish).

#### Logs
La section "logging" permet de configurer le contenu des fichiers de log (qui sont stockés dans `$COLABORATORY_HOME/logs`. Voir la documentation de slf4j.

### Proxy
Il sera probablement nécessaire de configurer le proxy du serveur afin de permettre/rediriger les connexions WebSocket vers le bon port.

Par exemple avec Nginx, rajouter les lignes suivantes dans le bloc correspondant (80 ou 443 selon si http ou https) pour un Tomcat qui tourne sur le port 8888 et un service déployé sur le contexte colaboratory-socket-dev-0.9.3 :
```apacheconf
location /services/labo-dev/websockets {
  proxy_pass http://127.0.0.1:8888/colaboratory-socket-dev-0.9.3;
  access_log on;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-NginX-Proxy true;
  proxy_set_header X-Forwarded-Proto $scheme;

  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "Upgrade";

  proxy_buffering off;

  proxy_connect_timeout   43200000;
  proxy_read_timeout      43200000;
  proxy_send_timeout      43200000;
}

location /services/labo-dev/rest {
  proxy_pass http://127.0.0.1:8888/colaboratory-socket-dev-0.9.3/rest;
}
```

## IHM
Dépendences :
  * NodeJS >4.2.0
  * npm >2.14.7

Si nécessaire, éditer les fichiers du répertoire /conf/ (tout changement doit être fait avant le packaging).

"npm i" pour télécharger les dépendences (nécessaire seulement la première fois ou en cas de changement des dépendences).

### Packaging & déploiement
#### Automatique
"npm run <server>" pour packaging et upload sur le bon serveur, parmi dev (local), ddev (serveur dev ReColNat), test (serveur test ReColNat), prod-vm (serveur pré-prod ReColNat)

##### Déployer ailleurs
Pour définir un autre serveur, éditer les fichiers `gulpfile.js` et `package.json`

Dans `gulpfile.js` ajouter les lignes suivantes en remplaçant `mytask` par un nouveau nom de tâche et `host`, `remotePath`, `user`, `pass` par les bonnes informations:
```js
gulp.task('build-mytask', ['conf-mytask', 'copy'], shell.task([
  'webpack -p --config webpack.production.config.js --progress --colors'
]));

gulp.task('conf-mytask', function() {
  gulp.src('./conf/ApplicationConfiguration-mytask.js')
    .pipe(rename('ApplicationConfiguration.js'))
    .pipe(gulp.dest('./src/conf'));
});

gulp.task('deploy-mytask', ['build-mytask'], function() {
  gulp.src(distSrc)
    .pipe(sftp({
      host: 'myurl.example.com',
      remotePath: '/path/to/www/lab',
      user: 'user',
      pass: "password"
    }));
});
```

Dans `package.json`, dans la section `scripts` ajouter :
```js
"mytask": "gulp deploy-mytask"
```

Ajouter un fichier `conf/ApplicationConfiguration-mytask.js` sur la base d'un des fichier de configuration existant dans ce répértoire. Dans ce fichier modifier la partie Services en fonction du WAR déployé antérieurement:
```js
let Services = {
  laboratoryRESTService: 'https://myurl.example.com/services/myservice',
  laboratorySocketService: 'wss://myurl.example.com/services/myservice/websockets/colaboratory',
  downloadsBaseURL: 'https://wp5test.recolnat.org/myservice-exports/'
};
```
Pour `downloadsBaseUrl`, indiquer l'URL correspondant au dossier configuré dans `colaboratory-socket.yml`.

#### Manuel
Pour un déploiement manuel, lancer la commande `npm run build`.

Ceci va génerer du contenu (html, js, images) dans le répertoire /dist/. Copier tout le contenu de ce répertoire vers le serveur de contenu web.

## Notes
Pour l'instant pas d'option pour lancer en local suite aux restrictions sur le nom de domaine pour l'authentification.