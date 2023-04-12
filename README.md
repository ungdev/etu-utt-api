# Setup with Docker

Setup environment variables
```sh
cp .env.example .env
```

Start the project
```sh
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

To open a terminal inside the container
```sh
docker exec -it etuutt-api /bin/sh
```

Push database changes
```sh
npx prisma db push
```

# Setup manually

Setup environment variables
```sh
cp .env.example .env
```

Install dependencies
```sh
yarn
```

Setup the database

```sh
yarn prisma generate
yarn db:push
```

# Services

You can now go to [http://localhost:3000](http://localhost:3000) to see the app !
| Service name | URL | Description |
| - | - | - |
| API | [http://localhost:3000](http://localhost:3000) | The API home page. You can address all requests to that endpoint. |

# Contribute

To commit
```sh
git cz
```
