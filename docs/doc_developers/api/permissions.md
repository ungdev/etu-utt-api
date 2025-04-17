# Permissions

Cette page traite à la fois des permissions des utilisateurs, et de celles des applications utilisant l'API.

Tous les termes spécifiques aux permissions seront en _italique_, et leur définition peut être retrouvée dans la partie [terminologie](#terminologie).

## Terminologie

### Permission

Une _permission_ est une autorisation de réaliser une action ou d'accéder à des données. Dès que quelque chose ne devrait pas être accessible / faisable avec n'importe quelle _clé API_ (si vous lisez la documentation pour la première fois, _clé API_ ~ utilisateur), une _permission_ pour faire cette dite chose doit exister.

Les _permissions_ sont divisées en 2 catégories : les _user permissions_ et les _API permissions_.

**Exemples :** La permission permettant de voir les commentaires des UEs, la permission permettant de modifier les permissions des autres, ...

### User permission

Une _user permission_ est un type de _permission_. Ces _permissions_ sont les _permissions_ liées à un utilisateur.

Elles ont la particularité de pouvoir s'appliquer à un utilisateur mais pas à un autre.

**Exemples :** accéder aux données privées des utilisateurs, modifier les données d'un utilisateur, ...

### API permission

Une _API permission_ est un type de _permission_. Ces _permissions_ sont les _permissions_ globales, qui portent sur toute l'API.

**Exemples :** modérer les commentaires, modérer les annales, etc...

### Application

Une application est un logiciel ayant besoin d'un accès à l'API de EtuUTT. Chaque application est reliée à un utilisateur, qui est l'administrateur de celle-ci.

**Exemples :** le front de EtuUTT, l'application mobile EtuUTT, le site de l'intégration, ...

### Clé API (ou api key)

Une _clé API_ (ou _api key_) est une relation entre un utilisateur et une _application_. Un utilisateur ne peut avoir qu'une _clé API_ par _application_.

```{note}
Une _clé API_ **n'est pas** un token, c'est plutôt un objet qui servira à générer un token et authentifier les requêtes.

Un utilisateur n'a pas nécessairement les mêmes droits sur les différentes _applications_. Il est tout de même important de noter que rien ne l'empêchera d'utiliser une _clé API_ sur un logiciel qui ne devrait pas utiliser cette _clé API_. Il est donc important **d'avoir confiance** en l'utilisateur si on lui donne des permissions sur une application. S'il a une permission sur une _application_, il peut simuler des requêtes venant de cette _application_ alors même qu'il n'utilise pas le logiciel censé l'utiliser.
```

**Exemple :** prenons l'exemple de l'intégration : ils auront :
* Une _clé API_ pour se connecter au front de EtuUTT avec l'utilisateur `integration@utt.fr` (reliée à l'_application_ `EtuUTT-front`)
* Une _clé API_ pour le back de leur site web (reliée à l'_application_ `Integration-website`)
* Une _clé API_ par utilisateur de leur application mobile (logiciel qui n'utiliserait pas le backend de leur site web), avec uniquement les droits de base (_clés API_ reliées à l'_application_ `Integration-app`). Chaque _clé API_ a des permissions différentes, ce qui signifie qu'on peut donner des droits à un utilisateur en particulier sur l'_application_ de l'intégration. Chaque utilisateur peut aussi accorder des droits différents à l'_application_.

### Bearer token

Le _bearer token_ est une chaîne de caractère encodant une certaine _clé API_, en utilisant le standard JWT.

### Soft grant

Un _soft grant_ ne peut se faire que sur des _user permissions_ (ça n'aurait pas de sens sur des _api permissions_).

Les _soft grant_ ne donnent pas la permission à la _clé API_ sur tous les utilisateurs. Chaque utilisateur doit explicitement donner son consentement pour que la _clé API_ puisse exercer sa _permission_ sur son profile (accéder à des informations personnelles par exemple).

Une _clé API_ peut demander un _soft grant_ de n'importe quelle _user permission_. Tant qu'elle n'aura reçu le consentement de personne, elle n'aura aucun droit supplémentaire.

**Exemple :** Guillaume, grand rageux qu'il est, décide de développer une application, qui permet d'avoir une interface bien plus agréable que celle de EtuUTT. Il a aussi une API (en Rust, on se respecte), qui s'occupe de faire l'interface entre l'API EtuUTT et son application. Guillaume pourra donner la _permission_ à sa _clé API_ de voir le détail des utilisateurs. Cependant, ce sera un _soft grant_, ce qui signifie qu'il n'aura au début accès aux détails d'aucun utilisateur. Teddy va alors être curieux du projet, et se connecter à son application. Pendant l'authentification avec EtuUTT, il devra donner son consentement pour que Guillaume puisse récupérer ses informations personnelles. À partir de ce moment là, Guillaume pourra utiliser sa permission sur Teddy, mais **uniquement** sur Teddy. (Ah, au fait, Teddy a pas aimé l'application et a revoke son consentement 😔)

### Hard grant

Un _hard grant_ peut se faire sur n'importe quel type de _permission_ (_user permissions_ et _API permissions_).

Un _hard grant_ ne nécessite le consentement de personne, et s'applique sur tous les utilisateurs. Seuls des administrateurs peuvent effectuer un _hard grant_.

Une _API permissions_ est nécessairement _hard granted_ (aucun sens de les _soft grant_).

**Exemple :** Guillaume rêve de pouvoir. Et finalement, il a amélioré son application (Teddy est revenu sur son choix). Son code est devenu propriété de l'UNG (merci Guillaume). Nous pouvons donc donner la _permission_ pour voir les informations personnelles des utilisateurs à l'_application_. Un administrateur va alors _hard grant_ la _permission_ à l'_application_ de Guillaume. Les utilisateurs n'ont pas besoin de donner leur consentement, Guillaume aspire toutes leurs données 😈.

```{warning}
Attention cependant à bien respecter le RGPD en faisant un _hard grant_ d'une _user permission_ ! \
```

## Tables

Faisons un tour d'horizon des tables :
- `ApiApplication` : représente une _application_. 
- `ApiKey` : représente une _clé API_. L'`ApiKey` contient un token, qui sera signé pour créer le _Bearer token_.
- `User` : représente un utilisateur (rien de particulier à signaler ici, la table ressemble à ce dont vous pouvez vous attendre d'une table utilisateur)
- `ApiKeyPermission` : Une _permission_ spécifique donnée à une certaine _clé API_. Cette _permission_ peut soit être _soft granted_ soit être _hard granted_.
- `ApiGrantedPermission` : Cette table contient les permissions données par les utilisateurs aux différentes clé API.
- `Permission` : une _enum_ listant l'entièreté des _permissions_ prises en charge par l'API. Les _API permissions_ commencent par `API_`, et les _user permissions_ commencent par `USER_`.

## Authentification des requêtes

On va traiter l'authentification des requêtes avant la connexion, le _flow_ me paraît plus logique dans ce sens là 🙂

Pour authentifier les requêtes, on utilise un _bearer token_ (token JWT), passé dans le _header_ `Authorization`, sous le format `Bearer {token}`. Quand on décode le token, on obtient un objet contenant un champ `token`. Ce champ permet de trouver une `ApiKey` unique. À partir de cette `ApiKey`, il est ainsi possible d'obtenir l'utilisateur authentifié, et les routes ou informations auxquelles l'utilisateur a le droit d'accéder.

## Connexion

On fera la différence entre un utilisateur et une _application_. Cependant, un utilisateur utilisateur qui se connecte n'est rien d'autre que l'_application_ du site web de EtuUTT qui essaie de se connecter en tant que cet utilisateur. La différence entre ces deux méthodes n'est donc pas le résultat final : les tokens que l'on obtient sont de même nature. La différence est dans la façon de les obtenir.

On va aussi faire la différence entre une connexion "utilisateur" au site de EtuUTT et une connexion "utilisateur" à une autre _application_.

La méthode de connexion "utilisateur" permettra de générer un _bearer token_ temporaire, avec une connexion classique (décentralisée ou nom d'utilisateur / mot de passe). C'est l'_application_ EtuUTT qui demandera à authentifier l'utilisateur, avec les informations fournies.

La méthode de connexion "application" permettra de générer un _bearer token_ avec une durée de vie possiblement infinie (en fonction de ce que veut l'utilisateur). C'est l'utilisateur connecté à l'_application_ EtuUTT qui demandera la génération d'un _bearer token_ pour notre _application_.

### Pour un utilisateur - connexion au site EtuUTT

Pour connecter un utilisateur au site EtuUTT, on passe par le CAS de l'UTT, avec la route `POST /auth/signin`, puis l'API nous renvoit un token pour authentifier nos requêtes, voir la partie (Authentification des requêtes)[#authentification-des-requetes]

### Pour un utilisateur - connexion à une autre _application_

Pour connecter un utilisateur à une autre _application_, cette application devra tout d'abord le rediriger vers `https://etu.utt.fr/auth/login?application=application_id`

L'utilisateur sera alors invité à se connecter. S'il n'a pas encore de _clé API_ pour cette application, il lui sera demandé s'il veut réellement en créer une.

L'utilisateur sera ensuite redirigé vers l'URL de redirection de l'_application_, avec un paramètre GET `token`. Ce token devra être envoyé à l'API sur la route `POST /auth/login/validate`, avec le client secret de l'_application_ pour confirmer la source de la requête. Cette route renvoie enfin un `bearer token`, qui peut être utilisé pour authentifier les requêtes.

### Pour une application

Pour une _application_, on génère un token pour la _clé API_ reliant l'_application_ et l'utilisateur à qui appartient cette _application_, puis on retourne le _bearer token_ associé. Il faut aussi bien sauvegarder la date de dernière mise à jour (`tokenUpdatedAt`), et utiliser cette date pour toujours retourner la même version du token (champ `iat` dans l'objet à encoder avec JWT).

L'utilisateur peut renouveler les token de ses `ApiKey`. Le token sera alors modifié, pour empêcher l'accès avec l'ancien token.

## Grant

### Soft grant

N'importe quelle application peut demander à un utilisateur de lui _soft grant_ une _permission_.

Pour permettre à un utilisateur de faire ce _soft grant_, l'_application_ doit rediriger l'utilisateur vers une route sur le front{sup}`route à déterminer`, en lui passant en paramètre l'id de l'_application_ et les _permissions_ nécessaires à _l'application_{sup}`noms des arguments à déterminer`.

L'utilisateur sera alors invité à se connecter, à accepter ou refuser les différentes _permissions_, et sera redirigé vers l'_application_{sup}`sur quelle url ?`, avec en paramètre les _permissions_ acceptées{sup}`format à déterminer`.
