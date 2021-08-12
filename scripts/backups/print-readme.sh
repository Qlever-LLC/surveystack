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

if [ -z "$PRODUCTION_CONNECTION_STRING" ]; then
    echo "PRODUCTION_CONNECTION_STRING is not defined";
    exit 1
fi

if [ -z "$PRODUCTION_DB" ]; then
    echo "PRODUCTION_DB is not defined";
    exit 1
fi

if [ -z "$PRODUCTION_CLOUD_USER" ]; then
    echo "PRODUCTION_CLOUD_USER is not defined";
    exit 1
fi

if [ -z "$PRODUCTION_CLOUD_PASSWORD" ]; then
    echo "PRODUCTION_CLOUD_PASSWORD is not defined";
    exit 1
fi

echo "GUI: MongoDB Compass"
echo "####################"
echo "0. Download MongoDB Compass from here:"
echo "https://www.mongodb.com/products/compass"
echo "1. Start MongoDB Compass"
echo "2. Paste in the following connection string:"
echo "$PRODUCTION_CONNECTION_STRING"
echo ""
echo ""

echo "Command line tool: mongo"
echo "########################"
echo "Connect to the production database:"
echo "$ mongo \"$PRODUCTION_CONNECTION_STRING\""

echo "> show databases"
echo "admin"
echo "local"
echo "$PRODUCTION_DB"
echo "> use $PRODUCTION_DB"
echo "> db"
echo "$PRODUCTION_DB"
echo "> db.users.find({}).pretty()"
echo "..."
echo ""
echo ""

echo "Cloud Atlas"
echo "###########"
echo "Go to https://www.mongodb.com/cloud and login"
echo "User: $PRODUCTION_CLOUD_USER"
echo "Password: $PRODUCTION_CLOUD_PASSWORD"
echo ""
echo "Choose organization '$PRODUCTION_CLOUD_ORGANIZATION', and project '$PRODUCTION_CLOUD_PROJECT'"
echo ""
echo "To see a list of command line tools (mongoimport, mongorestore, etc.):"
echo "Select Clusters in the menu on the left..."
echo "Choose '...' right next to Connect/Metrics/Collections and select 'Command Line Tools'"
echo ""