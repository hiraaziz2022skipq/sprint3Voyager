"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Hira4SprintStack = void 0;
const aws_cdk_lib_1 = require("aws-cdk-lib");
const lambda = require("aws-cdk-lib/aws-lambda");
const events = require("aws-cdk-lib/aws-events");
const targets = require("aws-cdk-lib/aws-events-targets");
const aws_iam_1 = require("aws-cdk-lib/aws-iam");
const cloudwatch = require("aws-cdk-lib/aws-cloudwatch");
const constant = require("../resources/constant.json");
const aws_cloudwatch_1 = require("aws-cdk-lib/aws-cloudwatch");
const aws_s3_deployment_1 = require("aws-cdk-lib/aws-s3-deployment");
const aws_s3_1 = require("aws-cdk-lib/aws-s3");
const sns = require("aws-cdk-lib/aws-sns");
const aws_sns_subscriptions_1 = require("aws-cdk-lib/aws-sns-subscriptions");
const cw_actions = require("aws-cdk-lib/aws-cloudwatch-actions");
const dynamodb = require("aws-cdk-lib/aws-dynamodb");
const aws_codedeploy_1 = require("aws-cdk-lib/aws-codedeploy");
class Hira4SprintStack extends aws_cdk_lib_1.Stack {
    constructor(scope, id, props) {
        var _a;
        super(scope, id, props);
        //Roles
        var roles = this.create_role();
        /*----------Creating S3 bucket-----------*/
        const bucket = new aws_s3_1.Bucket(this, id = constant.bucket_id, { accessControl: aws_s3_1.BucketAccessControl.PUBLIC_READ, });
        var s3_bucket = bucket.bucketName;
        (_a = bucket.policy) === null || _a === void 0 ? void 0 : _a.applyRemovalPolicy(aws_cdk_lib_1.RemovalPolicy.DESTROY);
        //Uploading file to S3 bucket
        this.Upload_file(bucket);
        /*-----------Calling web health lambda function-----------*/
        var lambda_func = this.lambdas(roles, "WebHealthLambda", "./resources", "webHealthLambda.webhandler", s3_bucket, 'bucket_name');
        var function_name = lambda_func.functionName;
        // Run Lambda periodically
        const rule = new events.Rule(this, 'Rule', {
            schedule: events.Schedule.rate(aws_cdk_lib_1.Duration.minutes(1)),
            targets: [new targets.LambdaFunction(lambda_func)],
        });
        /*---------------------Creating an SNS TOPIC----------------*/
        const topic = new sns.Topic(this, 'MyTopic');
        topic.addSubscription(new aws_sns_subscriptions_1.EmailSubscription(constant.email));
        for (let urls of constant.url) {
            let dimension = { 'URL': urls };
            /*
            create_alarm()
            
            dimensions -> key value pair , key = "URL" and value = url
            urls = url of website

            */
            const alarm_avail = this.create_alarm_avail(dimension, urls); // Calling an alarn for latency
            const alarm_latency = this.create_alarm_latency(dimension, urls); // Callin an alarm for availability
            alarm_avail.addAlarmAction(new cw_actions.SnsAction(topic)); // Binding avail alarm to sns
            alarm_latency.addAlarmAction(new cw_actions.SnsAction(topic)); // Binding latency alarm to sns
        }
        /*------------Creating Table-------------*/
        const my_table = this.create_table();
        var table_name = my_table.tableName;
        //Caling DYNAMO DB lambda function
        var dynamo_lambda = this.lambdas(roles, "DynamoLambda", "./resources", "dynamodb.dynamohandler", table_name, "table_name");
        dynamo_lambda.addEnviornment('table_name', table_name);
        my_table.grantReadWriteData(dynamo_lambda);
        // invoke lambda after every alarm
        topic.addSubscription(new aws_sns_subscriptions_1.LambdaSubscription(dynamo_lambda));
        // Creating Failures Alarm
        const lambda_func1 = lambda_func.currentVersion;
        /*
        failure_metric()
        function_name = name of current version of lambda
        
        returns metric
        */
        const failure_metric = this.failure_metrics(function_name);
        // Auto Roll back
        this.roll_back(failure_metric, lambda_func1);
    }
    /*------- Functions------*/
    // Bucket deployment func will upload all files of resource folder to s3 bucket
    Upload_file(bucket) {
        const deployment = new aws_s3_deployment_1.BucketDeployment(this, 'DeployWebsite', {
            sources: [aws_s3_deployment_1.Source.asset('./resources')],
            destinationBucket: bucket
        });
    }
    // Calling Lambda Function
    lambdas(roles, id, asset, handler, envior_var, env_name) {
        /* create_lambda()
              
        id -> string value
        asset -> Folder that contains code
        runtime -> Language
        handler -> Lambda function
        timeout -> After how long lambda will end
        
        Return : Lambda Function */
        const hello = new lambda.Function(this, id, {
            runtime: lambda.Runtime.NODEJS_14_X,
            code: lambda.Code.fromAsset(asset),
            handler: handler,
            timeout: aws_cdk_lib_1.Duration.seconds(180),
            role: roles,
            environment: { env_name: envior_var } // file is "webhandler", function is "handler"
        });
        return hello;
    }
    // create Roles
    create_role() {
        const role = new aws_iam_1.Role(this, 'example-iam-role', {
            assumedBy: new aws_iam_1.ServicePrincipal('lambda.amazonaws.com'),
            description: 'An example IAM role in AWS CDK',
            managedPolicies: [
                aws_iam_1.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchFullAccess'),
                aws_iam_1.ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess'),
                aws_iam_1.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
                aws_iam_1.ManagedPolicy.fromAwsManagedPolicyName('AWSLambdaInvocation-DynamoDB'),
            ],
        });
        return role;
    }
    // Generate availability alarm
    create_alarm_avail(dimension, urls) {
        /*
                  cloudwatch.Metric()
                  
                  metric_name ->  Name of the metric
                  namespace ->    Namespace of the metric data
                  period ->   After how many minutes this will check datapoints in published metrics
                  dimensions ->   It takes key and value. What we are monitoring
                  
                  Return : Fetch metric on aws cloudwatch
                  
        */
        const metric = new aws_cloudwatch_1.Metric({
            namespace: constant.url_namespace,
            metricName: constant.Metricname_avail,
            period: aws_cdk_lib_1.Duration.minutes(1),
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
        const alarm = new aws_cloudwatch_1.Alarm(this, 'availability_alarm' + urls, {
            metric: metric,
            threshold: 1,
            comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            evaluationPeriods: 1,
            alarmDescription: 'Alarm if the SUM of Errors is greater than or equal to the threshold (1) for 1 evaluation period',
        });
        return alarm;
    }
    // Generate latency alarm
    create_alarm_latency(dimension, urls) {
        const metric = new aws_cloudwatch_1.Metric({
            namespace: constant.url_namespace,
            metricName: constant.Metricname_latency,
            period: aws_cdk_lib_1.Duration.minutes(1),
            dimensionsMap: dimension
        });
        const alarm = new aws_cloudwatch_1.Alarm(this, 'Latency_alarm' + urls, {
            metric: metric,
            threshold: 0.4,
            comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
            evaluationPeriods: 1,
            alarmDescription: 'Alarm if the SUM of Errors is greater than or equal to the threshold (1) for 1 evaluation period',
        });
        return alarm;
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
            replicationRegions: ['us-east-1'],
        });
        return globalTable;
    }
    // Generate Failure alarms
    failure_metrics(function_name) {
        /*
              cloudwatch.Metric()
              
              namespace -> AWS/Lambda
              metric_name -> Duration
              dimentions_map -> FunctionName and lambda function name
              
              Return : Fetch aws Lambda duration value
        */
        const metric = new aws_cloudwatch_1.Metric({
            namespace: constant.fail_metric_namespace,
            metricName: constant.fail_metricname,
            dimensionsMap: { "FunctionName": function_name }
        });
        const alarm = new aws_cloudwatch_1.Alarm(this, 'failure_alarm', {
            metric: metric,
            threshold: constant.fail_metric_threshold,
            comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
            evaluationPeriods: 1,
            datapointsToAlarm: 1
        });
        return alarm;
    }
    roll_back(failure_metric, lambda_func1) {
        /*
              Id (str) : Id
              Alias_name(str) : Name of alias
              Version: Current version of lambda function
                  
              Return : Currenct version of lambda function
        */
        const alias = new lambda.Alias(this, 'LambdaAlias', {
            aliasName: 'Current_Version',
            version: lambda_func1,
        });
        /*
                  LambdaDeploymentGroup()
              
                  Id(str) : Id
                  alias(Func) : Alias
                  deployment_config: How many traffic should be send to new lambda function in specific time.
                  Alarms(func): triggered alarm
                 
        */
        // Deploy previous version of lambda if alarms gets triggered
        new aws_codedeploy_1.LambdaDeploymentGroup(this, 'DeploymentGroup', {
            alias,
            deploymentConfig: aws_codedeploy_1.LambdaDeploymentConfig.LINEAR_10PERCENT_EVERY_1MINUTE,
            alarms: [failure_metric]
        });
    }
}
exports.Hira4SprintStack = Hira4SprintStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGlyYTRzcHJpbnQtc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJoaXJhNHNwcmludC1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSw2Q0FBd0U7QUFDeEUsaURBQWlEO0FBRWpELGlEQUFpRDtBQUNqRCwwREFBMEQ7QUFDMUQsaURBQTRFO0FBQzVFLHlEQUF5RDtBQUN6RCxNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsNEJBQTRCLENBQUMsQ0FBQztBQUN2RCwrREFBdUQ7QUFDdkQscUVBQXNFO0FBQ3RFLCtDQUFpRTtBQUNqRSwyQ0FBMkM7QUFDM0MsNkVBQXVGO0FBQ3ZGLGlFQUFpRTtBQUNqRSxxREFBcUQ7QUFDckQsK0RBQXdGO0FBRXhGLE1BQWEsZ0JBQWlCLFNBQVEsbUJBQUs7SUFDekMsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUFrQjs7UUFDMUQsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsT0FBTztRQUNQLElBQUksS0FBSyxHQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUU3QiwyQ0FBMkM7UUFDM0MsTUFBTSxNQUFNLEdBQUcsSUFBSSxlQUFNLENBQUMsSUFBSSxFQUFDLEVBQUUsR0FBQyxRQUFRLENBQUMsU0FBUyxFQUFDLEVBQUMsYUFBYSxFQUFFLDRCQUFtQixDQUFDLFdBQVcsR0FBRSxDQUFDLENBQUM7UUFDeEcsSUFBSSxTQUFTLEdBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQTtRQUMvQixNQUFBLE1BQU0sQ0FBQyxNQUFNLDBDQUFFLGtCQUFrQixDQUFDLDJCQUFhLENBQUMsT0FBTyxFQUFFO1FBRXpELDZCQUE2QjtRQUM3QixJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBR3pCLDREQUE0RDtRQUM1RCxJQUFJLFdBQVcsR0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBQyxpQkFBaUIsRUFBQyxhQUFh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bkUsSUFBSSxzQ0FBcUIsQ0FBQyxJQUFJLEVBQUUsaUJBQWlCLEVBQUU7WUFDakQsS0FBSztZQUNMLGdCQUFnQixFQUFFLHVDQUFzQixDQUFDLDhCQUE4QjtZQUN2RSxNQUFNLEVBQUMsQ0FBQyxjQUFjLENBQUM7U0FDeEIsQ0FBQyxDQUFDO0lBRUwsQ0FBQztDQUVBO0FBeFNELDRDQXdTQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IER1cmF0aW9uLCBSZW1vdmFsUG9saWN5LCBTdGFjaywgU3RhY2tQcm9wc30gZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEnO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5pbXBvcnQgKiBhcyBldmVudHMgZnJvbSAnYXdzLWNkay1saWIvYXdzLWV2ZW50cyc7XG5pbXBvcnQgKiBhcyB0YXJnZXRzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1ldmVudHMtdGFyZ2V0cyc7XG5pbXBvcnQgeyBNYW5hZ2VkUG9saWN5LCBSb2xlLCBTZXJ2aWNlUHJpbmNpcGFsIH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWlhbSc7XG5pbXBvcnQgKiBhcyBjbG91ZHdhdGNoIGZyb20gJ2F3cy1jZGstbGliL2F3cy1jbG91ZHdhdGNoJztcbmNvbnN0IGNvbnN0YW50ID0gcmVxdWlyZShcIi4uL3Jlc291cmNlcy9jb25zdGFudC5qc29uXCIpO1xuaW1wb3J0IHtBbGFybSxNZXRyaWN9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1jbG91ZHdhdGNoJ1xuaW1wb3J0IHtCdWNrZXREZXBsb3ltZW50LCBTb3VyY2V9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1zMy1kZXBsb3ltZW50J1xuaW1wb3J0IHsgQnVja2V0LCBCdWNrZXRBY2Nlc3NDb250cm9sIH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLXMzJztcbmltcG9ydCAqIGFzIHNucyBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtc25zJztcbmltcG9ydCB7RW1haWxTdWJzY3JpcHRpb24sIExhbWJkYVN1YnNjcmlwdGlvbn0gZnJvbSAnYXdzLWNkay1saWIvYXdzLXNucy1zdWJzY3JpcHRpb25zJ1xuaW1wb3J0ICogYXMgY3dfYWN0aW9ucyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY2xvdWR3YXRjaC1hY3Rpb25zJztcbmltcG9ydCAqIGFzIGR5bmFtb2RiIGZyb20gJ2F3cy1jZGstbGliL2F3cy1keW5hbW9kYic7XG5pbXBvcnQge0xhbWJkYURlcGxveW1lbnRDb25maWcsIExhbWJkYURlcGxveW1lbnRHcm91cH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWNvZGVkZXBsb3knXG5cbmV4cG9ydCBjbGFzcyBIaXJhNFNwcmludFN0YWNrIGV4dGVuZHMgU3RhY2sge1xuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wcz86IFN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIC8vUm9sZXNcbiAgICB2YXIgcm9sZXM9dGhpcy5jcmVhdGVfcm9sZSgpO1xuXG4gICAgLyotLS0tLS0tLS0tQ3JlYXRpbmcgUzMgYnVja2V0LS0tLS0tLS0tLS0qL1xuICAgIGNvbnN0IGJ1Y2tldCA9IG5ldyBCdWNrZXQodGhpcyxpZD1jb25zdGFudC5idWNrZXRfaWQse2FjY2Vzc0NvbnRyb2w6IEJ1Y2tldEFjY2Vzc0NvbnRyb2wuUFVCTElDX1JFQUQsfSk7XG4gICAgdmFyIHMzX2J1Y2tldD1idWNrZXQuYnVja2V0TmFtZVxuICAgIGJ1Y2tldC5wb2xpY3k/LmFwcGx5UmVtb3ZhbFBvbGljeShSZW1vdmFsUG9saWN5LkRFU1RST1kpO1xuXG4gICAgLy9VcGxvYWRpbmcgZmlsZSB0byBTMyBidWNrZXRcbiAgICB0aGlzLlVwbG9hZF9maWxlKGJ1Y2tldCk7XG5cblxuICAgIC8qLS0tLS0tLS0tLS1DYWxsaW5nIHdlYiBoZWFsdGggbGFtYmRhIGZ1bmN0aW9uLS0tLS0tLS0tLS0qL1xuICAgIHZhciBsYW1iZGFfZnVuYz10aGlzLmxhbWJkYXMocm9sZXMsXCJXZWJIZWFsdGhMYW1iZGFcIixcIi4vcmVzb3VyY2VzXCIsXCJ3ZWJIZWFsdGhMYW1iZGEud2ViaGFuZGxlclwiLHMzX2J1Y2tldCwnYnVja2V0X25hbWUnKVxuICAgIHZhciBmdW5jdGlvbl9uYW1lPWxhbWJkYV9mdW5jLmZ1bmN0aW9uTmFtZVxuICAgIFxuXG4gICAgLy8gUnVuIExhbWJkYSBwZXJpb2RpY2FsbHlcbiAgICBjb25zdCBydWxlID0gbmV3IGV2ZW50cy5SdWxlKHRoaXMsICdSdWxlJywge1xuICAgICAgICAgICAgICAgICAgc2NoZWR1bGU6IGV2ZW50cy5TY2hlZHVsZS5yYXRlKER1cmF0aW9uLm1pbnV0ZXMoMSkpLFxuICAgICAgICAgICAgICAgICAgdGFyZ2V0czogW25ldyB0YXJnZXRzLkxhbWJkYUZ1bmN0aW9uKGxhbWJkYV9mdW5jKV0sXG4gICAgfSk7XG5cblxuICAgIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tQ3JlYXRpbmcgYW4gU05TIFRPUElDLS0tLS0tLS0tLS0tLS0tLSovXG5cbiAgICBjb25zdCB0b3BpYyA9IG5ldyBzbnMuVG9waWModGhpcywgJ015VG9waWMnKTtcbiAgICB0b3BpYy5hZGRTdWJzY3JpcHRpb24obmV3IEVtYWlsU3Vic2NyaXB0aW9uKGNvbnN0YW50LmVtYWlsKSk7XG4gICBcblxuICAgIGZvciAobGV0IHVybHMgb2YgY29uc3RhbnQudXJsKXtcbiAgICAgICAgICAgICAgbGV0IGRpbWVuc2lvbj17J1VSTCc6dXJsc31cblxuICAgICAgICAgICAgLyogXG4gICAgICAgICAgICBjcmVhdGVfYWxhcm0oKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBkaW1lbnNpb25zIC0+IGtleSB2YWx1ZSBwYWlyICwga2V5ID0gXCJVUkxcIiBhbmQgdmFsdWUgPSB1cmxcbiAgICAgICAgICAgIHVybHMgPSB1cmwgb2Ygd2Vic2l0ZSBcblxuICAgICAgICAgICAgKi9cblxuICAgICAgICAgICAgICBjb25zdCBhbGFybV9hdmFpbD0gdGhpcy5jcmVhdGVfYWxhcm1fYXZhaWwoZGltZW5zaW9uLHVybHMpOyAvLyBDYWxsaW5nIGFuIGFsYXJuIGZvciBsYXRlbmN5XG4gICAgICAgICAgICAgIGNvbnN0IGFsYXJtX2xhdGVuY3k9IHRoaXMuY3JlYXRlX2FsYXJtX2xhdGVuY3koZGltZW5zaW9uLHVybHMpICAvLyBDYWxsaW4gYW4gYWxhcm0gZm9yIGF2YWlsYWJpbGl0eVxuXG4gICAgICAgICAgICAgIGFsYXJtX2F2YWlsLmFkZEFsYXJtQWN0aW9uKG5ldyBjd19hY3Rpb25zLlNuc0FjdGlvbih0b3BpYykpOyAgLy8gQmluZGluZyBhdmFpbCBhbGFybSB0byBzbnNcbiAgICAgICAgICAgICAgYWxhcm1fbGF0ZW5jeS5hZGRBbGFybUFjdGlvbihuZXcgY3dfYWN0aW9ucy5TbnNBY3Rpb24odG9waWMpKTsgIC8vIEJpbmRpbmcgbGF0ZW5jeSBhbGFybSB0byBzbnNcbiAgICB9XG5cblxuICAgIC8qLS0tLS0tLS0tLS0tQ3JlYXRpbmcgVGFibGUtLS0tLS0tLS0tLS0tKi9cblxuICAgIGNvbnN0IG15X3RhYmxlPXRoaXMuY3JlYXRlX3RhYmxlKCk7XG4gICAgdmFyIHRhYmxlX25hbWU9bXlfdGFibGUudGFibGVOYW1lXG4gICAgXG4gICAgLy9DYWxpbmcgRFlOQU1PIERCIGxhbWJkYSBmdW5jdGlvblxuICAgIHZhciBkeW5hbW9fbGFtYmRhPXRoaXMubGFtYmRhcyhyb2xlcyxcIkR5bmFtb0xhbWJkYVwiLFwiLi9yZXNvdXJjZXNcIixcImR5bmFtb2RiLmR5bmFtb2hhbmRsZXJcIix0YWJsZV9uYW1lLFwidGFibGVfbmFtZVwiKVxuICAgIGR5bmFtb19sYW1iZGEuYWRkRW52aW9ybm1lbnQoJ3RhYmxlX25hbWUnLHRhYmxlX25hbWUpXG4gICAgbXlfdGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKGR5bmFtb19sYW1iZGEpXG4gICAgXG4gICAgLy8gaW52b2tlIGxhbWJkYSBhZnRlciBldmVyeSBhbGFybVxuICAgIHRvcGljLmFkZFN1YnNjcmlwdGlvbihuZXcgTGFtYmRhU3Vic2NyaXB0aW9uKGR5bmFtb19sYW1iZGEpKVxuXG5cblxuICAgIC8vIENyZWF0aW5nIEZhaWx1cmVzIEFsYXJtXG4gICAgY29uc3QgbGFtYmRhX2Z1bmMxPWxhbWJkYV9mdW5jLmN1cnJlbnRWZXJzaW9uXG4gICAgXG4gICAgLypcbiAgICBmYWlsdXJlX21ldHJpYygpXG4gICAgZnVuY3Rpb25fbmFtZSA9IG5hbWUgb2YgY3VycmVudCB2ZXJzaW9uIG9mIGxhbWJkYVxuICAgIFxuICAgIHJldHVybnMgbWV0cmljXG4gICAgKi9cbiAgICBjb25zdCBmYWlsdXJlX21ldHJpYz10aGlzLmZhaWx1cmVfbWV0cmljcyhmdW5jdGlvbl9uYW1lKTtcblxuICAgIC8vIEF1dG8gUm9sbCBiYWNrXG4gICAgdGhpcy5yb2xsX2JhY2soZmFpbHVyZV9tZXRyaWMsbGFtYmRhX2Z1bmMxKSBcbiAgfVxuXG5cblxuLyotLS0tLS0tIEZ1bmN0aW9ucy0tLS0tLSovXG5cblxuLy8gQnVja2V0IGRlcGxveW1lbnQgZnVuYyB3aWxsIHVwbG9hZCBhbGwgZmlsZXMgb2YgcmVzb3VyY2UgZm9sZGVyIHRvIHMzIGJ1Y2tldFxuVXBsb2FkX2ZpbGUoYnVja2V0OiBCdWNrZXQpIHtcbiAgY29uc3QgZGVwbG95bWVudCA9IG5ldyBCdWNrZXREZXBsb3ltZW50KHRoaXMsICdEZXBsb3lXZWJzaXRlJywge1xuICAgIHNvdXJjZXM6IFtTb3VyY2UuYXNzZXQoJy4vcmVzb3VyY2VzJyldLFxuICAgIGRlc3RpbmF0aW9uQnVja2V0OiBidWNrZXR9KVxuICB9XG5cblxuLy8gQ2FsbGluZyBMYW1iZGEgRnVuY3Rpb25cbmxhbWJkYXMocm9sZXM6YW55LGlkOnN0cmluZyxhc3NldDpzdHJpbmcsaGFuZGxlcjpzdHJpbmcsZW52aW9yX3ZhcjpzdHJpbmcsZW52X25hbWU6c3RyaW5nKTphbnl7XG5cbiAgLyogY3JlYXRlX2xhbWJkYSgpXG4gICAgICAgIFxuICBpZCAtPiBzdHJpbmcgdmFsdWVcbiAgYXNzZXQgLT4gRm9sZGVyIHRoYXQgY29udGFpbnMgY29kZVxuICBydW50aW1lIC0+IExhbmd1YWdlXG4gIGhhbmRsZXIgLT4gTGFtYmRhIGZ1bmN0aW9uXG4gIHRpbWVvdXQgLT4gQWZ0ZXIgaG93IGxvbmcgbGFtYmRhIHdpbGwgZW5kXG4gIFxuICBSZXR1cm4gOiBMYW1iZGEgRnVuY3Rpb24gKi9cblxuICBjb25zdCBoZWxsbyA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgaWQsIHtcbiAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMTRfWCwgICAgLy8gZXhlY3V0aW9uIGVudmlyb25tZW50XG4gICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KGFzc2V0KSwgIC8vIGNvZGUgbG9hZGVkIGZyb20gXCJyZXNvdXJjZVwiIGRpcmVjdG9yeVxuICAgIGhhbmRsZXI6IGhhbmRsZXIsXG4gICAgdGltZW91dDogRHVyYXRpb24uc2Vjb25kcygxODApICAsXG4gICAgcm9sZTpyb2xlcyxcbiAgICBlbnZpcm9ubWVudDp7ZW52X25hbWU6ZW52aW9yX3Zhcn0gICAgICAgICAgICAgLy8gZmlsZSBpcyBcIndlYmhhbmRsZXJcIiwgZnVuY3Rpb24gaXMgXCJoYW5kbGVyXCJcbiAgfSk7XG4gIHJldHVybiBoZWxsb1xufVxuXG5cbi8vIGNyZWF0ZSBSb2xlc1xuY3JlYXRlX3JvbGUoKTphbnl7XG5cbmNvbnN0IHJvbGUgPSBuZXcgUm9sZSh0aGlzLCAnZXhhbXBsZS1pYW0tcm9sZScsIHtcbiAgYXNzdW1lZEJ5OiBuZXcgU2VydmljZVByaW5jaXBhbCgnbGFtYmRhLmFtYXpvbmF3cy5jb20nKSxcbiAgZGVzY3JpcHRpb246ICdBbiBleGFtcGxlIElBTSByb2xlIGluIEFXUyBDREsnLFxuICBtYW5hZ2VkUG9saWNpZXM6IFtcbiAgICBNYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZSgnQ2xvdWRXYXRjaEZ1bGxBY2Nlc3MnKSxcbiAgICBNYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZSgnQW1hem9uRHluYW1vREJGdWxsQWNjZXNzJyksXG4gICAgTWFuYWdlZFBvbGljeS5mcm9tQXdzTWFuYWdlZFBvbGljeU5hbWUoJ3NlcnZpY2Utcm9sZS9BV1NMYW1iZGFCYXNpY0V4ZWN1dGlvblJvbGUnKSxcbiAgICBNYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZSgnQVdTTGFtYmRhSW52b2NhdGlvbi1EeW5hbW9EQicpLFxuICBdLFxufSk7XG5yZXR1cm4gcm9sZVxufVxuXG5cbi8vIEdlbmVyYXRlIGF2YWlsYWJpbGl0eSBhbGFybVxuY3JlYXRlX2FsYXJtX2F2YWlsKGRpbWVuc2lvbjphbnksdXJsczpzdHJpbmcpIHtcblxuICAvKlxuICAgICAgICAgICAgY2xvdWR3YXRjaC5NZXRyaWMoKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBtZXRyaWNfbmFtZSAtPiAgTmFtZSBvZiB0aGUgbWV0cmljXG4gICAgICAgICAgICBuYW1lc3BhY2UgLT4gICAgTmFtZXNwYWNlIG9mIHRoZSBtZXRyaWMgZGF0YVxuICAgICAgICAgICAgcGVyaW9kIC0+ICAgQWZ0ZXIgaG93IG1hbnkgbWludXRlcyB0aGlzIHdpbGwgY2hlY2sgZGF0YXBvaW50cyBpbiBwdWJsaXNoZWQgbWV0cmljc1xuICAgICAgICAgICAgZGltZW5zaW9ucyAtPiAgIEl0IHRha2VzIGtleSBhbmQgdmFsdWUuIFdoYXQgd2UgYXJlIG1vbml0b3JpbmdcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgUmV0dXJuIDogRmV0Y2ggbWV0cmljIG9uIGF3cyBjbG91ZHdhdGNoXG4gICAgICAgICAgICBcbiAgKi9cblxuXG4gIGNvbnN0IG1ldHJpYyA9IG5ldyBNZXRyaWMoe1xuICAgIG5hbWVzcGFjZTogY29uc3RhbnQudXJsX25hbWVzcGFjZSxcbiAgICBtZXRyaWNOYW1lOiBjb25zdGFudC5NZXRyaWNuYW1lX2F2YWlsLFxuICAgIHBlcmlvZDpEdXJhdGlvbi5taW51dGVzKDEpLFxuICAgIGRpbWVuc2lvbnNNYXA6IGRpbWVuc2lvblxuICB9KTtcblxuICAvKlxuICAgICAgICAgICAgY2xvdWR3YXRjaC5BbGFybSgpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlkIC0+IHN0cmluZyB2YWx1ZVxuICAgICAgICAgICAgbWV0cmljIC0+IEZ1bmN0aW9uIHRvIGZldGNoIHB1Ymxpc2hlZCBtZXRyaWNzXG4gICAgICAgICAgICBldmFsdWF0aW9uX3BlcmlvZHMgLT4gQWZ0ZXIgaG93IG1hbnkgZXZhbHVhdGlvbiBkYXRhIHdpbGwgYmUgY29tcGFyZWQgdG8gdGhyZXNob2xkXG4gICAgICAgICAgICBjb21wYXJpc29uX29wZXJhdG9yIC0+IHVzZWQgdG8gY29tcGFyZVxuICAgICAgICAgICAgZGF0YXBvaW50c190b19hbGFybSAtPiBBZnRlciBob3cgbWFueSBkYXRhIHBvaW50cyBicmVhY2hpbmcsIGFsYXJtIHNob3VsZCBiZSB0cmlnZ2VyZWQuIFxuICAgICAgICAgICAgXG4gICAgICAgICAgICBSZXR1cm4gOiBHZW5lcmF0ZWQgYWxhcm1zIGlmIGRhdGFwb2ludHMgZXhjZWVkcyB0aHJlc2hvbGRcbiAgICAgICAgICAgIFxuICAqL1xuICBjb25zdCBhbGFybT1uZXcgQWxhcm0odGhpcywgJ2F2YWlsYWJpbGl0eV9hbGFybScrdXJscywge1xuICAgIG1ldHJpYzogbWV0cmljLFxuXG4gICAgdGhyZXNob2xkOiAxLFxuICAgIGNvbXBhcmlzb25PcGVyYXRvcjpcbiAgICAgIGNsb3Vkd2F0Y2guQ29tcGFyaXNvbk9wZXJhdG9yLkdSRUFURVJfVEhBTl9USFJFU0hPTEQsXG4gICAgZXZhbHVhdGlvblBlcmlvZHM6IDEsXG4gICAgYWxhcm1EZXNjcmlwdGlvbjpcbiAgICAgICdBbGFybSBpZiB0aGUgU1VNIG9mIEVycm9ycyBpcyBncmVhdGVyIHRoYW4gb3IgZXF1YWwgdG8gdGhlIHRocmVzaG9sZCAoMSkgZm9yIDEgZXZhbHVhdGlvbiBwZXJpb2QnLFxuICB9KTtcbiAgcmV0dXJuIGFsYXJtXG59XG5cblxuLy8gR2VuZXJhdGUgbGF0ZW5jeSBhbGFybVxuY3JlYXRlX2FsYXJtX2xhdGVuY3koZGltZW5zaW9uOmFueSx1cmxzOnN0cmluZykge1xuXG4gIGNvbnN0IG1ldHJpYyA9IG5ldyBNZXRyaWMoe1xuICAgIG5hbWVzcGFjZTogY29uc3RhbnQudXJsX25hbWVzcGFjZSxcbiAgICBtZXRyaWNOYW1lOiBjb25zdGFudC5NZXRyaWNuYW1lX2xhdGVuY3ksXG4gICAgcGVyaW9kOkR1cmF0aW9uLm1pbnV0ZXMoMSksXG4gICAgZGltZW5zaW9uc01hcDogZGltZW5zaW9uXG4gIH0pO1xuXG4gIGNvbnN0IGFsYXJtID0gbmV3IEFsYXJtKHRoaXMsICdMYXRlbmN5X2FsYXJtJyt1cmxzLCB7XG4gICAgbWV0cmljOiBtZXRyaWMsXG4gICAgdGhyZXNob2xkOiAwLjQsXG4gICAgY29tcGFyaXNvbk9wZXJhdG9yOlxuICAgICAgY2xvdWR3YXRjaC5Db21wYXJpc29uT3BlcmF0b3IuR1JFQVRFUl9USEFOX09SX0VRVUFMX1RPX1RIUkVTSE9MRCxcbiAgICBldmFsdWF0aW9uUGVyaW9kczogMSxcbiAgICBhbGFybURlc2NyaXB0aW9uOlxuICAgICAgJ0FsYXJtIGlmIHRoZSBTVU0gb2YgRXJyb3JzIGlzIGdyZWF0ZXIgdGhhbiBvciBlcXVhbCB0byB0aGUgdGhyZXNob2xkICgxKSBmb3IgMSBldmFsdWF0aW9uIHBlcmlvZCcsXG4gIH0pO1xuICByZXR1cm4gYWxhcm1cbn1cblxuXG4vLyBDcmVhdGUgdGFibGUgZHluYW1vZGIgZnVuY3Rpb25cbmNyZWF0ZV90YWJsZSgpIHtcblxuICAgIC8qXG4gICAgVGFibGUoKVxuICAgIHRhYmxlX2lkIC0+IGlkIG9mIHRhYmxlXG4gICAgcGFydGl0aW9uX2tleSAtPiB1bmlxdWUga2V5IFxuICAgIHNvcnRfa2V5IC0+IGtleSB1c2VkIGZvciBzb3J0aW5nXG4gICAgXG4gICAgUmV0dXJuIDogRHluYW1vIGRiIHRhYmxlXG4gICAgKi9cblxuICBjb25zdCBnbG9iYWxUYWJsZSA9IG5ldyBkeW5hbW9kYi5UYWJsZSh0aGlzLCBjb25zdGFudC50YWJsZV9pZCwge1xuICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiBjb25zdGFudC5wYXJ0aXRpb25fa2V5LCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxuICAgIHJlcGxpY2F0aW9uUmVnaW9uczogWyd1cy1lYXN0LTEnXSwgfSk7XG4gICAgcmV0dXJuIGdsb2JhbFRhYmxlXG59XG5cblxuLy8gR2VuZXJhdGUgRmFpbHVyZSBhbGFybXNcbmZhaWx1cmVfbWV0cmljcyhmdW5jdGlvbl9uYW1lOmFueSl7XG5cbiAgICAgIC8qXG4gICAgICAgICAgICBjbG91ZHdhdGNoLk1ldHJpYygpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIG5hbWVzcGFjZSAtPiBBV1MvTGFtYmRhXG4gICAgICAgICAgICBtZXRyaWNfbmFtZSAtPiBEdXJhdGlvblxuICAgICAgICAgICAgZGltZW50aW9uc19tYXAgLT4gRnVuY3Rpb25OYW1lIGFuZCBsYW1iZGEgZnVuY3Rpb24gbmFtZVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBSZXR1cm4gOiBGZXRjaCBhd3MgTGFtYmRhIGR1cmF0aW9uIHZhbHVlXG4gICAgICAqL1xuXG5cbiAgICAgICAgY29uc3QgbWV0cmljID0gbmV3IE1ldHJpYyh7XG4gICAgICAgICAgICAgICAgbmFtZXNwYWNlOiBjb25zdGFudC5mYWlsX21ldHJpY19uYW1lc3BhY2UsXG4gICAgICAgICAgICAgICAgbWV0cmljTmFtZTogY29uc3RhbnQuZmFpbF9tZXRyaWNuYW1lLFxuICAgICAgICAgICAgICAgIGRpbWVuc2lvbnNNYXA6IHtcIkZ1bmN0aW9uTmFtZVwiOmZ1bmN0aW9uX25hbWV9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IGFsYXJtID0gbmV3IEFsYXJtKHRoaXMsICdmYWlsdXJlX2FsYXJtJywge1xuICAgICAgICAgICAgICAgIG1ldHJpYzogbWV0cmljLFxuICAgICAgICAgICAgICAgIHRocmVzaG9sZDogY29uc3RhbnQuZmFpbF9tZXRyaWNfdGhyZXNob2xkLFxuICAgICAgICAgICAgICAgIGNvbXBhcmlzb25PcGVyYXRvcjpcbiAgICAgICAgICAgICAgICBjbG91ZHdhdGNoLkNvbXBhcmlzb25PcGVyYXRvci5HUkVBVEVSX1RIQU5fT1JfRVFVQUxfVE9fVEhSRVNIT0xELFxuICAgICAgICAgICAgICAgIGV2YWx1YXRpb25QZXJpb2RzOiAxLFxuICAgICAgICAgICAgICAgIGRhdGFwb2ludHNUb0FsYXJtOjFcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBhbGFybVxufVxuXG5yb2xsX2JhY2soZmFpbHVyZV9tZXRyaWM6YW55LGxhbWJkYV9mdW5jMTphbnkpe1xuXG4gIC8qXG4gICAgICAgIElkIChzdHIpIDogSWRcbiAgICAgICAgQWxpYXNfbmFtZShzdHIpIDogTmFtZSBvZiBhbGlhc1xuICAgICAgICBWZXJzaW9uOiBDdXJyZW50IHZlcnNpb24gb2YgbGFtYmRhIGZ1bmN0aW9uXG4gICAgICAgICAgICBcbiAgICAgICAgUmV0dXJuIDogQ3VycmVuY3QgdmVyc2lvbiBvZiBsYW1iZGEgZnVuY3Rpb25cbiAgKi9cblxuICBjb25zdCBhbGlhcyA9IG5ldyBsYW1iZGEuQWxpYXModGhpcywgJ0xhbWJkYUFsaWFzJywge1xuICAgIGFsaWFzTmFtZTogJ0N1cnJlbnRfVmVyc2lvbicsXG4gICAgdmVyc2lvbiA6bGFtYmRhX2Z1bmMxLFxuICB9KTtcbiAgXG5cbiAgLypcbiAgICAgICAgICAgIExhbWJkYURlcGxveW1lbnRHcm91cCgpXG4gICAgICAgIFxuICAgICAgICAgICAgSWQoc3RyKSA6IElkXG4gICAgICAgICAgICBhbGlhcyhGdW5jKSA6IEFsaWFzXG4gICAgICAgICAgICBkZXBsb3ltZW50X2NvbmZpZzogSG93IG1hbnkgdHJhZmZpYyBzaG91bGQgYmUgc2VuZCB0byBuZXcgbGFtYmRhIGZ1bmN0aW9uIGluIHNwZWNpZmljIHRpbWUuXG4gICAgICAgICAgICBBbGFybXMoZnVuYyk6IHRyaWdnZXJlZCBhbGFybVxuICAgICAgICAgICBcbiAgKi9cbiAgICAgICAgXG4gICAgICAgICAgICBcbiAgICAgICAgLy8gRGVwbG95IHByZXZpb3VzIHZlcnNpb24gb2YgbGFtYmRhIGlmIGFsYXJtcyBnZXRzIHRyaWdnZXJlZFxuICBuZXcgTGFtYmRhRGVwbG95bWVudEdyb3VwKHRoaXMsICdEZXBsb3ltZW50R3JvdXAnLCB7XG4gICAgYWxpYXMsXG4gICAgZGVwbG95bWVudENvbmZpZzogTGFtYmRhRGVwbG95bWVudENvbmZpZy5MSU5FQVJfMTBQRVJDRU5UX0VWRVJZXzFNSU5VVEUsXG4gICAgYWxhcm1zOltmYWlsdXJlX21ldHJpY11cbiAgfSk7XG5cbn1cblxufVxuIl19