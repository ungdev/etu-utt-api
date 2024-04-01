###################
# BASE IMAGE
###################

ARG NODE_VERSION=19-alpine
FROM node:${NODE_VERSION} AS base

WORKDIR /usr/src/app

###################
# BUILD FOR PRODUCTION
###################

FROM base AS build

COPY --chown=node:node package.json pnpm-lock.yaml ./

RUN npm i -g pnpm && pnpm install --frozen-lockfile --production=false

COPY --chown=node:node . .

RUN pnpm prisma generate && pnpm build

ENV NODE_ENV production

RUN pnpm install --production

USER node

###################
# PRODUCTION
###################

FROM base AS production

COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/dist ./dist

CMD [ "node", "dist/src/main.js" ]
