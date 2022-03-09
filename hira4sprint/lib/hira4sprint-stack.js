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
        var lambda_func = this.lambdas(roles, "WebHealthLambda", "./resources", "webHealthLambda.webhandler", s3_bucket);
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
        var dynamo_lambda = this.lambdas(roles, "DynamoLambda", "./resources", "dynamodb.dynamohandler", table_name);
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
    lambdas(roles, id, asset, handler, envior_var) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGlyYTRzcHJpbnQtc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJoaXJhNHNwcmludC1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSw2Q0FBd0U7QUFDeEUsaURBQWlEO0FBRWpELGlEQUFpRDtBQUNqRCwwREFBMEQ7QUFDMUQsaURBQTRFO0FBQzVFLHlEQUF5RDtBQUN6RCxNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsNEJBQTRCLENBQUMsQ0FBQztBQUN2RCwrREFBdUQ7QUFDdkQscUVBQXNFO0FBQ3RFLCtDQUFpRTtBQUNqRSwyQ0FBMkM7QUFDM0MsNkVBQXVGO0FBQ3ZGLGlFQUFpRTtBQUNqRSxxREFBcUQ7QUFDckQsK0RBQXdGO0FBRXhGLE1BQWEsZ0JBQWlCLFNBQVEsbUJBQUs7SUFDekMsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUFrQjs7UUFDMUQsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsT0FBTztRQUNQLElBQUksS0FBSyxHQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUU3QiwyQ0FBMkM7UUFDM0MsTUFBTSxNQUFNLEdBQUcsSUFBSSxlQUFNLENBQUMsSUFBSSxFQUFDLEVBQUUsR0FBQyxRQUFRLENBQUMsU0FBUyxFQUFDLEVBQUMsYUFBYSxFQUFFLDRCQUFtQixDQUFDLFdBQVcsR0FBRSxDQUFDLENBQUM7UUFDeEcsSUFBSSxTQUFTLEdBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQTtRQUMvQixNQUFBLE1BQU0sQ0FBQyxNQUFNLDBDQUFFLGtCQUFrQixDQUFDLDJCQUFhLENBQUMsT0FBTyxFQUFFO1FBRXpELDZCQUE2QjtRQUM3QixJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBR3pCLDREQUE0RDtRQUM1RCxJQUFJLFdBQVcsR0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBQyxpQkFBaUIsRUFBQyxhQUFh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LDhCQUE4QjtZQUN2RSxNQUFNLEVBQUMsQ0FBQyxjQUFjLENBQUM7U0FDeEIsQ0FBQyxDQUFDO0lBRUwsQ0FBQztDQUVBO0FBclNELDRDQXFTQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IER1cmF0aW9uLCBSZW1vdmFsUG9saWN5LCBTdGFjaywgU3RhY2tQcm9wc30gZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEnO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5pbXBvcnQgKiBhcyBldmVudHMgZnJvbSAnYXdzLWNkay1saWIvYXdzLWV2ZW50cyc7XG5pbXBvcnQgKiBhcyB0YXJnZXRzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1ldmVudHMtdGFyZ2V0cyc7XG5pbXBvcnQgeyBNYW5hZ2VkUG9saWN5LCBSb2xlLCBTZXJ2aWNlUHJpbmNpcGFsIH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWlhbSc7XG5pbXBvcnQgKiBhcyBjbG91ZHdhdGNoIGZyb20gJ2F3cy1jZGstbGliL2F3cy1jbG91ZHdhdGNoJztcbmNvbnN0IGNvbnN0YW50ID0gcmVxdWlyZShcIi4uL3Jlc291cmNlcy9jb25zdGFudC5qc29uXCIpO1xuaW1wb3J0IHtBbGFybSxNZXRyaWN9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1jbG91ZHdhdGNoJ1xuaW1wb3J0IHtCdWNrZXREZXBsb3ltZW50LCBTb3VyY2V9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1zMy1kZXBsb3ltZW50J1xuaW1wb3J0IHsgQnVja2V0LCBCdWNrZXRBY2Nlc3NDb250cm9sIH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLXMzJztcbmltcG9ydCAqIGFzIHNucyBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtc25zJztcbmltcG9ydCB7RW1haWxTdWJzY3JpcHRpb24sIExhbWJkYVN1YnNjcmlwdGlvbn0gZnJvbSAnYXdzLWNkay1saWIvYXdzLXNucy1zdWJzY3JpcHRpb25zJ1xuaW1wb3J0ICogYXMgY3dfYWN0aW9ucyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY2xvdWR3YXRjaC1hY3Rpb25zJztcbmltcG9ydCAqIGFzIGR5bmFtb2RiIGZyb20gJ2F3cy1jZGstbGliL2F3cy1keW5hbW9kYic7XG5pbXBvcnQge0xhbWJkYURlcGxveW1lbnRDb25maWcsIExhbWJkYURlcGxveW1lbnRHcm91cH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWNvZGVkZXBsb3knXG5cbmV4cG9ydCBjbGFzcyBIaXJhNFNwcmludFN0YWNrIGV4dGVuZHMgU3RhY2sge1xuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wcz86IFN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIC8vUm9sZXNcbiAgICB2YXIgcm9sZXM9dGhpcy5jcmVhdGVfcm9sZSgpO1xuXG4gICAgLyotLS0tLS0tLS0tQ3JlYXRpbmcgUzMgYnVja2V0LS0tLS0tLS0tLS0qL1xuICAgIGNvbnN0IGJ1Y2tldCA9IG5ldyBCdWNrZXQodGhpcyxpZD1jb25zdGFudC5idWNrZXRfaWQse2FjY2Vzc0NvbnRyb2w6IEJ1Y2tldEFjY2Vzc0NvbnRyb2wuUFVCTElDX1JFQUQsfSk7XG4gICAgdmFyIHMzX2J1Y2tldD1idWNrZXQuYnVja2V0TmFtZVxuICAgIGJ1Y2tldC5wb2xpY3k/LmFwcGx5UmVtb3ZhbFBvbGljeShSZW1vdmFsUG9saWN5LkRFU1RST1kpO1xuXG4gICAgLy9VcGxvYWRpbmcgZmlsZSB0byBTMyBidWNrZXRcbiAgICB0aGlzLlVwbG9hZF9maWxlKGJ1Y2tldCk7XG5cblxuICAgIC8qLS0tLS0tLS0tLS1DYWxsaW5nIHdlYiBoZWFsdGggbGFtYmRhIGZ1bmN0aW9uLS0tLS0tLS0tLS0qL1xuICAgIHZhciBsYW1iZGFfZnVuYz10aGlzLmxhbWJkYXMocm9sZXMsXCJXZWJIZWFsdGhMYW1iZGFcIixcIi4vcmVzb3VyY2VzXCIsXCJ3ZWJIZWFsdGhMYW1iZGEud2ViaGFuZGxlclwiLHMzX2J1Y2tldClcbiAgICB2YXIgZnVuY3Rpb25fbmFtZT1sYW1iZGFfZnVuYy5mdW5jdGlvbk5hbWVcblxuICAgIC8vIFJ1biBMYW1iZGEgcGVyaW9kaWNhbGx5XG4gICAgY29uc3QgcnVsZSA9IG5ldyBldmVudHMuUnVsZSh0aGlzLCAnUnVsZScsIHtcbiAgICAgICAgICAgICAgICAgIHNjaGVkdWxlOiBldmVudHMuU2NoZWR1bGUucmF0ZShEdXJhdGlvbi5taW51dGVzKDEpKSxcbiAgICAgICAgICAgICAgICAgIHRhcmdldHM6IFtuZXcgdGFyZ2V0cy5MYW1iZGFGdW5jdGlvbihsYW1iZGFfZnVuYyldLFxuICAgIH0pO1xuXG5cbiAgICAvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLUNyZWF0aW5nIGFuIFNOUyBUT1BJQy0tLS0tLS0tLS0tLS0tLS0qL1xuXG4gICAgY29uc3QgdG9waWMgPSBuZXcgc25zLlRvcGljKHRoaXMsICdNeVRvcGljJyk7XG4gICAgdG9waWMuYWRkU3Vic2NyaXB0aW9uKG5ldyBFbWFpbFN1YnNjcmlwdGlvbihjb25zdGFudC5lbWFpbCkpO1xuICAgXG5cbiAgICBmb3IgKGxldCB1cmxzIG9mIGNvbnN0YW50LnVybCl7XG4gICAgICAgICAgICAgIGxldCBkaW1lbnNpb249eydVUkwnOnVybHN9XG5cbiAgICAgICAgICAgIC8qIFxuICAgICAgICAgICAgY3JlYXRlX2FsYXJtKClcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZGltZW5zaW9ucyAtPiBrZXkgdmFsdWUgcGFpciAsIGtleSA9IFwiVVJMXCIgYW5kIHZhbHVlID0gdXJsXG4gICAgICAgICAgICB1cmxzID0gdXJsIG9mIHdlYnNpdGUgXG5cbiAgICAgICAgICAgICovXG5cbiAgICAgICAgICAgICAgY29uc3QgYWxhcm1fYXZhaWw9IHRoaXMuY3JlYXRlX2FsYXJtX2F2YWlsKGRpbWVuc2lvbix1cmxzKTsgLy8gQ2FsbGluZyBhbiBhbGFybiBmb3IgbGF0ZW5jeVxuICAgICAgICAgICAgICBjb25zdCBhbGFybV9sYXRlbmN5PSB0aGlzLmNyZWF0ZV9hbGFybV9sYXRlbmN5KGRpbWVuc2lvbix1cmxzKSAgLy8gQ2FsbGluIGFuIGFsYXJtIGZvciBhdmFpbGFiaWxpdHlcblxuICAgICAgICAgICAgICBhbGFybV9hdmFpbC5hZGRBbGFybUFjdGlvbihuZXcgY3dfYWN0aW9ucy5TbnNBY3Rpb24odG9waWMpKTsgIC8vIEJpbmRpbmcgYXZhaWwgYWxhcm0gdG8gc25zXG4gICAgICAgICAgICAgIGFsYXJtX2xhdGVuY3kuYWRkQWxhcm1BY3Rpb24obmV3IGN3X2FjdGlvbnMuU25zQWN0aW9uKHRvcGljKSk7ICAvLyBCaW5kaW5nIGxhdGVuY3kgYWxhcm0gdG8gc25zXG4gICAgfVxuXG5cbiAgICAvKi0tLS0tLS0tLS0tLUNyZWF0aW5nIFRhYmxlLS0tLS0tLS0tLS0tLSovXG5cbiAgICBjb25zdCBteV90YWJsZT10aGlzLmNyZWF0ZV90YWJsZSgpO1xuICAgIHZhciB0YWJsZV9uYW1lPW15X3RhYmxlLnRhYmxlTmFtZVxuICAgIFxuICAgIC8vQ2FsaW5nIERZTkFNTyBEQiBsYW1iZGEgZnVuY3Rpb25cbiAgICB2YXIgZHluYW1vX2xhbWJkYT10aGlzLmxhbWJkYXMocm9sZXMsXCJEeW5hbW9MYW1iZGFcIixcIi4vcmVzb3VyY2VzXCIsXCJkeW5hbW9kYi5keW5hbW9oYW5kbGVyXCIsdGFibGVfbmFtZSlcbiAgICBteV90YWJsZS5ncmFudFJlYWRXcml0ZURhdGEoZHluYW1vX2xhbWJkYSlcbiAgICBcbiAgICAvLyBpbnZva2UgbGFtYmRhIGFmdGVyIGV2ZXJ5IGFsYXJtXG4gICAgdG9waWMuYWRkU3Vic2NyaXB0aW9uKG5ldyBMYW1iZGFTdWJzY3JpcHRpb24oZHluYW1vX2xhbWJkYSkpXG5cblxuXG4gICAgLy8gQ3JlYXRpbmcgRmFpbHVyZXMgQWxhcm1cbiAgICBjb25zdCBsYW1iZGFfZnVuYzE9bGFtYmRhX2Z1bmMuY3VycmVudFZlcnNpb25cbiAgICBcbiAgICAvKlxuICAgIGZhaWx1cmVfbWV0cmljKClcbiAgICBmdW5jdGlvbl9uYW1lID0gbmFtZSBvZiBjdXJyZW50IHZlcnNpb24gb2YgbGFtYmRhXG4gICAgXG4gICAgcmV0dXJucyBtZXRyaWNcbiAgICAqL1xuICAgIGNvbnN0IGZhaWx1cmVfbWV0cmljPXRoaXMuZmFpbHVyZV9tZXRyaWNzKGZ1bmN0aW9uX25hbWUpO1xuXG4gICAgLy8gQXV0byBSb2xsIGJhY2tcbiAgICB0aGlzLnJvbGxfYmFjayhmYWlsdXJlX21ldHJpYyxsYW1iZGFfZnVuYzEpIFxuICB9XG5cblxuXG4vKi0tLS0tLS0gRnVuY3Rpb25zLS0tLS0tKi9cblxuXG4vLyBCdWNrZXQgZGVwbG95bWVudCBmdW5jIHdpbGwgdXBsb2FkIGFsbCBmaWxlcyBvZiByZXNvdXJjZSBmb2xkZXIgdG8gczMgYnVja2V0XG5VcGxvYWRfZmlsZShidWNrZXQ6IEJ1Y2tldCkge1xuICBjb25zdCBkZXBsb3ltZW50ID0gbmV3IEJ1Y2tldERlcGxveW1lbnQodGhpcywgJ0RlcGxveVdlYnNpdGUnLCB7XG4gICAgc291cmNlczogW1NvdXJjZS5hc3NldCgnLi9yZXNvdXJjZXMnKV0sXG4gICAgZGVzdGluYXRpb25CdWNrZXQ6IGJ1Y2tldH0pXG4gIH1cblxuXG4vLyBDYWxsaW5nIExhbWJkYSBGdW5jdGlvblxubGFtYmRhcyhyb2xlczphbnksaWQ6c3RyaW5nLGFzc2V0OnN0cmluZyxoYW5kbGVyOnN0cmluZyxlbnZpb3JfdmFyOnN0cmluZyk6YW55e1xuXG4gIC8qIGNyZWF0ZV9sYW1iZGEoKVxuICAgICAgICBcbiAgaWQgLT4gc3RyaW5nIHZhbHVlXG4gIGFzc2V0IC0+IEZvbGRlciB0aGF0IGNvbnRhaW5zIGNvZGVcbiAgcnVudGltZSAtPiBMYW5ndWFnZVxuICBoYW5kbGVyIC0+IExhbWJkYSBmdW5jdGlvblxuICB0aW1lb3V0IC0+IEFmdGVyIGhvdyBsb25nIGxhbWJkYSB3aWxsIGVuZFxuICBcbiAgUmV0dXJuIDogTGFtYmRhIEZ1bmN0aW9uICovXG5cbiAgY29uc3QgaGVsbG8gPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsIGlkLCB7XG4gICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzE0X1gsICAgIC8vIGV4ZWN1dGlvbiBlbnZpcm9ubWVudFxuICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldChhc3NldCksICAvLyBjb2RlIGxvYWRlZCBmcm9tIFwicmVzb3VyY2VcIiBkaXJlY3RvcnlcbiAgICBoYW5kbGVyOiBoYW5kbGVyLFxuICAgIHRpbWVvdXQ6IER1cmF0aW9uLnNlY29uZHMoMTgwKSAgLFxuICAgIHJvbGU6cm9sZXMsXG4gICAgZW52aXJvbm1lbnQ6eyd0YWJsZV9uYW1lJzplbnZpb3JfdmFyfSAgICAgICAgICAgICAvLyBmaWxlIGlzIFwid2ViaGFuZGxlclwiLCBmdW5jdGlvbiBpcyBcImhhbmRsZXJcIlxuICB9KTtcbiAgcmV0dXJuIGhlbGxvXG59XG5cblxuLy8gY3JlYXRlIFJvbGVzXG5jcmVhdGVfcm9sZSgpOmFueXtcblxuY29uc3Qgcm9sZSA9IG5ldyBSb2xlKHRoaXMsICdleGFtcGxlLWlhbS1yb2xlJywge1xuICBhc3N1bWVkQnk6IG5ldyBTZXJ2aWNlUHJpbmNpcGFsKCdsYW1iZGEuYW1hem9uYXdzLmNvbScpLFxuICBkZXNjcmlwdGlvbjogJ0FuIGV4YW1wbGUgSUFNIHJvbGUgaW4gQVdTIENESycsXG4gIG1hbmFnZWRQb2xpY2llczogW1xuICAgIE1hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKCdDbG91ZFdhdGNoRnVsbEFjY2VzcycpLFxuICAgIE1hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKCdBbWF6b25EeW5hbW9EQkZ1bGxBY2Nlc3MnKSxcbiAgICBNYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZSgnc2VydmljZS1yb2xlL0FXU0xhbWJkYUJhc2ljRXhlY3V0aW9uUm9sZScpLFxuICAgIE1hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKCdBV1NMYW1iZGFJbnZvY2F0aW9uLUR5bmFtb0RCJyksXG4gIF0sXG59KTtcbnJldHVybiByb2xlXG59XG5cblxuLy8gR2VuZXJhdGUgYXZhaWxhYmlsaXR5IGFsYXJtXG5jcmVhdGVfYWxhcm1fYXZhaWwoZGltZW5zaW9uOmFueSx1cmxzOnN0cmluZykge1xuXG4gIC8qXG4gICAgICAgICAgICBjbG91ZHdhdGNoLk1ldHJpYygpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIG1ldHJpY19uYW1lIC0+ICBOYW1lIG9mIHRoZSBtZXRyaWNcbiAgICAgICAgICAgIG5hbWVzcGFjZSAtPiAgICBOYW1lc3BhY2Ugb2YgdGhlIG1ldHJpYyBkYXRhXG4gICAgICAgICAgICBwZXJpb2QgLT4gICBBZnRlciBob3cgbWFueSBtaW51dGVzIHRoaXMgd2lsbCBjaGVjayBkYXRhcG9pbnRzIGluIHB1Ymxpc2hlZCBtZXRyaWNzXG4gICAgICAgICAgICBkaW1lbnNpb25zIC0+ICAgSXQgdGFrZXMga2V5IGFuZCB2YWx1ZS4gV2hhdCB3ZSBhcmUgbW9uaXRvcmluZ1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBSZXR1cm4gOiBGZXRjaCBtZXRyaWMgb24gYXdzIGNsb3Vkd2F0Y2hcbiAgICAgICAgICAgIFxuICAqL1xuXG5cbiAgY29uc3QgbWV0cmljID0gbmV3IE1ldHJpYyh7XG4gICAgbmFtZXNwYWNlOiBjb25zdGFudC51cmxfbmFtZXNwYWNlLFxuICAgIG1ldHJpY05hbWU6IGNvbnN0YW50Lk1ldHJpY25hbWVfYXZhaWwsXG4gICAgcGVyaW9kOkR1cmF0aW9uLm1pbnV0ZXMoMSksXG4gICAgZGltZW5zaW9uc01hcDogZGltZW5zaW9uXG4gIH0pO1xuXG4gIC8qXG4gICAgICAgICAgICBjbG91ZHdhdGNoLkFsYXJtKClcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWQgLT4gc3RyaW5nIHZhbHVlXG4gICAgICAgICAgICBtZXRyaWMgLT4gRnVuY3Rpb24gdG8gZmV0Y2ggcHVibGlzaGVkIG1ldHJpY3NcbiAgICAgICAgICAgIGV2YWx1YXRpb25fcGVyaW9kcyAtPiBBZnRlciBob3cgbWFueSBldmFsdWF0aW9uIGRhdGEgd2lsbCBiZSBjb21wYXJlZCB0byB0aHJlc2hvbGRcbiAgICAgICAgICAgIGNvbXBhcmlzb25fb3BlcmF0b3IgLT4gdXNlZCB0byBjb21wYXJlXG4gICAgICAgICAgICBkYXRhcG9pbnRzX3RvX2FsYXJtIC0+IEFmdGVyIGhvdyBtYW55IGRhdGEgcG9pbnRzIGJyZWFjaGluZywgYWxhcm0gc2hvdWxkIGJlIHRyaWdnZXJlZC4gXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIFJldHVybiA6IEdlbmVyYXRlZCBhbGFybXMgaWYgZGF0YXBvaW50cyBleGNlZWRzIHRocmVzaG9sZFxuICAgICAgICAgICAgXG4gICovXG4gIGNvbnN0IGFsYXJtPW5ldyBBbGFybSh0aGlzLCAnYXZhaWxhYmlsaXR5X2FsYXJtJyt1cmxzLCB7XG4gICAgbWV0cmljOiBtZXRyaWMsXG5cbiAgICB0aHJlc2hvbGQ6IDEsXG4gICAgY29tcGFyaXNvbk9wZXJhdG9yOlxuICAgICAgY2xvdWR3YXRjaC5Db21wYXJpc29uT3BlcmF0b3IuR1JFQVRFUl9USEFOX1RIUkVTSE9MRCxcbiAgICBldmFsdWF0aW9uUGVyaW9kczogMSxcbiAgICBhbGFybURlc2NyaXB0aW9uOlxuICAgICAgJ0FsYXJtIGlmIHRoZSBTVU0gb2YgRXJyb3JzIGlzIGdyZWF0ZXIgdGhhbiBvciBlcXVhbCB0byB0aGUgdGhyZXNob2xkICgxKSBmb3IgMSBldmFsdWF0aW9uIHBlcmlvZCcsXG4gIH0pO1xuICByZXR1cm4gYWxhcm1cbn1cblxuXG4vLyBHZW5lcmF0ZSBsYXRlbmN5IGFsYXJtXG5jcmVhdGVfYWxhcm1fbGF0ZW5jeShkaW1lbnNpb246YW55LHVybHM6c3RyaW5nKSB7XG5cbiAgY29uc3QgbWV0cmljID0gbmV3IE1ldHJpYyh7XG4gICAgbmFtZXNwYWNlOiBjb25zdGFudC51cmxfbmFtZXNwYWNlLFxuICAgIG1ldHJpY05hbWU6IGNvbnN0YW50Lk1ldHJpY25hbWVfbGF0ZW5jeSxcbiAgICBwZXJpb2Q6RHVyYXRpb24ubWludXRlcygxKSxcbiAgICBkaW1lbnNpb25zTWFwOiBkaW1lbnNpb25cbiAgfSk7XG5cbiAgY29uc3QgYWxhcm0gPSBuZXcgQWxhcm0odGhpcywgJ0xhdGVuY3lfYWxhcm0nK3VybHMsIHtcbiAgICBtZXRyaWM6IG1ldHJpYyxcbiAgICB0aHJlc2hvbGQ6IDAuNCxcbiAgICBjb21wYXJpc29uT3BlcmF0b3I6XG4gICAgICBjbG91ZHdhdGNoLkNvbXBhcmlzb25PcGVyYXRvci5HUkVBVEVSX1RIQU5fT1JfRVFVQUxfVE9fVEhSRVNIT0xELFxuICAgIGV2YWx1YXRpb25QZXJpb2RzOiAxLFxuICAgIGFsYXJtRGVzY3JpcHRpb246XG4gICAgICAnQWxhcm0gaWYgdGhlIFNVTSBvZiBFcnJvcnMgaXMgZ3JlYXRlciB0aGFuIG9yIGVxdWFsIHRvIHRoZSB0aHJlc2hvbGQgKDEpIGZvciAxIGV2YWx1YXRpb24gcGVyaW9kJyxcbiAgfSk7XG4gIHJldHVybiBhbGFybVxufVxuXG5cbi8vIENyZWF0ZSB0YWJsZSBkeW5hbW9kYiBmdW5jdGlvblxuY3JlYXRlX3RhYmxlKCkge1xuXG4gICAgLypcbiAgICBUYWJsZSgpXG4gICAgdGFibGVfaWQgLT4gaWQgb2YgdGFibGVcbiAgICBwYXJ0aXRpb25fa2V5IC0+IHVuaXF1ZSBrZXkgXG4gICAgc29ydF9rZXkgLT4ga2V5IHVzZWQgZm9yIHNvcnRpbmdcbiAgICBcbiAgICBSZXR1cm4gOiBEeW5hbW8gZGIgdGFibGVcbiAgICAqL1xuXG4gIGNvbnN0IGdsb2JhbFRhYmxlID0gbmV3IGR5bmFtb2RiLlRhYmxlKHRoaXMsIGNvbnN0YW50LnRhYmxlX2lkLCB7XG4gICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6IGNvbnN0YW50LnBhcnRpdGlvbl9rZXksIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXG4gICAgcmVwbGljYXRpb25SZWdpb25zOiBbJ3VzLWVhc3QtMSddLCB9KTtcbiAgICByZXR1cm4gZ2xvYmFsVGFibGVcbn1cblxuXG4vLyBHZW5lcmF0ZSBGYWlsdXJlIGFsYXJtc1xuZmFpbHVyZV9tZXRyaWNzKGZ1bmN0aW9uX25hbWU6YW55KXtcblxuICAgICAgLypcbiAgICAgICAgICAgIGNsb3Vkd2F0Y2guTWV0cmljKClcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgbmFtZXNwYWNlIC0+IEFXUy9MYW1iZGFcbiAgICAgICAgICAgIG1ldHJpY19uYW1lIC0+IER1cmF0aW9uXG4gICAgICAgICAgICBkaW1lbnRpb25zX21hcCAtPiBGdW5jdGlvbk5hbWUgYW5kIGxhbWJkYSBmdW5jdGlvbiBuYW1lXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIFJldHVybiA6IEZldGNoIGF3cyBMYW1iZGEgZHVyYXRpb24gdmFsdWVcbiAgICAgICovXG5cblxuICAgICAgICBjb25zdCBtZXRyaWMgPSBuZXcgTWV0cmljKHtcbiAgICAgICAgICAgICAgICBuYW1lc3BhY2U6IGNvbnN0YW50LmZhaWxfbWV0cmljX25hbWVzcGFjZSxcbiAgICAgICAgICAgICAgICBtZXRyaWNOYW1lOiBjb25zdGFudC5mYWlsX21ldHJpY25hbWUsXG4gICAgICAgICAgICAgICAgZGltZW5zaW9uc01hcDoge1wiRnVuY3Rpb25OYW1lXCI6ZnVuY3Rpb25fbmFtZX1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgYWxhcm0gPSBuZXcgQWxhcm0odGhpcywgJ2ZhaWx1cmVfYWxhcm0nLCB7XG4gICAgICAgICAgICAgICAgbWV0cmljOiBtZXRyaWMsXG4gICAgICAgICAgICAgICAgdGhyZXNob2xkOiBjb25zdGFudC5mYWlsX21ldHJpY190aHJlc2hvbGQsXG4gICAgICAgICAgICAgICAgY29tcGFyaXNvbk9wZXJhdG9yOlxuICAgICAgICAgICAgICAgIGNsb3Vkd2F0Y2guQ29tcGFyaXNvbk9wZXJhdG9yLkdSRUFURVJfVEhBTl9PUl9FUVVBTF9UT19USFJFU0hPTEQsXG4gICAgICAgICAgICAgICAgZXZhbHVhdGlvblBlcmlvZHM6IDEsXG4gICAgICAgICAgICAgICAgZGF0YXBvaW50c1RvQWxhcm06MVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGFsYXJtXG59XG5cbnJvbGxfYmFjayhmYWlsdXJlX21ldHJpYzphbnksbGFtYmRhX2Z1bmMxOmFueSl7XG5cbiAgLypcbiAgICAgICAgSWQgKHN0cikgOiBJZFxuICAgICAgICBBbGlhc19uYW1lKHN0cikgOiBOYW1lIG9mIGFsaWFzXG4gICAgICAgIFZlcnNpb246IEN1cnJlbnQgdmVyc2lvbiBvZiBsYW1iZGEgZnVuY3Rpb25cbiAgICAgICAgICAgIFxuICAgICAgICBSZXR1cm4gOiBDdXJyZW5jdCB2ZXJzaW9uIG9mIGxhbWJkYSBmdW5jdGlvblxuICAqL1xuXG4gIGNvbnN0IGFsaWFzID0gbmV3IGxhbWJkYS5BbGlhcyh0aGlzLCAnTGFtYmRhQWxpYXMnLCB7XG4gICAgYWxpYXNOYW1lOiAnQ3VycmVudF9WZXJzaW9uJyxcbiAgICB2ZXJzaW9uIDpsYW1iZGFfZnVuYzEsXG4gIH0pO1xuICBcblxuICAvKlxuICAgICAgICAgICAgTGFtYmRhRGVwbG95bWVudEdyb3VwKClcbiAgICAgICAgXG4gICAgICAgICAgICBJZChzdHIpIDogSWRcbiAgICAgICAgICAgIGFsaWFzKEZ1bmMpIDogQWxpYXNcbiAgICAgICAgICAgIGRlcGxveW1lbnRfY29uZmlnOiBIb3cgbWFueSB0cmFmZmljIHNob3VsZCBiZSBzZW5kIHRvIG5ldyBsYW1iZGEgZnVuY3Rpb24gaW4gc3BlY2lmaWMgdGltZS5cbiAgICAgICAgICAgIEFsYXJtcyhmdW5jKTogdHJpZ2dlcmVkIGFsYXJtXG4gICAgICAgICAgIFxuICAqL1xuICAgICAgICBcbiAgICAgICAgLy8gRGVwbG95IHByZXZpb3VzIHZlcnNpb24gb2YgbGFtYmRhIGlmIGFsYXJtcyBnZXRzIHRyaWdnZXJlZFxuICBuZXcgTGFtYmRhRGVwbG95bWVudEdyb3VwKHRoaXMsICdEZXBsb3ltZW50R3JvdXAnLCB7XG4gICAgYWxpYXMsXG4gICAgZGVwbG95bWVudENvbmZpZzogTGFtYmRhRGVwbG95bWVudENvbmZpZy5MSU5FQVJfMTBQRVJDRU5UX0VWRVJZXzFNSU5VVEUsXG4gICAgYWxhcm1zOltmYWlsdXJlX21ldHJpY11cbiAgfSk7XG5cbn1cblxufVxuIl19