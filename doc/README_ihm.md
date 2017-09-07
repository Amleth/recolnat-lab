# L'interface graphique du Collaboratoire ReColNat

Conventions :
	- Les noms de composants React sont écrits `<Ainsi>`.

---

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

### Déploiement sur le serveur de test

Voir le `gulpfile.js`. Emplacement : `/home/cnamuser/www/labo-dev` & `https://wp5test.recolnat.org/labo-dev/`.

---

## Structure des composants

### Remarques générales sur la structure de l'application

- Point d'entrée de l'application : `src/main.js`
	- application de styles CSS à l'élément `body`
- Composant racine : `src/Window`
	- instanciation d'un `WebSocketConnector` (singleton)
	- instanciation des *Stores*
- Gestion des communications avec les services : `src/utils/WebSocketConnector`
	- *wrapper* intelligent vers [websocket](https://www.npmjs.com/package/websocket)

### Arborescence des composants

Une « carte » générale des composants visuels peut être utile pour s'orienter dans le code :

- `<Window> => src/Window`
	- `<iframe>`
	- `<Modals>`
	- `<MainMenu>`
	- `<OrbalContextMenu>`
	- `<WebSocketStatus>`
	- `<LeftPane> => src/components/panes/LeftPane.js`
	- `<CenterPane> => src/components/panes/CenterPane.js`
	- `<RightPane> => src/components/panes/RightPane.js`
		- `<MetadataViewer> => src/tools/palettes/MetadataViewer.js`
			- `<SpecimenMetadataTable> => src/tools/palettes/metadata/SpecimenMetadataTable.js`
			- `<DeterminationMetadataTable> => src/tools/palettes/metadata/DeterminationMetadataTable.js`
			- `<HarvestMetadataTable> => src/tools/palettes/metadata/HarvestMetadataTable.js`
			- `<LocationMetadataTable> => src/tools/palettes/metadata/LocationMetadataTable.js`
		- `<AnnotationList> => src/tools/palettes/AnnotationList.js`
		- `<ElementInspector> => src/tools/palettes/ElementInspector.js`

Notes :
	- Cette arborescence a été réalisée en s'apppuyant sur les [React Developer Tools de Chrome](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi?hl=en).
	- Cette arborescence ne montre pas les conteneurs `<div>` qui n'ont aucune valeur logique mais uniquement esthétique ou typo-dispositionnelle.

### Les *Stores*

- Chaque *Store* a une référence vers l'instance de WebSocketConnector.

---

## La paillasse

### Affichage des images

---

## Aspects liés aux métadonnées ReColNat

### Obtention

L'affichage des données récupérées à partir de l'API ReColNat est pris en charge par `<SpecimenMetadataTable>`.

`loadingSpecimen`

L'API est appelée dans `<MetadataViewer>` (parent du composant susmentionné), paramétrée par l'id du spécimen courant. Pour information, un appel à la route `https://api.recolnat.org/erecolnat/v1/specimens/<id>` renvoie un contenu JSON tel que celui-ci :

```json
{
  "@specimenID": 1,
  "basisofrecord": "PreservedSpecimen",
  "catalognumber": "P02470920",
  "collectioncode": "P",
  "created": 1440071726000,
  "dwcaid": "http://coldb.mnhn.fr/catalognumber/mnhn/p/p02470920",
  "explore_url": "https://explore.recolnat.org/specimen/botanique/2C462AB9E8CA4C7FA1D9E527196B22D1",
  "hascoordinates": false,
  "hasmedia": true,
  "institutioncode": "MNHN",
  "links": [
    {
      "href": "https://api.recolnat.org/erecolnat/v1/specimens/2c462ab9-e8ca-4c7f-a1d9-e527196b22d1",
      "rel": "self"
    },
    {
      "href": "https://api.recolnat.org/erecolnat/v1/specimens/2c462ab9-e8ca-4c7f-a1d9-e527196b22d1/images",
      "rel": "images"
    },
    {
      "href": "https://api.recolnat.org/erecolnat/v1/specimens/2c462ab9-e8ca-4c7f-a1d9-e527196b22d1/determinations",
      "rel": "determinations"
    },
    {
      "href": "https://api.recolnat.org/erecolnat/v1/specimens/2c462ab9-e8ca-4c7f-a1d9-e527196b22d1/recolte",
      "rel": "recoltes"
    }
  ],
  "modified": 1440071726000,
  "occurrenceid": "2c462ab9-e8ca-4c7f-a1d9-e527196b22d1",
  "sourcefileid": "mnhn-p"
}
```

Si tout se passe bien, `<>MetadataViewer>` place l'objet JSON retourné par l'API dans la propriété `specimen` de son `state`.
