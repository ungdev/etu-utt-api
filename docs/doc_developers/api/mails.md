# Mail

Pour utiliser les mails en local, il est possible de lancer l'utilitaire gessnerfl/fake-smtp-server pour lancer un serveur SMTP local :

```shell
pnpm dev:smtp-server
```

Des certificats _dummy_ sont déjà présents dans le repo, il est possible de les mettre à jour avec cette commande :

```shell
pnpm dev:smtp-server:certificate
```

On peut alors se connecter au serveur avec smtp://localhost:8025.
On peut accéder au client mail avec http://localhost:8080.