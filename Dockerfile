ARG NODE_VERSION=22-alpine
FROM node:${NODE_VERSION} AS base

ARG NODE_AUTH_TOKEN=

WORKDIR /usr/src/app

# Add alpine dependencies for 'sharp'
RUN apk add --upgrade --no-cache vips-dev build-base openssl

COPY --chown=node:node package.json pnpm-lock.yaml ./

RUN npm i -g pnpm && pnpm config set "//npm.pkg.github.com/:_authToken" ${NODE_AUTH_TOKEN} && pnpm install --no-optional --frozen-lockfile --production=false

COPY --chown=node:node . .

RUN pnpm prisma generate && pnpm build

ENV NODE_ENV production

RUN pnpm install --no-optional --production

USER node

CMD node dist/src/main.js
