import { Duration, pipelines, RemovalPolicy, Stack, StackProps} from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import * as cdk from 'aws-cdk-lib';
import { GitHubTrigger } from 'aws-cdk-lib/aws-codepipeline-actions';
import {Hirastagestack} from './hirastagestack'
const app = new cdk.App();

export class Hirapipelinestack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
      super(scope, id, props);

      // creating pipelines
      const pipeline = new pipelines.CodePipeline(this, 'Pipeline', {
                synth: new pipelines.CodeBuildStep('Synth', {
                        input: pipelines.CodePipelineSource.gitHub('hiraaziz2022skipq/sprint3Voyager', 'branch', {
                          // This is optional
                          authentication: cdk.SecretValue.secretsManager('webtken'),
                          trigger:GitHubTrigger.POLL,}),

                        // pipelines.CodePipelineSource.connection('hiraaziz2022skipq/Voyager', 'main',{
                        //     connectionArn: 'arn:aws:secretsmanager:us-west-1:315997497220:secret:webtken-RRczq1'}),
                        commands: ["cd hira4sprint/","npm ci","npx cdk synth"],
                        primaryOutputDirectory: "hira3sprint/cdk.out",
                        role:this.create_role()
                }),
      });
      
    //   var beta=new Hirastagestack(this,"beta")
    //   pipeline.addStage(beta)

      // var prod=new Hirastagestack(this,"prod")
      // pipeline.addStage.arguments(prod)
    }
  


    create_role():any{
        const role = new Role(this, 'example-iam-role', {
          assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
          description: 'An example IAM role in AWS CDK',
          managedPolicies: [
            ManagedPolicy.fromAwsManagedPolicyName('CloudWatchFullAccess'),
            ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess'),
            ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
            ManagedPolicy.fromAwsManagedPolicyName("AWSCodePipeline_FullAccess"),
            ManagedPolicy.fromAwsManagedPolicyName("AmazonS3FullAccess"),
            ManagedPolicy.fromAwsManagedPolicyName("AwsCloudFormationFullAccess"),
          ],
        });
        return role
      }
    }
