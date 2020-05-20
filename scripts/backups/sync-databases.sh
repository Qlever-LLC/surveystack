#!/bin/bash
ABSDIR=$(cd `dirname $0` && pwd)
ENV_FILE=.env

cd $(dirname $0)

if [ ! -f "$ENV_FILE" ]; then
    echo "$ENV_FILE file not found under $ABSDIR/$ENV_FILE";
    echo "Create it and then adjust the variables accordingly:"
    echo "cp $ABSDIR/$ENV_FILE.defaults $ABSDIR/$ENV_FILE"
    exit 1
fi

source "$ENV_FILE"

if [ -z "$HOST" ]; then
    echo "HOST is not defined";
    exit 1
fi

if [ -z "$USERNAME" ]; then
    echo "USERNAME is not defined";
    exit 1
fi

if [ -z "$PASSWORD" ]; then
    echo "PASSWORD is not defined";
    exit 1
fi

if [ -z "$DB" ]; then
    echo "DB is not defined";
    exit 1
fi

mongodump --host "$HOST" --ssl --username "$USERNAME" --password "$PASSWORD" --authenticationDatabase admin --db "$DB"
