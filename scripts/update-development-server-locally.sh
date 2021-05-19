#!/bin/bash

cd $(dirname $0)
cd ..

# Stop pm2 service
pm2 stop oursci-server-dev

# Pull from repo
git fetch
git checkout develop
git merge origin/develop

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
pm2 start oursci-server-dev

