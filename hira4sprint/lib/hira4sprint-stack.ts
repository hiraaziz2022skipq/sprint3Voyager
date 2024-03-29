import { Duration, RemovalPolicy, Stack, StackProps} from 'aws-cdk-lib';
import * as cdk from 'aws-cdk-lib'
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
const constant = require("../resources/constant.json");
import {Alarm,Metric} from 'aws-cdk-lib/aws-cloudwatch'
import {BucketDeployment, Source} from 'aws-cdk-lib/aws-s3-deployment'
import { Bucket, BucketAccessControl } from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import {EmailSubscription, LambdaSubscription} from 'aws-cdk-lib/aws-sns-subscriptions'
import * as cw_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import {LambdaDeploymentConfig, LambdaDeploymentGroup} from 'aws-cdk-lib/aws-codedeploy'
import { CfnDisk } from 'aws-cdk-lib/aws-lightsail';

export class Hira4SprintStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    //Roles
    var roles=this.create_role();

    /*----------Creating S3 bucket-----------*/
    const bucket = new Bucket(this,id=constant.bucket_id,{accessControl: BucketAccessControl.PUBLIC_READ,});
    var s3_bucket=bucket.bucketName
    bucket.policy?.applyRemovalPolicy(RemovalPolicy.DESTROY);

    //Uploading file to S3 bucket
    this.Upload_file(bucket);


    /*-----------Calling web health lambda function-----------*/
    var lambda_func=this.weblambdas(roles,"WebHealthLambda","./resources","webHealthLambda.webhandler",s3_bucket)
    var function_name=lambda_func.functionName
    

    // Run Lambda periodically
    const rule = new events.Rule(this, 'Rule', {
                  schedule: events.Schedule.rate(Duration.minutes(1)),
                  targets: [new targets.LambdaFunction(lambda_func)],
    });


    /*---------------------Creating an SNS TOPIC----------------*/

    const topic = new sns.Topic(this, 'MyTopic');
    topic.addSubscription(new EmailSubscription(constant.email));
   

    for (let urls of constant.url){
              let dimension={'URL':urls}

            /* 
            create_alarm()
            
            dimensions -> key value pair , key = "URL" and value = url
            urls = url of website 

            */

              const alarm_avail= this.create_alarm_avail(dimension,urls); // Calling an alarn for latency
              const alarm_latency= this.create_alarm_latency(dimension,urls)  // Callin an alarm for availability

              alarm_avail.addAlarmAction(new cw_actions.SnsAction(topic));  // Binding avail alarm to sns
              alarm_latency.addAlarmAction(new cw_actions.SnsAction(topic));  // Binding latency alarm to sns
    }


    /*------------Creating Table-------------*/

    const my_table=this.create_table();
    var table_name=my_table.tableName
    
    //Caling DYNAMO DB lambda function
    var dynamo_lambda=this.dynamolambdas(roles,"DynamoLambda","./resources","dynamodb.dynamohandler",table_name)

    my_table.grantReadWriteData(dynamo_lambda)
    
    // invoke lambda after every alarm
    topic.addSubscription(new LambdaSubscription(dynamo_lambda))



    // Creating Failures Alarm
    const lambda_func1=lambda_func.currentVersion
    
    /*
    failure_metric()
    function_name = name of current version of lambda
    
    returns metric
    */
    const failure_metric=this.failure_metrics(function_name);

    // Auto Roll back
    this.roll_back(failure_metric,lambda_func1) 
  }



/*------- Functions------*/


// Bucket deployment func will upload all files of resource folder to s3 bucket
Upload_file(bucket: Bucket) {
  const deployment = new BucketDeployment(this, 'DeployWebsite', {
    sources: [Source.asset('./resources')],
    destinationBucket: bucket})
  }


// Calling Lambda Function
weblambdas(roles:any,id:string,asset:string,handler:string,envior_var:string):any{

  /* create_lambda()
        
  id -> string value
  asset -> Folder that contains code
  runtime -> Language
  handler -> Lambda function
  timeout -> After how long lambda will end
  
  Return : Lambda Function */

  const hello = new lambda.Function(this, id, {
    runtime: lambda.Runtime.NODEJS_14_X,    // execution environment
    code: lambda.Code.fromAsset(asset),  // code loaded from "resource" directory
    handler: handler,
    timeout: Duration.seconds(180)  ,
    role:roles,
    environment:{'bucket_name':envior_var}             // file is "webhandler", function is "handler"
  });
  return hello
}

