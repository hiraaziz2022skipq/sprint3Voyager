import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
export declare class Hira4SprintStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps);
    Upload_file(bucket: Bucket): void;
    lambdas(roles: any, id: string, asset: string, handler: string, envior_var: string, env_name: string): any;
    create_role(): any;
    create_alarm_avail(dimension: any, urls: string): cloudwatch.Alarm;
    create_alarm_latency(dimension: any, urls: string): cloudwatch.Alarm;
    create_table(): dynamodb.Table;
    failure_metrics(function_name: any): cloudwatch.Alarm;
    roll_back(failure_metric: any, lambda_func1: any): void;
}
