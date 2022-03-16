import { pipelines, Stack, StackProps} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import { GitHubTrigger } from 'aws-cdk-lib/aws-codepipeline-actions';
import {Hirastage} from './hirastage'
import { ManualApprovalStep, ShellStep } from 'aws-cdk-lib/pipelines';
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
                                            commands: ["cd sprint5hira","npm ci","npx cdk synth"],
                                            primaryOutputDirectory : "sprint5hira/cdk.out"})


      // Connecting to the github
      const pipeline = new pipelines.CodePipeline(this, 'Pipeline', {synth: synth});


        // Adding Test and commands
        const unit_test= new ShellStep("Unit_Test",{
        commands:["cd sprint5hira","npm ci","npm run test"]})


        // Instantiate Beta stage
        const stagebeta = new Hirastage(this,"betastage")
        // Adding beta stage to the pipeline and  unit test as pre stage
        pipeline.addStage(stagebeta,{pre:[unit_test]})


        // Creating Production stage
        const prod=new Hirastage(this,"prod")
        // Adding product to pipeline and manual approval as pre stage
        pipeline.addStage(prod,{pre:[new ManualApprovalStep("Waiting for your approval")]})}
  

  }