import { Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda'
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
const {path} = require('path')


export class Sprint5HiraStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const roles=this.create_role()

    const layer = new lambda.LayerVersion(this, 'MyLayer', {
      removalPolicy: RemovalPolicy.RETAIN,
      code: lambda.Code.fromAsset('./layers'),
      compatibleRuntimes: [lambda.Runtime.NODEJS_14_X],
    });

    const api_lambda_func = new lambda.Function(this, "api_lambda", {
      runtime: lambda.Runtime.NODEJS_14_X,    // execution environment
      code: lambda.Code.fromAsset("./server"),  // code loaded from "resource" directory
      handler: "api_lambda.handler",
      timeout: Duration.minutes(5)  ,
      layers:[layer],
      role:roles,
                 // file is "webhandler", function is "handler"
    });

    const api = new apigateway.LambdaRestApi(this, 'myapi', {
      handler: api_lambda_func});
    

  }




  create_role():any{

    const role = new Role(this, 'example-iam-role', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      description: 'An example IAM role in AWS CDK',
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('CloudWatchFullAccess'),
        ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess'),
        ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        ManagedPolicy.fromAwsManagedPolicyName('AmazonAPIGatewayInvokeFullAccess'),
        ManagedPolicy.fromAwsManagedPolicyName('AmazonAPIGatewayAdministrator'),
      ],
    });
    return role
    }
}
