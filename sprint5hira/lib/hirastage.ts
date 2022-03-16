import { Stack, StackProps, Stage} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Sprint5HiraStack } from './sprint5hira-stack';


export class Hirastage extends Stage {
    constructor(scope: Construct, id: string, props?: StackProps) {
      super(scope, id, props);

        // Instantiate Stack      
         const hira4stack = new Sprint5HiraStack(this,"HiraStack")
    }
}