# EtuUTT API : NestJS & Prisma

## Setup with Docker

Copy environment variables file and fill it with API keys and secrets.
```sh
cp .env.example .env
```

Start the project (add a `-d` flag to run it in background) (It may takes a few minutes on first install because `node_modules` are installed in the background)
```sh
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

Everytime that you `up` the project, it will do the following things for you in the background :
- Check and install dependencies (Useful when installing the project for the first time or when switching branches).
- Apply last changes on the `schema.prisma` to the database and update the prisma client.
- Start Prisma Studio [on port 5555](http://localhost:5555).
- Start the NestJS API in dev mode.

## Services

You can now go to [http://localhost:3000](http://localhost:3000) to see the app !
| Service name | URL | Description |
| - | - | - |
| API | [http://localhost:3000](http://localhost:3000) | The API home page. You can address all requests to that endpoint. |
| Prisma Studio | [http://localhost:5555](http://localhost:5555) | A Prisma UI to see and administrate data inside the database. |

## How to use

To open a terminal inside the container.
```sh
docker exec -it etuutt-api sh
```

Inside that terminal, you can run any command you want, like this one to acces NestJS CLI.
```sh
npx nest
```

To run lint.
```sh
npm run lint
```

To run end to end tests (e2e) in watch mode.
```sh
npm run test:e2e
```

# Contribute

To commit
```sh
git cz
```
