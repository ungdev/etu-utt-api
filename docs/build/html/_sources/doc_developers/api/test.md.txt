# Test

Pour les tests, nous utilisons Jest.

Dans la CLI, quand on exécute les tests, il faut absolument passer le paramètre `--runInBand`, pour éviter que les tests
ne s’exécutent en parallèle. Le paramètre est passé par défaut dans les commandes `package.json`

Les tests sont divisés en 2 parties :

- E2E (End-to-End) : tous les tests testant des routes, en simulant une requête d’un client.
- Unit (Unitaires) : les tests unitaires permettent de tester une partie de l’API. Il n’y en a pas pour toutes les
  parties de l’API, uniquement les plus complexes, là où c’est jugé nécessaire.

## Suite

Une suite est un ensemble de test permettant de tester une fonctionnalité : route, service, … Une suite représente en
réalité une simple fonction qui, une fois exécutée, crée un `describe()` avec un `beforeAll()` pré-généré.
Ce `beforeAll` permet notamment de vider complètement la base de données. La fonction permettant de créer une suite
prend 2 paramètres, les mêmes qu’un `describe` : le nom de la suite et le callback. Le callback prend un argument :
l’`AppProvider`. L’`AppProvider` est utilisé pour toutes les interactions avec l’API : requêtes, Prisma, …

De la même manière qu’il y a 2 types de tests, il y a 2 types de suites et d’`AppProvider` : les suites
E2E / `E2EAppProvider`, et les suites unitaires / `UnitAppProvider`. Voici donc comment vous pouvez créer une suite pour
tester la route `GET /users/:id` :

```ts
import { e2eSuite, E2EAppProvider } from '../../utils/test_utils';

const GetUserFromIdE2ESpec = e2eSuite('GET /users/:userId', (app: E2EAppProvider) => {
  // Insérez les tests ici : initialisation, it(), ...
});

import { INestApplication, VersioningType } from '@nestjs/common';

// Fonction dans le fichier e2e/app.e2e-spec.ts, exécutant tous les tests E2E
describe('E2E Spec', () => {
  let app: INestApplication;
  beforeAll(async () => {
    // Création de l'app
    app = (await Test.createTestingModule({ imports: [AppModule] }).compile()).createNestApplication();
    // ... Reste de l'initialisation de l'app.
  });
  GetUserFromIdE2ESpec(() => app);
});
```

## Module fakedb

Le module `fakedb` est un module simplifiant grandement l’écriture de tests, permettant notamment de générer plus
facilement des données de test. Le module abstrait beaucoup de fonctions que vous utilisez habituellement, assurez-vous
donc de bien lire et comprendre cette partie de la documentation.

### Plugin faker

Nous utilisons un plugin faker personnalisé, nous permettant de simplifier la création de code de semestres, d’UEs, etc.
Ce plugin permet aussi d’éviter, pour les champs uniques, de générer plusieurs fois les mêmes valeurs. Toutes les
additions de ce plugin sont dans l’objet `faker.db`. Cet objet a pour clés le nom de tables (plus précisément, les clés
de `FakeEntityMap`, voir plus bas). Les valeurs de cet objet sont des noms de colonnes de cette table. Par exemple, si
je veux générer le nom d’un semestre, je peux faire :

```ts
import faker from '@/faker-js/faker';

const semestre: string = faker.db.semester.code();
```

Si une valeur unique est hardcodée (par exemple, un numéro de semestre qui ne serait pas généré aléatoirement) dans un
test, la fonction `registerUniqueValue` du module. Dans le cas où je veux par exemple créer un semestre A24 dans un
test :

```ts
import { registerUniqueValue } from '<path_to_root_directory>/prisma/seed/utils';

const semestre: FakeSemester = createSemester(app, { code: registerUniqueValue('semester', 'code', 'A24') });
```

Pour le moment, ne vous préoccupez pas de `createSemester` et `FakeSemester`, leur nom sont suffisamment explicites pour
le moment.

Tous les champs uniques ne sont pas représentés. C’est le cas notamment des UUIDs, qui sont bien trop nombreux pour
qu’il y ait un intérêt à les représenter.

Si un champ est complexe à générer aléatoirement, on peut très bien l’ajouter dans le plugin, mais évidemment sans
appeler la fonction `registerUniqueValue` dessus.

### Création d’entités

Dans cette section, ce que l’on nomme une “entité” est une entrée d’une certaine table dans la base de données. Par
exemple, l’utilisateur qui me représente est une entrée, le semestre A24 est une entrée, etc.

