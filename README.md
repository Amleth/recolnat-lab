# Le Collaboratoire
## Sous-projets
colaboratory -> l'IHM du Collaboratoire (JS, React, Semantic-UI, d3)
commons -> méthodes et algorithmes génériques pour accéder à la base de données OrientDB (Java)
reporting -> simple page de reporting sur l'état des serveurs (JS)
services -> les APIs websocket et REST permettant d'accéder à la base (Java)

## API
Compilé et packagé avec Maven.

commons -> `mvn clean package install`
services/websocket -> `mvn clean package`
services/rest -> pas maintenu

Le script `upload.sh` permet de déployer sur le bon serveur (dev, test, vm). Lancement du jar via la commande `java -jar colaboratory-socket.jar colaboratory-socket.yml` après vérification de la configuration dans le fichier YAML mentionné.

## IHM
"npm i" pour télécharger les dépendences
"npm run <server>" pour packaging et upload sur le bon serveur, parmi dev (local), ddev (serveur dev ReColNat), test (serveur test ReColNat), prod-vm (serveur pré-prod ReColNat)

## Notes
Pour l'instant pas d'option pour lancer en local suite aux restrictions sur le nom de domaine pour l'authentification.