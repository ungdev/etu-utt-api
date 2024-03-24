# Conventions

Cette page traite des conventions utilisées dans le développement de l’API EtuUTT.

## Langue

Les noms de variables, de fonctions, de classe, de fichiers, de dossiers, les commentaires, etc. doivent être en
anglais.

## Noms de fichiers, dossiers, variables, fonctions, etc.

Pour les noms de variables et de fonction, on utilise le _camelCase_ : le premier mot doit être écrit totalement en
minuscule, la première lettre des mots suivants doit être en majuscule (`myVariable`, `aLongFunctionName`).

Pour les noms de classe et de types, on utilisera la convention _PascalCase_ : chaque mot commence par une majuscule
(`MyClass`, `ThisTypeHasALongName`).

Le nom d'une classe doit être suffixé par ce qu'elle représente :

* Les classes de type module : `Module` (`UsersModule`),
* Les classes de type service : `Service` (`UsersService`),
* Les classes de type DTO (Data Transfer Object) : `Dto` (`UsersSearchDto`).
* Les classes de type pipe : `Pipe` (`RegexPipe`).
* etc.

Les noms de fichiers et de dossiers doivent être _kebab-case_ : entièrement en minuscule, sans espace, et séparés par
des tirets (`-`). Par exemple, un fichier nommé `MyClass.ts` devrait être renommé en `my-class.ts`.

Sauf pour certains fichiers particuliers (`main.ts`, `exceeptions.ts`, etc.), l'extension des fichiers TypeScript doit
être `.<type_de_fichier>.ts`. `<type_de_fichier>` peut prendre les valeurs suivantes :

* `module` si le fichier contient un module
* `service` si le fichier contient un provider
* `dto` si le fichier contient un DTO (Data Transfer Object)
* etc.

On aura alors par exemple `auth.service.ts` ou `profile-update.dto.ts`.

## Style de code

Le fichier `.eslintrc.js` contient les conventions de syntaxe utilisées dans le projet. Avant d’être acceptée, une PR
doit toujours suivre ces conventions. Pour s’assurer que l’intégralité du projet les suit, vous pouvez simplement
exécuter la commande `pnpm lint`. Si cette commande produit des erreurs, vous devez les corriger avant de merge la PR.


