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
        var lambda_func = this.weblambdas(roles, "WebHealthLambda", "./resources", "webHealthLambda.webhandler", s3_bucket);
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
        var dynamo_lambda = this.dynamolambdas(roles, "DynamoLambda", "./resources", "dynamodb.dynamohandler", table_name);
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
    weblambdas(roles, id, asset, handler, envior_var) {
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
            environment: { 'bucket_name': envior_var } // file is "webhandler", function is "handler"
        });
        return hello;
    }
    dynamolambdas(roles, id, asset, handler, envior_var) {
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
            environment: { 'table_name': envior_var } // file is "webhandler", function is "handler"
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGlyYTRzcHJpbnQtc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJoaXJhNHNwcmludC1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSw2Q0FBd0U7QUFDeEUsaURBQWlEO0FBRWpELGlEQUFpRDtBQUNqRCwwREFBMEQ7QUFDMUQsaURBQTRFO0FBQzVFLHlEQUF5RDtBQUN6RCxNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsNEJBQTRCLENBQUMsQ0FBQztBQUN2RCwrREFBdUQ7QUFDdkQscUVBQXNFO0FBQ3RFLCtDQUFpRTtBQUNqRSwyQ0FBMkM7QUFDM0MsNkVBQXVGO0FBQ3ZGLGlFQUFpRTtBQUNqRSxxREFBcUQ7QUFDckQsK0RBQXdGO0FBRXhGLE1BQWEsZ0JBQWlCLFNBQVEsbUJBQUs7SUFDekMsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUFrQjs7UUFDMUQsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsT0FBTztRQUNQLElBQUksS0FBSyxHQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUU3QiwyQ0FBMkM7UUFDM0MsTUFBTSxNQUFNLEdBQUcsSUFBSSxlQUFNLENBQUMsSUFBSSxFQUFDLEVBQUUsR0FBQyxRQUFRLENBQUMsU0FBUyxFQUFDLEVBQUMsYUFBYSxFQUFFLDRCQUFtQixDQUFDLFdBQVcsR0FBRSxDQUFDLENBQUM7UUFDeEcsSUFBSSxTQUFTLEdBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQTtRQUMvQixNQUFBLE1BQU0sQ0FBQyxNQUFNLDBDQUFFLGtCQUFrQixDQUFDLDJCQUFhLENBQUMsT0FBTyxFQUFFO1FBRXpELDZCQUE2QjtRQUM3QixJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBR3pCLDREQUE0RDtRQUM1RCxJQUFJLFdBQVcsR0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBQyxpQkFBaUIsRUFBQyxhQUFh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QXFCO1lBQ3pDLGtCQUFrQixFQUNsQixVQUFVLENBQUMsa0JBQWtCLENBQUMsa0NBQWtDO1lBQ2hFLGlCQUFpQixFQUFFLENBQUM7WUFDcEIsaUJBQWlCLEVBQUMsQ0FBQztTQUMxQixDQUFDLENBQUM7UUFDSCxPQUFPLEtBQUssQ0FBQTtJQUNwQixDQUFDO0lBRUQsU0FBUyxDQUFDLGNBQWtCLEVBQUMsWUFBZ0I7UUFFM0M7Ozs7OztVQU1FO1FBRUYsTUFBTSxLQUFLLEdBQUcsSUFBSSxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxhQUFhLEVBQUU7WUFDbEQsU0FBUyxFQUFFLGlCQUFpQjtZQUM1QixPQUFPLEVBQUUsWUFBWTtTQUN0QixDQUFDLENBQUM7UUFHSDs7Ozs7Ozs7VUFRRTtRQUdJLDZEQUE2RDtRQUNuRSxJQUFJLHNDQUFxQixDQUFDLElBQUksRUFBRSxpQkFBaUIsRUFBRTtZQUNqRCxLQUFLO1lBQ0wsZ0JBQWdCLEVBQUUsdUNBQXNCLENBQUMsOEJBQThCO1lBQ3ZFLE1BQU0sRUFBQyxDQUFDLGNBQWMsQ0FBQztTQUN4QixDQUFDLENBQUM7SUFFTCxDQUFDO0NBRUE7QUEvVEQsNENBK1RDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRHVyYXRpb24sIFJlbW92YWxQb2xpY3ksIFN0YWNrLCBTdGFja1Byb3BzfSBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgKiBhcyBsYW1iZGEgZnJvbSAnYXdzLWNkay1saWIvYXdzLWxhbWJkYSc7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcbmltcG9ydCAqIGFzIGV2ZW50cyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZXZlbnRzJztcbmltcG9ydCAqIGFzIHRhcmdldHMgZnJvbSAnYXdzLWNkay1saWIvYXdzLWV2ZW50cy10YXJnZXRzJztcbmltcG9ydCB7IE1hbmFnZWRQb2xpY3ksIFJvbGUsIFNlcnZpY2VQcmluY2lwYWwgfSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtaWFtJztcbmltcG9ydCAqIGFzIGNsb3Vkd2F0Y2ggZnJvbSAnYXdzLWNkay1saWIvYXdzLWNsb3Vkd2F0Y2gnO1xuY29uc3QgY29uc3RhbnQgPSByZXF1aXJlKFwiLi4vcmVzb3VyY2VzL2NvbnN0YW50Lmpzb25cIik7XG5pbXBvcnQge0FsYXJtLE1ldHJpY30gZnJvbSAnYXdzLWNkay1saWIvYXdzLWNsb3Vkd2F0Y2gnXG5pbXBvcnQge0J1Y2tldERlcGxveW1lbnQsIFNvdXJjZX0gZnJvbSAnYXdzLWNkay1saWIvYXdzLXMzLWRlcGxveW1lbnQnXG5pbXBvcnQgeyBCdWNrZXQsIEJ1Y2tldEFjY2Vzc0NvbnRyb2wgfSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtczMnO1xuaW1wb3J0ICogYXMgc25zIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zbnMnO1xuaW1wb3J0IHtFbWFpbFN1YnNjcmlwdGlvbiwgTGFtYmRhU3Vic2NyaXB0aW9ufSBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtc25zLXN1YnNjcmlwdGlvbnMnXG5pbXBvcnQgKiBhcyBjd19hY3Rpb25zIGZyb20gJ2F3cy1jZGstbGliL2F3cy1jbG91ZHdhdGNoLWFjdGlvbnMnO1xuaW1wb3J0ICogYXMgZHluYW1vZGIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWR5bmFtb2RiJztcbmltcG9ydCB7TGFtYmRhRGVwbG95bWVudENvbmZpZywgTGFtYmRhRGVwbG95bWVudEdyb3VwfSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY29kZWRlcGxveSdcblxuZXhwb3J0IGNsYXNzIEhpcmE0U3ByaW50U3RhY2sgZXh0ZW5kcyBTdGFjayB7XG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgLy9Sb2xlc1xuICAgIHZhciByb2xlcz10aGlzLmNyZWF0ZV9yb2xlKCk7XG5cbiAgICAvKi0tLS0tLS0tLS1DcmVhdGluZyBTMyBidWNrZXQtLS0tLS0tLS0tLSovXG4gICAgY29uc3QgYnVja2V0ID0gbmV3IEJ1Y2tldCh0aGlzLGlkPWNvbnN0YW50LmJ1Y2tldF9pZCx7YWNjZXNzQ29udHJvbDogQnVja2V0QWNjZXNzQ29udHJvbC5QVUJMSUNfUkVBRCx9KTtcbiAgICB2YXIgczNfYnVja2V0PWJ1Y2tldC5idWNrZXROYW1lXG4gICAgYnVja2V0LnBvbGljeT8uYXBwbHlSZW1vdmFsUG9saWN5KFJlbW92YWxQb2xpY3kuREVTVFJPWSk7XG5cbiAgICAvL1VwbG9hZGluZyBmaWxlIHRvIFMzIGJ1Y2tldFxuICAgIHRoaXMuVXBsb2FkX2ZpbGUoYnVja2V0KTtcblxuXG4gICAgLyotLS0tLS0tLS0tLUNhbGxpbmcgd2ViIGhlYWx0aCBsYW1iZGEgZnVuY3Rpb24tLS0tLS0tLS0tLSovXG4gICAgdmFyIGxhbWJkYV9mdW5jPXRoaXMud2VibGFtYmRhcyhyb2xlcyxcIldlYkhlYWx0aExhbWJkYVwiLFwiLi9yZXNvdXJjZXNcIixcIndlYkhlYWx0aExhbWJkYS53ZWJoYW5kbGVyXCIsczNfYnVja2V0KVxuICAgIHZhciBmdW5jdGlvbl9uYW1lPWxhbWJkYV9mdW5jLmZ1bmN0aW9uTmFtZVxuICAgIFxuXG4gICAgLy8gUnVuIExhbWJkYSBwZXJpb2RpY2FsbHlcbiAgICBjb25zdCBydWxlID0gbmV3IGV2ZW50cy5SdWxlKHRoaXMsICdSdWxlJywge1xuICAgICAgICAgICAgICAgICAgc2NoZWR1bGU6IGV2ZW50cy5TY2hlZHVsZS5yYXRlKER1cmF0aW9uLm1pbnV0ZXMoMSkpLFxuICAgICAgICAgICAgICAgICAgdGFyZ2V0czogW25ldyB0YXJnZXRzLkxhbWJkYUZ1bmN0aW9uKGxhbWJkYV9mdW5jKV0sXG4gICAgfSk7XG5cblxuICAgIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tQ3JlYXRpbmcgYW4gU05TIFRPUElDLS0tLS0tLS0tLS0tLS0tLSovXG5cbiAgICBjb25zdCB0b3BpYyA9IG5ldyBzbnMuVG9waWModGhpcywgJ015VG9waWMnKTtcbiAgICB0b3BpYy5hZGRTdWJzY3JpcHRpb24obmV3IEVtYWlsU3Vic2NyaXB0aW9uKGNvbnN0YW50LmVtYWlsKSk7XG4gICBcblxuICAgIGZvciAobGV0IHVybHMgb2YgY29uc3RhbnQudXJsKXtcbiAgICAgICAgICAgICAgbGV0IGRpbWVuc2lvbj17J1VSTCc6dXJsc31cblxuICAgICAgICAgICAgLyogXG4gICAgICAgICAgICBjcmVhdGVfYWxhcm0oKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBkaW1lbnNpb25zIC0+IGtleSB2YWx1ZSBwYWlyICwga2V5ID0gXCJVUkxcIiBhbmQgdmFsdWUgPSB1cmxcbiAgICAgICAgICAgIHVybHMgPSB1cmwgb2Ygd2Vic2l0ZSBcblxuICAgICAgICAgICAgKi9cblxuICAgICAgICAgICAgICBjb25zdCBhbGFybV9hdmFpbD0gdGhpcy5jcmVhdGVfYWxhcm1fYXZhaWwoZGltZW5zaW9uLHVybHMpOyAvLyBDYWxsaW5nIGFuIGFsYXJuIGZvciBsYXRlbmN5XG4gICAgICAgICAgICAgIGNvbnN0IGFsYXJtX2xhdGVuY3k9IHRoaXMuY3JlYXRlX2FsYXJtX2xhdGVuY3koZGltZW5zaW9uLHVybHMpICAvLyBDYWxsaW4gYW4gYWxhcm0gZm9yIGF2YWlsYWJpbGl0eVxuXG4gICAgICAgICAgICAgIGFsYXJtX2F2YWlsLmFkZEFsYXJtQWN0aW9uKG5ldyBjd19hY3Rpb25zLlNuc0FjdGlvbih0b3BpYykpOyAgLy8gQmluZGluZyBhdmFpbCBhbGFybSB0byBzbnNcbiAgICAgICAgICAgICAgYWxhcm1fbGF0ZW5jeS5hZGRBbGFybUFjdGlvbihuZXcgY3dfYWN0aW9ucy5TbnNBY3Rpb24odG9waWMpKTsgIC8vIEJpbmRpbmcgbGF0ZW5jeSBhbGFybSB0byBzbnNcbiAgICB9XG5cblxuICAgIC8qLS0tLS0tLS0tLS0tQ3JlYXRpbmcgVGFibGUtLS0tLS0tLS0tLS0tKi9cblxuICAgIGNvbnN0IG15X3RhYmxlPXRoaXMuY3JlYXRlX3RhYmxlKCk7XG4gICAgdmFyIHRhYmxlX25hbWU9bXlfdGFibGUudGFibGVOYW1lXG4gICAgXG4gICAgLy9DYWxpbmcgRFlOQU1PIERCIGxhbWJkYSBmdW5jdGlvblxuICAgIHZhciBkeW5hbW9fbGFtYmRhPXRoaXMuZHluYW1vbGFtYmRhcyhyb2xlcyxcIkR5bmFtb0xhbWJkYVwiLFwiLi9yZXNvdXJjZXNcIixcImR5bmFtb2RiLmR5bmFtb2hhbmRsZXJcIix0YWJsZV9uYW1lKVxuXG4gICAgbXlfdGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKGR5bmFtb19sYW1iZGEpXG4gICAgXG4gICAgLy8gaW52b2tlIGxhbWJkYSBhZnRlciBldmVyeSBhbGFybVxuICAgIHRvcGljLmFkZFN1YnNjcmlwdGlvbihuZXcgTGFtYmRhU3Vic2NyaXB0aW9uKGR5bmFtb19sYW1iZGEpKVxuXG5cblxuICAgIC8vIENyZWF0aW5nIEZhaWx1cmVzIEFsYXJtXG4gICAgY29uc3QgbGFtYmRhX2Z1bmMxPWxhbWJkYV9mdW5jLmN1cnJlbnRWZXJzaW9uXG4gICAgXG4gICAgLypcbiAgICBmYWlsdXJlX21ldHJpYygpXG4gICAgZnVuY3Rpb25fbmFtZSA9IG5hbWUgb2YgY3VycmVudCB2ZXJzaW9uIG9mIGxhbWJkYVxuICAgIFxuICAgIHJldHVybnMgbWV0cmljXG4gICAgKi9cbiAgICBjb25zdCBmYWlsdXJlX21ldHJpYz10aGlzLmZhaWx1cmVfbWV0cmljcyhmdW5jdGlvbl9uYW1lKTtcblxuICAgIC8vIEF1dG8gUm9sbCBiYWNrXG4gICAgdGhpcy5yb2xsX2JhY2soZmFpbHVyZV9tZXRyaWMsbGFtYmRhX2Z1bmMxKSBcbiAgfVxuXG5cblxuLyotLS0tLS0tIEZ1bmN0aW9ucy0tLS0tLSovXG5cblxuLy8gQnVja2V0IGRlcGxveW1lbnQgZnVuYyB3aWxsIHVwbG9hZCBhbGwgZmlsZXMgb2YgcmVzb3VyY2UgZm9sZGVyIHRvIHMzIGJ1Y2tldFxuVXBsb2FkX2ZpbGUoYnVja2V0OiBCdWNrZXQpIHtcbiAgY29uc3QgZGVwbG95bWVudCA9IG5ldyBCdWNrZXREZXBsb3ltZW50KHRoaXMsICdEZXBsb3lXZWJzaXRlJywge1xuICAgIHNvdXJjZXM6IFtTb3VyY2UuYXNzZXQoJy4vcmVzb3VyY2VzJyldLFxuICAgIGRlc3RpbmF0aW9uQnVja2V0OiBidWNrZXR9KVxuICB9XG5cblxuLy8gQ2FsbGluZyBMYW1iZGEgRnVuY3Rpb25cbndlYmxhbWJkYXMocm9sZXM6YW55LGlkOnN0cmluZyxhc3NldDpzdHJpbmcsaGFuZGxlcjpzdHJpbmcsZW52aW9yX3ZhcjpzdHJpbmcpOmFueXtcblxuICAvKiBjcmVhdGVfbGFtYmRhKClcbiAgICAgICAgXG4gIGlkIC0+IHN0cmluZyB2YWx1ZVxuICBhc3NldCAtPiBGb2xkZXIgdGhhdCBjb250YWlucyBjb2RlXG4gIHJ1bnRpbWUgLT4gTGFuZ3VhZ2VcbiAgaGFuZGxlciAtPiBMYW1iZGEgZnVuY3Rpb25cbiAgdGltZW91dCAtPiBBZnRlciBob3cgbG9uZyBsYW1iZGEgd2lsbCBlbmRcbiAgXG4gIFJldHVybiA6IExhbWJkYSBGdW5jdGlvbiAqL1xuXG4gIGNvbnN0IGhlbGxvID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCBpZCwge1xuICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18xNF9YLCAgICAvLyBleGVjdXRpb24gZW52aXJvbm1lbnRcbiAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQoYXNzZXQpLCAgLy8gY29kZSBsb2FkZWQgZnJvbSBcInJlc291cmNlXCIgZGlyZWN0b3J5XG4gICAgaGFuZGxlcjogaGFuZGxlcixcbiAgICB0aW1lb3V0OiBEdXJhdGlvbi5zZWNvbmRzKDE4MCkgICxcbiAgICByb2xlOnJvbGVzLFxuICAgIGVudmlyb25tZW50OnsnYnVja2V0X25hbWUnOmVudmlvcl92YXJ9ICAgICAgICAgICAgIC8vIGZpbGUgaXMgXCJ3ZWJoYW5kbGVyXCIsIGZ1bmN0aW9uIGlzIFwiaGFuZGxlclwiXG4gIH0pO1xuICByZXR1cm4gaGVsbG9cbn1cblxuZHluYW1vbGFtYmRhcyhyb2xlczphbnksaWQ6c3RyaW5nLGFzc2V0OnN0cmluZyxoYW5kbGVyOnN0cmluZyxlbnZpb3JfdmFyOnN0cmluZyk6YW55e1xuXG4gIC8qIGNyZWF0ZV9sYW1iZGEoKVxuICAgICAgICBcbiAgaWQgLT4gc3RyaW5nIHZhbHVlXG4gIGFzc2V0IC0+IEZvbGRlciB0aGF0IGNvbnRhaW5zIGNvZGVcbiAgcnVudGltZSAtPiBMYW5ndWFnZVxuICBoYW5kbGVyIC0+IExhbWJkYSBmdW5jdGlvblxuICB0aW1lb3V0IC0+IEFmdGVyIGhvdyBsb25nIGxhbWJkYSB3aWxsIGVuZFxuICBcbiAgUmV0dXJuIDogTGFtYmRhIEZ1bmN0aW9uICovXG5cbiAgY29uc3QgaGVsbG8gPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsIGlkLCB7XG4gICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzE0X1gsICAgIC8vIGV4ZWN1dGlvbiBlbnZpcm9ubWVudFxuICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldChhc3NldCksICAvLyBjb2RlIGxvYWRlZCBmcm9tIFwicmVzb3VyY2VcIiBkaXJlY3RvcnlcbiAgICBoYW5kbGVyOiBoYW5kbGVyLFxuICAgIHRpbWVvdXQ6IER1cmF0aW9uLnNlY29uZHMoMTgwKSAgLFxuICAgIHJvbGU6cm9sZXMsXG4gICAgZW52aXJvbm1lbnQ6eyd0YWJsZV9uYW1lJzplbnZpb3JfdmFyfSAgICAgICAgICAgICAvLyBmaWxlIGlzIFwid2ViaGFuZGxlclwiLCBmdW5jdGlvbiBpcyBcImhhbmRsZXJcIlxuICB9KTtcbiAgcmV0dXJuIGhlbGxvXG59XG5cblxuLy8gY3JlYXRlIFJvbGVzXG5jcmVhdGVfcm9sZSgpOmFueXtcblxuY29uc3Qgcm9sZSA9IG5ldyBSb2xlKHRoaXMsICdleGFtcGxlLWlhbS1yb2xlJywge1xuICBhc3N1bWVkQnk6IG5ldyBTZXJ2aWNlUHJpbmNpcGFsKCdsYW1iZGEuYW1hem9uYXdzLmNvbScpLFxuICBkZXNjcmlwdGlvbjogJ0FuIGV4YW1wbGUgSUFNIHJvbGUgaW4gQVdTIENESycsXG4gIG1hbmFnZWRQb2xpY2llczogW1xuICAgIE1hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKCdDbG91ZFdhdGNoRnVsbEFjY2VzcycpLFxuICAgIE1hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKCdBbWF6b25EeW5hbW9EQkZ1bGxBY2Nlc3MnKSxcbiAgICBNYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZSgnc2VydmljZS1yb2xlL0FXU0xhbWJkYUJhc2ljRXhlY3V0aW9uUm9sZScpLFxuICAgIE1hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKCdBV1NMYW1iZGFJbnZvY2F0aW9uLUR5bmFtb0RCJyksXG4gIF0sXG59KTtcbnJldHVybiByb2xlXG59XG5cblxuLy8gR2VuZXJhdGUgYXZhaWxhYmlsaXR5IGFsYXJtXG5jcmVhdGVfYWxhcm1fYXZhaWwoZGltZW5zaW9uOmFueSx1cmxzOnN0cmluZykge1xuXG4gIC8qXG4gICAgICAgICAgICBjbG91ZHdhdGNoLk1ldHJpYygpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIG1ldHJpY19uYW1lIC0+ICBOYW1lIG9mIHRoZSBtZXRyaWNcbiAgICAgICAgICAgIG5hbWVzcGFjZSAtPiAgICBOYW1lc3BhY2Ugb2YgdGhlIG1ldHJpYyBkYXRhXG4gICAgICAgICAgICBwZXJpb2QgLT4gICBBZnRlciBob3cgbWFueSBtaW51dGVzIHRoaXMgd2lsbCBjaGVjayBkYXRhcG9pbnRzIGluIHB1Ymxpc2hlZCBtZXRyaWNzXG4gICAgICAgICAgICBkaW1lbnNpb25zIC0+ICAgSXQgdGFrZXMga2V5IGFuZCB2YWx1ZS4gV2hhdCB3ZSBhcmUgbW9uaXRvcmluZ1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBSZXR1cm4gOiBGZXRjaCBtZXRyaWMgb24gYXdzIGNsb3Vkd2F0Y2hcbiAgICAgICAgICAgIFxuICAqL1xuXG5cbiAgY29uc3QgbWV0cmljID0gbmV3IE1ldHJpYyh7XG4gICAgbmFtZXNwYWNlOiBjb25zdGFudC51cmxfbmFtZXNwYWNlLFxuICAgIG1ldHJpY05hbWU6IGNvbnN0YW50Lk1ldHJpY25hbWVfYXZhaWwsXG4gICAgcGVyaW9kOkR1cmF0aW9uLm1pbnV0ZXMoMSksXG4gICAgZGltZW5zaW9uc01hcDogZGltZW5zaW9uXG4gIH0pO1xuXG4gIC8qXG4gICAgICAgICAgICBjbG91ZHdhdGNoLkFsYXJtKClcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWQgLT4gc3RyaW5nIHZhbHVlXG4gICAgICAgICAgICBtZXRyaWMgLT4gRnVuY3Rpb24gdG8gZmV0Y2ggcHVibGlzaGVkIG1ldHJpY3NcbiAgICAgICAgICAgIGV2YWx1YXRpb25fcGVyaW9kcyAtPiBBZnRlciBob3cgbWFueSBldmFsdWF0aW9uIGRhdGEgd2lsbCBiZSBjb21wYXJlZCB0byB0aHJlc2hvbGRcbiAgICAgICAgICAgIGNvbXBhcmlzb25fb3BlcmF0b3IgLT4gdXNlZCB0byBjb21wYXJlXG4gICAgICAgICAgICBkYXRhcG9pbnRzX3RvX2FsYXJtIC0+IEFmdGVyIGhvdyBtYW55IGRhdGEgcG9pbnRzIGJyZWFjaGluZywgYWxhcm0gc2hvdWxkIGJlIHRyaWdnZXJlZC4gXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIFJldHVybiA6IEdlbmVyYXRlZCBhbGFybXMgaWYgZGF0YXBvaW50cyBleGNlZWRzIHRocmVzaG9sZFxuICAgICAgICAgICAgXG4gICovXG4gIGNvbnN0IGFsYXJtPW5ldyBBbGFybSh0aGlzLCAnYXZhaWxhYmlsaXR5X2FsYXJtJyt1cmxzLCB7XG4gICAgbWV0cmljOiBtZXRyaWMsXG5cbiAgICB0aHJlc2hvbGQ6IDEsXG4gICAgY29tcGFyaXNvbk9wZXJhdG9yOlxuICAgICAgY2xvdWR3YXRjaC5Db21wYXJpc29uT3BlcmF0b3IuR1JFQVRFUl9USEFOX1RIUkVTSE9MRCxcbiAgICBldmFsdWF0aW9uUGVyaW9kczogMSxcbiAgICBhbGFybURlc2NyaXB0aW9uOlxuICAgICAgJ0FsYXJtIGlmIHRoZSBTVU0gb2YgRXJyb3JzIGlzIGdyZWF0ZXIgdGhhbiBvciBlcXVhbCB0byB0aGUgdGhyZXNob2xkICgxKSBmb3IgMSBldmFsdWF0aW9uIHBlcmlvZCcsXG4gIH0pO1xuICByZXR1cm4gYWxhcm1cbn1cblxuXG4vLyBHZW5lcmF0ZSBsYXRlbmN5IGFsYXJtXG5jcmVhdGVfYWxhcm1fbGF0ZW5jeShkaW1lbnNpb246YW55LHVybHM6c3RyaW5nKSB7XG5cbiAgY29uc3QgbWV0cmljID0gbmV3IE1ldHJpYyh7XG4gICAgbmFtZXNwYWNlOiBjb25zdGFudC51cmxfbmFtZXNwYWNlLFxuICAgIG1ldHJpY05hbWU6IGNvbnN0YW50Lk1ldHJpY25hbWVfbGF0ZW5jeSxcbiAgICBwZXJpb2Q6RHVyYXRpb24ubWludXRlcygxKSxcbiAgICBkaW1lbnNpb25zTWFwOiBkaW1lbnNpb25cbiAgfSk7XG5cbiAgY29uc3QgYWxhcm0gPSBuZXcgQWxhcm0odGhpcywgJ0xhdGVuY3lfYWxhcm0nK3VybHMsIHtcbiAgICBtZXRyaWM6IG1ldHJpYyxcbiAgICB0aHJlc2hvbGQ6IDAuNCxcbiAgICBjb21wYXJpc29uT3BlcmF0b3I6XG4gICAgICBjbG91ZHdhdGNoLkNvbXBhcmlzb25PcGVyYXRvci5HUkVBVEVSX1RIQU5fT1JfRVFVQUxfVE9fVEhSRVNIT0xELFxuICAgIGV2YWx1YXRpb25QZXJpb2RzOiAxLFxuICAgIGFsYXJtRGVzY3JpcHRpb246XG4gICAgICAnQWxhcm0gaWYgdGhlIFNVTSBvZiBFcnJvcnMgaXMgZ3JlYXRlciB0aGFuIG9yIGVxdWFsIHRvIHRoZSB0aHJlc2hvbGQgKDEpIGZvciAxIGV2YWx1YXRpb24gcGVyaW9kJyxcbiAgfSk7XG4gIHJldHVybiBhbGFybVxufVxuXG5cbi8vIENyZWF0ZSB0YWJsZSBkeW5hbW9kYiBmdW5jdGlvblxuY3JlYXRlX3RhYmxlKCkge1xuXG4gICAgLypcbiAgICBUYWJsZSgpXG4gICAgdGFibGVfaWQgLT4gaWQgb2YgdGFibGVcbiAgICBwYXJ0aXRpb25fa2V5IC0+IHVuaXF1ZSBrZXkgXG4gICAgc29ydF9rZXkgLT4ga2V5IHVzZWQgZm9yIHNvcnRpbmdcbiAgICBcbiAgICBSZXR1cm4gOiBEeW5hbW8gZGIgdGFibGVcbiAgICAqL1xuXG4gIGNvbnN0IGdsb2JhbFRhYmxlID0gbmV3IGR5bmFtb2RiLlRhYmxlKHRoaXMsIGNvbnN0YW50LnRhYmxlX2lkLCB7XG4gICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6IGNvbnN0YW50LnBhcnRpdGlvbl9rZXksIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXG4gICAgcmVwbGljYXRpb25SZWdpb25zOiBbJ3VzLWVhc3QtMSddLCB9KTtcbiAgICByZXR1cm4gZ2xvYmFsVGFibGVcbn1cblxuXG4vLyBHZW5lcmF0ZSBGYWlsdXJlIGFsYXJtc1xuZmFpbHVyZV9tZXRyaWNzKGZ1bmN0aW9uX25hbWU6YW55KXtcblxuICAgICAgLypcbiAgICAgICAgICAgIGNsb3Vkd2F0Y2guTWV0cmljKClcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgbmFtZXNwYWNlIC0+IEFXUy9MYW1iZGFcbiAgICAgICAgICAgIG1ldHJpY19uYW1lIC0+IER1cmF0aW9uXG4gICAgICAgICAgICBkaW1lbnRpb25zX21hcCAtPiBGdW5jdGlvbk5hbWUgYW5kIGxhbWJkYSBmdW5jdGlvbiBuYW1lXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIFJldHVybiA6IEZldGNoIGF3cyBMYW1iZGEgZHVyYXRpb24gdmFsdWVcbiAgICAgICovXG5cblxuICAgICAgICBjb25zdCBtZXRyaWMgPSBuZXcgTWV0cmljKHtcbiAgICAgICAgICAgICAgICBuYW1lc3BhY2U6IGNvbnN0YW50LmZhaWxfbWV0cmljX25hbWVzcGFjZSxcbiAgICAgICAgICAgICAgICBtZXRyaWNOYW1lOiBjb25zdGFudC5mYWlsX21ldHJpY25hbWUsXG4gICAgICAgICAgICAgICAgZGltZW5zaW9uc01hcDoge1wiRnVuY3Rpb25OYW1lXCI6ZnVuY3Rpb25fbmFtZX1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgYWxhcm0gPSBuZXcgQWxhcm0odGhpcywgJ2ZhaWx1cmVfYWxhcm0nLCB7XG4gICAgICAgICAgICAgICAgbWV0cmljOiBtZXRyaWMsXG4gICAgICAgICAgICAgICAgdGhyZXNob2xkOiBjb25zdGFudC5mYWlsX21ldHJpY190aHJlc2hvbGQsXG4gICAgICAgICAgICAgICAgY29tcGFyaXNvbk9wZXJhdG9yOlxuICAgICAgICAgICAgICAgIGNsb3Vkd2F0Y2guQ29tcGFyaXNvbk9wZXJhdG9yLkdSRUFURVJfVEhBTl9PUl9FUVVBTF9UT19USFJFU0hPTEQsXG4gICAgICAgICAgICAgICAgZXZhbHVhdGlvblBlcmlvZHM6IDEsXG4gICAgICAgICAgICAgICAgZGF0YXBvaW50c1RvQWxhcm06MVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGFsYXJtXG59XG5cbnJvbGxfYmFjayhmYWlsdXJlX21ldHJpYzphbnksbGFtYmRhX2Z1bmMxOmFueSl7XG5cbiAgLypcbiAgICAgICAgSWQgKHN0cikgOiBJZFxuICAgICAgICBBbGlhc19uYW1lKHN0cikgOiBOYW1lIG9mIGFsaWFzXG4gICAgICAgIFZlcnNpb246IEN1cnJlbnQgdmVyc2lvbiBvZiBsYW1iZGEgZnVuY3Rpb25cbiAgICAgICAgICAgIFxuICAgICAgICBSZXR1cm4gOiBDdXJyZW5jdCB2ZXJzaW9uIG9mIGxhbWJkYSBmdW5jdGlvblxuICAqL1xuXG4gIGNvbnN0IGFsaWFzID0gbmV3IGxhbWJkYS5BbGlhcyh0aGlzLCAnTGFtYmRhQWxpYXMnLCB7XG4gICAgYWxpYXNOYW1lOiAnQ3VycmVudF9WZXJzaW9uJyxcbiAgICB2ZXJzaW9uIDpsYW1iZGFfZnVuYzEsXG4gIH0pO1xuICBcblxuICAvKlxuICAgICAgICAgICAgTGFtYmRhRGVwbG95bWVudEdyb3VwKClcbiAgICAgICAgXG4gICAgICAgICAgICBJZChzdHIpIDogSWRcbiAgICAgICAgICAgIGFsaWFzKEZ1bmMpIDogQWxpYXNcbiAgICAgICAgICAgIGRlcGxveW1lbnRfY29uZmlnOiBIb3cgbWFueSB0cmFmZmljIHNob3VsZCBiZSBzZW5kIHRvIG5ldyBsYW1iZGEgZnVuY3Rpb24gaW4gc3BlY2lmaWMgdGltZS5cbiAgICAgICAgICAgIEFsYXJtcyhmdW5jKTogdHJpZ2dlcmVkIGFsYXJtXG4gICAgICAgICAgIFxuICAqL1xuICAgICAgICBcbiAgICAgICAgICAgIFxuICAgICAgICAvLyBEZXBsb3kgcHJldmlvdXMgdmVyc2lvbiBvZiBsYW1iZGEgaWYgYWxhcm1zIGdldHMgdHJpZ2dlcmVkXG4gIG5ldyBMYW1iZGFEZXBsb3ltZW50R3JvdXAodGhpcywgJ0RlcGxveW1lbnRHcm91cCcsIHtcbiAgICBhbGlhcyxcbiAgICBkZXBsb3ltZW50Q29uZmlnOiBMYW1iZGFEZXBsb3ltZW50Q29uZmlnLkxJTkVBUl8xMFBFUkNFTlRfRVZFUllfMU1JTlVURSxcbiAgICBhbGFybXM6W2ZhaWx1cmVfbWV0cmljXVxuICB9KTtcblxufVxuXG59XG4iXX0=