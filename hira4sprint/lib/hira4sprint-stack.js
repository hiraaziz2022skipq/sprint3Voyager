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
            alias: alias,
            deploymentConfig: aws_codedeploy_1.LambdaDeploymentConfig.CANARY_10PERCENT_5MINUTES,
            alarms: [failure_metric]
        });
    }
}
exports.Hira4SprintStack = Hira4SprintStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGlyYTRzcHJpbnQtc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJoaXJhNHNwcmludC1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSw2Q0FBd0U7QUFDeEUsaURBQWlEO0FBRWpELGlEQUFpRDtBQUNqRCwwREFBMEQ7QUFDMUQsaURBQTRFO0FBQzVFLHlEQUF5RDtBQUN6RCxNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsNEJBQTRCLENBQUMsQ0FBQztBQUN2RCwrREFBdUQ7QUFDdkQscUVBQXNFO0FBQ3RFLCtDQUFpRTtBQUNqRSwyQ0FBMkM7QUFDM0MsNkVBQXVGO0FBQ3ZGLGlFQUFpRTtBQUNqRSxxREFBcUQ7QUFDckQsK0RBQXdGO0FBRXhGLE1BQWEsZ0JBQWlCLFNBQVEsbUJBQUs7SUFDekMsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUFrQjs7UUFDMUQsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsT0FBTztRQUNQLElBQUksS0FBSyxHQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUU3QiwyQ0FBMkM7UUFDM0MsTUFBTSxNQUFNLEdBQUcsSUFBSSxlQUFNLENBQUMsSUFBSSxFQUFDLEVBQUUsR0FBQyxRQUFRLENBQUMsU0FBUyxFQUFDLEVBQUMsYUFBYSxFQUFFLDRCQUFtQixDQUFDLFdBQVcsR0FBRSxDQUFDLENBQUM7UUFDeEcsSUFBSSxTQUFTLEdBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQTtRQUMvQixNQUFBLE1BQU0sQ0FBQyxNQUFNLDBDQUFFLGtCQUFrQixDQUFDLDJCQUFhLENBQUMsT0FBTyxFQUFFO1FBRXpELDZCQUE2QjtRQUM3QixJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBR3pCLDREQUE0RDtRQUM1RCxJQUFJLFdBQVcsR0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBQyxpQkFBaUIsRUFBQyxhQUFh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QXFCO1lBQ3pDLGtCQUFrQixFQUNsQixVQUFVLENBQUMsa0JBQWtCLENBQUMsa0NBQWtDO1lBQ2hFLGlCQUFpQixFQUFFLENBQUM7WUFDcEIsaUJBQWlCLEVBQUMsQ0FBQztTQUMxQixDQUFDLENBQUM7UUFDSCxPQUFPLEtBQUssQ0FBQTtJQUNwQixDQUFDO0lBRUQsU0FBUyxDQUFDLGNBQWtCLEVBQUMsWUFBZ0I7UUFFM0M7Ozs7OztVQU1FO1FBRUYsTUFBTSxLQUFLLEdBQUcsSUFBSSxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxhQUFhLEVBQUU7WUFDbEQsU0FBUyxFQUFFLGlCQUFpQjtZQUM1QixPQUFPLEVBQUUsWUFBWTtTQUN0QixDQUFDLENBQUM7UUFHSDs7Ozs7Ozs7VUFRRTtRQUdJLDZEQUE2RDtRQUNuRSxJQUFJLHNDQUFxQixDQUFDLElBQUksRUFBRSxpQkFBaUIsRUFBRTtZQUNqRCxLQUFLLEVBQUMsS0FBSztZQUNYLGdCQUFnQixFQUFFLHVDQUFzQixDQUFDLHlCQUF5QjtZQUNsRSxNQUFNLEVBQUMsQ0FBQyxjQUFjLENBQUM7U0FDeEIsQ0FBQyxDQUFDO0lBRUwsQ0FBQztDQUVBO0FBL1RELDRDQStUQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IER1cmF0aW9uLCBSZW1vdmFsUG9saWN5LCBTdGFjaywgU3RhY2tQcm9wc30gZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEnO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5pbXBvcnQgKiBhcyBldmVudHMgZnJvbSAnYXdzLWNkay1saWIvYXdzLWV2ZW50cyc7XG5pbXBvcnQgKiBhcyB0YXJnZXRzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1ldmVudHMtdGFyZ2V0cyc7XG5pbXBvcnQgeyBNYW5hZ2VkUG9saWN5LCBSb2xlLCBTZXJ2aWNlUHJpbmNpcGFsIH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWlhbSc7XG5pbXBvcnQgKiBhcyBjbG91ZHdhdGNoIGZyb20gJ2F3cy1jZGstbGliL2F3cy1jbG91ZHdhdGNoJztcbmNvbnN0IGNvbnN0YW50ID0gcmVxdWlyZShcIi4uL3Jlc291cmNlcy9jb25zdGFudC5qc29uXCIpO1xuaW1wb3J0IHtBbGFybSxNZXRyaWN9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1jbG91ZHdhdGNoJ1xuaW1wb3J0IHtCdWNrZXREZXBsb3ltZW50LCBTb3VyY2V9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1zMy1kZXBsb3ltZW50J1xuaW1wb3J0IHsgQnVja2V0LCBCdWNrZXRBY2Nlc3NDb250cm9sIH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLXMzJztcbmltcG9ydCAqIGFzIHNucyBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtc25zJztcbmltcG9ydCB7RW1haWxTdWJzY3JpcHRpb24sIExhbWJkYVN1YnNjcmlwdGlvbn0gZnJvbSAnYXdzLWNkay1saWIvYXdzLXNucy1zdWJzY3JpcHRpb25zJ1xuaW1wb3J0ICogYXMgY3dfYWN0aW9ucyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY2xvdWR3YXRjaC1hY3Rpb25zJztcbmltcG9ydCAqIGFzIGR5bmFtb2RiIGZyb20gJ2F3cy1jZGstbGliL2F3cy1keW5hbW9kYic7XG5pbXBvcnQge0xhbWJkYURlcGxveW1lbnRDb25maWcsIExhbWJkYURlcGxveW1lbnRHcm91cH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWNvZGVkZXBsb3knXG5cbmV4cG9ydCBjbGFzcyBIaXJhNFNwcmludFN0YWNrIGV4dGVuZHMgU3RhY2sge1xuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wcz86IFN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIC8vUm9sZXNcbiAgICB2YXIgcm9sZXM9dGhpcy5jcmVhdGVfcm9sZSgpO1xuXG4gICAgLyotLS0tLS0tLS0tQ3JlYXRpbmcgUzMgYnVja2V0LS0tLS0tLS0tLS0qL1xuICAgIGNvbnN0IGJ1Y2tldCA9IG5ldyBCdWNrZXQodGhpcyxpZD1jb25zdGFudC5idWNrZXRfaWQse2FjY2Vzc0NvbnRyb2w6IEJ1Y2tldEFjY2Vzc0NvbnRyb2wuUFVCTElDX1JFQUQsfSk7XG4gICAgdmFyIHMzX2J1Y2tldD1idWNrZXQuYnVja2V0TmFtZVxuICAgIGJ1Y2tldC5wb2xpY3k/LmFwcGx5UmVtb3ZhbFBvbGljeShSZW1vdmFsUG9saWN5LkRFU1RST1kpO1xuXG4gICAgLy9VcGxvYWRpbmcgZmlsZSB0byBTMyBidWNrZXRcbiAgICB0aGlzLlVwbG9hZF9maWxlKGJ1Y2tldCk7XG5cblxuICAgIC8qLS0tLS0tLS0tLS1DYWxsaW5nIHdlYiBoZWFsdGggbGFtYmRhIGZ1bmN0aW9uLS0tLS0tLS0tLS0qL1xuICAgIHZhciBsYW1iZGFfZnVuYz10aGlzLndlYmxhbWJkYXMocm9sZXMsXCJXZWJIZWFsdGhMYW1iZGFcIixcIi4vcmVzb3VyY2VzXCIsXCJ3ZWJIZWFsdGhMYW1iZGEud2ViaGFuZGxlclwiLHMzX2J1Y2tldClcbiAgICB2YXIgZnVuY3Rpb25fbmFtZT1sYW1iZGFfZnVuYy5mdW5jdGlvbk5hbWVcbiAgICBcblxuICAgIC8vIFJ1biBMYW1iZGEgcGVyaW9kaWNhbGx5XG4gICAgY29uc3QgcnVsZSA9IG5ldyBldmVudHMuUnVsZSh0aGlzLCAnUnVsZScsIHtcbiAgICAgICAgICAgICAgICAgIHNjaGVkdWxlOiBldmVudHMuU2NoZWR1bGUucmF0ZShEdXJhdGlvbi5taW51dGVzKDEpKSxcbiAgICAgICAgICAgICAgICAgIHRhcmdldHM6IFtuZXcgdGFyZ2V0cy5MYW1iZGFGdW5jdGlvbihsYW1iZGFfZnVuYyldLFxuICAgIH0pO1xuXG5cbiAgICAvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLUNyZWF0aW5nIGFuIFNOUyBUT1BJQy0tLS0tLS0tLS0tLS0tLS0qL1xuXG4gICAgY29uc3QgdG9waWMgPSBuZXcgc25zLlRvcGljKHRoaXMsICdNeVRvcGljJyk7XG4gICAgdG9waWMuYWRkU3Vic2NyaXB0aW9uKG5ldyBFbWFpbFN1YnNjcmlwdGlvbihjb25zdGFudC5lbWFpbCkpO1xuICAgXG5cbiAgICBmb3IgKGxldCB1cmxzIG9mIGNvbnN0YW50LnVybCl7XG4gICAgICAgICAgICAgIGxldCBkaW1lbnNpb249eydVUkwnOnVybHN9XG5cbiAgICAgICAgICAgIC8qIFxuICAgICAgICAgICAgY3JlYXRlX2FsYXJtKClcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZGltZW5zaW9ucyAtPiBrZXkgdmFsdWUgcGFpciAsIGtleSA9IFwiVVJMXCIgYW5kIHZhbHVlID0gdXJsXG4gICAgICAgICAgICB1cmxzID0gdXJsIG9mIHdlYnNpdGUgXG5cbiAgICAgICAgICAgICovXG5cbiAgICAgICAgICAgICAgY29uc3QgYWxhcm1fYXZhaWw9IHRoaXMuY3JlYXRlX2FsYXJtX2F2YWlsKGRpbWVuc2lvbix1cmxzKTsgLy8gQ2FsbGluZyBhbiBhbGFybiBmb3IgbGF0ZW5jeVxuICAgICAgICAgICAgICBjb25zdCBhbGFybV9sYXRlbmN5PSB0aGlzLmNyZWF0ZV9hbGFybV9sYXRlbmN5KGRpbWVuc2lvbix1cmxzKSAgLy8gQ2FsbGluIGFuIGFsYXJtIGZvciBhdmFpbGFiaWxpdHlcblxuICAgICAgICAgICAgICBhbGFybV9hdmFpbC5hZGRBbGFybUFjdGlvbihuZXcgY3dfYWN0aW9ucy5TbnNBY3Rpb24odG9waWMpKTsgIC8vIEJpbmRpbmcgYXZhaWwgYWxhcm0gdG8gc25zXG4gICAgICAgICAgICAgIGFsYXJtX2xhdGVuY3kuYWRkQWxhcm1BY3Rpb24obmV3IGN3X2FjdGlvbnMuU25zQWN0aW9uKHRvcGljKSk7ICAvLyBCaW5kaW5nIGxhdGVuY3kgYWxhcm0gdG8gc25zXG4gICAgfVxuXG5cbiAgICAvKi0tLS0tLS0tLS0tLUNyZWF0aW5nIFRhYmxlLS0tLS0tLS0tLS0tLSovXG5cbiAgICBjb25zdCBteV90YWJsZT10aGlzLmNyZWF0ZV90YWJsZSgpO1xuICAgIHZhciB0YWJsZV9uYW1lPW15X3RhYmxlLnRhYmxlTmFtZVxuICAgIFxuICAgIC8vQ2FsaW5nIERZTkFNTyBEQiBsYW1iZGEgZnVuY3Rpb25cbiAgICB2YXIgZHluYW1vX2xhbWJkYT10aGlzLmR5bmFtb2xhbWJkYXMocm9sZXMsXCJEeW5hbW9MYW1iZGFcIixcIi4vcmVzb3VyY2VzXCIsXCJkeW5hbW9kYi5keW5hbW9oYW5kbGVyXCIsdGFibGVfbmFtZSlcblxuICAgIG15X3RhYmxlLmdyYW50UmVhZFdyaXRlRGF0YShkeW5hbW9fbGFtYmRhKVxuICAgIFxuICAgIC8vIGludm9rZSBsYW1iZGEgYWZ0ZXIgZXZlcnkgYWxhcm1cbiAgICB0b3BpYy5hZGRTdWJzY3JpcHRpb24obmV3IExhbWJkYVN1YnNjcmlwdGlvbihkeW5hbW9fbGFtYmRhKSlcblxuXG5cbiAgICAvLyBDcmVhdGluZyBGYWlsdXJlcyBBbGFybVxuICAgIGNvbnN0IGxhbWJkYV9mdW5jMT1sYW1iZGFfZnVuYy5jdXJyZW50VmVyc2lvblxuICAgIFxuICAgIC8qXG4gICAgZmFpbHVyZV9tZXRyaWMoKVxuICAgIGZ1bmN0aW9uX25hbWUgPSBuYW1lIG9mIGN1cnJlbnQgdmVyc2lvbiBvZiBsYW1iZGFcbiAgICBcbiAgICByZXR1cm5zIG1ldHJpY1xuICAgICovXG4gICAgY29uc3QgZmFpbHVyZV9tZXRyaWM9dGhpcy5mYWlsdXJlX21ldHJpY3MoZnVuY3Rpb25fbmFtZSk7XG5cbiAgICAvLyBBdXRvIFJvbGwgYmFja1xuICAgIHRoaXMucm9sbF9iYWNrKGZhaWx1cmVfbWV0cmljLGxhbWJkYV9mdW5jMSkgXG4gIH1cblxuXG5cbi8qLS0tLS0tLSBGdW5jdGlvbnMtLS0tLS0qL1xuXG5cbi8vIEJ1Y2tldCBkZXBsb3ltZW50IGZ1bmMgd2lsbCB1cGxvYWQgYWxsIGZpbGVzIG9mIHJlc291cmNlIGZvbGRlciB0byBzMyBidWNrZXRcblVwbG9hZF9maWxlKGJ1Y2tldDogQnVja2V0KSB7XG4gIGNvbnN0IGRlcGxveW1lbnQgPSBuZXcgQnVja2V0RGVwbG95bWVudCh0aGlzLCAnRGVwbG95V2Vic2l0ZScsIHtcbiAgICBzb3VyY2VzOiBbU291cmNlLmFzc2V0KCcuL3Jlc291cmNlcycpXSxcbiAgICBkZXN0aW5hdGlvbkJ1Y2tldDogYnVja2V0fSlcbiAgfVxuXG5cbi8vIENhbGxpbmcgTGFtYmRhIEZ1bmN0aW9uXG53ZWJsYW1iZGFzKHJvbGVzOmFueSxpZDpzdHJpbmcsYXNzZXQ6c3RyaW5nLGhhbmRsZXI6c3RyaW5nLGVudmlvcl92YXI6c3RyaW5nKTphbnl7XG5cbiAgLyogY3JlYXRlX2xhbWJkYSgpXG4gICAgICAgIFxuICBpZCAtPiBzdHJpbmcgdmFsdWVcbiAgYXNzZXQgLT4gRm9sZGVyIHRoYXQgY29udGFpbnMgY29kZVxuICBydW50aW1lIC0+IExhbmd1YWdlXG4gIGhhbmRsZXIgLT4gTGFtYmRhIGZ1bmN0aW9uXG4gIHRpbWVvdXQgLT4gQWZ0ZXIgaG93IGxvbmcgbGFtYmRhIHdpbGwgZW5kXG4gIFxuICBSZXR1cm4gOiBMYW1iZGEgRnVuY3Rpb24gKi9cblxuICBjb25zdCBoZWxsbyA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgaWQsIHtcbiAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMTRfWCwgICAgLy8gZXhlY3V0aW9uIGVudmlyb25tZW50XG4gICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KGFzc2V0KSwgIC8vIGNvZGUgbG9hZGVkIGZyb20gXCJyZXNvdXJjZVwiIGRpcmVjdG9yeVxuICAgIGhhbmRsZXI6IGhhbmRsZXIsXG4gICAgdGltZW91dDogRHVyYXRpb24uc2Vjb25kcygxODApICAsXG4gICAgcm9sZTpyb2xlcyxcbiAgICBlbnZpcm9ubWVudDp7J2J1Y2tldF9uYW1lJzplbnZpb3JfdmFyfSAgICAgICAgICAgICAvLyBmaWxlIGlzIFwid2ViaGFuZGxlclwiLCBmdW5jdGlvbiBpcyBcImhhbmRsZXJcIlxuICB9KTtcbiAgcmV0dXJuIGhlbGxvXG59XG5cbmR5bmFtb2xhbWJkYXMocm9sZXM6YW55LGlkOnN0cmluZyxhc3NldDpzdHJpbmcsaGFuZGxlcjpzdHJpbmcsZW52aW9yX3ZhcjpzdHJpbmcpOmFueXtcblxuICAvKiBjcmVhdGVfbGFtYmRhKClcbiAgICAgICAgXG4gIGlkIC0+IHN0cmluZyB2YWx1ZVxuICBhc3NldCAtPiBGb2xkZXIgdGhhdCBjb250YWlucyBjb2RlXG4gIHJ1bnRpbWUgLT4gTGFuZ3VhZ2VcbiAgaGFuZGxlciAtPiBMYW1iZGEgZnVuY3Rpb25cbiAgdGltZW91dCAtPiBBZnRlciBob3cgbG9uZyBsYW1iZGEgd2lsbCBlbmRcbiAgXG4gIFJldHVybiA6IExhbWJkYSBGdW5jdGlvbiAqL1xuXG4gIGNvbnN0IGhlbGxvID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCBpZCwge1xuICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18xNF9YLCAgICAvLyBleGVjdXRpb24gZW52aXJvbm1lbnRcbiAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQoYXNzZXQpLCAgLy8gY29kZSBsb2FkZWQgZnJvbSBcInJlc291cmNlXCIgZGlyZWN0b3J5XG4gICAgaGFuZGxlcjogaGFuZGxlcixcbiAgICB0aW1lb3V0OiBEdXJhdGlvbi5zZWNvbmRzKDE4MCkgICxcbiAgICByb2xlOnJvbGVzLFxuICAgIGVudmlyb25tZW50OnsndGFibGVfbmFtZSc6ZW52aW9yX3Zhcn0gICAgICAgICAgICAgLy8gZmlsZSBpcyBcIndlYmhhbmRsZXJcIiwgZnVuY3Rpb24gaXMgXCJoYW5kbGVyXCJcbiAgfSk7XG4gIHJldHVybiBoZWxsb1xufVxuXG5cbi8vIGNyZWF0ZSBSb2xlc1xuY3JlYXRlX3JvbGUoKTphbnl7XG5cbmNvbnN0IHJvbGUgPSBuZXcgUm9sZSh0aGlzLCAnZXhhbXBsZS1pYW0tcm9sZScsIHtcbiAgYXNzdW1lZEJ5OiBuZXcgU2VydmljZVByaW5jaXBhbCgnbGFtYmRhLmFtYXpvbmF3cy5jb20nKSxcbiAgZGVzY3JpcHRpb246ICdBbiBleGFtcGxlIElBTSByb2xlIGluIEFXUyBDREsnLFxuICBtYW5hZ2VkUG9saWNpZXM6IFtcbiAgICBNYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZSgnQ2xvdWRXYXRjaEZ1bGxBY2Nlc3MnKSxcbiAgICBNYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZSgnQW1hem9uRHluYW1vREJGdWxsQWNjZXNzJyksXG4gICAgTWFuYWdlZFBvbGljeS5mcm9tQXdzTWFuYWdlZFBvbGljeU5hbWUoJ3NlcnZpY2Utcm9sZS9BV1NMYW1iZGFCYXNpY0V4ZWN1dGlvblJvbGUnKSxcbiAgICBNYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZSgnQVdTTGFtYmRhSW52b2NhdGlvbi1EeW5hbW9EQicpLFxuICBdLFxufSk7XG5yZXR1cm4gcm9sZVxufVxuXG5cbi8vIEdlbmVyYXRlIGF2YWlsYWJpbGl0eSBhbGFybVxuY3JlYXRlX2FsYXJtX2F2YWlsKGRpbWVuc2lvbjphbnksdXJsczpzdHJpbmcpIHtcblxuICAvKlxuICAgICAgICAgICAgY2xvdWR3YXRjaC5NZXRyaWMoKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBtZXRyaWNfbmFtZSAtPiAgTmFtZSBvZiB0aGUgbWV0cmljXG4gICAgICAgICAgICBuYW1lc3BhY2UgLT4gICAgTmFtZXNwYWNlIG9mIHRoZSBtZXRyaWMgZGF0YVxuICAgICAgICAgICAgcGVyaW9kIC0+ICAgQWZ0ZXIgaG93IG1hbnkgbWludXRlcyB0aGlzIHdpbGwgY2hlY2sgZGF0YXBvaW50cyBpbiBwdWJsaXNoZWQgbWV0cmljc1xuICAgICAgICAgICAgZGltZW5zaW9ucyAtPiAgIEl0IHRha2VzIGtleSBhbmQgdmFsdWUuIFdoYXQgd2UgYXJlIG1vbml0b3JpbmdcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgUmV0dXJuIDogRmV0Y2ggbWV0cmljIG9uIGF3cyBjbG91ZHdhdGNoXG4gICAgICAgICAgICBcbiAgKi9cblxuXG4gIGNvbnN0IG1ldHJpYyA9IG5ldyBNZXRyaWMoe1xuICAgIG5hbWVzcGFjZTogY29uc3RhbnQudXJsX25hbWVzcGFjZSxcbiAgICBtZXRyaWNOYW1lOiBjb25zdGFudC5NZXRyaWNuYW1lX2F2YWlsLFxuICAgIHBlcmlvZDpEdXJhdGlvbi5taW51dGVzKDEpLFxuICAgIGRpbWVuc2lvbnNNYXA6IGRpbWVuc2lvblxuICB9KTtcblxuICAvKlxuICAgICAgICAgICAgY2xvdWR3YXRjaC5BbGFybSgpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlkIC0+IHN0cmluZyB2YWx1ZVxuICAgICAgICAgICAgbWV0cmljIC0+IEZ1bmN0aW9uIHRvIGZldGNoIHB1Ymxpc2hlZCBtZXRyaWNzXG4gICAgICAgICAgICBldmFsdWF0aW9uX3BlcmlvZHMgLT4gQWZ0ZXIgaG93IG1hbnkgZXZhbHVhdGlvbiBkYXRhIHdpbGwgYmUgY29tcGFyZWQgdG8gdGhyZXNob2xkXG4gICAgICAgICAgICBjb21wYXJpc29uX29wZXJhdG9yIC0+IHVzZWQgdG8gY29tcGFyZVxuICAgICAgICAgICAgZGF0YXBvaW50c190b19hbGFybSAtPiBBZnRlciBob3cgbWFueSBkYXRhIHBvaW50cyBicmVhY2hpbmcsIGFsYXJtIHNob3VsZCBiZSB0cmlnZ2VyZWQuIFxuICAgICAgICAgICAgXG4gICAgICAgICAgICBSZXR1cm4gOiBHZW5lcmF0ZWQgYWxhcm1zIGlmIGRhdGFwb2ludHMgZXhjZWVkcyB0aHJlc2hvbGRcbiAgICAgICAgICAgIFxuICAqL1xuICBjb25zdCBhbGFybT1uZXcgQWxhcm0odGhpcywgJ2F2YWlsYWJpbGl0eV9hbGFybScrdXJscywge1xuICAgIG1ldHJpYzogbWV0cmljLFxuXG4gICAgdGhyZXNob2xkOiAxLFxuICAgIGNvbXBhcmlzb25PcGVyYXRvcjpcbiAgICAgIGNsb3Vkd2F0Y2guQ29tcGFyaXNvbk9wZXJhdG9yLkdSRUFURVJfVEhBTl9USFJFU0hPTEQsXG4gICAgZXZhbHVhdGlvblBlcmlvZHM6IDEsXG4gICAgYWxhcm1EZXNjcmlwdGlvbjpcbiAgICAgICdBbGFybSBpZiB0aGUgU1VNIG9mIEVycm9ycyBpcyBncmVhdGVyIHRoYW4gb3IgZXF1YWwgdG8gdGhlIHRocmVzaG9sZCAoMSkgZm9yIDEgZXZhbHVhdGlvbiBwZXJpb2QnLFxuICB9KTtcbiAgcmV0dXJuIGFsYXJtXG59XG5cblxuLy8gR2VuZXJhdGUgbGF0ZW5jeSBhbGFybVxuY3JlYXRlX2FsYXJtX2xhdGVuY3koZGltZW5zaW9uOmFueSx1cmxzOnN0cmluZykge1xuXG4gIGNvbnN0IG1ldHJpYyA9IG5ldyBNZXRyaWMoe1xuICAgIG5hbWVzcGFjZTogY29uc3RhbnQudXJsX25hbWVzcGFjZSxcbiAgICBtZXRyaWNOYW1lOiBjb25zdGFudC5NZXRyaWNuYW1lX2xhdGVuY3ksXG4gICAgcGVyaW9kOkR1cmF0aW9uLm1pbnV0ZXMoMSksXG4gICAgZGltZW5zaW9uc01hcDogZGltZW5zaW9uXG4gIH0pO1xuXG4gIGNvbnN0IGFsYXJtID0gbmV3IEFsYXJtKHRoaXMsICdMYXRlbmN5X2FsYXJtJyt1cmxzLCB7XG4gICAgbWV0cmljOiBtZXRyaWMsXG4gICAgdGhyZXNob2xkOiAwLjQsXG4gICAgY29tcGFyaXNvbk9wZXJhdG9yOlxuICAgICAgY2xvdWR3YXRjaC5Db21wYXJpc29uT3BlcmF0b3IuR1JFQVRFUl9USEFOX09SX0VRVUFMX1RPX1RIUkVTSE9MRCxcbiAgICBldmFsdWF0aW9uUGVyaW9kczogMSxcbiAgICBhbGFybURlc2NyaXB0aW9uOlxuICAgICAgJ0FsYXJtIGlmIHRoZSBTVU0gb2YgRXJyb3JzIGlzIGdyZWF0ZXIgdGhhbiBvciBlcXVhbCB0byB0aGUgdGhyZXNob2xkICgxKSBmb3IgMSBldmFsdWF0aW9uIHBlcmlvZCcsXG4gIH0pO1xuICByZXR1cm4gYWxhcm1cbn1cblxuXG4vLyBDcmVhdGUgdGFibGUgZHluYW1vZGIgZnVuY3Rpb25cbmNyZWF0ZV90YWJsZSgpIHtcblxuICAgIC8qXG4gICAgVGFibGUoKVxuICAgIHRhYmxlX2lkIC0+IGlkIG9mIHRhYmxlXG4gICAgcGFydGl0aW9uX2tleSAtPiB1bmlxdWUga2V5IFxuICAgIHNvcnRfa2V5IC0+IGtleSB1c2VkIGZvciBzb3J0aW5nXG4gICAgXG4gICAgUmV0dXJuIDogRHluYW1vIGRiIHRhYmxlXG4gICAgKi9cblxuICBjb25zdCBnbG9iYWxUYWJsZSA9IG5ldyBkeW5hbW9kYi5UYWJsZSh0aGlzLCBjb25zdGFudC50YWJsZV9pZCwge1xuICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiBjb25zdGFudC5wYXJ0aXRpb25fa2V5LCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxuICAgIHJlcGxpY2F0aW9uUmVnaW9uczogWyd1cy1lYXN0LTEnXSwgfSk7XG4gICAgcmV0dXJuIGdsb2JhbFRhYmxlXG59XG5cblxuLy8gR2VuZXJhdGUgRmFpbHVyZSBhbGFybXNcbmZhaWx1cmVfbWV0cmljcyhmdW5jdGlvbl9uYW1lOmFueSl7XG5cbiAgICAgIC8qXG4gICAgICAgICAgICBjbG91ZHdhdGNoLk1ldHJpYygpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIG5hbWVzcGFjZSAtPiBBV1MvTGFtYmRhXG4gICAgICAgICAgICBtZXRyaWNfbmFtZSAtPiBEdXJhdGlvblxuICAgICAgICAgICAgZGltZW50aW9uc19tYXAgLT4gRnVuY3Rpb25OYW1lIGFuZCBsYW1iZGEgZnVuY3Rpb24gbmFtZVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBSZXR1cm4gOiBGZXRjaCBhd3MgTGFtYmRhIGR1cmF0aW9uIHZhbHVlXG4gICAgICAqL1xuXG5cbiAgICAgICAgY29uc3QgbWV0cmljID0gbmV3IE1ldHJpYyh7XG4gICAgICAgICAgICAgICAgbmFtZXNwYWNlOiBjb25zdGFudC5mYWlsX21ldHJpY19uYW1lc3BhY2UsXG4gICAgICAgICAgICAgICAgbWV0cmljTmFtZTogY29uc3RhbnQuZmFpbF9tZXRyaWNuYW1lLFxuICAgICAgICAgICAgICAgIGRpbWVuc2lvbnNNYXA6IHtcIkZ1bmN0aW9uTmFtZVwiOmZ1bmN0aW9uX25hbWV9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IGFsYXJtID0gbmV3IEFsYXJtKHRoaXMsICdmYWlsdXJlX2FsYXJtJywge1xuICAgICAgICAgICAgICAgIG1ldHJpYzogbWV0cmljLFxuICAgICAgICAgICAgICAgIHRocmVzaG9sZDogY29uc3RhbnQuZmFpbF9tZXRyaWNfdGhyZXNob2xkLFxuICAgICAgICAgICAgICAgIGNvbXBhcmlzb25PcGVyYXRvcjpcbiAgICAgICAgICAgICAgICBjbG91ZHdhdGNoLkNvbXBhcmlzb25PcGVyYXRvci5HUkVBVEVSX1RIQU5fT1JfRVFVQUxfVE9fVEhSRVNIT0xELFxuICAgICAgICAgICAgICAgIGV2YWx1YXRpb25QZXJpb2RzOiAxLFxuICAgICAgICAgICAgICAgIGRhdGFwb2ludHNUb0FsYXJtOjFcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBhbGFybVxufVxuXG5yb2xsX2JhY2soZmFpbHVyZV9tZXRyaWM6YW55LGxhbWJkYV9mdW5jMTphbnkpe1xuXG4gIC8qXG4gICAgICAgIElkIChzdHIpIDogSWRcbiAgICAgICAgQWxpYXNfbmFtZShzdHIpIDogTmFtZSBvZiBhbGlhc1xuICAgICAgICBWZXJzaW9uOiBDdXJyZW50IHZlcnNpb24gb2YgbGFtYmRhIGZ1bmN0aW9uXG4gICAgICAgICAgICBcbiAgICAgICAgUmV0dXJuIDogQ3VycmVuY3QgdmVyc2lvbiBvZiBsYW1iZGEgZnVuY3Rpb25cbiAgKi9cblxuICBjb25zdCBhbGlhcyA9IG5ldyBsYW1iZGEuQWxpYXModGhpcywgJ0xhbWJkYUFsaWFzJywge1xuICAgIGFsaWFzTmFtZTogJ0N1cnJlbnRfVmVyc2lvbicsXG4gICAgdmVyc2lvbiA6bGFtYmRhX2Z1bmMxLFxuICB9KTtcbiAgXG5cbiAgLypcbiAgICAgICAgICAgIExhbWJkYURlcGxveW1lbnRHcm91cCgpXG4gICAgICAgIFxuICAgICAgICAgICAgSWQoc3RyKSA6IElkXG4gICAgICAgICAgICBhbGlhcyhGdW5jKSA6IEFsaWFzXG4gICAgICAgICAgICBkZXBsb3ltZW50X2NvbmZpZzogSG93IG1hbnkgdHJhZmZpYyBzaG91bGQgYmUgc2VuZCB0byBuZXcgbGFtYmRhIGZ1bmN0aW9uIGluIHNwZWNpZmljIHRpbWUuXG4gICAgICAgICAgICBBbGFybXMoZnVuYyk6IHRyaWdnZXJlZCBhbGFybVxuICAgICAgICAgICBcbiAgKi9cbiAgICAgICAgXG4gICAgICAgICAgICBcbiAgICAgICAgLy8gRGVwbG95IHByZXZpb3VzIHZlcnNpb24gb2YgbGFtYmRhIGlmIGFsYXJtcyBnZXRzIHRyaWdnZXJlZFxuICBuZXcgTGFtYmRhRGVwbG95bWVudEdyb3VwKHRoaXMsICdEZXBsb3ltZW50R3JvdXAnLCB7XG4gICAgYWxpYXM6YWxpYXMsXG4gICAgZGVwbG95bWVudENvbmZpZzogTGFtYmRhRGVwbG95bWVudENvbmZpZy5DQU5BUllfMTBQRVJDRU5UXzVNSU5VVEVTLFxuICAgIGFsYXJtczpbZmFpbHVyZV9tZXRyaWNdXG4gIH0pO1xuXG59XG5cbn1cbiJdfQ==