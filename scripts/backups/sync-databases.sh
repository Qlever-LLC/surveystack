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

if [ -z "$LOCAL_DB" ]; then
    echo "LOCAL_DB is not defined";
    exit 1
fi

TIMESTAMP=`date +%Y-%m-%d_%H-%M-%S`
OUTFOLDER="dumps/$TIMESTAMP"

# create backup from remote database
echo "##"
echo "# Creating dump of remote database $DB in folder $OUTFOLDER..."
echo "##"
mkdir -p "$OUTFOLDER"
mongodump --out="$OUTFOLDER" --host="$HOST" --ssl --username="$USERNAME" --password="$PASSWORD" --authenticationDatabase=admin --db="$DB"

# restore into local database
echo "##"
echo "# Copying backup into local database $LOCAL_DB..."
echo "##"
mongorestore --nsFrom="$DB.*" --nsTo="$LOCAL_DB.*" "$OUTFOLDER"

echo "##"
echo "# DONE!"
echo "# Note: You may want to set DATABASE_NAME=$LOCAL_DB inside the root .env file of this project"
echo "##"

