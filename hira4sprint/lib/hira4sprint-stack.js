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
        var function_name = lambda_func.FunctionName;
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
        // const lambda_func1=lambda_func.currentVersion
        /*
        failure_metric()
        function_name = name of current version of lambda
        
        returns metric
        */
        // const failure_metric=this.failure_metrics(function_name);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGlyYTRzcHJpbnQtc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJoaXJhNHNwcmludC1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSw2Q0FBd0U7QUFDeEUsaURBQWlEO0FBRWpELGlEQUFpRDtBQUNqRCwwREFBMEQ7QUFDMUQsaURBQTRFO0FBQzVFLHlEQUF5RDtBQUN6RCxNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsNEJBQTRCLENBQUMsQ0FBQztBQUN2RCwrREFBdUQ7QUFDdkQscUVBQXNFO0FBQ3RFLCtDQUFpRTtBQUNqRSwyQ0FBMkM7QUFDM0MsNkVBQXVGO0FBQ3ZGLGlFQUFpRTtBQUNqRSxxREFBcUQ7QUFHckQsTUFBYSxnQkFBaUIsU0FBUSxtQkFBSztJQUN6QyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQWtCOztRQUMxRCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4QixPQUFPO1FBQ1AsSUFBSSxLQUFLLEdBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBRTdCLDJDQUEyQztRQUMzQyxNQUFNLE1BQU0sR0FBRyxJQUFJLGVBQU0sQ0FBQyxJQUFJLEVBQUMsRUFBRSxHQUFDLFFBQVEsQ0FBQyxTQUFTLEVBQUMsRUFBQyxhQUFhLEVBQUUsNEJBQW1CLENBQUMsV0FBVyxHQUFFLENBQUMsQ0FBQztRQUN4RyxJQUFJLFNBQVMsR0FBQyxNQUFNLENBQUMsVUFBVSxDQUFBO1FBQy9CLE1BQUEsTUFBTSxDQUFDLE1BQU0sMENBQUUsa0JBQWtCLENBQUMsMkJBQWEsQ0FBQyxPQUFPLEVBQUU7UUFFekQsNkJBQTZCO1FBQzdCLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUM7UUFHekIsNERBQTREO1FBQzVELElBQUksV0FBVyxHQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFDLGlCQUFpQixFQUFDLGFBQWEsRUFBQyw0QkFBNEIs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QixDQUFDO0lBR0QsMEJBQTBCO0lBQzFCLGVBQWUsQ0FBQyxhQUFpQjtRQUUzQjs7Ozs7Ozs7VUFRRTtRQUdBLE1BQU0sTUFBTSxHQUFHLElBQUksdUJBQU0sQ0FBQztZQUNsQixTQUFTLEVBQUUsUUFBUSxDQUFDLHFCQUFxQjtZQUN6QyxVQUFVLEVBQUUsUUFBUSxDQUFDLGVBQWU7WUFDcEMsTUFBTSxFQUFDLHNCQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUMxQixhQUFhLEVBQUUsRUFBQyxjQUFjLEVBQUMsYUFBYSxFQUFDO1NBQ3BELENBQUMsQ0FBQztRQUVILE1BQU0sS0FBSyxHQUFHLElBQUksc0JBQUssQ0FBQyxJQUFJLEVBQUUsZUFBZSxFQUFFO1lBQ3ZDLE1BQU0sRUFBRSxNQUFNO1lBQ2QsU0FBUyxFQUFFLFFBQVEsQ0FBQyxvQkFBb0I7WUFDeEMsa0JBQWtCLEVBQ2xCLFVBQVUsQ0FBQyxrQkFBa0IsQ0FBQyxrQ0FBa0M7WUFDaEUsaUJBQWlCLEVBQUUsQ0FBQztZQUNwQixpQkFBaUIsRUFBQyxDQUFDO1NBQzFCLENBQUMsQ0FBQztRQUNILE9BQU8sS0FBSyxDQUFBO0lBQ3BCLENBQUM7Q0FFQTtBQWxRRCw0Q0FrUUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBEdXJhdGlvbiwgUmVtb3ZhbFBvbGljeSwgU3RhY2ssIFN0YWNrUHJvcHN9IGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCAqIGFzIGxhbWJkYSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbGFtYmRhJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuaW1wb3J0ICogYXMgZXZlbnRzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1ldmVudHMnO1xuaW1wb3J0ICogYXMgdGFyZ2V0cyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZXZlbnRzLXRhcmdldHMnO1xuaW1wb3J0IHsgTWFuYWdlZFBvbGljeSwgUm9sZSwgU2VydmljZVByaW5jaXBhbCB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1pYW0nO1xuaW1wb3J0ICogYXMgY2xvdWR3YXRjaCBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY2xvdWR3YXRjaCc7XG5jb25zdCBjb25zdGFudCA9IHJlcXVpcmUoXCIuLi9yZXNvdXJjZXMvY29uc3RhbnQuanNvblwiKTtcbmltcG9ydCB7QWxhcm0sTWV0cmljfSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY2xvdWR3YXRjaCdcbmltcG9ydCB7QnVja2V0RGVwbG95bWVudCwgU291cmNlfSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtczMtZGVwbG95bWVudCdcbmltcG9ydCB7IEJ1Y2tldCwgQnVja2V0QWNjZXNzQ29udHJvbCB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1zMyc7XG5pbXBvcnQgKiBhcyBzbnMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXNucyc7XG5pbXBvcnQge0VtYWlsU3Vic2NyaXB0aW9uLCBMYW1iZGFTdWJzY3JpcHRpb259IGZyb20gJ2F3cy1jZGstbGliL2F3cy1zbnMtc3Vic2NyaXB0aW9ucydcbmltcG9ydCAqIGFzIGN3X2FjdGlvbnMgZnJvbSAnYXdzLWNkay1saWIvYXdzLWNsb3Vkd2F0Y2gtYWN0aW9ucyc7XG5pbXBvcnQgKiBhcyBkeW5hbW9kYiBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZHluYW1vZGInO1xuaW1wb3J0IHsgVGFyZ2V0R3JvdXBMb2FkQmFsYW5jaW5nQWxnb3JpdGhtVHlwZSB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1lbGFzdGljbG9hZGJhbGFuY2luZ3YyJztcblxuZXhwb3J0IGNsYXNzIEhpcmE0U3ByaW50U3RhY2sgZXh0ZW5kcyBTdGFjayB7XG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgLy9Sb2xlc1xuICAgIHZhciByb2xlcz10aGlzLmNyZWF0ZV9yb2xlKCk7XG5cbiAgICAvKi0tLS0tLS0tLS1DcmVhdGluZyBTMyBidWNrZXQtLS0tLS0tLS0tLSovXG4gICAgY29uc3QgYnVja2V0ID0gbmV3IEJ1Y2tldCh0aGlzLGlkPWNvbnN0YW50LmJ1Y2tldF9pZCx7YWNjZXNzQ29udHJvbDogQnVja2V0QWNjZXNzQ29udHJvbC5QVUJMSUNfUkVBRCx9KTtcbiAgICB2YXIgczNfYnVja2V0PWJ1Y2tldC5idWNrZXROYW1lXG4gICAgYnVja2V0LnBvbGljeT8uYXBwbHlSZW1vdmFsUG9saWN5KFJlbW92YWxQb2xpY3kuREVTVFJPWSk7XG5cbiAgICAvL1VwbG9hZGluZyBmaWxlIHRvIFMzIGJ1Y2tldFxuICAgIHRoaXMuVXBsb2FkX2ZpbGUoYnVja2V0KTtcblxuXG4gICAgLyotLS0tLS0tLS0tLUNhbGxpbmcgd2ViIGhlYWx0aCBsYW1iZGEgZnVuY3Rpb24tLS0tLS0tLS0tLSovXG4gICAgdmFyIGxhbWJkYV9mdW5jPXRoaXMubGFtYmRhcyhyb2xlcyxcIldlYkhlYWx0aExhbWJkYVwiLFwiLi9yZXNvdXJjZXNcIixcIndlYkhlYWx0aExhbWJkYS53ZWJoYW5kbGVyXCIsczNfYnVja2V0KVxuICAgIHZhciBmdW5jdGlvbl9uYW1lPWxhbWJkYV9mdW5jLkZ1bmN0aW9uTmFtZVxuXG4gICAgLy8gUnVuIExhbWJkYSBwZXJpb2RpY2FsbHlcbiAgICBjb25zdCBydWxlID0gbmV3IGV2ZW50cy5SdWxlKHRoaXMsICdSdWxlJywge1xuICAgICAgICAgICAgICAgICAgc2NoZWR1bGU6IGV2ZW50cy5TY2hlZHVsZS5yYXRlKER1cmF0aW9uLm1pbnV0ZXMoMSkpLFxuICAgICAgICAgICAgICAgICAgdGFyZ2V0czogW25ldyB0YXJnZXRzLkxhbWJkYUZ1bmN0aW9uKGxhbWJkYV9mdW5jKV0sXG4gICAgfSk7XG5cblxuICAgIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tQ3JlYXRpbmcgYW4gU05TIFRPUElDLS0tLS0tLS0tLS0tLS0tLSovXG5cbiAgICBjb25zdCB0b3BpYyA9IG5ldyBzbnMuVG9waWModGhpcywgJ015VG9waWMnKTtcbiAgICB0b3BpYy5hZGRTdWJzY3JpcHRpb24obmV3IEVtYWlsU3Vic2NyaXB0aW9uKGNvbnN0YW50LmVtYWlsKSk7XG4gICBcblxuICAgIGZvciAobGV0IHVybHMgb2YgY29uc3RhbnQudXJsKXtcbiAgICAgICAgICAgICAgbGV0IGRpbWVuc2lvbj17J1VSTCc6dXJsc31cblxuICAgICAgICAgICAgLyogXG4gICAgICAgICAgICBjcmVhdGVfYWxhcm0oKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBkaW1lbnNpb25zIC0+IGtleSB2YWx1ZSBwYWlyICwga2V5ID0gXCJVUkxcIiBhbmQgdmFsdWUgPSB1cmxcbiAgICAgICAgICAgIHVybHMgPSB1cmwgb2Ygd2Vic2l0ZSBcblxuICAgICAgICAgICAgKi9cblxuICAgICAgICAgICAgICBjb25zdCBhbGFybV9hdmFpbD0gdGhpcy5jcmVhdGVfYWxhcm1fYXZhaWwoZGltZW5zaW9uLHVybHMpOyAvLyBDYWxsaW5nIGFuIGFsYXJuIGZvciBsYXRlbmN5XG4gICAgICAgICAgICAgIGNvbnN0IGFsYXJtX2xhdGVuY3k9IHRoaXMuY3JlYXRlX2FsYXJtX2xhdGVuY3koZGltZW5zaW9uLHVybHMpICAvLyBDYWxsaW4gYW4gYWxhcm0gZm9yIGF2YWlsYWJpbGl0eVxuXG4gICAgICAgICAgICAgIGFsYXJtX2F2YWlsLmFkZEFsYXJtQWN0aW9uKG5ldyBjd19hY3Rpb25zLlNuc0FjdGlvbih0b3BpYykpOyAgLy8gQmluZGluZyBhdmFpbCBhbGFybSB0byBzbnNcbiAgICAgICAgICAgICAgYWxhcm1fbGF0ZW5jeS5hZGRBbGFybUFjdGlvbihuZXcgY3dfYWN0aW9ucy5TbnNBY3Rpb24odG9waWMpKTsgIC8vIEJpbmRpbmcgbGF0ZW5jeSBhbGFybSB0byBzbnNcbiAgICB9XG5cblxuICAgIC8qLS0tLS0tLS0tLS0tQ3JlYXRpbmcgVGFibGUtLS0tLS0tLS0tLS0tKi9cblxuICAgIGNvbnN0IG15X3RhYmxlPXRoaXMuY3JlYXRlX3RhYmxlKCk7XG4gICAgdmFyIHRhYmxlX25hbWU9bXlfdGFibGUudGFibGVOYW1lXG4gICAgXG4gICAgLy9DYWxpbmcgRFlOQU1PIERCIGxhbWJkYSBmdW5jdGlvblxuICAgIHZhciBkeW5hbW9fbGFtYmRhPXRoaXMubGFtYmRhcyhyb2xlcyxcIkR5bmFtb0xhbWJkYVwiLFwiLi9yZXNvdXJjZXNcIixcImR5bmFtb2RiLmR5bmFtb2hhbmRsZXJcIix0YWJsZV9uYW1lKVxuICAgIG15X3RhYmxlLmdyYW50UmVhZFdyaXRlRGF0YShkeW5hbW9fbGFtYmRhKVxuICAgIFxuICAgIC8vIGludm9rZSBsYW1iZGEgYWZ0ZXIgZXZlcnkgYWxhcm1cbiAgICB0b3BpYy5hZGRTdWJzY3JpcHRpb24obmV3IExhbWJkYVN1YnNjcmlwdGlvbihkeW5hbW9fbGFtYmRhKSlcblxuXG5cbiAgICAvLyBDcmVhdGluZyBGYWlsdXJlcyBBbGFybVxuICAgIC8vIGNvbnN0IGxhbWJkYV9mdW5jMT1sYW1iZGFfZnVuYy5jdXJyZW50VmVyc2lvblxuICAgIFxuICAgIC8qXG4gICAgZmFpbHVyZV9tZXRyaWMoKVxuICAgIGZ1bmN0aW9uX25hbWUgPSBuYW1lIG9mIGN1cnJlbnQgdmVyc2lvbiBvZiBsYW1iZGFcbiAgICBcbiAgICByZXR1cm5zIG1ldHJpY1xuICAgICovXG4gICAgLy8gY29uc3QgZmFpbHVyZV9tZXRyaWM9dGhpcy5mYWlsdXJlX21ldHJpY3MoZnVuY3Rpb25fbmFtZSk7XG5cbiAgfVxuXG5cblxuLyotLS0tLS0tIEZ1bmN0aW9ucy0tLS0tLSovXG5cblxuLy8gQnVja2V0IGRlcGxveW1lbnQgZnVuYyB3aWxsIHVwbG9hZCBhbGwgZmlsZXMgb2YgcmVzb3VyY2UgZm9sZGVyIHRvIHMzIGJ1Y2tldFxuVXBsb2FkX2ZpbGUoYnVja2V0OiBCdWNrZXQpIHtcbiAgY29uc3QgZGVwbG95bWVudCA9IG5ldyBCdWNrZXREZXBsb3ltZW50KHRoaXMsICdEZXBsb3lXZWJzaXRlJywge1xuICAgIHNvdXJjZXM6IFtTb3VyY2UuYXNzZXQoJy4vcmVzb3VyY2VzJyldLFxuICAgIGRlc3RpbmF0aW9uQnVja2V0OiBidWNrZXR9KVxuICB9XG5cblxuLy8gQ2FsbGluZyBMYW1iZGEgRnVuY3Rpb25cbmxhbWJkYXMocm9sZXM6YW55LGlkOnN0cmluZyxhc3NldDpzdHJpbmcsaGFuZGxlcjpzdHJpbmcsZW52aW9yX3ZhcjpzdHJpbmcpOmFueXtcblxuICAvKiBjcmVhdGVfbGFtYmRhKClcbiAgICAgICAgXG4gIGlkIC0+IHN0cmluZyB2YWx1ZVxuICBhc3NldCAtPiBGb2xkZXIgdGhhdCBjb250YWlucyBjb2RlXG4gIHJ1bnRpbWUgLT4gTGFuZ3VhZ2VcbiAgaGFuZGxlciAtPiBMYW1iZGEgZnVuY3Rpb25cbiAgdGltZW91dCAtPiBBZnRlciBob3cgbG9uZyBsYW1iZGEgd2lsbCBlbmRcbiAgXG4gIFJldHVybiA6IExhbWJkYSBGdW5jdGlvbiAqL1xuXG4gIGNvbnN0IGhlbGxvID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCBpZCwge1xuICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18xNF9YLCAgICAvLyBleGVjdXRpb24gZW52aXJvbm1lbnRcbiAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQoYXNzZXQpLCAgLy8gY29kZSBsb2FkZWQgZnJvbSBcInJlc291cmNlXCIgZGlyZWN0b3J5XG4gICAgaGFuZGxlcjogaGFuZGxlcixcbiAgICB0aW1lb3V0OiBEdXJhdGlvbi5zZWNvbmRzKDE4MCkgICxcbiAgICByb2xlOnJvbGVzLFxuICAgIGVudmlyb25tZW50OnsndGFibGVfbmFtZSc6ZW52aW9yX3Zhcn0gICAgICAgICAgICAgLy8gZmlsZSBpcyBcIndlYmhhbmRsZXJcIiwgZnVuY3Rpb24gaXMgXCJoYW5kbGVyXCJcbiAgfSk7XG4gIHJldHVybiBoZWxsb1xufVxuXG5cbi8vIGNyZWF0ZSBSb2xlc1xuY3JlYXRlX3JvbGUoKTphbnl7XG5cbmNvbnN0IHJvbGUgPSBuZXcgUm9sZSh0aGlzLCAnZXhhbXBsZS1pYW0tcm9sZScsIHtcbiAgYXNzdW1lZEJ5OiBuZXcgU2VydmljZVByaW5jaXBhbCgnbGFtYmRhLmFtYXpvbmF3cy5jb20nKSxcbiAgZGVzY3JpcHRpb246ICdBbiBleGFtcGxlIElBTSByb2xlIGluIEFXUyBDREsnLFxuICBtYW5hZ2VkUG9saWNpZXM6IFtcbiAgICBNYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZSgnQ2xvdWRXYXRjaEZ1bGxBY2Nlc3MnKSxcbiAgICBNYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZSgnQW1hem9uRHluYW1vREJGdWxsQWNjZXNzJyksXG4gICAgTWFuYWdlZFBvbGljeS5mcm9tQXdzTWFuYWdlZFBvbGljeU5hbWUoJ3NlcnZpY2Utcm9sZS9BV1NMYW1iZGFCYXNpY0V4ZWN1dGlvblJvbGUnKSxcbiAgICBNYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZSgnQVdTTGFtYmRhSW52b2NhdGlvbi1EeW5hbW9EQicpLFxuICBdLFxufSk7XG5yZXR1cm4gcm9sZVxufVxuXG5cbi8vIEdlbmVyYXRlIGF2YWlsYWJpbGl0eSBhbGFybVxuY3JlYXRlX2FsYXJtX2F2YWlsKGRpbWVuc2lvbjphbnksdXJsczpzdHJpbmcpIHtcblxuICAvKlxuICAgICAgICAgICAgY2xvdWR3YXRjaC5NZXRyaWMoKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBtZXRyaWNfbmFtZSAtPiAgTmFtZSBvZiB0aGUgbWV0cmljXG4gICAgICAgICAgICBuYW1lc3BhY2UgLT4gICAgTmFtZXNwYWNlIG9mIHRoZSBtZXRyaWMgZGF0YVxuICAgICAgICAgICAgcGVyaW9kIC0+ICAgQWZ0ZXIgaG93IG1hbnkgbWludXRlcyB0aGlzIHdpbGwgY2hlY2sgZGF0YXBvaW50cyBpbiBwdWJsaXNoZWQgbWV0cmljc1xuICAgICAgICAgICAgZGltZW5zaW9ucyAtPiAgIEl0IHRha2VzIGtleSBhbmQgdmFsdWUuIFdoYXQgd2UgYXJlIG1vbml0b3JpbmdcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgUmV0dXJuIDogRmV0Y2ggbWV0cmljIG9uIGF3cyBjbG91ZHdhdGNoXG4gICAgICAgICAgICBcbiAgKi9cblxuXG4gIGNvbnN0IG1ldHJpYyA9IG5ldyBNZXRyaWMoe1xuICAgIG5hbWVzcGFjZTogY29uc3RhbnQudXJsX25hbWVzcGFjZSxcbiAgICBtZXRyaWNOYW1lOiBjb25zdGFudC5NZXRyaWNuYW1lX2F2YWlsLFxuICAgIHBlcmlvZDpEdXJhdGlvbi5taW51dGVzKDEpLFxuICAgIGRpbWVuc2lvbnNNYXA6IGRpbWVuc2lvblxuICB9KTtcblxuICAvKlxuICAgICAgICAgICAgY2xvdWR3YXRjaC5BbGFybSgpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlkIC0+IHN0cmluZyB2YWx1ZVxuICAgICAgICAgICAgbWV0cmljIC0+IEZ1bmN0aW9uIHRvIGZldGNoIHB1Ymxpc2hlZCBtZXRyaWNzXG4gICAgICAgICAgICBldmFsdWF0aW9uX3BlcmlvZHMgLT4gQWZ0ZXIgaG93IG1hbnkgZXZhbHVhdGlvbiBkYXRhIHdpbGwgYmUgY29tcGFyZWQgdG8gdGhyZXNob2xkXG4gICAgICAgICAgICBjb21wYXJpc29uX29wZXJhdG9yIC0+IHVzZWQgdG8gY29tcGFyZVxuICAgICAgICAgICAgZGF0YXBvaW50c190b19hbGFybSAtPiBBZnRlciBob3cgbWFueSBkYXRhIHBvaW50cyBicmVhY2hpbmcsIGFsYXJtIHNob3VsZCBiZSB0cmlnZ2VyZWQuIFxuICAgICAgICAgICAgXG4gICAgICAgICAgICBSZXR1cm4gOiBHZW5lcmF0ZWQgYWxhcm1zIGlmIGRhdGFwb2ludHMgZXhjZWVkcyB0aHJlc2hvbGRcbiAgICAgICAgICAgIFxuICAqL1xuXG4gIGNvbnN0IGFsYXJtPW5ldyBBbGFybSh0aGlzLCAnYXZhaWxhYmlsaXR5X2FsYXJtJyt1cmxzLCB7XG4gICAgbWV0cmljOiBtZXRyaWMsXG5cbiAgICB0aHJlc2hvbGQ6IDEsXG4gICAgY29tcGFyaXNvbk9wZXJhdG9yOlxuICAgICAgY2xvdWR3YXRjaC5Db21wYXJpc29uT3BlcmF0b3IuR1JFQVRFUl9USEFOX1RIUkVTSE9MRCxcbiAgICBldmFsdWF0aW9uUGVyaW9kczogMSxcbiAgICBhbGFybURlc2NyaXB0aW9uOlxuICAgICAgJ0FsYXJtIGlmIHRoZSBTVU0gb2YgRXJyb3JzIGlzIGdyZWF0ZXIgdGhhbiBvciBlcXVhbCB0byB0aGUgdGhyZXNob2xkICgxKSBmb3IgMSBldmFsdWF0aW9uIHBlcmlvZCcsXG4gIH0pO1xuICByZXR1cm4gYWxhcm1cbn1cblxuXG4vLyBHZW5lcmF0ZSBsYXRlbmN5IGFsYXJtXG5jcmVhdGVfYWxhcm1fbGF0ZW5jeShkaW1lbnNpb246YW55LHVybHM6c3RyaW5nKSB7XG5cbiAgY29uc3QgbWV0cmljID0gbmV3IE1ldHJpYyh7XG4gICAgbmFtZXNwYWNlOiBjb25zdGFudC51cmxfbmFtZXNwYWNlLFxuICAgIG1ldHJpY05hbWU6IGNvbnN0YW50Lk1ldHJpY25hbWVfbGF0ZW5jeSxcbiAgICBwZXJpb2Q6RHVyYXRpb24ubWludXRlcygxKSxcbiAgICBkaW1lbnNpb25zTWFwOiBkaW1lbnNpb25cbiAgfSk7XG5cbiAgY29uc3QgYWxhcm0gPSBuZXcgQWxhcm0odGhpcywgJ0xhdGVuY3lfYWxhcm0nK3VybHMsIHtcbiAgICBtZXRyaWM6IG1ldHJpYyxcbiAgICB0aHJlc2hvbGQ6IDAuNCxcbiAgICBjb21wYXJpc29uT3BlcmF0b3I6XG4gICAgICBjbG91ZHdhdGNoLkNvbXBhcmlzb25PcGVyYXRvci5HUkVBVEVSX1RIQU5fT1JfRVFVQUxfVE9fVEhSRVNIT0xELFxuICAgIGV2YWx1YXRpb25QZXJpb2RzOiAxLFxuICAgIGFsYXJtRGVzY3JpcHRpb246XG4gICAgICAnQWxhcm0gaWYgdGhlIFNVTSBvZiBFcnJvcnMgaXMgZ3JlYXRlciB0aGFuIG9yIGVxdWFsIHRvIHRoZSB0aHJlc2hvbGQgKDEpIGZvciAxIGV2YWx1YXRpb24gcGVyaW9kJyxcbiAgfSk7XG4gIHJldHVybiBhbGFybVxufVxuXG5cbi8vIENyZWF0ZSB0YWJsZSBkeW5hbW9kYiBmdW5jdGlvblxuY3JlYXRlX3RhYmxlKCkge1xuXG4gICAgLypcbiAgICBUYWJsZSgpXG4gICAgdGFibGVfaWQgLT4gaWQgb2YgdGFibGVcbiAgICBwYXJ0aXRpb25fa2V5IC0+IHVuaXF1ZSBrZXkgXG4gICAgc29ydF9rZXkgLT4ga2V5IHVzZWQgZm9yIHNvcnRpbmdcbiAgICBcbiAgICBSZXR1cm4gOiBEeW5hbW8gZGIgdGFibGVcbiAgICAqL1xuXG4gIGNvbnN0IGdsb2JhbFRhYmxlID0gbmV3IGR5bmFtb2RiLlRhYmxlKHRoaXMsIGNvbnN0YW50LnRhYmxlX2lkLCB7XG4gICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6IGNvbnN0YW50LnBhcnRpdGlvbl9rZXksIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXG4gICAgcmVwbGljYXRpb25SZWdpb25zOiBbJ3VzLWVhc3QtMSddLCB9KTtcbiAgICByZXR1cm4gZ2xvYmFsVGFibGVcbn1cblxuXG4vLyBHZW5lcmF0ZSBGYWlsdXJlIGFsYXJtc1xuZmFpbHVyZV9tZXRyaWNzKGZ1bmN0aW9uX25hbWU6YW55KTphbnl7XG5cbiAgICAgIC8qXG4gICAgICAgICAgICBjbG91ZHdhdGNoLk1ldHJpYygpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIG5hbWVzcGFjZSAtPiBBV1MvTGFtYmRhXG4gICAgICAgICAgICBtZXRyaWNfbmFtZSAtPiBEdXJhdGlvblxuICAgICAgICAgICAgZGltZW50aW9uc19tYXAgLT4gRnVuY3Rpb25OYW1lIGFuZCBsYW1iZGEgZnVuY3Rpb24gbmFtZVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBSZXR1cm4gOiBGZXRjaCBhd3MgTGFtYmRhIGR1cmF0aW9uIHZhbHVlXG4gICAgICAqL1xuXG5cbiAgICAgICAgY29uc3QgbWV0cmljID0gbmV3IE1ldHJpYyh7XG4gICAgICAgICAgICAgICAgbmFtZXNwYWNlOiBjb25zdGFudC5mYWlsX21ldHJpY19uYW1lc3BhY2UsXG4gICAgICAgICAgICAgICAgbWV0cmljTmFtZTogY29uc3RhbnQuZmFpbF9tZXRyaWNuYW1lLFxuICAgICAgICAgICAgICAgIHBlcmlvZDpEdXJhdGlvbi5taW51dGVzKDEpLFxuICAgICAgICAgICAgICAgIGRpbWVuc2lvbnNNYXA6IHtcIkZ1bmN0aW9uTmFtZVwiOmZ1bmN0aW9uX25hbWV9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IGFsYXJtID0gbmV3IEFsYXJtKHRoaXMsICdmYWlsdXJlX2FsYXJtJywge1xuICAgICAgICAgICAgICAgIG1ldHJpYzogbWV0cmljLFxuICAgICAgICAgICAgICAgIHRocmVzaG9sZDogY29uc3RhbnQuZmFpbF9tZXRyaWNfdHJlc2hvbGQsXG4gICAgICAgICAgICAgICAgY29tcGFyaXNvbk9wZXJhdG9yOlxuICAgICAgICAgICAgICAgIGNsb3Vkd2F0Y2guQ29tcGFyaXNvbk9wZXJhdG9yLkdSRUFURVJfVEhBTl9PUl9FUVVBTF9UT19USFJFU0hPTEQsXG4gICAgICAgICAgICAgICAgZXZhbHVhdGlvblBlcmlvZHM6IDEsXG4gICAgICAgICAgICAgICAgZGF0YXBvaW50c1RvQWxhcm06MVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGFsYXJtXG59XG5cbn1cbiJdfQ==