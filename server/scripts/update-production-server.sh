#!/bin/bash
APP_URL=https://app.surveystack.io
PEM_FILE=~/.ssh/surveystack-production.pem

USER=ubuntu
SERVER_FALLBACK=ec2-18-212-28-97.compute-1.amazonaws.com
SERVER_PWA_DIR=/home/ubuntu/repos/production/our-sci-pwa

SERVER=`curl -f -s $APP_URL/api/info/public-hostname`

if [ -z "$SERVER" ]; then
  echo -n "Enter hostname [$SERVER_FALLBACK]:"
  read SERVER
  if [ -z "$SERVER" ]; then
    SERVER=$SERVER_FALLBACK
  fi
else
  echo "Found public hostname: $SERVER"
fi

echo "Will use this server: $SERVER"

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
    yarn build || exit 1
    
    TMP_ARCHIVE=/tmp/our-sci-pwa-dist.tar.gz
    rm $TMP_ARCHIVE 2>/dev/null
    tar -czvf $TMP_ARCHIVE dist

    echo "Transfering $TMP_ARCHIVE to server..."
    scp -i "$PEM_FILE" $TMP_ARCHIVE "$USER@$SERVER:$TMP_ARCHIVE"
    echo "Extracting $TMP_ARCHIVE on server..."
    ssh -i "$PEM_FILE" "$USER@$SERVER" "
    cd $SERVER_PWA_DIR
    rm -rf dist/*
    tar -xvf $TMP_ARCHIVE
    rm $TMP_ARCHIVE
    "
fi

# run script on server to stop pm2 service, pull from repo, install and restart
ssh -i "$PEM_FILE" "$USER@$SERVER" << EOF
cd ~/repos/production/our-sci-server
bash -i ./scripts/update-production-server-locally.sh
EOF
