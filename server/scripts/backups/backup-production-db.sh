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

if [ -z "$PRODUCTION_HOST" ]; then
    echo "PRODUCTION_HOST is not defined";
    exit 1
fi

if [ -z "$PRODUCTION_USERNAME" ]; then
    echo "PRODUCTION_USERNAME is not defined";
    exit 1
fi

if [ -z "$PRODUCTION_PASSWORD" ]; then
    echo "PRODUCTION_PASSWORD is not defined";
    exit 1
fi

if [ -z "$PRODUCTION_DB" ]; then
    echo "PRODUCTION_DB is not defined";
    exit 1
fi

if [ -z "$LOCAL_DB" ]; then
    echo "LOCAL_DB is not defined";
    exit 1
fi

TIMESTAMP=`date +%Y-%m-%d_%H-%M-%S`
OUTFOLDER="dumps/$TIMESTAMP"

# create backup from remote database
echo "##"
echo "# Creating dump of remote database $PRODUCTION_DB in folder $OUTFOLDER..."
echo "##"
mkdir -p "$OUTFOLDER"
mongodump --out="$OUTFOLDER" --host="$PRODUCTION_HOST" --ssl --username="$PRODUCTION_USERNAME" --password="$PRODUCTION_PASSWORD" --authenticationDatabase=admin --db="$PRODUCTION_DB"

# restore into local database
echo "##"
echo "# Copying backup into local database $LOCAL_DB..."
echo "##"
mongorestore --nsFrom="$PRODUCTION_DB.*" --nsTo="$LOCAL_DB.*" --drop "$OUTFOLDER"

echo "##"
echo "# DONE!"
echo "# Note: You may want to set DATABASE_NAME=$LOCAL_DB inside the root .env file of this project and restart your local server"
echo "##"