À toute entité que l’on pourrait vouloir générer de façon aléatoire, on définit un type qui représente une version
“fake” de cette entité (*fake entity*). Ces versions fake sont `Partial`, ce qui signifie qu’aucun de leur champ n’est
obligatoire : on peut toutes leur assigner la valeur `{}`. La plupart du temps, ces versions fake sont exactement les
versions raw (celles qui sont directement données par prisma, telles qu’elles sont définies dans la base de données,
sans relations), passées dans le type `Partial` évidemment. Cependant, certaines entités générées aléatoirement peuvent
être plus complexes, par exemple un utilisateur : il aura ses données par défaut (`RawUser`), quelques informations
supplémentaires (`RawUserInfos`), ainsi qu’un token (pour authentifier ses requêtes) et un tableau de ses permissions :

```ts
export type FakeSemester = Partial<RawSemester>; // Exemple d'un type fake simple.
export type FakeUser = Partial<RawUser & RawUserInfos & { permissions: string[]; token: string }>; // Exemple d'un type fake plus complexe.
```

**Création de fake entities**

Ensuite, pour générer une fake entity, vous pouvez appeler la fonction
correspondante : `createUser`, `createSemester`, … (*fake functions*)

Les fake functions sont toutes définies de la même façon :

- Le premier argument est l’`AppSupplier`.
- Le deuxième argument (`dependencies`) est un objet de paramètres obligatoires (**dépendances**) : ils peuvent par
  exemple représenter d’autres fake entities. Pour créer une filière par exemple, on doit avoir une branche créée
  préalablement, et créer la filière pour cette branche. On passera donc le paramètre `branch` dans cet objet.

  Ce deuxième argument n’est pas toujours existant, si l’entité ne contient pas de dépendances. Les arguments suivants
  seront donc *techniquement* mal numérotés dans la documentation, mais pour un souci de clarté, nous allons quand
  même appeler l’argument suivant le “troisième”, même si pour certaines fonctions, ça sera le deuxième.

- Le troisième argument (`rawParams`) est un objet permettant de passer les autres paramètres, tous optionnels. Cela
  signifie que vous pouvez passer `{}`. Si besoin, des valeurs par défaut seront utilisées (nous allons voir comment ces
  valeurs sont définies plus tard). Ce paramètre est optionnel, si vous n’avez pas besoin de passer d’argument,
  omettez-le.
- Le quatrième argument (`onTheFly`) permet de définir le comportement de la fonction :
    - S’il vaut `true`, on crée l’entité directement.
    - S’il vaut `false`, l’entité sera créée dans un bloc `beforeAll`.

  L’argument est optionnel, et vaut par défaut `false`. Donc :

    - Si vous appelez la fonction dans un `describe` (ou équivalent), ne passez pas cet argument.
    - Si vous appelez la fonction dans un `it`, donnez la valeur `true` au paramètre.

Voici plusieurs exemples d’utilisation de ces fonctions :

```ts
import * as fakedb from '../../utils/fakedb';

e2eSuite("Foo", (app) => { // Vous pouvez aussi utiliser unitSuite, ou n'importe quoi d'autre, tant que c'est équivalent à un describe() et que vous pouvez avoir l'app.
  beforeAll(() => fonctionTest());
  const branche: FakeBranch = fakedb.createBranch(app); // Branch n'a pas de dépendance
  const semestre: FakeSemester = fakedb.createSemester(app, { code: registerUniqueValue('semester', 'code', 'A24') }); // Semester n'a pas de dépendance
  const filiere: FakeBranchOption = createBranchOption(app, { branch }); // BranchOption a 1 dépendance: Branch
  const ue: FakeUE = createUE(
      app,
      { semesters: [semestre], branchOption: filiere }, // UE a 2 dépendances : une liste de Semester, et une BranchOption
      {
        code: registerUniqueValue('XX03'),
        credits: [
          {
            category: {
              code: 'CS',
              name: 'CS',
            },
            credits: 6,
          },
        ],
      }, // We passed quite a lot of parameters there, they are all optional, we can remove any one of them.
    )
  ;

  const fonctionTest = () => {
    // Les objets que nous avons créés sont toujours vides
    // (le beforeAll qui appelle cette fonction a été défini au tout début, il sera donc appelé avant tous les autres beforeAll.
    // Les objets ont quand même été créés, ils n'ont juste pas été remplis)
    expect(semestre).not.toBeUndefined();
    expect(semestre.code).toBeUndefined();
  }

  it("bar", () => {
    const user: FakeUser = fakedb.createUser(app, {}, true); // User n'a pas de dépendance. On le crée à la volée :
                                                             // à la fin de l'appel à la fonction, user sera rempli et aura été sauvegardé dans la base de données
    // Ici, la base de donnée a été seed, les objets ne sont plus vides.
    expect(semestre.code).toBeEqual('A24');
    expect(user.id).not.toBeUndefined();
  });
});
```

Les types des paramètres des différentes fonctions se trouvent dans l’interface `FakeEntityMap`. Sa structure est la
suivante :

