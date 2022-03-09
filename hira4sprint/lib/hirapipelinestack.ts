import { Duration, pipelines, RemovalPolicy, Stack, StackProps} from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import * as cdk from 'aws-cdk-lib';
import { GitHubTrigger } from 'aws-cdk-lib/aws-codepipeline-actions';
import {Hirastagestack} from './hirastagestack'
import { ManualApprovalStep, ShellStep } from 'aws-cdk-lib/pipelines';
// const {Hirastagestack}=require('./hirastagestack')
const app = new cdk.App();

export class Hirapipelinestack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
      super(scope, id, props);

      
      // Using Secrets Manager to provide the access token to authenticate to GitHub
      const input = pipelines.CodePipelineSource.gitHub('hiraaziz2022skipq/sprint3Voyager', "main",{
                                            authentication:cdk.SecretValue.secretsManager('webtken'),
                                            trigger:GitHubTrigger.POLL,})

        /** 
        ShellStep()
                                            
        id -> 'synth'
        input -> source
        commands -> commands to run in pipeline
        primary_output_directory -> : Directory that will contain primary output fileset when script run
        
        **/

      const synth = new pipelines.ShellStep('Synth', {
                      input: input,
                      commands: ["cd hira4sprint","npm ci","npx cdk synth"],
                      primaryOutputDirectory : "hira4sprint/cdk.out"})

      // Connecting to the github
      const pipeline = new pipelines.CodePipeline(this, 'Pipeline', {synth: synth});

        // Adding Test and commands
        const unit_test= new ShellStep("Unit_Test",{
          commands:["cd hira4sprint","npm ci","npm run test"]
        })


      // Instantiate Beta stage
      const stagebeta = new Hirastagestack(this,"betastage")
      // Adding beta stage to the pipeline and  unit test as pre stage
      pipeline.addStage(stagebeta,{pre:[unit_test]})

      // Creating Production stage
      const prod=new Hirastagestack(this,"prod")
      // Adding product to pipeline and manual approval as pre stage
      pipeline.addStage(prod,{pre:[new ManualApprovalStep("Waiting for your approval")]})
    }
  

  }