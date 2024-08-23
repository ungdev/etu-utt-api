# Documentation

Cette page traite de la documentation, aussi bien cette documentation, que la documentation du code, ou de la documentation pour l'utilisateur.

La règle d'or de toutes les documentations que vous écrirez : elles doivent être exhaustives et compréhensibles, tout en allant à l'essentiel. Une documentation pas exhaustive remplie mal son rôle ; une documentation trop longue décourage le lecteur.

## Documentation pour le développeur

La documentation pour le développeur, vous vous familiarisez déjà avec, puisque c'est celle que vous lisez.

Elle doit contenir une documentation de tous les outils présents, de manière à simplifier l'arrivée de nouveaux développeurs. Elle ne doit cependant pas trop rentrer dans les détails techniques de chaque fonction : ceux-ci sont réservés à la documentation dans le code.

À chaque fois que vous développez un nouvel outil (de taille conséquente), vous devrez documenter son fonctionnement. La règle d'or : si vous pensez qu'un développeur qui ne connaît pas le code pourrait passer à côté de vôtre outil, ou ne pas le comprendre, c'est qu'il faut créer une page dans la documentation pour en parler. Sinon, vous n'en avez probablement pas besoin.

## Documentation dans le code

Chaque fonction doit être documentée à l'aide d'une JSDoc. Seules les fonction des contrôleurs n'ont pas besoin de l'être (elles le sont déjà avec Swagger, le nom de la route, le nom de la fonction, etc...). Les paramètres des fonctions doivent être décrits. Si besoin, n'hésitez pas à mettre un exemple d'utilisation de la fonction.

Les parties du code qui vous semblent peu lisibles ou longues doivent être commentées, pour que l'on puisse comprendre le raisonnement derrière l'algorithme, ou les différentes étapes. De manière générale, préférez la simplification du code à l'ajout de commentaires.

## Documentation Swagger

Il existe une documentation accessible sur `{API_BASE_URL}/docs`. Cette documentation est générée automatiquement par Swagger/OpenAPI. Elle est utile pour les utilisateurs de l'API, et doit être gardée à jour. Dès que vous créez une nouvelle route, vous devez écrire la documentation pour celle-ci (pour vous motiver : c'est vraiment super rapide à faire, et c'est au même endroit)

La documentation se fait à l'aide de décorateurs, commençant tous par `Api` (`ApiTags`, `ApiOperation`, `ApiOkResponse`, ...). Ces décorateurs (sauf les décorateurs _custom_) prennent tous un paramètre, contenant plusieurs options. N'hésitez pas à les regarder, et les utiliser si nécessaire.

Chaque route doit être décorée par un `@ApiOperation({description: "..."})`. Vous devez aussi décorer la route pour définir ce qu'elle renvoit (`@ApiOkResponse({ type: ClasseRenvoyeeResDto })` pour un code 200, `@ApiCreatedResponse(...)` pour un code 201, etc...). Le type du `body` sera inféré. Enfin, vous devez préciser les différentes erreurs qui peuvent être levées, en utilisant autant de fois que nécessaire le décorateur _custom_ `@ApiAppErrorResponse(ERROR_CODE.ERREUR_RENVOYEE, 'une description optionnelle')`.

Si la route est paginée (la route renvoie une valeur de type `Pagination<any>`), vous pouvez utiliser la fonction `paginatedResponseDto` : `@ApiOkResponse({ type: paginatedResponseDto(ClasseRenvoyeeResDto) })`

Les classes décrivant les structures renvoyées (`*ResDto`) sont dans les dossiers `dto/res`

Si une route renvoie un type de la forme `{ outerField: { innerField: string } }`, alors on pourra utiliser la classe `AResDto` pour décrire ce type :

```ts
export default class AResDto {
  outerField: AResDto_OuterField;
}

class AResDto_OuterField {
  innerField: string;
}
```

Les traductions se faisant automatiquement **une fois la réponse du contrôleur reçue**, on ne peut pas mettre le type `string` à un champ traduit. On doit donc faire savoir à Swagger que le type final sera bien une `string`, et pas une `Translation` :

```ts
import { ApiProperty } from '@nestjs/swagger';

class AResDto {
  @ApiProperty({ type: String })
  translationField: Translation;
}
```
