#!/bin/zsh
#
while getopts "s:p:f:" opt; do
    case "$opt" in
        s)
            stack_name=$OPTARG;;
        f)
            file=$OPTARG;;
        p)
            profile=$OPTARG;;
    esac
done

if [[ ! -v stack_name ]]; then
    echo "stack name (-s) required"
    exit
fi
if [[ ! -v profile ]]; then
    echo "profile (-p) required"
    exit
fi
if [[ ! -v file ]]; then
    echo "file (-f) required"
    exit
fi

echo "Using profile: $profile"
echo "Updating $stack_name stack from $file"

aws cloudformation deploy \
    --profile=$profile \
    --stack-name=$stack_name \
    --capabilities CAPABILITY_IAM \
    --template-file=$file