```ts
interface FakeEntityMap {
  [nom_de_table]: {
    entity: TypeEntityFake;
    params: TypeParametresOptionnels;
    deps?: TypeDependances;
  };

  // 2 exemples :
  branch: {
    entity: FakeBranch;
    params: CreateBranchParameters;
  };
  branchOption: {
    entity: FakeBranchOption;
    params: CreateBranchOptionParameters;
    deps: { branch: FakeBranch };
  };
}
```

On peut accéder aux types directement, ou plus facilement en utilisant les 3 types suivants :

```ts
export type Entity<T extends keyof FakeEntityMap> = FakeEntityMap[T]['entity'];
type Params<T extends keyof FakeEntityMap> = FakeEntityMap[T]['params'];
type Deps<T extends keyof FakeEntityMap> = FakeEntityMap[T] extends { deps: infer R } ? R : Record<string, never>;
```

Ces 3 types prennent en paramètre le nom de la table (`branch`, `user`, `semester`, `branchOption`, …).

Tous les outils développés et documentés dans la suite de cette partie ont permis d’obtenir ce résultat : leur code est
difficile à lire à cause de sa complexité, mais nous pensons qu’ils permettent de grandement simplifier la lisibilité,
l’écriture, la redondance du code ensuite. Il n’y a que quelques centaines de lignes tout au plus de code fortement
typé (et assez abstrait), normalement, vous serez capable de comprendre le fonctionnement global de ces lignes à la fin
de la partie suivante.

**Création de fake functions**

Une fonction pour générer une entité fake ressemble à ça :

```ts
const createBranchOption = <OnTheFly extends boolean = false>(
    app: AppProvider,
    dependencies: FakeEntityMap.branchOption.deps,
    rawParams: FakeEntityMap.branchOption.params = {},
    onTheFly: OnTheFly = false as OnTheFly,
  ): OnTheFly extends true ? Promise<Entity<'branchOption'>> : Entity<'branchOption'> => {
    // L'entité qui sera retournée, pleine ou vide en fonction de la variable de onTheFly
    const lazyEntity: Entity<'branchOption'> = {};
    // La fonction qui sera appelée pour créer la fake entity
    const factory = async () => {
      // Paramètres par défaut
      const params = {
        code: faker.db.branch.code(),
        name: faker.name.jobTitle(),
        ...rawParams,
      } as Params<'branchOption'>;
      // Création de l'entité
      const entity = await app().get(PrismaService).uTTBranchOption.create({ data: { /* Paramètres de création */ } });
      // On injecte la valeur en entity dans lazyEntity, de manière à modifier la valeur de la référence
      // Si on avait directement fait lazyEntity = entity, on aurait modifié la valeur pointée par la variable
      // et donc la variable détenant la valeur retournée par createBranchOption resterait inchangée
      return Object.assign(lazyEntity, entity);
    };
    if (onTheFly === true) {
      // On retourne directement le retour de la factory.
      return factory() as OnTheFly extends true ? Promise<Entity<'branchOption'>> : never;
    }
    // On ajoute un beforeAll, qui appelera la factory.
    beforeAll(factory);
    // Et on retourne la référence du lazyEntity. Quand le beforeAll sera appelé, lazyEntity sera rempli
    return lazyEntity as OnTheFly extends true ? never : Entity<'branchOption'>;
  }
;
```

Ne cherchez pas ce code, il n’existe pas, ou du moins pas sous cette forme. On vous l’a mis là pour que vous puissiez
bien saisir la logique des fake functions. On remarque vite que la logique pour toutes les fake functions est exactement
la même, et que le code est donc très redondant. Voici donc à quoi ressemble la définition réelle
de `createBranchOption` :

```ts
export const createBranchOption = entityFaker(
  'branchOption',
  {
    code: faker.db.branchOption.code,
    name: faker.name.jobTitle,
  },
  async (app, dependencies, params) =>
    app()
      .get(PrismaService)
      .uTTBranchOption.create({
      data: { /* Paramètres de création */ }
    }),
);
```

`entityFaker` est une fonction permettant de créer des fake functions. La fake function générée par entity faker a
exactement le même comportement que celle que nous avons détaillée au-dessus. Détaillons chacun de ses paramètres :

- `_kind` : le type de la fake function à créer. C’est le nom d’une table (plus précisément d’une clé
  de `FakeEntityMap`). Il permet de déduire le type des paramètres, des dépendances, et de la fake entity.
- `defaultParams` : les paramètres par défaut de la fake function. Ce doit être un subset du type des `params` de la
  fake entity.
- `entityFactory` : une fonction retournant une `Promise` de la fake entity. Elle prend en paramètre l’`AppProvider`,
  les dépendances et les paramètres de la fake entity que nous voulons créer. Si la fake entity n’a pas de dépendance,
  la fonction ne prend que 2 paramètres, le paramètre n’est pas passé.

La fonction retourne alors une fonction prenant 3 ou 4 paramètres (en fonction de l’existence ou non de dépendances dans
la `FakeEntityMap`). La fake function est ainsi utilisable comme nous l’avons vu jusqu’alors.