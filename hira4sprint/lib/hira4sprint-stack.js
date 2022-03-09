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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGlyYTRzcHJpbnQtc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJoaXJhNHNwcmludC1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSw2Q0FBd0U7QUFDeEUsaURBQWlEO0FBRWpELGlEQUFpRDtBQUNqRCwwREFBMEQ7QUFDMUQsaURBQTRFO0FBQzVFLHlEQUF5RDtBQUN6RCxNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsNEJBQTRCLENBQUMsQ0FBQztBQUN2RCwrREFBdUQ7QUFDdkQscUVBQXNFO0FBQ3RFLCtDQUFpRTtBQUNqRSwyQ0FBMkM7QUFDM0MsNkVBQXVGO0FBQ3ZGLGlFQUFpRTtBQUNqRSxxREFBcUQ7QUFHckQsTUFBYSxnQkFBaUIsU0FBUSxtQkFBSztJQUN6QyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQWtCOztRQUMxRCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4QixPQUFPO1FBQ1AsSUFBSSxLQUFLLEdBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBRTdCLDJDQUEyQztRQUMzQyxNQUFNLE1BQU0sR0FBRyxJQUFJLGVBQU0sQ0FBQyxJQUFJLEVBQUMsRUFBRSxHQUFDLFFBQVEsQ0FBQyxTQUFTLEVBQUMsRUFBQyxhQUFhLEVBQUUsNEJBQW1CLENBQUMsV0FBVyxHQUFFLENBQUMsQ0FBQztRQUN4RyxJQUFJLFNBQVMsR0FBQyxNQUFNLENBQUMsVUFBVSxDQUFBO1FBQy9CLE1BQUEsTUFBTSxDQUFDLE1BQU0sMENBQUUsa0JBQWtCLENBQUMsMkJBQWEsQ0FBQyxPQUFPLEVBQUU7UUFFekQsNkJBQTZCO1FBQzdCLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUM7UUFHekIsNERBQTREO1FBQzVELElBQUksV0FBVyxHQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFDLGlCQUFpQixFQUFDLGFBQWEsRUFBQyw0QkFBNEIs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Q25GLGtCQUFrQixFQUFFLENBQUMsV0FBVyxDQUFDO1NBQUcsQ0FBQyxDQUFDO1FBQ3RDLE9BQU8sV0FBVyxDQUFBO0lBQ3RCLENBQUM7SUFHRCwwQkFBMEI7SUFDMUIsZUFBZSxDQUFDLGFBQWlCO1FBRTNCOzs7Ozs7OztVQVFFO1FBR0EsTUFBTSxNQUFNLEdBQUcsSUFBSSx1QkFBTSxDQUFDO1lBQ2xCLFNBQVMsRUFBRSxRQUFRLENBQUMscUJBQXFCO1lBQ3pDLFVBQVUsRUFBRSxRQUFRLENBQUMsZUFBZTtZQUNwQyxNQUFNLEVBQUMsc0JBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBQzFCLGFBQWEsRUFBRSxFQUFDLGNBQWMsRUFBQyxhQUFhLEVBQUM7U0FDcEQsQ0FBQyxDQUFDO1FBRUgsTUFBTSxLQUFLLEdBQUcsSUFBSSxzQkFBSyxDQUFDLElBQUksRUFBRSxlQUFlLEVBQUU7WUFDdkMsTUFBTSxFQUFFLE1BQU07WUFDZCxTQUFTLEVBQUUsUUFBUSxDQUFDLG9CQUFvQjtZQUN4QyxrQkFBa0IsRUFDbEIsVUFBVSxDQUFDLGtCQUFrQixDQUFDLGtDQUFrQztZQUNoRSxpQkFBaUIsRUFBRSxDQUFDO1lBQ3BCLGlCQUFpQixFQUFDLENBQUM7U0FDMUIsQ0FBQyxDQUFDO1FBQ0gsT0FBTyxLQUFLLENBQUE7SUFDcEIsQ0FBQztDQUVBO0FBalFELDRDQWlRQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IER1cmF0aW9uLCBSZW1vdmFsUG9saWN5LCBTdGFjaywgU3RhY2tQcm9wc30gZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEnO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5pbXBvcnQgKiBhcyBldmVudHMgZnJvbSAnYXdzLWNkay1saWIvYXdzLWV2ZW50cyc7XG5pbXBvcnQgKiBhcyB0YXJnZXRzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1ldmVudHMtdGFyZ2V0cyc7XG5pbXBvcnQgeyBNYW5hZ2VkUG9saWN5LCBSb2xlLCBTZXJ2aWNlUHJpbmNpcGFsIH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWlhbSc7XG5pbXBvcnQgKiBhcyBjbG91ZHdhdGNoIGZyb20gJ2F3cy1jZGstbGliL2F3cy1jbG91ZHdhdGNoJztcbmNvbnN0IGNvbnN0YW50ID0gcmVxdWlyZShcIi4uL3Jlc291cmNlcy9jb25zdGFudC5qc29uXCIpO1xuaW1wb3J0IHtBbGFybSxNZXRyaWN9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1jbG91ZHdhdGNoJ1xuaW1wb3J0IHtCdWNrZXREZXBsb3ltZW50LCBTb3VyY2V9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1zMy1kZXBsb3ltZW50J1xuaW1wb3J0IHsgQnVja2V0LCBCdWNrZXRBY2Nlc3NDb250cm9sIH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLXMzJztcbmltcG9ydCAqIGFzIHNucyBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtc25zJztcbmltcG9ydCB7RW1haWxTdWJzY3JpcHRpb24sIExhbWJkYVN1YnNjcmlwdGlvbn0gZnJvbSAnYXdzLWNkay1saWIvYXdzLXNucy1zdWJzY3JpcHRpb25zJ1xuaW1wb3J0ICogYXMgY3dfYWN0aW9ucyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY2xvdWR3YXRjaC1hY3Rpb25zJztcbmltcG9ydCAqIGFzIGR5bmFtb2RiIGZyb20gJ2F3cy1jZGstbGliL2F3cy1keW5hbW9kYic7XG5pbXBvcnQgeyBUYXJnZXRHcm91cExvYWRCYWxhbmNpbmdBbGdvcml0aG1UeXBlIH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWVsYXN0aWNsb2FkYmFsYW5jaW5ndjInO1xuXG5leHBvcnQgY2xhc3MgSGlyYTRTcHJpbnRTdGFjayBleHRlbmRzIFN0YWNrIHtcbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBTdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cbiAgICAvL1JvbGVzXG4gICAgdmFyIHJvbGVzPXRoaXMuY3JlYXRlX3JvbGUoKTtcblxuICAgIC8qLS0tLS0tLS0tLUNyZWF0aW5nIFMzIGJ1Y2tldC0tLS0tLS0tLS0tKi9cbiAgICBjb25zdCBidWNrZXQgPSBuZXcgQnVja2V0KHRoaXMsaWQ9Y29uc3RhbnQuYnVja2V0X2lkLHthY2Nlc3NDb250cm9sOiBCdWNrZXRBY2Nlc3NDb250cm9sLlBVQkxJQ19SRUFELH0pO1xuICAgIHZhciBzM19idWNrZXQ9YnVja2V0LmJ1Y2tldE5hbWVcbiAgICBidWNrZXQucG9saWN5Py5hcHBseVJlbW92YWxQb2xpY3koUmVtb3ZhbFBvbGljeS5ERVNUUk9ZKTtcblxuICAgIC8vVXBsb2FkaW5nIGZpbGUgdG8gUzMgYnVja2V0XG4gICAgdGhpcy5VcGxvYWRfZmlsZShidWNrZXQpO1xuXG5cbiAgICAvKi0tLS0tLS0tLS0tQ2FsbGluZyB3ZWIgaGVhbHRoIGxhbWJkYSBmdW5jdGlvbi0tLS0tLS0tLS0tKi9cbiAgICB2YXIgbGFtYmRhX2Z1bmM9dGhpcy5sYW1iZGFzKHJvbGVzLFwiV2ViSGVhbHRoTGFtYmRhXCIsXCIuL3Jlc291cmNlc1wiLFwid2ViSGVhbHRoTGFtYmRhLndlYmhhbmRsZXJcIixzM19idWNrZXQpXG4gICAgdmFyIGZ1bmN0aW9uX25hbWU9bGFtYmRhX2Z1bmMuZnVuY3Rpb25OYW1lXG5cbiAgICAvLyBSdW4gTGFtYmRhIHBlcmlvZGljYWxseVxuICAgIGNvbnN0IHJ1bGUgPSBuZXcgZXZlbnRzLlJ1bGUodGhpcywgJ1J1bGUnLCB7XG4gICAgICAgICAgICAgICAgICBzY2hlZHVsZTogZXZlbnRzLlNjaGVkdWxlLnJhdGUoRHVyYXRpb24ubWludXRlcygxKSksXG4gICAgICAgICAgICAgICAgICB0YXJnZXRzOiBbbmV3IHRhcmdldHMuTGFtYmRhRnVuY3Rpb24obGFtYmRhX2Z1bmMpXSxcbiAgICB9KTtcblxuXG4gICAgLyotLS0tLS0tLS0tLS0tLS0tLS0tLS1DcmVhdGluZyBhbiBTTlMgVE9QSUMtLS0tLS0tLS0tLS0tLS0tKi9cblxuICAgIGNvbnN0IHRvcGljID0gbmV3IHNucy5Ub3BpYyh0aGlzLCAnTXlUb3BpYycpO1xuICAgIHRvcGljLmFkZFN1YnNjcmlwdGlvbihuZXcgRW1haWxTdWJzY3JpcHRpb24oY29uc3RhbnQuZW1haWwpKTtcbiAgIFxuXG4gICAgZm9yIChsZXQgdXJscyBvZiBjb25zdGFudC51cmwpe1xuICAgICAgICAgICAgICBsZXQgZGltZW5zaW9uPXsnVVJMJzp1cmxzfVxuXG4gICAgICAgICAgICAvKiBcbiAgICAgICAgICAgIGNyZWF0ZV9hbGFybSgpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGRpbWVuc2lvbnMgLT4ga2V5IHZhbHVlIHBhaXIgLCBrZXkgPSBcIlVSTFwiIGFuZCB2YWx1ZSA9IHVybFxuICAgICAgICAgICAgdXJscyA9IHVybCBvZiB3ZWJzaXRlIFxuXG4gICAgICAgICAgICAqL1xuXG4gICAgICAgICAgICAgIGNvbnN0IGFsYXJtX2F2YWlsPSB0aGlzLmNyZWF0ZV9hbGFybV9hdmFpbChkaW1lbnNpb24sdXJscyk7IC8vIENhbGxpbmcgYW4gYWxhcm4gZm9yIGxhdGVuY3lcbiAgICAgICAgICAgICAgY29uc3QgYWxhcm1fbGF0ZW5jeT0gdGhpcy5jcmVhdGVfYWxhcm1fbGF0ZW5jeShkaW1lbnNpb24sdXJscykgIC8vIENhbGxpbiBhbiBhbGFybSBmb3IgYXZhaWxhYmlsaXR5XG5cbiAgICAgICAgICAgICAgYWxhcm1fYXZhaWwuYWRkQWxhcm1BY3Rpb24obmV3IGN3X2FjdGlvbnMuU25zQWN0aW9uKHRvcGljKSk7ICAvLyBCaW5kaW5nIGF2YWlsIGFsYXJtIHRvIHNuc1xuICAgICAgICAgICAgICBhbGFybV9sYXRlbmN5LmFkZEFsYXJtQWN0aW9uKG5ldyBjd19hY3Rpb25zLlNuc0FjdGlvbih0b3BpYykpOyAgLy8gQmluZGluZyBsYXRlbmN5IGFsYXJtIHRvIHNuc1xuICAgIH1cblxuXG4gICAgLyotLS0tLS0tLS0tLS1DcmVhdGluZyBUYWJsZS0tLS0tLS0tLS0tLS0qL1xuXG4gICAgY29uc3QgbXlfdGFibGU9dGhpcy5jcmVhdGVfdGFibGUoKTtcbiAgICB2YXIgdGFibGVfbmFtZT1teV90YWJsZS50YWJsZU5hbWVcbiAgICBcbiAgICAvL0NhbGluZyBEWU5BTU8gREIgbGFtYmRhIGZ1bmN0aW9uXG4gICAgdmFyIGR5bmFtb19sYW1iZGE9dGhpcy5sYW1iZGFzKHJvbGVzLFwiRHluYW1vTGFtYmRhXCIsXCIuL3Jlc291cmNlc1wiLFwiZHluYW1vZGIuZHluYW1vaGFuZGxlclwiLHRhYmxlX25hbWUpXG4gICAgbXlfdGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKGR5bmFtb19sYW1iZGEpXG4gICAgXG4gICAgLy8gaW52b2tlIGxhbWJkYSBhZnRlciBldmVyeSBhbGFybVxuICAgIHRvcGljLmFkZFN1YnNjcmlwdGlvbihuZXcgTGFtYmRhU3Vic2NyaXB0aW9uKGR5bmFtb19sYW1iZGEpKVxuXG5cblxuICAgIC8vIENyZWF0aW5nIEZhaWx1cmVzIEFsYXJtXG4gICAgY29uc3QgbGFtYmRhX2Z1bmMxPWxhbWJkYV9mdW5jLmN1cnJlbnRWZXJzaW9uXG4gICAgXG4gICAgLypcbiAgICBmYWlsdXJlX21ldHJpYygpXG4gICAgZnVuY3Rpb25fbmFtZSA9IG5hbWUgb2YgY3VycmVudCB2ZXJzaW9uIG9mIGxhbWJkYVxuICAgIFxuICAgIHJldHVybnMgbWV0cmljXG4gICAgKi9cbiAgICBjb25zdCBmYWlsdXJlX21ldHJpYz10aGlzLmZhaWx1cmVfbWV0cmljcyhmdW5jdGlvbl9uYW1lKTtcblxuICB9XG5cblxuXG4vKi0tLS0tLS0gRnVuY3Rpb25zLS0tLS0tKi9cblxuXG4vLyBCdWNrZXQgZGVwbG95bWVudCBmdW5jIHdpbGwgdXBsb2FkIGFsbCBmaWxlcyBvZiByZXNvdXJjZSBmb2xkZXIgdG8gczMgYnVja2V0XG5VcGxvYWRfZmlsZShidWNrZXQ6IEJ1Y2tldCkge1xuICBjb25zdCBkZXBsb3ltZW50ID0gbmV3IEJ1Y2tldERlcGxveW1lbnQodGhpcywgJ0RlcGxveVdlYnNpdGUnLCB7XG4gICAgc291cmNlczogW1NvdXJjZS5hc3NldCgnLi9yZXNvdXJjZXMnKV0sXG4gICAgZGVzdGluYXRpb25CdWNrZXQ6IGJ1Y2tldH0pXG4gIH1cblxuXG4vLyBDYWxsaW5nIExhbWJkYSBGdW5jdGlvblxubGFtYmRhcyhyb2xlczphbnksaWQ6c3RyaW5nLGFzc2V0OnN0cmluZyxoYW5kbGVyOnN0cmluZyxlbnZpb3JfdmFyOnN0cmluZyk6YW55e1xuXG4gIC8qIGNyZWF0ZV9sYW1iZGEoKVxuICAgICAgICBcbiAgaWQgLT4gc3RyaW5nIHZhbHVlXG4gIGFzc2V0IC0+IEZvbGRlciB0aGF0IGNvbnRhaW5zIGNvZGVcbiAgcnVudGltZSAtPiBMYW5ndWFnZVxuICBoYW5kbGVyIC0+IExhbWJkYSBmdW5jdGlvblxuICB0aW1lb3V0IC0+IEFmdGVyIGhvdyBsb25nIGxhbWJkYSB3aWxsIGVuZFxuICBcbiAgUmV0dXJuIDogTGFtYmRhIEZ1bmN0aW9uICovXG5cbiAgY29uc3QgaGVsbG8gPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsIGlkLCB7XG4gICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzE0X1gsICAgIC8vIGV4ZWN1dGlvbiBlbnZpcm9ubWVudFxuICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldChhc3NldCksICAvLyBjb2RlIGxvYWRlZCBmcm9tIFwicmVzb3VyY2VcIiBkaXJlY3RvcnlcbiAgICBoYW5kbGVyOiBoYW5kbGVyLFxuICAgIHRpbWVvdXQ6IER1cmF0aW9uLnNlY29uZHMoMTgwKSAgLFxuICAgIHJvbGU6cm9sZXMsXG4gICAgZW52aXJvbm1lbnQ6eyd0YWJsZV9uYW1lJzplbnZpb3JfdmFyfSAgICAgICAgICAgICAvLyBmaWxlIGlzIFwid2ViaGFuZGxlclwiLCBmdW5jdGlvbiBpcyBcImhhbmRsZXJcIlxuICB9KTtcbiAgcmV0dXJuIGhlbGxvXG59XG5cblxuLy8gY3JlYXRlIFJvbGVzXG5jcmVhdGVfcm9sZSgpOmFueXtcblxuY29uc3Qgcm9sZSA9IG5ldyBSb2xlKHRoaXMsICdleGFtcGxlLWlhbS1yb2xlJywge1xuICBhc3N1bWVkQnk6IG5ldyBTZXJ2aWNlUHJpbmNpcGFsKCdsYW1iZGEuYW1hem9uYXdzLmNvbScpLFxuICBkZXNjcmlwdGlvbjogJ0FuIGV4YW1wbGUgSUFNIHJvbGUgaW4gQVdTIENESycsXG4gIG1hbmFnZWRQb2xpY2llczogW1xuICAgIE1hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKCdDbG91ZFdhdGNoRnVsbEFjY2VzcycpLFxuICAgIE1hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKCdBbWF6b25EeW5hbW9EQkZ1bGxBY2Nlc3MnKSxcbiAgICBNYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZSgnc2VydmljZS1yb2xlL0FXU0xhbWJkYUJhc2ljRXhlY3V0aW9uUm9sZScpLFxuICAgIE1hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKCdBV1NMYW1iZGFJbnZvY2F0aW9uLUR5bmFtb0RCJyksXG4gIF0sXG59KTtcbnJldHVybiByb2xlXG59XG5cblxuLy8gR2VuZXJhdGUgYXZhaWxhYmlsaXR5IGFsYXJtXG5jcmVhdGVfYWxhcm1fYXZhaWwoZGltZW5zaW9uOmFueSx1cmxzOnN0cmluZykge1xuXG4gIC8qXG4gICAgICAgICAgICBjbG91ZHdhdGNoLk1ldHJpYygpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIG1ldHJpY19uYW1lIC0+ICBOYW1lIG9mIHRoZSBtZXRyaWNcbiAgICAgICAgICAgIG5hbWVzcGFjZSAtPiAgICBOYW1lc3BhY2Ugb2YgdGhlIG1ldHJpYyBkYXRhXG4gICAgICAgICAgICBwZXJpb2QgLT4gICBBZnRlciBob3cgbWFueSBtaW51dGVzIHRoaXMgd2lsbCBjaGVjayBkYXRhcG9pbnRzIGluIHB1Ymxpc2hlZCBtZXRyaWNzXG4gICAgICAgICAgICBkaW1lbnNpb25zIC0+ICAgSXQgdGFrZXMga2V5IGFuZCB2YWx1ZS4gV2hhdCB3ZSBhcmUgbW9uaXRvcmluZ1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBSZXR1cm4gOiBGZXRjaCBtZXRyaWMgb24gYXdzIGNsb3Vkd2F0Y2hcbiAgICAgICAgICAgIFxuICAqL1xuXG5cbiAgY29uc3QgbWV0cmljID0gbmV3IE1ldHJpYyh7XG4gICAgbmFtZXNwYWNlOiBjb25zdGFudC51cmxfbmFtZXNwYWNlLFxuICAgIG1ldHJpY05hbWU6IGNvbnN0YW50Lk1ldHJpY25hbWVfYXZhaWwsXG4gICAgcGVyaW9kOkR1cmF0aW9uLm1pbnV0ZXMoMSksXG4gICAgZGltZW5zaW9uc01hcDogZGltZW5zaW9uXG4gIH0pO1xuXG4gIC8qXG4gICAgICAgICAgICBjbG91ZHdhdGNoLkFsYXJtKClcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWQgLT4gc3RyaW5nIHZhbHVlXG4gICAgICAgICAgICBtZXRyaWMgLT4gRnVuY3Rpb24gdG8gZmV0Y2ggcHVibGlzaGVkIG1ldHJpY3NcbiAgICAgICAgICAgIGV2YWx1YXRpb25fcGVyaW9kcyAtPiBBZnRlciBob3cgbWFueSBldmFsdWF0aW9uIGRhdGEgd2lsbCBiZSBjb21wYXJlZCB0byB0aHJlc2hvbGRcbiAgICAgICAgICAgIGNvbXBhcmlzb25fb3BlcmF0b3IgLT4gdXNlZCB0byBjb21wYXJlXG4gICAgICAgICAgICBkYXRhcG9pbnRzX3RvX2FsYXJtIC0+IEFmdGVyIGhvdyBtYW55IGRhdGEgcG9pbnRzIGJyZWFjaGluZywgYWxhcm0gc2hvdWxkIGJlIHRyaWdnZXJlZC4gXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIFJldHVybiA6IEdlbmVyYXRlZCBhbGFybXMgaWYgZGF0YXBvaW50cyBleGNlZWRzIHRocmVzaG9sZFxuICAgICAgICAgICAgXG4gICovXG4gIGNvbnN0IGFsYXJtPW5ldyBBbGFybSh0aGlzLCAnYXZhaWxhYmlsaXR5X2FsYXJtJyt1cmxzLCB7XG4gICAgbWV0cmljOiBtZXRyaWMsXG5cbiAgICB0aHJlc2hvbGQ6IDEsXG4gICAgY29tcGFyaXNvbk9wZXJhdG9yOlxuICAgICAgY2xvdWR3YXRjaC5Db21wYXJpc29uT3BlcmF0b3IuR1JFQVRFUl9USEFOX1RIUkVTSE9MRCxcbiAgICBldmFsdWF0aW9uUGVyaW9kczogMSxcbiAgICBhbGFybURlc2NyaXB0aW9uOlxuICAgICAgJ0FsYXJtIGlmIHRoZSBTVU0gb2YgRXJyb3JzIGlzIGdyZWF0ZXIgdGhhbiBvciBlcXVhbCB0byB0aGUgdGhyZXNob2xkICgxKSBmb3IgMSBldmFsdWF0aW9uIHBlcmlvZCcsXG4gIH0pO1xuICByZXR1cm4gYWxhcm1cbn1cblxuXG4vLyBHZW5lcmF0ZSBsYXRlbmN5IGFsYXJtXG5jcmVhdGVfYWxhcm1fbGF0ZW5jeShkaW1lbnNpb246YW55LHVybHM6c3RyaW5nKSB7XG5cbiAgY29uc3QgbWV0cmljID0gbmV3IE1ldHJpYyh7XG4gICAgbmFtZXNwYWNlOiBjb25zdGFudC51cmxfbmFtZXNwYWNlLFxuICAgIG1ldHJpY05hbWU6IGNvbnN0YW50Lk1ldHJpY25hbWVfbGF0ZW5jeSxcbiAgICBwZXJpb2Q6RHVyYXRpb24ubWludXRlcygxKSxcbiAgICBkaW1lbnNpb25zTWFwOiBkaW1lbnNpb25cbiAgfSk7XG5cbiAgY29uc3QgYWxhcm0gPSBuZXcgQWxhcm0odGhpcywgJ0xhdGVuY3lfYWxhcm0nK3VybHMsIHtcbiAgICBtZXRyaWM6IG1ldHJpYyxcbiAgICB0aHJlc2hvbGQ6IDAuNCxcbiAgICBjb21wYXJpc29uT3BlcmF0b3I6XG4gICAgICBjbG91ZHdhdGNoLkNvbXBhcmlzb25PcGVyYXRvci5HUkVBVEVSX1RIQU5fT1JfRVFVQUxfVE9fVEhSRVNIT0xELFxuICAgIGV2YWx1YXRpb25QZXJpb2RzOiAxLFxuICAgIGFsYXJtRGVzY3JpcHRpb246XG4gICAgICAnQWxhcm0gaWYgdGhlIFNVTSBvZiBFcnJvcnMgaXMgZ3JlYXRlciB0aGFuIG9yIGVxdWFsIHRvIHRoZSB0aHJlc2hvbGQgKDEpIGZvciAxIGV2YWx1YXRpb24gcGVyaW9kJyxcbiAgfSk7XG4gIHJldHVybiBhbGFybVxufVxuXG5cbi8vIENyZWF0ZSB0YWJsZSBkeW5hbW9kYiBmdW5jdGlvblxuY3JlYXRlX3RhYmxlKCkge1xuXG4gICAgLypcbiAgICBUYWJsZSgpXG4gICAgdGFibGVfaWQgLT4gaWQgb2YgdGFibGVcbiAgICBwYXJ0aXRpb25fa2V5IC0+IHVuaXF1ZSBrZXkgXG4gICAgc29ydF9rZXkgLT4ga2V5IHVzZWQgZm9yIHNvcnRpbmdcbiAgICBcbiAgICBSZXR1cm4gOiBEeW5hbW8gZGIgdGFibGVcbiAgICAqL1xuXG4gIGNvbnN0IGdsb2JhbFRhYmxlID0gbmV3IGR5bmFtb2RiLlRhYmxlKHRoaXMsIGNvbnN0YW50LnRhYmxlX2lkLCB7XG4gICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6IGNvbnN0YW50LnBhcnRpdGlvbl9rZXksIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXG4gICAgcmVwbGljYXRpb25SZWdpb25zOiBbJ3VzLWVhc3QtMSddLCB9KTtcbiAgICByZXR1cm4gZ2xvYmFsVGFibGVcbn1cblxuXG4vLyBHZW5lcmF0ZSBGYWlsdXJlIGFsYXJtc1xuZmFpbHVyZV9tZXRyaWNzKGZ1bmN0aW9uX25hbWU6YW55KTphbnl7XG5cbiAgICAgIC8qXG4gICAgICAgICAgICBjbG91ZHdhdGNoLk1ldHJpYygpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIG5hbWVzcGFjZSAtPiBBV1MvTGFtYmRhXG4gICAgICAgICAgICBtZXRyaWNfbmFtZSAtPiBEdXJhdGlvblxuICAgICAgICAgICAgZGltZW50aW9uc19tYXAgLT4gRnVuY3Rpb25OYW1lIGFuZCBsYW1iZGEgZnVuY3Rpb24gbmFtZVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBSZXR1cm4gOiBGZXRjaCBhd3MgTGFtYmRhIGR1cmF0aW9uIHZhbHVlXG4gICAgICAqL1xuXG5cbiAgICAgICAgY29uc3QgbWV0cmljID0gbmV3IE1ldHJpYyh7XG4gICAgICAgICAgICAgICAgbmFtZXNwYWNlOiBjb25zdGFudC5mYWlsX21ldHJpY19uYW1lc3BhY2UsXG4gICAgICAgICAgICAgICAgbWV0cmljTmFtZTogY29uc3RhbnQuZmFpbF9tZXRyaWNuYW1lLFxuICAgICAgICAgICAgICAgIHBlcmlvZDpEdXJhdGlvbi5taW51dGVzKDEpLFxuICAgICAgICAgICAgICAgIGRpbWVuc2lvbnNNYXA6IHtcIkZ1bmN0aW9uTmFtZVwiOmZ1bmN0aW9uX25hbWV9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IGFsYXJtID0gbmV3IEFsYXJtKHRoaXMsICdmYWlsdXJlX2FsYXJtJywge1xuICAgICAgICAgICAgICAgIG1ldHJpYzogbWV0cmljLFxuICAgICAgICAgICAgICAgIHRocmVzaG9sZDogY29uc3RhbnQuZmFpbF9tZXRyaWNfdHJlc2hvbGQsXG4gICAgICAgICAgICAgICAgY29tcGFyaXNvbk9wZXJhdG9yOlxuICAgICAgICAgICAgICAgIGNsb3Vkd2F0Y2guQ29tcGFyaXNvbk9wZXJhdG9yLkdSRUFURVJfVEhBTl9PUl9FUVVBTF9UT19USFJFU0hPTEQsXG4gICAgICAgICAgICAgICAgZXZhbHVhdGlvblBlcmlvZHM6IDEsXG4gICAgICAgICAgICAgICAgZGF0YXBvaW50c1RvQWxhcm06MVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGFsYXJtXG59XG5cbn1cbiJdfQ==