dynamolambdas(roles:any,id:string,asset:string,handler:string,envior_var:string):any{

  /* create_lambda()
        
  id -> string value
  asset -> Folder that contains code
  runtime -> Language
  handler -> Lambda function
  timeout -> After how long lambda will end
  
  Return : Lambda Function */

  const hello = new lambda.Function(this, id, {
    runtime: lambda.Runtime.NODEJS_14_X,    // execution environment
    code: lambda.Code.fromAsset(asset),  // code loaded from "resource" directory
    handler: handler,
    timeout: Duration.seconds(180)  ,
    role:roles,
    environment:{'table_name':envior_var}             // file is "webhandler", function is "handler"
  });
  return hello
}


// create Roles
create_role():any{

const role = new Role(this, 'example-iam-role', {
  assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
  description: 'An example IAM role in AWS CDK',
  managedPolicies: [
    ManagedPolicy.fromAwsManagedPolicyName('CloudWatchFullAccess'),
    ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess'),
    ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
    ManagedPolicy.fromAwsManagedPolicyName('AWSLambdaInvocation-DynamoDB'),
    ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'),
  ],
});
return role
}


// Generate availability alarm
create_alarm_avail(dimension:any,urls:string) {

  /*
            cloudwatch.Metric()
            
            metric_name ->  Name of the metric
            namespace ->    Namespace of the metric data
            period ->   After how many minutes this will check datapoints in published metrics
            dimensions ->   It takes key and value. What we are monitoring
            
            Return : Fetch metric on aws cloudwatch
            
  */


  const metric = new Metric({
    namespace: constant.url_namespace,
    metricName: constant.Metricname_avail,
    period:Duration.minutes(1),
    dimensionsMap: dimension
  });

  /*
            cloudwatch.Alarm()
            
            id -> string value
            metric -> Function to fetch published metrics
            evaluation_periods -> After how many evaluation data will be compared to threshold
            comparison_operator -> used to compare
            datapoints_to_alarm -> After how many data points breaching, alarm should be triggered. 
            
            Return : Generated alarms if datapoints exceeds threshold
            
  */
  const alarm=new Alarm(this, 'availability_alarm'+urls, {
    metric: metric,

    threshold: 1,
    comparisonOperator:
      cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    evaluationPeriods: 1,
    alarmDescription:
      'Alarm if the SUM of Errors is greater than or equal to the threshold (1) for 1 evaluation period',
  });
  return alarm
}


// Generate latency alarm
create_alarm_latency(dimension:any,urls:string) {

  const metric = new Metric({
    namespace: constant.url_namespace,
    metricName: constant.Metricname_latency,
    period:Duration.minutes(1),
    dimensionsMap: dimension
  });

  const alarm = new Alarm(this, 'Latency_alarm'+urls, {
    metric: metric,
    threshold: 0.4,
    comparisonOperator:
      cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    evaluationPeriods: 1,
    alarmDescription:
      'Alarm if the SUM of Errors is greater than or equal to the threshold (1) for 1 evaluation period',
  });
  return alarm
}


// Create table dynamodb function
create_table() {

    /*
    Table()
    table_id -> id of table
    partition_key -> unique key 
    sort_key -> key used for sorting
    
    Return : Dynamo db table
    */

  const globalTable = new dynamodb.Table(this, constant.table_id, {
    partitionKey: { name: constant.partition_key, type: dynamodb.AttributeType.STRING },
    replicationRegions: ['us-east-1'],removalPolicy: cdk.RemovalPolicy.DESTROY });
    return globalTable
}


// Generate Failure alarms
failure_metrics(function_name:any){

      /*
            cloudwatch.Metric()
            
            namespace -> AWS/Lambda
            metric_name -> Duration
            dimentions_map -> FunctionName and lambda function name
            
            Return : Fetch aws Lambda duration value
      */


        const metric = new Metric({
                namespace: constant.fail_metric_namespace,
                metricName: constant.fail_metricname,
                dimensionsMap: {"FunctionName":function_name}
        });

        const alarm = new Alarm(this, 'failure_alarm', {
                metric: metric,
                threshold: constant.fail_metric_threshold,
                comparisonOperator:
                cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
                evaluationPeriods: 1,
                datapointsToAlarm:1
        });
        return alarm
}

roll_back(failure_metric:any,lambda_func1:any){

  /*
        Id (str) : Id
        Alias_name(str) : Name of alias
        Version: Current version of lambda function
            
        Return : Currenct version of lambda function
  */

  const alias = new lambda.Alias(this, 'LambdaAlias', {
    aliasName: 'Current_Version',
    version :lambda_func1,
  });
  

  /*
            LambdaDeploymentGroup()
        
            Id(str) : Id
            alias(Func) : Alias
            deployment_config: How many traffic should be send to new lambda function in specific time.
            Alarms(func): triggered alarm
           
  */
        
            
        // Deploy previous version of lambda if alarms gets triggered
  new LambdaDeploymentGroup(this, 'DeploymentGroup', {
    alias:alias,
    deploymentConfig: LambdaDeploymentConfig.CANARY_10PERCENT_5MINUTES,
    alarms:[failure_metric]
  });

}

}
