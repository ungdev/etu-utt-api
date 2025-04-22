ARG NODE_VERSION=22-alpine
FROM node:${NODE_VERSION} AS base

WORKDIR /usr/src/app

# Add alpine dependencies for 'sharp'
RUN apk add --upgrade --no-cache vips-dev build-base openssl

COPY --chown=node:node package.json pnpm-lock.yaml ./

RUN npm i -g pnpm && pnpm install --frozen-lockfile --production=false

COPY --chown=node:node . .

RUN pnpm prisma generate && pnpm build

ENV NODE_ENV production

RUN pnpm install --production

USER node

CMD node dist/src/main.js
