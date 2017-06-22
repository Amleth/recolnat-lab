# L'interface graphique du Collaboratoire ERECOLNAT

## Compilation et déploiement

Ceci est un projet Node.js/npm/gulp. La lecture de ce document suppose une compréhension de ces trois outils et de leurs commandes de base.

### Dépendances

La version 4.2.1 de Node.js a été utilisée lors du développement. Pour travailler avec une version ancienne de Node.js sans compromettre une installation plus récente, on pourra utiliser [nvm](https://github.com/creationix/nvm). Ansi :
 
    nvm install v4.2.1

Lors de la reprise du code (juin 2017) :
  - les versions des dépendances utilisées dans la phase de développement inital (mars 2015 -> mai 2017) ont été fixées dans le `package.json`.
  - il a été nécessaire d'ajouter un [`json-loader`](https://github.com/webpack-contrib/json-loader) dans le `webpack.config.js` car le `package.json` de `websocket` faisait planter la compilation.
  
### Données de configuration
  
- Le code source s'attend à trouver un fichier `./conf/ApplicationConfiguration`. Il doit donc être généré lors du *build*.
- La branche `downloadsBaseUrl` du fichier de configuration indique l'URL correspondant au dossier configuré dans le `colaboratory-socket.yml` du service.