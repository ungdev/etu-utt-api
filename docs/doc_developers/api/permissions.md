# Permissions

Cette page traite à la fois des permissions des utilisateurs, et de celles des applications utilisant l'API.

Tous les termes spécifiques aux permissions seront en _italique_, et leur définition peut être retrouvée dans la partie [terminologie](#terminologie).

## Terminologie

### Permission

Une _permission_ est une autorisation de réaliser une action ou d'accéder à des données. Dès que quelque chose ne devrait pas être accessible / faisable avec n'importe quelle _clé API_, une _permission_ pour faire cette dite chose doit exister.

Les _permissions_ sont divisées en 2 catégories : les _user permissions_ et les _API permissions_.

**Exemples :** La permission permettant de voir les commentaires des UEs, la permission permettant de modifier les permissions des autres, ...

### User permission

Une _user permission_ est un type de _permission_. Ces _permissions_ sont les _permissions_ liées à un utilisateur.

**Exemples :** accéder aux données privées des utilisateurs, modifier les données d'un utilisateur, ...

### API permission
Une _API permission_ est un type de _permission_. Ces _permissions_ sont les _permissions_ générales, qui portent sur toute l'API.

**Exemples :** modérer les commentaires, modérer les annales, etc...

### Application

Une application est un logiciel ayant besoin d'un accès à l'API de EtuUTT. Chaque application est reliée à un utilisateur, qui est l'administrateur de celle-ci.

**Exemples :** le front de EtuUTT, l'application EtuUTT, le site de l'intégration, ...

### Clé API (ou Api Key)

Une _clé API_ (ou _Api Key_) est une relation entre un utilisateur et une _application_. Un utilisateur ne peut avoir qu'une _clé API_ par _application_.

```{note}
Une _clé API_ **n'est pas** un token, c'est plutôt un objet qui servira à générer un token et authentifier les requêtes.

Un utilisateur n'a pas nécessairement les mêmes droits sur les différentes _applications_. Il est tout de même important de noter que rien ne l'empêchera d'utiliser une _clé API_ sur une _application_ qui n'est pas liée à cette _clé API_. Il est donc important **d'avoir confiance** en l'utilisateur, et pas uniquement en l'application.
```

**Exemple :** prenons l'exemple de l'intégration : ils auront :
* Une _clé API_ pour le pour se connecter au front de EtuUTT avec le compte `integration@utt.fr` (reliée à l'_application_ `EtuUTT-front`)
* Une _clé API_ pour le back de leur site web (reliée à `Integration-website`)
* Une _clé API_ par utilisateur de leur application (qui n'utiliserait pas le backend de leur site web), avec uniquement les droits de base, pour leur application (reliées à `Integration-app`). Chaque _clé API_ a des permissions différentes, ce qui signifie qu'on peut donner des droits à un utilisateur en particulier sur l'_application_ de l'intégration.

### Bearer token

Le _bearer token_ est une chaîne de caractère encodant une certaine _clé API_, en utilisant le standard JWT.

### Soft grant

Un _soft grant_ ne peut se faire que sur des _user permissions_ (ça n'aurait pas de sens sur des _api permissions_).

Les _soft grant_ ne donne pas la permission à la _clé API_ sur tous les utilisateurs. Chaque utilisateur doit explicitement donner son consentement pour que la _clé API_ puisse exercer sa _permission_ sur son compte.

Une _clé API_ peut se soft grant n'importe quelle _user permission_. Tant qu'elle n'aura reçu le consentement de personne, elle n'aura aucun droit supplémentaire.

**Exemple :** Guillaume, grand rageux qu'il est, décide de développer une application, qui permet d'avoir une interface bien plus agréable que celle de EtuUTT. Il a aussi une API (en Rust, on se respecte), qui s'occupe de faire l'interface entre l'API EtuUTT et son application. Guillaume pourra donner la _permission_ à sa clé API de voir le détail des utilisateurs. Cependant, ce sera un _soft grant_, ce qui signifie qu'il n'aura au début accès aux détails d'aucun utilisateur. Teddy va alors être curieux du projet, et se connecter à son application. Pendant l'authentification avec EtuUTT, il devra donner son consentement pour que Guillaume puisse récupérer ses informations personnelles. À partir de ce moment là, Guillaume pourra utiliser sa permission sur Teddy, mais **uniquement** sur Teddy, jusqu'à ce qu'un autre utilisateur lui donne son consentement. (Ah, au fait, Teddy a pas aimé l'application et a revoke son consentement 😔)

### Hard grant

Un _hard grant_ peut se faire sur n'importe quel type de _permissions_ (_user permissions_ et _API permissions_).

Un _hard grant_ ne nécessite le consentement de personne, et s'applique sur tous les utilisateurs. Une _clé API_ ne peut évidemment pas se _hard grant_ des _permissions_.

Une _API permissions_ est nécessairement _hard granted_ (aucun sens de les _soft grant_).

**Exemple :** Guillaume rêve de pouvoir. Et finalement, il a amélioré son application (Teddy est revenu sur son choix). Son code est devenu propriété de l'UNG (merci Guillaume). Nous pouvons donc donner la _permission_ pour voir les informations personnelles des utilisateurs à l'application. Un administrateur va alors _hard grant_ la permission à Guillaume. Les utilisateurs n'ont pas besoin de donner leur consentement, Guillaume aspire tout 😈.

```{warning}
Attenation cependant à bien respecter le RGPD en faisant un _hard grant_ d'une _user permission_ ! \
À ce jour, nous ne pensons qu'à 2 _applications_ qui devraient en avoir besoin : le site de EtuUTT, et son application.
```

## Tables

Faisons un tour d'horizon des tables :
- `Application` : représente une _application_. 
- `ApiKey` : représente une _clé API_. L'`ApiKey` contient un token, qui sera signé pour créer le Bearer token.
- `User` : représente un utilisateur (rien de particulier à signaler ici, la table ressemble à ce dont vous pouvez vous attendre d'une table utilisateur)
- `ApiKeyPermission` : Une _permission_ spécifique donnée à une certaine _clé API_. Cette _permission_ peut soit être _soft granted_ soit être _hard granted_.
- `GrantedPermissions` : Cette table contient les permissions données par un certain utilisateur à une certaine clé API.
- `Permission` : une _enum_ listant l'entièreté des _permissions_ prises en charge par l'API. Les _API permissions_ commencent par `API_`, et les _user permissions_ commencent par `USER_`.

## Authentification des requêtes

On va traiter l'authentification des requêtes avant la connexion, le _flow_ me paraît plus logique dans ce sens là 🙂

Pour authentifier les requêtes, on utilise un _bearer token_ (token JWT), passé dans le _header_ `Authorization`, sous le format `Bearer {token}`. Une fois décodé, le token renvoit un objet contenant un champ `token`. Ce champ permet de trouver une `ApiKey` unique. À partir de cette `ApiKey`, il est ainsi possible d'obtenir l'utilisateur authentifié, et les routes ou informations auxquelles l'utilisateur a le droit d'accéder.

## Connexion

On fera la différence entre un utilisateur et une _application_. Mais comme vous avez dû le comprendre, un utilisateur n'est rien d'autre que l'_application_ du site web de EtuUTT essayant de se connecter en tant que cet utilisateur.

La méthode de connexion "utilisateur" permettra donc de générer un _bearer token_ temporaire, avec une connexion standard (décentralisée, nom d'utilisateur / mot de passe).

La méthode de connexion "application" permettra de générer un _bearer token_ avec une durée de vie possiblement infinie (en fonction de ce que veut l'utilisateur). On passe ici par une autre application (le site EtuUTT) pour générer un _bearer token_.

### Pour un utilisateur

Pour un utilisateur, on passe par le CAS de l'UTT, avec la route `POST /auth/signin`, puis l'API nous renvoit un token pour authentifier nos requêtes, voir la partie (Authentification des requêtes)[#authentification-des-requetes]

### Pour une application

Pour une application, on génère un token pour la _clé API_ demandée, puis on retourne le _bearer token_ associé. Il faut aussi bien sauvegarder la date de dernière mise à jour (`tokenUpdatedAt`), et utiliser cette date pour toujours retourner la même version du token (champ `iat` dans l'objet à encoder avec JWT).

L'utilisateur peut renouveler les token de ses `ApiKey`. Le token sera alors modifié, pour empêcher l'accès avec l'ancien token.
