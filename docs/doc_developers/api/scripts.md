# Scripts

Les scripts peuvent être trouvés dans le dossier `scripts`.

Voici les différents scripts que vous pouvez utiliser :

| Commande                    | Description                                                                      |
|-----------------------------|----------------------------------------------------------------------------------|
| `pnpm script:deps:graph`    | Construit un arbre de dépendance des différents modules                          |
| `pnpm seed:base`            | Seed la DB avec les semestres, les branches, filières, ... (environnement "dev") |
| `pnpm seed:base:prod`       | Seed la DB avec les UEs, les branches, filières, ... (environnement "prod")      |
| `pnpm seed:ue:aliases`      | Seed la DB avec les alias d'UE (environnement "dev")                             |
| `pnpm seed:ue:aliases:prod` | Seed la DB avec les alias d'UE (environnement "prod")                            |
| `pnpm seed:ue`              | Seed la DB avec les UEs (environnement "dev")                                    |
| `pnpm seed:ue:prod`         | Seed la DB avec les UEs (environnement "prod")                                   |

Il est aussi possible de seed la DB avec des données dummy avec le script `prisma/seed/seed.ts` : `pnpm db:seed`