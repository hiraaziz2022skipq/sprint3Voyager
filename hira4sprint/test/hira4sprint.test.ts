import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import * as Hira4Sprint from '../lib/hira4sprint-stack';


test('S3 Bucket Created', () => {
  const app = new cdk.App();
  // WHEN
  const stack = new Hira4Sprint.Hira4SprintStack(app, 'MyTestStack');
  // THEN

  const template = cdk.assertions.Template.fromStack(stack);


  template.resourceCountIs('AWS::S3::Bucket', 0);
});

test('Lambda Function Created', () => {
  const app = new cdk.App();
  // WHEN
  const stack = new Hira4Sprint.Hira4SprintStack(app, 'MyTestStack');
  // THEN

  const template = cdk.assertions.Template.fromStack(stack);


  template.resourceCountIs('AWS::Lambda::Function', 1);
});
