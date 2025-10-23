# Texte formatable

```{danger}
*Le texte formatable est un **sujet de travail actuel**. Son implémentation est susceptible de changer.* \
Par ailleurs, il est possible que cette fonctionnalité soit séparée dans un package nodejs indépendant.
```

A certains endroits du site étu, les utilisateurs pourront formatter du texte. Nous avons décidé de nous baser sur une bibliothèque, [lexical](https://lexical.dev) ([github](https://github.com/facebook/lexical)). Bien que l'utilisateur puisse envoyer du contenu formatté sur à peu près n'importe quel champ texte de l'api (à condition de respecter la limite de caractères), il n'y a que quelques champs qui supportent réellement le texte formatté.

```{warning}
Les champs qui ne supportent pas le texte formatté acceptent **pour le moment** des inputs formattés. Cependant, ces champs ne seront pas traités comme telles par les applications front-end (comme le front du site étu). Cela peut donner lieu à un affichage considéré comme buggé si la feature est mal utilisée par certaines implémentations front-end !
```

## Abbréviations dans ce document

Nous utiliserons dans ce documents les abbréviations/anglicismes suivantes :

- RTE: Rich Text Editor, l'éditeur de texte dans lequel l'utilisateur peut formater du texte
- Renderer: côté serveur, la fonction qui transforme du contenu lexical en html
- Document Object Model (DOM): la structure d'un document, généralement HTML. On l'utilisera ici pour parler de tout ce qui est relatif à l'affichage du texte formatable.

## Les bundles

Un bundle est la définition de l'ensemble des contenus supportés par une zone de texte formatable. Il contient des [nodes](#node) et, pour le front, des [plugins](#plugin) et des [composants de toolbar](#composant-de-toolbar).
La définition d'un bundle permet de configurer plusieurs RTE ou Renderers de manière identique.

Détaillons maintenant les différents éléments contenu dans un bundle :

### Node

Une node est une partie du texte ou un élément visuel que l'utilisateur peut ajouter à son texte. Il peut s'agir par exemple d'images, d'émojis customs, ou de texte avec un fond coloré.
Pour créer de nouvelles capacités/de nouveaux éléments dans le texte formatté, la première étape est de créer une `class` qui hérite de `ElementNode`, `TextNode` ou `DecoratorNode`. Pour voir les méthodes à implémenter, regarde [la doc de lexical](https://lexical.dev/docs/concepts/nodes#creating-custom-nodes). Comme indiqué plus bas dans la doc, tu peux utiliser [`$config` et ne pas implémenter les 3 fonctions statiques](https://lexical.dev/docs/concepts/nodes#extending-elementnode-with-config).

```{tip}
Seule les `DecoratorNode` pourront être rendues avec une ReactNode côté front (cf. `DecoratorNode#decorate`). Si tu n'as pas envie d'écrire des opérations DOM, cela peut être une bonne solution 😉
```

Lorsque tu appliques des classes à des éléments, fais bien attention à prendre celles du thème de l'éditeur, `editor.theme[className]`. Tu pourrais sinon oublier de les implémenter de l'autre côté (serveur/client) et le rendu serait alors différent !

Si tu souhaites remplacer une node déjà définie, tu peux enregistrer des [remplacements](https://lexical.dev/docs/concepts/node-replacement). Cela t'évitera de devoir copier-coller tout son code, et à chaque fois qu'une node remplacée sera créée, elle sera transformée en ta nouvelle node à l'aide de la fonction que tu auras définie !

### Plugin

Les plugins n'existent que côté front-end. Ce sont eux qui vont ajouter de la logique, tu vas pouvoir:

- écouter des [évènements](https://lexical.dev/docs/concepts/commands), à l'aide de `editor.registerCommand()`
- enregistrer des [transformers](https://lexical.dev/docs/concepts/transforms) avec `editor.registerNodeTransform()`
- en react, utiliser `useEffect`
- rendre un élément supplémentaire, un overlay par exemple

```{admonition} TLDR
:class: tip
Un transformer, c'est du code qui va te permettre de transformer du contenu dans le RTE au fur et à mesure qu'il est ajouté. Par exemple, tu peux transformer automatiquement `:joy:` en l'émoji correspondant, 😂.
```

### Composant de toolbar

Ce qui permettra à l'utilisateur d'intéragir avec tes nodes depuis une interface.

A l'heure actuelle, ces composants n'existent pas encore en tant que tel et font partie du composant `ToolbarPlugin`. Leur future séparation permettra d'ajouter facilement des composants (boutons, etc) custom dans cette toolbar.

## Côté serveur

Bien que le serveur n'ait pas à gérer l'édition en temps réel, il doit pouvoir effectuer quelques opérations sur le contenu généré par l'utilisateur. Cela inclut la validation du contenu lexical et l'export en HTML (pour pouvoir l'utiliser dans des emails par exemple).

```{admonition} Structure Lexical
La structure envoyée entre le client est le front est un JSON (créé avec `LexicalNode#exportJSON`). Il contient les nodes imbriquées les unes dans les autres.
```

### La validation

La validation vérifie que le contenu fourni utilisateur a bien une structure comprise par le serveur. Cela vérifie :

- que c'est bien du JSON
- que l'éditeur lexical le comprend
- qu'il n'y a pas de node absente du bundle
- qu'il n'y a pas de propriétés inconnues sur les nodes

```{attention}
Les propriétés des nodes doivent apparaitre dans le même sens lors de l'exportJSON côté front et côté serveur.
```

### Le rendu

Le rendu permet au serveur de transformer du contenu lexical en html. Il faut faire attention à deux points ici :

- les méthodes `DecoratorNode#decorate` doivent être enlevées et le contenu de la node doit être traduit en instructions DOM dans `DecoratorNode#createDOM`
- les styles appliqués sur le front doivent être réappliqués sur le DOM produit sur l'API. Cela peut nécessiter des modifications structurelles dans l'HTML généré. En cas de besoin, il est possible d'ajouter des conditions spécifiques dans `NodeStyleInjector.ts`
