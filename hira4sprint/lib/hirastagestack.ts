import { Stack, StackProps} from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import {Hira4SprintStack} from './hira4sprint-stack'
import * as cdk from 'aws-cdk-lib';

const app = new cdk.App();

export class Hirastagestack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
      super(scope, id, props);
         const hira4stack = new Hira4SprintStack(this,"HiraStack")
    }
}