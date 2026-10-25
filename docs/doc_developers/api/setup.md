# Setup de l'API EtuUTT

## Prérequis

On supposera que :

- Vous avez une connexion internet (sinon comment vous êtes-vous retrouvé ici ?) ;
- Vous avez [Git](https://git-scm.org) ;
- Vous avez un compte GitHub ;
- Vous savez utiliser les commandes de base d'un système UNIX (`cd`, `ls`, `mkdir`, `cp`, etc.)

La documentation est écrite pour un ordinateur sous
Ubuntu, vous pouvez aussi utiliser WSL (Windows Subsystem for Linux).

## NodeJS

NodeJS est le moteur qui permet de faire tourner le code JavaScript hors d'un navigateur. Pour installer NodeJS, vous
pouvez utiliser les commandes suivantes :

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install nodejs
```

Vous pouvez remplacer `22` par la version de NodeJS que vous souhaitez installer.

Si vous avez besoin de mettre à jour NodeJS vers une version spécifique, vous pouvez exécuter les commandes suivantes (
pour utiliser Node 24 dans l'exemple donné) :

```sh
sudo npm i -g n
sudo n 24
```

Ces commande ne fonctionneront pas sous Windows (mais de toute façon, vous utilisez WSL, right ? :)).

Vous pouvez maintenant utiliser le gestionnaire de dépendances utilisé dans le projet : PNPM.

```bash
sudo npm install -g pnpm
```

Pour vérifier l'installation, tapez `pnpm --version` dans la console. Si vous n'avez pas d'erreur, vous avez bien
installé PNPM.

## Préparer la base de données

Pour utiliser l'API, vous aurez besoin d'une base de données MariaDB (ou MySQL). Vous pouvez installer MariaDB avec la
commande suivante :

```bash
sudo apt install mariadb-server
```

Si vous êtes sous WSL, vous aurez besoin de démarrer MariaDB :

```bash
sudo service mariadb start
```

Vous pouvez maintenant vous connecter à MariaDB avec la commande suivante :

```bash
sudo mariadb
```

Si vous avez une erreur, c'est peut-être que votre service n'est pas démarré. Référez-vous à la commande au-dessus.

Vous allez avoir besoin de créer un utilisateur `dev` :

```sql
CREATE
USER 'dev'@'localhost' IDENTIFIED BY 'dev';
GRANT ALL PRIVILEGES ON *.* TO
'dev'@'localhost' WITH GRANT OPTION;
FLUSH
PRIVILEGES;
```

Puis de créer 2 bases de données : une base de données pour l'environnement de dev, et une pour l'environnement de
test :

```sql
CREATE
DATABASE etuutt_dev;
CREATE
DATABASE etuutt_test;
```

Vous pouvez maintenant quitter MariaDB avec la commande `exit`.

## Récupérer le code source

Avant de récupérer le code source, vous devez avoir une clé SSH configurée sur votre compte GitHub. Pour savoir si vous
avez déjà une clé, tapez la commande suivante :

```bash
cat ~/.ssh/id_rsa.pub
```

Si le fichier n'existe pas, créez une clé SSH avec la commande suivante :

```bash
ssh-keygen
```

Puis, appuyer sur ENTREE pour chaque option proposée pour garder les options par défaut.

Ensuite, vous pouvez ajouter votre clé SSH à votre compte GitHub. Pour cela, copiez le contenu du
fichier `~/.ssh/id_rsa.pub` et collez-le dans la section "SSH and GPG keys" des paramètres de votre compte GitHub.

Déplacez-vous alors dans le dossier dans lequel vous voudrez que le dossier racine se situe (par exemple, `~/dev/etuutt`
pour que le projet se situe dans `~/dev/etuutt/api`). Vous pouvez maintenant récupérer le code source de l'API :

```bash
git clone git@github.com:ungdev/etu-utt-api.git api
```

Vous pouvez alors aller dans le dossier `api`.

## Configuration du projet

Pour configurer le projet, vous aurez besoin de créer une copie du fichier `.env.dist`, nommez-la `.env.dev`. Vous
pouvez alors changer les valeurs en vous référant à la documentation pour chacune d'entre-elle.

Créez une copie du fichier `.env.test.dist` et nommez-la `.env.test`. De même, les valeurs sont documentées directement
dans le fichier.

```{tip}
Si tes tests sont lents (>100s), configure `DATABASE_TEXT_PROTOCOL=true` dans les fichiers `.env`. Cela permet de ne pas utiliser le protocole binaire qui pourrait être mal supporté par ton moteur de base de données.

Si ta db ne répond plus à vos requêtes, ajoutez `?allowPublicKeyRetrieval=true&connectionLimit=3` à la fin de votre `DATABASE_URL`
```

## Utiliser les commandes du projet

### Installer les dépendances

Une dépendance est hébergée sur le Github Registry ([@ungdev/rich-turbo-editor](https://github.com/ungdev/rich-turbo-editor)). Pour cela tu vas avoir besoin de te connecter avec un token github.

Pour le créer, crée un [token (classic)](https://github.com/settings/tokens) lié à ton compte Github (choisis bien l'option _Generate new token (classic)_ !). Donne lui un nom évocateur et donne lui uniquement la permission `read:packages`. Tu peux choisir une date d'expiration ou ne le jamais le faire expirer si tu n'as pas de packages privés importants sur ton compte github (ou auxquels ton compte github a accès).

Configure maintenant pnpm pour qu'il utilise ton token sur le registry (remplace `{token}` par le token que tu viens de créer) :

```bash
pnpm config set "//npm.pkg.github.com/:_authToken" {token}
```

On peut maintenant installer les dépendances !

```bash
pnpm install --no-optional
# ou
pnpm i --no-optional
```

Après téléchargement, les dépendances seront installées.

### Commandes pour la base de données

Les commandes suivantes sont utiles pour administrer la base de données :

```bash
# Applique le schema.prisma aux bases de données dev et test. Attention, toutes les données actuellement présentes seront supprimées.
pnpm db:reset
# Lance l'interface de Prisma pour visualiser et interagir avec la base de données. Il est disponible à l'adresse http://localhost:5555.
pnpm db:editor
# Rempli la base de données avec des données de test. Les mots de passe seront tous "etuutt".
pnpm db:seed
```

Avant de lancer le serveur de développement, utilise `db:reset` puis `db:seed` ;)

### Lancer le serveur de développement

```bash
pnpm dev
```

Le serveur de développement est maintenant lancé. Vous pouvez accéder à l'API à l'adresse `http://localhost:3000`.

### Lancer les tests

```bash
pnpm test
```

Les tests sont tous lancés. Au bout de quelques secondes / minutes, tous les tests devraient correctement passer.

Tu pourras trouver les différentes options des tests [dans la page dédiée](./test.md).

## Compiler la documentation

Pour cela, vous devez avoir Python3 installé.

```bash
# Pour la première commande, il faut la faire uniquement la première fois, elle va installer les dépendances python
pnpm build:docs:configure
pnpm build:docs
```

Le résultat du build se situe alors dans `docs/build/html`. Le fichier racine est `index.html`. Le résultat de la
compilation est cette documentation que vous êtes en train de lire.

La documentation est écrite en markdown mais les directives RST sont supportées. Leur syntaxe est disponible sur [cette page](https://myst-parser.readthedocs.io/en/latest/syntax/typography.html).
