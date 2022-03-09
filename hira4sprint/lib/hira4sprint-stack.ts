import { Duration, RemovalPolicy, Stack, StackProps} from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
const constant = require("../resources/constant.json");
import {Alarm,Metric} from 'aws-cdk-lib/aws-cloudwatch'
import {BucketDeployment, Source} from 'aws-cdk-lib/aws-s3-deployment'
import { Bucket, BucketAccessControl } from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import {EmailSubscription, LambdaSubscription} from 'aws-cdk-lib/aws-sns-subscriptions'
import * as cw_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export class Hira4SprintStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    //Roles
    var roles=this.create_role();

    // Creating S3 bucket
    const bucket = new Bucket(this,id=constant.bucket_id,{accessControl: BucketAccessControl.PUBLIC_READ,});
    var s3_bucket=bucket.bucketName
    bucket.policy?.applyRemovalPolicy(RemovalPolicy.DESTROY);

    // Uploading file to S3 bucket
    this.Upload_file(bucket);

    //Calling web health lambda function
    var lambda_func=this.lambdas(roles,"WebHealthLambda","./resources","webHealthLambda.webhandler",s3_bucket)

    // Run Lambda periodically
    const rule = new events.Rule(this, 'Rule', {
            schedule: events.Schedule.rate(Duration.minutes(1)),
            targets: [new targets.LambdaFunction(lambda_func)],
    });

  }

// Functions

Upload_file(bucket: Bucket) {
  const deployment = new BucketDeployment(this, 'DeployWebsite', {
    sources: [Source.asset('./resources')],
    destinationBucket: bucket})

   
  }


lambdas(roles:any,id:string,asset:string,handler:string,envior_var:string):any{
  const hello = new lambda.Function(this, id, {
    runtime: lambda.Runtime.NODEJS_14_X,    // execution environment
    code: lambda.Code.fromAsset(asset),  // code loaded from "resource" directory
    handler: handler,
    timeout: Duration.seconds(180)  ,
    role:roles,
    environment:{'table_name':envior_var}             // file is "webhandler", function is "handler"
  });
  return hello
}


create_role():any{
const role = new Role(this, 'example-iam-role', {
  assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
  description: 'An example IAM role in AWS CDK',
  managedPolicies: [
    ManagedPolicy.fromAwsManagedPolicyName('CloudWatchFullAccess'),
    ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess'),
    ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
    ManagedPolicy.fromAwsManagedPolicyName('AWSLambdaInvocation-DynamoDB'),
  ],
});
return role
}

}
