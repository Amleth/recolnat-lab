# Documentation du fichier de configuration

Chaque section de ce document explicite le rôle de chacune des variables définies à la racine des fichiers de configuration de type ```ApplicationConfiguration-<CONTEXT>.js```.

## Application

Defines languages available in application. Each language must have a corresponding language file defined in src/data/i18n localized: The displayed name in its original language flag: Flag of the country (see Semantic-UI doc on country flags)

## Integration

URLs of external elements to integrate in the interface: menu bar origin (for cross-validation) & url, CAS login & signup urls

## Services

Locations of service APIs & export downloads.

## Endpoints

Adresses of REST endpoints

## Actions

Actions available for each endpoint

## SocketActions

Actions available for the websocket (these go into the actionDetail message parameter).