#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
// import { Hira4SprintStack } from '../lib/hira4sprint-stack';
import {Hirapipelinestack} from '../lib/hirapipelinestack'
const app = new cdk.App();
new Hirapipelinestack(app, 'Hira4SprintStack');
