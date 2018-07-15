import commander = require("commander");
import util = require("util");
import fs = require("fs");
import archiver = require("archiver");
import {Readable} from "stream";
import throttle = require("lodash.throttle");

const PROGRESS_THROTTLE_WAIT = 1000;
const readFilePromise: (path: string) => Promise<Buffer> = util.promisify(fs.readFile);

interface CLIParams extends commander.Command {
    profile?: string
    stackName?: string
    codeBucket?: string
    codeKey?: string
    uploadOnly?: boolean
}
const args: CLIParams = commander
    .option('-p, --profile [profile]', 'profile')
    .option('-c, --code-bucket [code-bucket]', 'code bucket')
    .option('-s, --stack-name [stack-name]', 'stack name')
    .option('-k, --code-key [code-key]', 'code key')
    .option('--upload-only')
    .allowUnknownOption(false)
    .parse(process.argv);
const { profile } = args;

process.env.AWS_PROFILE = profile;
process.env.AWS_SDK_LOAD_CONFIG = "true";
import AWS = require("aws-sdk");
import {ManagedUpload} from "aws-sdk/clients/s3";
const cf = new AWS.CloudFormation();
const lambda = new AWS.Lambda();
const s3 = new AWS.S3();

function createZipFile(fileName: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        const archive = archiver('zip');
        const fileStream = fs.createWriteStream(fileName);
        const progressFunc = throttle((progress: archiver.ProgressData) =>
            console.log(`Zip progress: ${progress.entries.processed}/${progress.entries.total}`), PROGRESS_THROTTLE_WAIT);
        archive.on("progress", progressFunc);
        archive.on("error", (err) => {
            console.error("Failed to create zip file for lambda code");
            console.error(`Archiver error: ${err.code}`);
            reject(err);
        });
        fileStream.on('error', (err) => {
            console.error(`Failed to write zip file ${fileName}`);
            reject(err);
        })
        fileStream.on('close', resolve);
        archive.pipe(fileStream);
        archive.directory("src/", "src");
        archive.directory("node_modules/", "node_modules");
        archive.finalize();
    });
}

async function uploadCode(codeBucket: string, codeKey: string): Promise<void> {
    try {
        await createZipFile(codeKey);
        const s3Upload = s3.upload({
            Key: codeKey,
            Bucket: codeBucket,
            Body: fs.createReadStream(codeKey)
        });
        const progressFunc = throttle((progress: ManagedUpload.Progress) =>
            console.log(`Upload progress: ${progress.loaded}/${progress.total}`), PROGRESS_THROTTLE_WAIT);
        s3Upload.on("httpUploadProgress", progressFunc);
        const response = await s3Upload.promise();
        console.log(response);
    } catch (err) {
        console.error(`Failed to upload file to s3 ${codeKey}:`);
        console.error(err);
        throw new Error(err);
    }
}

async function getLambdaFunctionNames(stackName: string): Promise<string[]> {
    const response = await cf.describeStackResources({ StackName: stackName }).promise();
    const functionNames: string[] = [];
    (response.StackResources || []).forEach((resource) => {
        if (resource.ResourceType == "AWS::Lambda::Function" && resource.PhysicalResourceId) {
            functionNames.push(resource.PhysicalResourceId);
        }
    });
    return functionNames;
}

async function updateLambdaFunction(codeBucket: string, codeKey: string, functionName: string): Promise<void> {
    try {
        const response = await lambda.updateFunctionCode({
            FunctionName: functionName,
            S3Bucket: codeBucket,
            S3Key: codeKey
        }).promise();
        console.log(response);
    } catch (err) {
        console.error(`Failed to update lambda function ${functionName}:`)
        console.error(err);
        throw new Error(err);
    }
}

async function run({ profile, stackName, codeBucket, codeKey, uploadOnly}: CLIParams): Promise<void> {
   if (profile && stackName && codeBucket && codeKey) {
       try {
           await uploadCode(codeBucket, codeKey);
           if (uploadOnly) {
               console.log("Skipping update due to --upload-only flag");
           } else {
               const functions = await getLambdaFunctionNames(stackName);
               await Promise.all(functions.map((functionName) => {
                   console.log(`Updating function ${functionName}`);
                   return updateLambdaFunction(codeBucket, codeKey, functionName)
               }));
           }
           console.log("All finished!")

       } catch (err) {
           console.error(err);
       }
   } else {
       args.outputHelp();
   }
}
run(args);
