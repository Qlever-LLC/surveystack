FROM node:14
WORKDIR /app

COPY package*.json ./
# RUN npm install --global yarn
RUN yarn
# preload mongodb binary for testing
RUN node -e "const mms = require('mongodb-memory-server');mms.MongoMemoryServer.create().then(() => console.log('done'))"
COPY . .
