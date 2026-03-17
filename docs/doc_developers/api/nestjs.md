# NestJS

NestJS est le framework utilisé pour l'api du site étu, il se base sur ExpressJS.
Tu connais Express ? Et bien ça ne te servira pas... _(en réalité ça peut être utile dans certains cas très précis<sup>[1](#quand-nestjs-ne-suffit-pas)</sup>)_

Nous allons dans cette documentation passer en revue tout ce que tu as besoin de savoir sur NestJS pour contribuer au site étudiant. Cependant s'il manque des choses, tu peux lire [la documentation de NestJS](https://docs.nestjs.com) et faire une pull request pour compléter la présente documentation s'il manque des fonctionnalités clés !

## La structure de l'API

Dans cette partie nous allons comprendre comment l'API est structurée, quels fichiers et quels objets doivent être créés pour créer une route ou un "groupement" de routes.

### Les modules

Lors de l'ajout d'une nouvelle fonctionnalité _(on entendra par là une fonctionnalité qui n'est pas directement liée à une fonctionnalité déjà existante)_, on crée un nouveau `Module`. Cela se traduira souvent, en terme d'url, par l'ajout d'un préfixe commun à toutes les routes du module. Par exemple, si on décide de rajouter un panier sur le site (oui, comme un site e-commerce) on mettra toutes les routes derrière un préfixe `/cart`. Un module peut aussi exister d'un point de vue purement technique : on a par exemple un menu qui sert à charger le .env, un module qui fait le pont avec le LDAP, etc.

Lors de la création d'un module, on commencera avant tout par créer un dossier, qui contiendra les fichiers nécessaires au bon fonctionnement de notre module.

```{warning}
Suis bien les [conventions de nommage](conventions.md#noms-de-fichiers-dossiers-variables-fonctions-etc) des fichiers et des classes que tu crées 😉
```

On définit ensuite le module avec un fichier `mon-module.module.ts`. C'est le fichier principal du module, c'est lui qui va indiquer à NestJS ce qu'il faut charger pour que le module fonctionne ! Il se déclare de la manière suivante :

```typescript
@Module({
  providers: [DummyService],
  controllers: [DummyController],
})
export class DummyModule {}
```

Parfois tu auras besoin de définir d'autres paramètres dans le décorateur (le `@Module()`{l=ts}):

- `imports` qui est une liste de modules. Il te permet notamment d'importer automatiquement des providers exportés d'autres modules.
- `exports` qui doit impérativement être une sous-liste de `providers`. Cela permet de marquer les providers listés comme étant exportés, c'est-à-dire importables dans d'autres modules.

Afin que le module soit chargé, il doit être importé dans l'attribut `imports` d'un autre module (sauf si c'est le module racine auquel cas il est appelé avec `NestFactory.create`{l=ts}). On choisira le module dont il fait logiquement partie, par exemple dans le cas de notre module `cart`, on pourra le mettre dans le module `shop`. Cela donnera des routes en `/shop/cart`

Nous allons maintenant aborder la façon dont nous allons déclarer et créer des routes.

### Les controllers

On va créer un fichier `mon-module.controller.ts` qui va contenir tous les controllers. C'est dans ce fichier qu'on va définir les différentes routes qui sont disponibles dans le module. Il est importé par le module à l'aide de l'attribut `controllers`.

Le fichier est constitué d'une seule classe dont la plupart des méthodes seront des routes. Voici un exemple :

```ts
@Controller('dummy')
@ApiTags('Dummy')
export class DummyController {
  constructor(private dummyService: DummyService) {}

  @Get()
  @ApiOperation({ description: 'This is a dummy route' })
  @ApiOkResponse({ type: DummyResDto })
  async dummyRoute(): Promise<DummyResDto> {
    return (await this.dummyService.performDummyOperation()).map(this.formatDummy);
  }

  private formatDummy(dummy: Dummy) {
    return {
      data: dummmy.xyz,
    };
  }
}
```

Passons en revue les différentes particularités d'une classe _controller_ comme celle-ci :

- un _controller_ est déclarée avec le décorateur `@Controller(...)`{l=ts}. Il prend en paramètre le préfixe de toutes les routes déclarées dans le _controller_ : dans le cas de notre module `cart` il faudrait utiliser `@Controller('shop/cart')`{l=ts}.
  ```{note}
  S'il s'agit du controller racine, on peut omettre le paramètre du décorateur et utiliser uniquement `@Controller()`{l=ts}
  ```
- on rajoute un tag pour la [documentation Swagger](documentation.md#documentation-swagger).
- le constructeur du _controller_ est très important, c'est par lui que nous pouvons accéder aux _providers_. En effet, NestJS va instancier le _controller_ avec les _providers_ déclarés dans l'attribut `providers` du module (et aussi les _providers_ exportés des autres modules importés). Puisque nous nous servons des _providers_ dans le _controller_, nous les gardons en variable en utilisant le [mot-clé `private`{l=ts}](https://www.typescriptlang.org/docs/handbook/2/classes.html#parameter-properties).
  ```{note}
  Les paramètres du constructeur ne sont pas ordonnés ! Laisse donc NestJS trouver le bon provider à utiliser pour chacun de tes arguments 😉 \
  Tu n'est pas obligé pas de déclarer tous les providers présents dans le champ `providers` du module.
  ```
- les fonctions du _controller_ vont nous permettre de définir les routes et d'effectuer quelques opérations basiques en rapport direct avec de la mise en forme des données renvoyées (ex. du formattage)
  Les routes sont déclarées marquées par un décorateur indiquant la [méthode http](https://developer.mozilla.org/fr/docs/Web/HTTP/Methods) et l'URL qui lui est associée. \
  Dans le cas de notre exemple, on pourrait ainsi avoir `@Get()`{l=ts} pour récupérer le contenu du panier à l'url `/shop/cart` ou `@Post('item')`{l=ts} pour ajouter un item à l'url `/shop/cart/item`
- Les autres décorateurs présents dans cet exemple sont expliqués dans la [documentation Swagger](documentation.md#documentation-swagger)

  Les routes renvoient un objet qui sera transformé en JSON par NestJS avant d'être envoyé dans la réponse.

  ```{important}
  Les routes déclarées dans les _controllers_ ne doivent pas contenir les opérations effectuées côté serveur mais uniquement des appels à ces opérations ou des vérifications en fonction des paramètres de la requête. \
  Les opérations (interactions avec la base de données, envoi de mail, génération de documents, etc) devront être effectuées dans un _**provider**_.
  ```

  Si la vérification d'une condition échoue, on ne renverra pas d'objet dans la fonction mais on soulèvera une erreur. Plus de détails sur ce processus [ici](#la-gestion-des-erreurs).

  On aura souvent besoin, lors de l'écriture d'une route, de récupérer les informations transmises par l'utilisateur ou des informations de session. Voici comment y accéder :

  - pour récupérer l'utilisateur connecté _(ou `null` si l'utilisateur ne l'est pas)_, il suffit de rajouter un argument à la fonction en le décorant avec `@GetUser()`{l=ts}.
  - pour accéder aux informations envoyées par l'utilisateur en query (c'est à dire dans l'url `mon-url?data=userinputisalwaysunsafe`), il faut ajouter un argument à la fonction en le décorant avec `@Query()`{l=ts}.

    ```{danger}
    Attention, il faut également créer le type de cet argument pour vérifier son format et sa structure. Voir [créer un DTO](#créer-un-dto).
    ```

  - pour accéder aux informations envoyées par l'utilisateur dans le _body_ (dans le cas d'une requête `POST`, `PUT` ou `PATCH`), il faut ajouter un argument à la fonction en le décorant avec `@Body()`{l=ts}.

    ```{danger}
      Attention, il faut également créer le type de cet argument pour vérifier son format et sa structure. Voir [créer un DTO](#créer-un-dto).
    ```

  - pour certains objets REST (et parce que ça fait stylé en vrai), on peut créer des routes "génériques". C'est-à-dire des routes qui vont être appelées pour avec plusieurs urls possibles. Par exemple pour une UE, on veut une url par UE (ex. `/ue/MT01` et `/ue/MT02`). Dans ce cas, il faut récupérer le contenu de l'url afin de pouvoir appeler les bonnes fonctions du _controller_. On utilisera alors un argument rajouté à la fonction et décoré avec `@Param(...)`{l=ts}. Il faudra lui donner le nom du paramètre (donné après les `:` dans la route) et, si besoin, de quoi parser la valeur.

    Voici un exemple d'utilisation de paramètre :

    ```ts
    @Get('/:dummy/action')
    async dummyRoute(@Param('dummy') dummy: string) {
      ...
    }
    ```

### Créer un DTO

Nous utilisons des DTO _(Data Transfer Object)_ pour définir la structure et le format que les données envoyées par l'utilisateur doivent avoir et s'assurer que les données renvoyées par l'API correspondent bien à un type précis. Un DTO est défini comme tout objet transitant entre le client et l'API (peu importe le sens) : un objet reçu par l'API est un _ReqDto_ (Request DTO), et un objet renvoyé est un _ResDto_ (ResponseDto). Les DTOs sont simplement des classes définies dans des fichiers spécialisés, permettant de normaliser les données.

#### Les user-inputs

Il faudra créer le dto dans un fichier `dto/req/dummy-data-req.dto.ts` (cf. les [conventions de nommage](conventions.md#noms-de-fichiers-dossiers-variables-fonctions-etc)) et ajouter des décorateurs à chaque propriété pour vérifier que les valeurs correspondent bien à ce que l'API attend. On pourra également décorer les propriétés afin d'expliciter leur usage pour la [documentation générée par swagger](documentation.md#documentation-swagger).

On aura ainsi des DTOs qui ressemblent à cela :

```ts
export class DummyDataReqDto {
  @IsString()
  @IsOptional()
  dummyProperty?: string;
}
```

````{note}
Les propriétés d'un DTO peuvent être d'un autre type que `string`. Dans ce cas, il faut ajouter le décorateur `@Type(...)`{l=ts} du package `class-transformer`. Il s'utilise avec une fonction de "mapping" comme un constructeur dans l'exemple qui suit :
```ts
@Type(() => Number)
@IsInt()
@Max(5)
@Min(1)
value: number;
```

````

#### Les outputs

La création des DTO des réponses est plus simple puisque nous ne devons pas effectuer les validations des inputs de l'utilisateur. Il suffit de créer un fichier `dto/res/dummy-data-res.dto.ts` et d'y écrire une classe qui décrit le type retourné par la route.

### Les services

C'est dans les services (aussi appelés _providers_) que sont exécutées les opérations de traitement. Il peut s'agir d'interagir avec la base de données, de générer des documents, etc.

De la même façon qu'un _controller_, NestJS fournira les _providers_ disponibles aux arguments du constructeur de la classe. Voici un exemple de service :

```ts
@Injectable()
export class DummyService {
  constructor(private prisma: PrismaService) {}

  doDummyOperation(): Promise<void> {
    this.prisma.dummy.updateMany({
      where: {
        data: null,
      },
      data: {
        data: 'dummy',
      },
    });
  }
}
```

```{important}
Pour qu'une class puisse être utilisée par NestJS dans le constructeur d'un _controller_ ou d'un service, elle doit être décorée par `@Injectable()`
```

## Le cycle de vie d'une requête

De la requête initiée par l'utilisateur à la réponse que l'API lui renvoie, les données passent des vérifications et peuvent entrainer un certain nombre de modifications sur l'état de l'application, de ses données et de ses services. Nous allons dans cette
partie comprendre les étapes essentielles par lequelles passent une requête HTTP faite à l'API.

NestJS définit plusieurs étapes dans la résolution d'une requête faite à l'API. Ce découpage nous permet d'avoir une structure plus claire et d'exécuter le bon code au bon moment. Voici, dans l'ordre d'appel, la liste de ces différentes étapes :

### Les middlewares [_(docs)_](https://docs.nestjs.com/middleware)

Ce sont les premières fonctions à être appelées lors de la réception d'une requête. Ce sera principalement du code modifiant profondément l'API par exemple en rajoutant un préfixe (ex. le versionning `/v1/`) ou activant des politiques CORS.

```ts
// Adds a prefix to the API
app.setGlobalPrefix(process.env.API_PREFIX);
// Adds a CORS policy
app.enableCors({ origin: '*' });
```

```{note}
Les middlewares correspondent aux `app.use()`{l=ts} de ExpressJS
```

### Les guards [_(docs)_](https://docs.nestjs.com/guards)

Parfois notre API ne doit pas exécuter certaines requêtes, par exemple si l'utilisateur n'est pas connecté alors que la route le nécessite; s'il n'a pas les permissions suffisantes, etc. Nous devons vérifier cela assez tôt dans le traitement de la requête pour ne pas traiter des données inutiles.

On les utilise généralement de la façon suivante quand ils sont appliqués à une route unique :

```ts
@UseGuards(DummyGuard)
async dummyRoute(): Promise<DummyType>
```

Sinon, on pourra les appliquer au [module](#les-modules) tout entier comme suit

```ts
@Module({
  imports: [SubModule],
  providers: [
    {
      provide: APP_GUARD,
      useClass: DummyGuard,
    },
  ],
})
export class DummyModule {}
```

```{tip}
L'API de EtuUTT utilise des guards personnalisés, ils sont listés [ici](#outils-spécifiques-du-site-étu).
```

### Les interceptors [_(docs)_](https://docs.nestjs.com/interceptors)

Ils permettent d'ajouter une logique commune à plusieurs routes. Un _interceptor_ peut exécuter du code avant le _controller_ mais aussi après, permettant ainsi d'avoir facilement accès en même temps aux _inputs_ et aux _outputs_ de la route avant d'envoyer la réponse à l'utilisateur. Il peut bien évidemment remplacer l'exécution du _controller_, par exemple dans le cas de la mise en place de cache sur certaines routes.

On l'utilise de la même façon que les guards, comme suit :

```ts
@UseInterceptors(DummyInterceptor)
async dummyRoute(): Promise<DummyType>
```

```ts
@Module({
  imports: [SubModule],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: DummyInterceptor,
    },
  ],
})
export class DummyModule {}
```

```{note}
Dans le cas de l'API EtuUTT, on utilise par exemple des _interceptors_ pour les traductions de l'API ou pour les uploads de fichiers.
```

### Les pipes [_(docs)_](https://docs.nestjs.com/pipes)

Les pipes permettent d'effectuer des opérations sur les données envoyées par l'utilisateur avant l'exécution du _controller_. Il peut s'agir de vérifier que les données sont correctes (c'est à ce moment là que sont faites les vérifications liées aux [types des DTO](#les-user-inputs)) ou de les transformer, d'en changer le type.

### Le controller [_(défini plus haut)_](#les-controllers)

C'est le corps de la route, la fonction qui va appeler les différentes opérations à effectuer et qui va générer la réponse.

### Les interceptors

Les interceptors sont rappelés à ce moment là, et peuvent utiliser et modifier la réponse renvoyée par le _controller_.

### Les filters [_(docs)_](https://docs.nestjs.com/exception-filters)

Les _filters_ (ou _exception filters_ dans leur nom complet) permettent d'afficher des erreurs personnalisées et de gérer tous les cas non traités par l'application. Pour EtuUTT, nous utilisons le _filter_ par défaut mais modifions le format des erreurs connues et gérées par l'API.

```{seealso}
Voir la [gestion des erreurs](#la-gestion-des-erreurs)
```

Après toutes ces étapes, l'utilisateur reçoit la réponse de l'API.

Voici une illustration qui permet de récapituler les différentes étapes dans le cas de EtuUTT :

```{image} request-lifecycle.png
:height: 400
:alt: Request lifecycle
```

## Outils spécifiques du site étu

### La gestion des erreurs

Nous avons implémenté des messages d'erreurs customisés, voir la page sur [la gestion des erreurs](errors.md).

### L'authentification nécessaire par défaut

Nous appliquons une politique zéro accès par défaut, ainsi les routes sont par défaut uniquement accessibles aux utilisateurs connectés.

Pour rendre une route accessible à tous (la rendre publique), il faudra utiliser le décorateur `@IsPublic()`{l=ts}.

Cela donne par exemple :

```ts
@IsPublic()
@Post('dummy')
async dummy(@Body() dto: DummyReqDto): Promise<void> {
  ...
}
```

### La gestion des types d'utilisateur

Un utilisateur peut être étudiant, enseignant, ancien étudiant, etc

Ça fait beaucoup de monde sur le site étu... et certaines fonctionnalités sont accessibles uniquement à certains types d'utilisateurs. On peut facilement limiter l'accès à une route avec le décorateur `@RequireUserType(...)`{l=ts}. Le décorateur prend autant d'arguments que de `UserType` acceptés pour accéder à la route.

```{important}
Dans le cas de l'utilisation de `@UserType()`{l=ts} avec plusieurs `UserType`, un utilisateur peut accéder à la route s'il a **UN** des types demandés.
```

## Quand NestJS ne suffit pas...

Dans certains cas, l'utilisation de NestJS ne permet pas d'être aussi flexible qu'on l'aurait souhaité, notamment pour modifier les certains paramètres de la réponse de l'API.

### Accéder à la requête/réponse ExpressJS

S'il est nécessaire d'accéder à la requête ExpressJS depuis le _controller_, on pourra utiliser le décorateur `@Request()`{l=ts}/`@Response()`{l=ts} pour gérer certaines choses à la main.

Ce sera notamment le cas pour le streaming de fichiers.

```{attention}
Si le décorateur `@Response()`{l=ts} est utilisé, NestJS ne gère plus la réponse. Ainsi, la valeur de retour du _controller_ est inutile, il faut utiliser la fonction [`res.send(...)` de ExpressJS](https://expressjs.com/en/4x/api.html#res.send).
```
