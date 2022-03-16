#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import {Hirapipelinestack} from '../lib/hirapipelinestack'

const app = new cdk.App();
new Hirapipelinestack(app, 'Hirapiplelinestack', {
  
});