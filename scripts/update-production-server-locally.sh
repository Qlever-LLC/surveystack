#!/bin/bash

cd $(dirname $0)
cd ..

# Stop pm2 service
pm2 stop surveystack-production

# Pull from repo
git pull

# NOTE: not building on server because memory limits
# install node modules in client
# cd ../our-sci-pwa
# git pull
# yarn install
# yarn build
# cd ../our-sci-server

# install node modules in webserver
yarn install

# Restart pm2 service
pm2 start surveystack-production

