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
class Hira4SprintStack extends aws_cdk_lib_1.Stack {
    constructor(scope, id, props) {
        var _a;
        super(scope, id, props);
        //Roles
        var roles = this.create_role();
        // Creating S3 bucket
        const bucket = new aws_s3_1.Bucket(this, id = constant.bucket_id, { accessControl: aws_s3_1.BucketAccessControl.PUBLIC_READ, });
        var s3_bucket = bucket.bucketName;
        (_a = bucket.policy) === null || _a === void 0 ? void 0 : _a.applyRemovalPolicy(aws_cdk_lib_1.RemovalPolicy.DESTROY);
        // Uploading file to S3 bucket
        this.Upload_file(bucket);
        //Calling web health lambda function
        var lambda_func = this.lambdas(roles, "WebHealthLambda", "./resources", "webHealthLambda.webhandler", s3_bucket);
        var function_name = lambda_func.FunctionName;
        // Run Lambda periodically
        const rule = new events.Rule(this, 'Rule', {
            schedule: events.Schedule.rate(aws_cdk_lib_1.Duration.minutes(1)),
            targets: [new targets.LambdaFunction(lambda_func)],
        });
        //Creating an SNS TOPIC
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
        //Creating Table 
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
    }
    // Functions
    // Bucket deployment func will upload all files of resource folder to s3 bucket
    Upload_file(bucket) {
        const deployment = new aws_s3_deployment_1.BucketDeployment(this, 'DeployWebsite', {
            sources: [aws_s3_deployment_1.Source.asset('./resources')],
            destinationBucket: bucket
        });
    }
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
            period: aws_cdk_lib_1.Duration.minutes(1),
            dimensionsMap: { "FunctionName": function_name }
        });
        const alarm = new aws_cloudwatch_1.Alarm(this, 'failure_alarm', {
            metric: metric,
            threshold: constant.fail_metric_treshold,
            comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
            evaluationPeriods: 1,
            datapointsToAlarm: 1
        });
        return alarm;
    }
}
exports.Hira4SprintStack = Hira4SprintStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGlyYTRzcHJpbnQtc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJoaXJhNHNwcmludC1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSw2Q0FBd0U7QUFDeEUsaURBQWlEO0FBRWpELGlEQUFpRDtBQUNqRCwwREFBMEQ7QUFDMUQsaURBQTRFO0FBQzVFLHlEQUF5RDtBQUN6RCxNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsNEJBQTRCLENBQUMsQ0FBQztBQUN2RCwrREFBdUQ7QUFDdkQscUVBQXNFO0FBQ3RFLCtDQUFpRTtBQUNqRSwyQ0FBMkM7QUFDM0MsNkVBQXVGO0FBQ3ZGLGlFQUFpRTtBQUNqRSxxREFBcUQ7QUFHckQsTUFBYSxnQkFBaUIsU0FBUSxtQkFBSztJQUN6QyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQWtCOztRQUMxRCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4QixPQUFPO1FBQ1AsSUFBSSxLQUFLLEdBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBRTdCLHFCQUFxQjtRQUNyQixNQUFNLE1BQU0sR0FBRyxJQUFJLGVBQU0sQ0FBQyxJQUFJLEVBQUMsRUFBRSxHQUFDLFFBQVEsQ0FBQyxTQUFTLEVBQUMsRUFBQyxhQUFhLEVBQUUsNEJBQW1CLENBQUMsV0FBVyxHQUFFLENBQUMsQ0FBQztRQUN4RyxJQUFJLFNBQVMsR0FBQyxNQUFNLENBQUMsVUFBVSxDQUFBO1FBQy9CLE1BQUEsTUFBTSxDQUFDLE1BQU0sMENBQUUsa0JBQWtCLENBQUMsMkJBQWEsQ0FBQyxPQUFPLEVBQUU7UUFFekQsOEJBQThCO1FBQzlCLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUM7UUFFekIsb0NBQW9DO1FBQ3BDLElBQUksV0FBVyxHQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFDLGlCQUFpQixFQUFDLGFBQWEsRUFBQyw0QkFBNEIs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QTtJQUN0QixDQUFDO0lBRUQsZUFBZSxDQUFDLGFBQWlCO1FBRTNCOzs7Ozs7OztVQVFFO1FBR0EsTUFBTSxNQUFNLEdBQUcsSUFBSSx1QkFBTSxDQUFDO1lBQ2xCLFNBQVMsRUFBRSxRQUFRLENBQUMscUJBQXFCO1lBQ3pDLFVBQVUsRUFBRSxRQUFRLENBQUMsZUFBZTtZQUNwQyxNQUFNLEVBQUMsc0JBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBQzFCLGFBQWEsRUFBRSxFQUFDLGNBQWMsRUFBQyxhQUFhLEVBQUM7U0FDcEQsQ0FBQyxDQUFDO1FBRUgsTUFBTSxLQUFLLEdBQUcsSUFBSSxzQkFBSyxDQUFDLElBQUksRUFBRSxlQUFlLEVBQUU7WUFDdkMsTUFBTSxFQUFFLE1BQU07WUFDZCxTQUFTLEVBQUUsUUFBUSxDQUFDLG9CQUFvQjtZQUN4QyxrQkFBa0IsRUFDbEIsVUFBVSxDQUFDLGtCQUFrQixDQUFDLGtDQUFrQztZQUNoRSxpQkFBaUIsRUFBRSxDQUFDO1lBQ3BCLGlCQUFpQixFQUFDLENBQUM7U0FDMUIsQ0FBQyxDQUFDO1FBQ0gsT0FBTyxLQUFLLENBQUE7SUFDcEIsQ0FBQztDQUVBO0FBblBELDRDQW1QQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IER1cmF0aW9uLCBSZW1vdmFsUG9saWN5LCBTdGFjaywgU3RhY2tQcm9wc30gZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEnO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5pbXBvcnQgKiBhcyBldmVudHMgZnJvbSAnYXdzLWNkay1saWIvYXdzLWV2ZW50cyc7XG5pbXBvcnQgKiBhcyB0YXJnZXRzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1ldmVudHMtdGFyZ2V0cyc7XG5pbXBvcnQgeyBNYW5hZ2VkUG9saWN5LCBSb2xlLCBTZXJ2aWNlUHJpbmNpcGFsIH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWlhbSc7XG5pbXBvcnQgKiBhcyBjbG91ZHdhdGNoIGZyb20gJ2F3cy1jZGstbGliL2F3cy1jbG91ZHdhdGNoJztcbmNvbnN0IGNvbnN0YW50ID0gcmVxdWlyZShcIi4uL3Jlc291cmNlcy9jb25zdGFudC5qc29uXCIpO1xuaW1wb3J0IHtBbGFybSxNZXRyaWN9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1jbG91ZHdhdGNoJ1xuaW1wb3J0IHtCdWNrZXREZXBsb3ltZW50LCBTb3VyY2V9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1zMy1kZXBsb3ltZW50J1xuaW1wb3J0IHsgQnVja2V0LCBCdWNrZXRBY2Nlc3NDb250cm9sIH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLXMzJztcbmltcG9ydCAqIGFzIHNucyBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtc25zJztcbmltcG9ydCB7RW1haWxTdWJzY3JpcHRpb24sIExhbWJkYVN1YnNjcmlwdGlvbn0gZnJvbSAnYXdzLWNkay1saWIvYXdzLXNucy1zdWJzY3JpcHRpb25zJ1xuaW1wb3J0ICogYXMgY3dfYWN0aW9ucyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY2xvdWR3YXRjaC1hY3Rpb25zJztcbmltcG9ydCAqIGFzIGR5bmFtb2RiIGZyb20gJ2F3cy1jZGstbGliL2F3cy1keW5hbW9kYic7XG5pbXBvcnQgeyBUYXJnZXRHcm91cExvYWRCYWxhbmNpbmdBbGdvcml0aG1UeXBlIH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWVsYXN0aWNsb2FkYmFsYW5jaW5ndjInO1xuXG5leHBvcnQgY2xhc3MgSGlyYTRTcHJpbnRTdGFjayBleHRlbmRzIFN0YWNrIHtcbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBTdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cbiAgICAvL1JvbGVzXG4gICAgdmFyIHJvbGVzPXRoaXMuY3JlYXRlX3JvbGUoKTtcblxuICAgIC8vIENyZWF0aW5nIFMzIGJ1Y2tldFxuICAgIGNvbnN0IGJ1Y2tldCA9IG5ldyBCdWNrZXQodGhpcyxpZD1jb25zdGFudC5idWNrZXRfaWQse2FjY2Vzc0NvbnRyb2w6IEJ1Y2tldEFjY2Vzc0NvbnRyb2wuUFVCTElDX1JFQUQsfSk7XG4gICAgdmFyIHMzX2J1Y2tldD1idWNrZXQuYnVja2V0TmFtZVxuICAgIGJ1Y2tldC5wb2xpY3k/LmFwcGx5UmVtb3ZhbFBvbGljeShSZW1vdmFsUG9saWN5LkRFU1RST1kpO1xuXG4gICAgLy8gVXBsb2FkaW5nIGZpbGUgdG8gUzMgYnVja2V0XG4gICAgdGhpcy5VcGxvYWRfZmlsZShidWNrZXQpO1xuXG4gICAgLy9DYWxsaW5nIHdlYiBoZWFsdGggbGFtYmRhIGZ1bmN0aW9uXG4gICAgdmFyIGxhbWJkYV9mdW5jPXRoaXMubGFtYmRhcyhyb2xlcyxcIldlYkhlYWx0aExhbWJkYVwiLFwiLi9yZXNvdXJjZXNcIixcIndlYkhlYWx0aExhbWJkYS53ZWJoYW5kbGVyXCIsczNfYnVja2V0KVxuICAgIHZhciBmdW5jdGlvbl9uYW1lPWxhbWJkYV9mdW5jLkZ1bmN0aW9uTmFtZVxuXG4gICAgLy8gUnVuIExhbWJkYSBwZXJpb2RpY2FsbHlcbiAgICBjb25zdCBydWxlID0gbmV3IGV2ZW50cy5SdWxlKHRoaXMsICdSdWxlJywge1xuICAgICAgICAgICAgc2NoZWR1bGU6IGV2ZW50cy5TY2hlZHVsZS5yYXRlKER1cmF0aW9uLm1pbnV0ZXMoMSkpLFxuICAgICAgICAgICAgdGFyZ2V0czogW25ldyB0YXJnZXRzLkxhbWJkYUZ1bmN0aW9uKGxhbWJkYV9mdW5jKV0sXG4gICAgfSk7XG5cbiAgICAvL0NyZWF0aW5nIGFuIFNOUyBUT1BJQ1xuICAgIGNvbnN0IHRvcGljID0gbmV3IHNucy5Ub3BpYyh0aGlzLCAnTXlUb3BpYycpO1xuICAgIHRvcGljLmFkZFN1YnNjcmlwdGlvbihuZXcgRW1haWxTdWJzY3JpcHRpb24oY29uc3RhbnQuZW1haWwpKTtcbiAgIFxuXG4gICAgZm9yIChsZXQgdXJscyBvZiBjb25zdGFudC51cmwpe1xuICAgICAgICAgICAgICBsZXQgZGltZW5zaW9uPXsnVVJMJzp1cmxzfVxuXG4gICAgICAgICAgICAvKiBcbiAgICAgICAgICAgIGNyZWF0ZV9hbGFybSgpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGRpbWVuc2lvbnMgLT4ga2V5IHZhbHVlIHBhaXIgLCBrZXkgPSBcIlVSTFwiIGFuZCB2YWx1ZSA9IHVybFxuICAgICAgICAgICAgdXJscyA9IHVybCBvZiB3ZWJzaXRlIFxuXG4gICAgICAgICAgICAqL1xuXG4gICAgICAgICAgICAgIGNvbnN0IGFsYXJtX2F2YWlsPSB0aGlzLmNyZWF0ZV9hbGFybV9hdmFpbChkaW1lbnNpb24sdXJscyk7IC8vIENhbGxpbmcgYW4gYWxhcm4gZm9yIGxhdGVuY3lcbiAgICAgICAgICAgICAgY29uc3QgYWxhcm1fbGF0ZW5jeT0gdGhpcy5jcmVhdGVfYWxhcm1fbGF0ZW5jeShkaW1lbnNpb24sdXJscykgIC8vIENhbGxpbiBhbiBhbGFybSBmb3IgYXZhaWxhYmlsaXR5XG5cbiAgICAgICAgICAgICAgYWxhcm1fYXZhaWwuYWRkQWxhcm1BY3Rpb24obmV3IGN3X2FjdGlvbnMuU25zQWN0aW9uKHRvcGljKSk7ICAvLyBCaW5kaW5nIGF2YWlsIGFsYXJtIHRvIHNuc1xuICAgICAgICAgICAgICBhbGFybV9sYXRlbmN5LmFkZEFsYXJtQWN0aW9uKG5ldyBjd19hY3Rpb25zLlNuc0FjdGlvbih0b3BpYykpOyAgLy8gQmluZGluZyBsYXRlbmN5IGFsYXJtIHRvIHNuc1xuICAgIH1cblxuXG4gICAgLy9DcmVhdGluZyBUYWJsZSBcbiAgICBjb25zdCBteV90YWJsZT10aGlzLmNyZWF0ZV90YWJsZSgpO1xuICAgIHZhciB0YWJsZV9uYW1lPW15X3RhYmxlLnRhYmxlTmFtZVxuICAgIFxuICAgIC8vQ2FsaW5nIERZTkFNTyBEQiBsYW1iZGEgZnVuY3Rpb25cbiAgICB2YXIgZHluYW1vX2xhbWJkYT10aGlzLmxhbWJkYXMocm9sZXMsXCJEeW5hbW9MYW1iZGFcIixcIi4vcmVzb3VyY2VzXCIsXCJkeW5hbW9kYi5keW5hbW9oYW5kbGVyXCIsdGFibGVfbmFtZSlcbiAgICBteV90YWJsZS5ncmFudFJlYWRXcml0ZURhdGEoZHluYW1vX2xhbWJkYSlcbiAgICBcbiAgICAvLyBpbnZva2UgbGFtYmRhIGFmdGVyIGV2ZXJ5IGFsYXJtXG4gICAgdG9waWMuYWRkU3Vic2NyaXB0aW9uKG5ldyBMYW1iZGFTdWJzY3JpcHRpb24oZHluYW1vX2xhbWJkYSkpXG5cblxuXG4gICAgLy8gQ3JlYXRpbmcgRmFpbHVyZXMgQWxhcm1cbiAgICBjb25zdCBsYW1iZGFfZnVuYzE9bGFtYmRhX2Z1bmMuY3VycmVudFZlcnNpb25cbiAgICBcbiAgICAvKlxuICAgIGZhaWx1cmVfbWV0cmljKClcbiAgICBmdW5jdGlvbl9uYW1lID0gbmFtZSBvZiBjdXJyZW50IHZlcnNpb24gb2YgbGFtYmRhXG4gICAgXG4gICAgcmV0dXJucyBtZXRyaWNcbiAgICAqL1xuICAgIGNvbnN0IGZhaWx1cmVfbWV0cmljPXRoaXMuZmFpbHVyZV9tZXRyaWNzKGZ1bmN0aW9uX25hbWUpO1xuXG4gIH1cblxuLy8gRnVuY3Rpb25zXG5cblxuLy8gQnVja2V0IGRlcGxveW1lbnQgZnVuYyB3aWxsIHVwbG9hZCBhbGwgZmlsZXMgb2YgcmVzb3VyY2UgZm9sZGVyIHRvIHMzIGJ1Y2tldFxuVXBsb2FkX2ZpbGUoYnVja2V0OiBCdWNrZXQpIHtcbiAgY29uc3QgZGVwbG95bWVudCA9IG5ldyBCdWNrZXREZXBsb3ltZW50KHRoaXMsICdEZXBsb3lXZWJzaXRlJywge1xuICAgIHNvdXJjZXM6IFtTb3VyY2UuYXNzZXQoJy4vcmVzb3VyY2VzJyldLFxuICAgIGRlc3RpbmF0aW9uQnVja2V0OiBidWNrZXR9KVxuICB9XG5cblxuXG5sYW1iZGFzKHJvbGVzOmFueSxpZDpzdHJpbmcsYXNzZXQ6c3RyaW5nLGhhbmRsZXI6c3RyaW5nLGVudmlvcl92YXI6c3RyaW5nKTphbnl7XG5cbiAgLyogY3JlYXRlX2xhbWJkYSgpXG4gICAgICAgIFxuICBpZCAtPiBzdHJpbmcgdmFsdWVcbiAgYXNzZXQgLT4gRm9sZGVyIHRoYXQgY29udGFpbnMgY29kZVxuICBydW50aW1lIC0+IExhbmd1YWdlXG4gIGhhbmRsZXIgLT4gTGFtYmRhIGZ1bmN0aW9uXG4gIHRpbWVvdXQgLT4gQWZ0ZXIgaG93IGxvbmcgbGFtYmRhIHdpbGwgZW5kXG4gIFxuICBSZXR1cm4gOiBMYW1iZGEgRnVuY3Rpb24gKi9cblxuICBjb25zdCBoZWxsbyA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgaWQsIHtcbiAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMTRfWCwgICAgLy8gZXhlY3V0aW9uIGVudmlyb25tZW50XG4gICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KGFzc2V0KSwgIC8vIGNvZGUgbG9hZGVkIGZyb20gXCJyZXNvdXJjZVwiIGRpcmVjdG9yeVxuICAgIGhhbmRsZXI6IGhhbmRsZXIsXG4gICAgdGltZW91dDogRHVyYXRpb24uc2Vjb25kcygxODApICAsXG4gICAgcm9sZTpyb2xlcyxcbiAgICBlbnZpcm9ubWVudDp7J3RhYmxlX25hbWUnOmVudmlvcl92YXJ9ICAgICAgICAgICAgIC8vIGZpbGUgaXMgXCJ3ZWJoYW5kbGVyXCIsIGZ1bmN0aW9uIGlzIFwiaGFuZGxlclwiXG4gIH0pO1xuICByZXR1cm4gaGVsbG9cbn1cblxuXG5cbmNyZWF0ZV9yb2xlKCk6YW55e1xuXG5jb25zdCByb2xlID0gbmV3IFJvbGUodGhpcywgJ2V4YW1wbGUtaWFtLXJvbGUnLCB7XG4gIGFzc3VtZWRCeTogbmV3IFNlcnZpY2VQcmluY2lwYWwoJ2xhbWJkYS5hbWF6b25hd3MuY29tJyksXG4gIGRlc2NyaXB0aW9uOiAnQW4gZXhhbXBsZSBJQU0gcm9sZSBpbiBBV1MgQ0RLJyxcbiAgbWFuYWdlZFBvbGljaWVzOiBbXG4gICAgTWFuYWdlZFBvbGljeS5mcm9tQXdzTWFuYWdlZFBvbGljeU5hbWUoJ0Nsb3VkV2F0Y2hGdWxsQWNjZXNzJyksXG4gICAgTWFuYWdlZFBvbGljeS5mcm9tQXdzTWFuYWdlZFBvbGljeU5hbWUoJ0FtYXpvbkR5bmFtb0RCRnVsbEFjY2VzcycpLFxuICAgIE1hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKCdzZXJ2aWNlLXJvbGUvQVdTTGFtYmRhQmFzaWNFeGVjdXRpb25Sb2xlJyksXG4gICAgTWFuYWdlZFBvbGljeS5mcm9tQXdzTWFuYWdlZFBvbGljeU5hbWUoJ0FXU0xhbWJkYUludm9jYXRpb24tRHluYW1vREInKSxcbiAgXSxcbn0pO1xucmV0dXJuIHJvbGVcbn1cblxuY3JlYXRlX2FsYXJtX2F2YWlsKGRpbWVuc2lvbjphbnksdXJsczpzdHJpbmcpIHtcblxuICAvKlxuICAgICAgICAgICAgY2xvdWR3YXRjaC5NZXRyaWMoKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBtZXRyaWNfbmFtZSAtPiAgTmFtZSBvZiB0aGUgbWV0cmljXG4gICAgICAgICAgICBuYW1lc3BhY2UgLT4gICAgTmFtZXNwYWNlIG9mIHRoZSBtZXRyaWMgZGF0YVxuICAgICAgICAgICAgcGVyaW9kIC0+ICAgQWZ0ZXIgaG93IG1hbnkgbWludXRlcyB0aGlzIHdpbGwgY2hlY2sgZGF0YXBvaW50cyBpbiBwdWJsaXNoZWQgbWV0cmljc1xuICAgICAgICAgICAgZGltZW5zaW9ucyAtPiAgIEl0IHRha2VzIGtleSBhbmQgdmFsdWUuIFdoYXQgd2UgYXJlIG1vbml0b3JpbmdcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgUmV0dXJuIDogRmV0Y2ggbWV0cmljIG9uIGF3cyBjbG91ZHdhdGNoXG4gICAgICAgICAgICBcbiAgKi9cblxuXG4gIGNvbnN0IG1ldHJpYyA9IG5ldyBNZXRyaWMoe1xuICAgIG5hbWVzcGFjZTogY29uc3RhbnQudXJsX25hbWVzcGFjZSxcbiAgICBtZXRyaWNOYW1lOiBjb25zdGFudC5NZXRyaWNuYW1lX2F2YWlsLFxuICAgIHBlcmlvZDpEdXJhdGlvbi5taW51dGVzKDEpLFxuICAgIGRpbWVuc2lvbnNNYXA6IGRpbWVuc2lvblxuICB9KTtcblxuICAvKlxuICAgICAgICAgICAgY2xvdWR3YXRjaC5BbGFybSgpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlkIC0+IHN0cmluZyB2YWx1ZVxuICAgICAgICAgICAgbWV0cmljIC0+IEZ1bmN0aW9uIHRvIGZldGNoIHB1Ymxpc2hlZCBtZXRyaWNzXG4gICAgICAgICAgICBldmFsdWF0aW9uX3BlcmlvZHMgLT4gQWZ0ZXIgaG93IG1hbnkgZXZhbHVhdGlvbiBkYXRhIHdpbGwgYmUgY29tcGFyZWQgdG8gdGhyZXNob2xkXG4gICAgICAgICAgICBjb21wYXJpc29uX29wZXJhdG9yIC0+IHVzZWQgdG8gY29tcGFyZVxuICAgICAgICAgICAgZGF0YXBvaW50c190b19hbGFybSAtPiBBZnRlciBob3cgbWFueSBkYXRhIHBvaW50cyBicmVhY2hpbmcsIGFsYXJtIHNob3VsZCBiZSB0cmlnZ2VyZWQuIFxuICAgICAgICAgICAgXG4gICAgICAgICAgICBSZXR1cm4gOiBHZW5lcmF0ZWQgYWxhcm1zIGlmIGRhdGFwb2ludHMgZXhjZWVkcyB0aHJlc2hvbGRcbiAgICAgICAgICAgIFxuICAqL1xuXG4gIGNvbnN0IGFsYXJtPW5ldyBBbGFybSh0aGlzLCAnYXZhaWxhYmlsaXR5X2FsYXJtJyt1cmxzLCB7XG4gICAgbWV0cmljOiBtZXRyaWMsXG5cbiAgICB0aHJlc2hvbGQ6IDEsXG4gICAgY29tcGFyaXNvbk9wZXJhdG9yOlxuICAgICAgY2xvdWR3YXRjaC5Db21wYXJpc29uT3BlcmF0b3IuR1JFQVRFUl9USEFOX1RIUkVTSE9MRCxcbiAgICBldmFsdWF0aW9uUGVyaW9kczogMSxcbiAgICBhbGFybURlc2NyaXB0aW9uOlxuICAgICAgJ0FsYXJtIGlmIHRoZSBTVU0gb2YgRXJyb3JzIGlzIGdyZWF0ZXIgdGhhbiBvciBlcXVhbCB0byB0aGUgdGhyZXNob2xkICgxKSBmb3IgMSBldmFsdWF0aW9uIHBlcmlvZCcsXG4gIH0pO1xuICByZXR1cm4gYWxhcm1cbn1cblxuY3JlYXRlX2FsYXJtX2xhdGVuY3koZGltZW5zaW9uOmFueSx1cmxzOnN0cmluZykge1xuXG4gIGNvbnN0IG1ldHJpYyA9IG5ldyBNZXRyaWMoe1xuICAgIG5hbWVzcGFjZTogY29uc3RhbnQudXJsX25hbWVzcGFjZSxcbiAgICBtZXRyaWNOYW1lOiBjb25zdGFudC5NZXRyaWNuYW1lX2xhdGVuY3ksXG4gICAgcGVyaW9kOkR1cmF0aW9uLm1pbnV0ZXMoMSksXG4gICAgZGltZW5zaW9uc01hcDogZGltZW5zaW9uXG4gIH0pO1xuXG4gIGNvbnN0IGFsYXJtID0gbmV3IEFsYXJtKHRoaXMsICdMYXRlbmN5X2FsYXJtJyt1cmxzLCB7XG4gICAgbWV0cmljOiBtZXRyaWMsXG4gICAgdGhyZXNob2xkOiAwLjQsXG4gICAgY29tcGFyaXNvbk9wZXJhdG9yOlxuICAgICAgY2xvdWR3YXRjaC5Db21wYXJpc29uT3BlcmF0b3IuR1JFQVRFUl9USEFOX09SX0VRVUFMX1RPX1RIUkVTSE9MRCxcbiAgICBldmFsdWF0aW9uUGVyaW9kczogMSxcbiAgICBhbGFybURlc2NyaXB0aW9uOlxuICAgICAgJ0FsYXJtIGlmIHRoZSBTVU0gb2YgRXJyb3JzIGlzIGdyZWF0ZXIgdGhhbiBvciBlcXVhbCB0byB0aGUgdGhyZXNob2xkICgxKSBmb3IgMSBldmFsdWF0aW9uIHBlcmlvZCcsXG4gIH0pO1xuICByZXR1cm4gYWxhcm1cbn1cbiAgY3JlYXRlX3RhYmxlKCkge1xuXG4gICAgLypcbiAgICBUYWJsZSgpXG4gICAgdGFibGVfaWQgLT4gaWQgb2YgdGFibGVcbiAgICBwYXJ0aXRpb25fa2V5IC0+IHVuaXF1ZSBrZXkgXG4gICAgc29ydF9rZXkgLT4ga2V5IHVzZWQgZm9yIHNvcnRpbmdcbiAgICBcbiAgICBSZXR1cm4gOiBEeW5hbW8gZGIgdGFibGVcbiAgICAqL1xuXG4gIGNvbnN0IGdsb2JhbFRhYmxlID0gbmV3IGR5bmFtb2RiLlRhYmxlKHRoaXMsIGNvbnN0YW50LnRhYmxlX2lkLCB7XG4gICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6IGNvbnN0YW50LnBhcnRpdGlvbl9rZXksIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXG4gICAgcmVwbGljYXRpb25SZWdpb25zOiBbJ3VzLWVhc3QtMSddLCB9KTtcbiAgICByZXR1cm4gZ2xvYmFsVGFibGVcbn1cblxuZmFpbHVyZV9tZXRyaWNzKGZ1bmN0aW9uX25hbWU6YW55KTphbnl7XG5cbiAgICAgIC8qXG4gICAgICAgICAgICBjbG91ZHdhdGNoLk1ldHJpYygpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIG5hbWVzcGFjZSAtPiBBV1MvTGFtYmRhXG4gICAgICAgICAgICBtZXRyaWNfbmFtZSAtPiBEdXJhdGlvblxuICAgICAgICAgICAgZGltZW50aW9uc19tYXAgLT4gRnVuY3Rpb25OYW1lIGFuZCBsYW1iZGEgZnVuY3Rpb24gbmFtZVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBSZXR1cm4gOiBGZXRjaCBhd3MgTGFtYmRhIGR1cmF0aW9uIHZhbHVlXG4gICAgICAqL1xuXG5cbiAgICAgICAgY29uc3QgbWV0cmljID0gbmV3IE1ldHJpYyh7XG4gICAgICAgICAgICAgICAgbmFtZXNwYWNlOiBjb25zdGFudC5mYWlsX21ldHJpY19uYW1lc3BhY2UsXG4gICAgICAgICAgICAgICAgbWV0cmljTmFtZTogY29uc3RhbnQuZmFpbF9tZXRyaWNuYW1lLFxuICAgICAgICAgICAgICAgIHBlcmlvZDpEdXJhdGlvbi5taW51dGVzKDEpLFxuICAgICAgICAgICAgICAgIGRpbWVuc2lvbnNNYXA6IHtcIkZ1bmN0aW9uTmFtZVwiOmZ1bmN0aW9uX25hbWV9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IGFsYXJtID0gbmV3IEFsYXJtKHRoaXMsICdmYWlsdXJlX2FsYXJtJywge1xuICAgICAgICAgICAgICAgIG1ldHJpYzogbWV0cmljLFxuICAgICAgICAgICAgICAgIHRocmVzaG9sZDogY29uc3RhbnQuZmFpbF9tZXRyaWNfdHJlc2hvbGQsXG4gICAgICAgICAgICAgICAgY29tcGFyaXNvbk9wZXJhdG9yOlxuICAgICAgICAgICAgICAgIGNsb3Vkd2F0Y2guQ29tcGFyaXNvbk9wZXJhdG9yLkdSRUFURVJfVEhBTl9PUl9FUVVBTF9UT19USFJFU0hPTEQsXG4gICAgICAgICAgICAgICAgZXZhbHVhdGlvblBlcmlvZHM6IDEsXG4gICAgICAgICAgICAgICAgZGF0YXBvaW50c1RvQWxhcm06MVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGFsYXJtXG59XG5cbn1cbiJdfQ==