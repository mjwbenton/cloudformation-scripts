# cloudformation-scripts

```
$ npm i @mattb.tech/cloudformation-scripts
$ cf-create-stack -s stack-name -f template-file.yml -p aws-credentials-profile
```

Scripts for working with cloudformation

## cf-create-stack

Create a new stack

```
$ cf-create-stack -s stack-name -f template-file.yml -p aws-credentials-profile
```

## cf-update-stack

Update an existing stack

```
$ cf-update-stack -s stack-name -f template-file.yml -p aws-credentials-profile
```

## cf-deploy-stack

Deploy a stack

```
$ cf-update-stack -s stack-name -f template-file.yml -p aws-credentials-profile
```

## cf-update-files

Sync some files in S3 with a local folder, and invalidate those files in cloudfront. Used to deploy a new version of a static website.

```
$ cf-update-files -b s3-bucket -d cloudfront-distribution -f ./local-folder -p aws-credentials-profile
```

## cf-update-lambda

Update lambda functions. Zips up all the code in the package from which this is called.

```
$ cf-update-lambda -s stack-name -r cloudformation-resource-name \
    -c s3-code-bucket -k s3-code-key \
    -p aws-credentials-h
```
