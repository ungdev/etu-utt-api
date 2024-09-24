# Gestion des erreurs

Afin de retourner des erreurs compréhensibles, nous avons choisi de retourner un message d'erreur, lisible par un
humain, ainsi qu'un code facilement interprétable par un logiciel client. Cela nous permettra d'améliorer nos messages
d'erreurs à l'avenir sans casser tous les logiciels utilisant notre API et à faciliter les mises à jour des logiciels
clients vers des versions plus récentes de l'API.

Ainsi, toute erreur gérée par l'API aura le format suivant :

```json
{
  "errorCode": 2099,
  "error": "This is a dummy error."
}
```

## Lever une erreur

Les erreurs gérées par l'API sont levées avec une instance de `AppException`. Le constructeur prend en argument un code
d'erreur qu'il faudra préalablement renseigner dans l'enum `ERROR_CODE` puis dans l'objet `ErrorData`. Cela permet
d'attribuer un code, un message et un status HTTP à l'erreur.

```{note}
Les messages d'erreur peuvent prendre des arguments donnés lors de l'appel du constructeur de `AppException`. Pour cela, utilise le symbole `%` dans le message d'erreur : le typage typescript de `AppException` s'adaptera en fonction du message d'erreur que tu auras choisi.
```

```ts
throw new AppException(ERROR_CODE.NO_TOKEN);
```

## Tester une erreur

Dans vos tests, vous pouvez utiliser la méthode `expectAppError` dans le `Spec`, prenant en paramètre le type de
l'erreur, ainsi que les éventuels arguments de l'erreur.

```ts
pactum
  .spec()
  .post('/auth/signin')
  .withBody({...dto, login: undefined})
  .expectAppError(ERROR_CODE.PARAM_MISSING, 'login');
```

## Créer un nouveau type d'erreur

Pour créer un nouveau type d'erreur, allez dans le fichier `src/exceptions.ts`, et ajoutez une entrée à l'_enum_
`ERROR_CODE` (essayez de trouver un emplacement logique par rapport à ce qui existe déjà).
Puis, ajoutez une entrée à l'objet `ErrorData` pour définir le message à renvoyer, et le code HTTP. Dans le message,
vous pouvez utiliser le caractère % pour demander à recevoir un paramètre. Ce paramètre sera demandé automatiquement par
`AppException(...)` et `expectAppError(...)`
