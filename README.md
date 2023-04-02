# Setup with Docker

Start the project
```sh
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

To open a terminal inside the container
```sh
docker etuutt-api exec -it application /bin/bash
```

# Services

You can now go to [http://localhost:3000](http://localhost:3000) to see the app !
| Service name | URL | Description |
| - | - | - |
| API | [http://localhost:3000](http://localhost:3000) | The API home page. You can address all requests to that endpoint. |
