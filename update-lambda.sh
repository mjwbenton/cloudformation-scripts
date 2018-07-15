#!/bin/zsh
BASEDIR=$(dirname "$0")
$BASEDIR/ts-node $BASEDIR/../@mattb/cloudformation-scripts/update-lambda.ts $@

