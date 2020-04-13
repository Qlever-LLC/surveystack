#!/bin/bash
APP_URL=https://app.surveystack.io

PEM_FILE=~/.ssh/surveystack-production.pem
USER=ubuntu
SERVER_FALLBACK=ec2-18-212-28-97.compute-1.amazonaws.com

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

cd $(dirname $0)

if [ ! -f "$PEM_FILE" ]; then
    echo "'.pem file not found at '$PEM_FILE', aborting..."
    exit
fi

ssh -i "$PEM_FILE" "$USER@$SERVER"
