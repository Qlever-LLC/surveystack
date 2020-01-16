#!/bin/bash
PEM_FILE=oursci-allround.pem
ROOT_PATH="$( cd "$(dirname "$0")"; cd .. ; pwd -P )"

cd $(dirname $0)

if [ ! -f "../$PEM_FILE" ]; then
    EXPECTED_LOCATION="$(dirname $0)"
    echo "'$PEM_FILE' not found at '$ROOT_PATH/$PEM_FILE', aborting..."
    exit
fi
ssh -i "../oursci-allround.pem" ubuntu@ec2-52-207-218-148.compute-1.amazonaws.com
