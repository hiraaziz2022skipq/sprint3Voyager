import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Bucket } from 'aws-cdk-lib/aws-s3';
export declare class Hira4SprintStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps);
    Upload_file(bucket: Bucket): void;
    lambdas(roles: any, id: string, asset: string, handler: string, envior_var: string): any;
    create_role(): any;
}
