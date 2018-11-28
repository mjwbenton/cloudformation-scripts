#!/bin/zsh

while getopts "b:d:p:f:" opt; do
    case "$opt" in
        b)
            bucket=$OPTARG;;
        d)
            distribution=$OPTARG;;
        p)
            profile=$OPTARG;;
        f)
            folder=$OPTARG;;
    esac
done

if [[ ! -v folder ]]; then
    folder="./output"
fi
if [[ ! -v bucket ]]; then
    echo "bucket (-b) required"
    exit
fi
if [[ ! -v profile ]]; then
    echo "profile (-p) required"
    exit
fi
if [[ ! -v distribution ]]; then
    echo "distribution (-d) required"
    exit
fi

aws s3 sync --acl public-read --delete \
    --exclude "*" --include "*.html" \
    --content-type "text/html; charset=utf-8" --metadata-directive=REPLACE \
    $folder s3://$bucket/ \
    --profile $profile
aws s3 sync --acl public-read --delete \
    --include "*" --exclude "*.html" \
    $folder s3://$bucket/ \
    --profile $profile

aws cloudfront create-invalidation \
        --distribution-id $distribution \
        --profile $profile \
        --paths '/*'
