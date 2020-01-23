#!/bin/bash
PEM_FILE=~/.ssh/oursci-allround.pem
USER=ubuntu
SERVER=ec2-52-207-218-148.compute-1.amazonaws.com

SERVER_PWA_DIR=~/repos/development/our-sci-pwa

print_usage() {
  printf "Usage: $0 [ -s ]\n"
  printf "  -s   updates server module only (skip building and uploading client)\n"
}

cd $(dirname $0)

server_only=0
while getopts 'sh' flag; do
  case "${flag}" in
    s) server_only=1 ;;
    *) print_usage
       exit 1 ;;
  esac
done


if [ $server_only -eq 0 ]; then
    # create build dist locally
    # because server does not have enough memory
    echo "Building production dist folder locally..."
    cd ..
    cd ../our-sci-pwa
    yarn build
    echo "Transfer dist folder to server..."
    #scp -i "$PEM_FILE" -r dist/ ubuntu@ec2-52-207-218-148.compute-1.amazonaws.com:~/repos/development/our-sci-pwa/
    scp -i "$PEM_FILE" -r dist/ "$USER@$SERVER:$SERVER_PWA_DIR/"
fi

# run script on server to stop pm2 service, pull from repo, install and restart
ssh -i "$PEM_FILE" "$USER@$SERVER" << EOF
cd ~/repos/development/our-sci-server
bash -i ./scripts/update-server-locally.sh
EOF
