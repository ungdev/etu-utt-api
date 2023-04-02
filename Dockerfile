ARG NODE_VERSION=19-alpine


###################
# BUILD FOR LOCAL DEVELOPMENT
###################

FROM node:${NODE_VERSION} As development

WORKDIR /usr/src/app

COPY --chown=node:node package*.json ./

RUN npm ci

USER node


###################
# BUILD FOR PRODUCTION
###################

FROM node:${NODE_VERSION} As build

WORKDIR /usr/src/app

COPY --chown=node:node package*.json ./

COPY --chown=node:node --from=development /usr/src/app/node_modules ./node_modules

COPY --chown=node:node . .

RUN npm run build

ENV NODE_ENV production

RUN npm ci --only=production && npm cache clean --force

USER node


###################
# PRODUCTION
###################

FROM node:${NODE_VERSION} As production

COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/dist ./dist

CMD [ "node", "dist/main.js" ]
