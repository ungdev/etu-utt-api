# Permissions

Cette page traite à la fois des permissions des utilisateurs, et de celles des applications utilisant l'API.

## Introduction

Tout d'abord, faisons un tour d'horizon des tables :
- `ApiKey` : c'est la table de base pour les permissions. Cette table contient des données de base sur les droits de chaque utilisateur. L'utilisateur ne sera pas authentifié directement, mais avec une `ApiKey`. Chaque utilisateur peut avoir plusieurs `ApiKey`, que vous pouvez voir comme des subdivisions d'un utilisateur. Prenons l'exemple de l'intégration : ils auront une `ApiKey` pour le front de EtuUTT, une `ApiKey` pour leur site web, et une troisième pour leur application. Chaque `ApiKey` a des permissions différentes.
- `User` : l'utilisateur, les `ApiKey` pointent vers cette table.
- `GrantedPermissions` : Cette table contient les permissions données par un certain utilisateur à une certaine clé API.
- `ApiPermissions` et `UserPermissions` : Ces _enum_ listent l'entièreté des permissions prises en charge par l'API. Les valeurs de `ApiPermissions` (resp. `UserPermissions`) commencent par `API_` (resp. `USER_`). Les `UserPermissions` peuvent être demandées par les différentes applications et acceptées par les utilisateurs au cas par cas. Plus d'information dans la partie du fonctionnement des (grants)[#grants].

## Authentification des requêtes

On va traiter l'authentification des requêtes avant la connexion, le _flow_ me paraît plus logique dans ce sens là :)

Pour authentifier les requêtes, on utilise un token JWT, passé dans le _header_ `Authorization`, sous le format `Bearer {token}`. Une fois décodé, le token renvoit un objet de la forme contenant un champ `token`. Ce champ permet de trouver l'`ApiKey` unique. À partir de cette `ApiKey`, il est ainsi possible d'obtenir l'utilisateur authentifié, et les routes ou informations auxquelles l'utilisateur a le droit d'accéder.

## Connexion

La connexion pour un utilisateur ou une application diffère :
- Pour un utilisateur : on passe par le CAS de l'UTT, avec la route `POST /auth/signin`, puis l'API nous renvoit un token pour authentifier nos requêtes, voir la partie (Authentification des requêtes)[#authentification-des-requetes]
- Pour une application : on génère un token pour l'`ApiKey` demandée, puis on retourne le token JWT. Il faut aussi bien sauvegarder la date de dernière mise à jour (`tokenUpdatedAt`), et utiliser cette date pour toujours retourner la même version du token (champ `iat` dans l'objet à encoder avec JWT). L'utilisateur peut renouveler les token de ses `ApiKey`, le token sera alors modifié, pour empêcher l'accès avec l'ancien token.

## Grants

Ce système de _grant_ permet aux utilisateurs de maîtriser quelles données sont partagées avec quelle application externe.

Par exemple, Guillaume a décidé de développer une application web avec un backend Rust permettant de gérer nos comptes EtuUTT. Il aimerait donc les permissions `USER_SEE_DETAILS` et `USER_UPDATE` sur tous les utilisateurs, ce que nous ne pouvons évidemment pas lui donner, pour des raisons de sécurité et de confidentialité. Il peut cependant marquer ces permissions comme étant demandées (champ `grantablePermissions` de la table `ApiKey`). Ainsi, il pourra rediriger les utilisateur vers une page de EtuUTT (TODO : toujours à déterminer, API ou front ? API serait plus simple), qui leur permettront de se connecter et d'accepter ou non que l'application de Guillaume accède à leurs données. Ils peuvent aussi choisir, par exemple, de n'autoriser l'application qu'à voir leurs données, mais pas de les mettre à jour.
