import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as sprint5hira from '../lib/sprint5hira-stack'

// example test. To run these tests, uncomment this file along with the
// example resource in lib/sprint5hira-stack.ts


test('S3 Bucket Created', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new sprint5hira.Sprint5HiraStack(app, 'MyTestStack');
    // THEN
    const template = cdk.assertions.Template.fromStack(stack);
    template.resourceCountIs('AWS::Lambda::Function', 1);
  });
