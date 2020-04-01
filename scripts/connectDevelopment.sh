#!/bin/bash
PEM_FILE=~/.ssh/oursci-allround.pem
USER=ubuntu
SERVER=ec2-52-90-19-245.compute-1.amazonaws.com

cd $(dirname $0)

if [ ! -f "$PEM_FILE" ]; then
    echo "'.pem file not found at '$PEM_FILE', aborting..."
    exit
fi

ssh -i "$PEM_FILE" "$USER@$SERVER"
