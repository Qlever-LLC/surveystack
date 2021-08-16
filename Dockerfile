FROM node:14

COPY ./client/dist /app/client/dist
COPY ./server/dist /app/server/dist
COPY ./server/node_modules /app/server/node_modules

USER node
EXPOSE 3000
ENV NODE_ENV production
WORKDIR /app/server
CMD ["node", "./dist/index.js"]
