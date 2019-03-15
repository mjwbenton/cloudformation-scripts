#!/bin/zsh
BASEDIR=$(dirname "$0")
node $BASEDIR/../@mattb.tech/cloudformation-scripts/update-lambda.js $@

