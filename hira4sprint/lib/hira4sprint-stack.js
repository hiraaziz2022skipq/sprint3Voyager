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
        var lambda_func = this.lambdas(roles, "WebHealthLambda", "./resources", "webHealthLambda.webhandler", s3_bucket, "bucket_name");
        var function_name = lambda_func.functionName;
        lambda_func.addEnviornment('bucket_name', s3_bucket);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGlyYTRzcHJpbnQtc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJoaXJhNHNwcmludC1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSw2Q0FBd0U7QUFDeEUsaURBQWlEO0FBRWpELGlEQUFpRDtBQUNqRCwwREFBMEQ7QUFDMUQsaURBQTRFO0FBQzVFLHlEQUF5RDtBQUN6RCxNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsNEJBQTRCLENBQUMsQ0FBQztBQUN2RCwrREFBdUQ7QUFDdkQscUVBQXNFO0FBQ3RFLCtDQUFpRTtBQUNqRSwyQ0FBMkM7QUFDM0MsNkVBQXVGO0FBQ3ZGLGlFQUFpRTtBQUNqRSxxREFBcUQ7QUFDckQsK0RBQXdGO0FBRXhGLE1BQWEsZ0JBQWlCLFNBQVEsbUJBQUs7SUFDekMsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUFrQjs7UUFDMUQsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsT0FBTztRQUNQLElBQUksS0FBSyxHQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUU3QiwyQ0FBMkM7UUFDM0MsTUFBTSxNQUFNLEdBQUcsSUFBSSxlQUFNLENBQUMsSUFBSSxFQUFDLEVBQUUsR0FBQyxRQUFRLENBQUMsU0FBUyxFQUFDLEVBQUMsYUFBYSxFQUFFLDRCQUFtQixDQUFDLFdBQVcsR0FBRSxDQUFDLENBQUM7UUFDeEcsSUFBSSxTQUFTLEdBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQTtRQUMvQixNQUFBLE1BQU0sQ0FBQyxNQUFNLDBDQUFFLGtCQUFrQixDQUFDLDJCQUFhLENBQUMsT0FBTyxFQUFFO1FBRXpELDZCQUE2QjtRQUM3QixJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBR3pCLDREQUE0RDtRQUM1RCxJQUFJLFdBQVcsR0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBQyxpQkFBaUIsRUFBQyxhQUFh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LElBQUksc0NBQXFCLENBQUMsSUFBSSxFQUFFLGlCQUFpQixFQUFFO1lBQ2pELEtBQUs7WUFDTCxnQkFBZ0IsRUFBRSx1Q0FBc0IsQ0FBQyw4QkFBOEI7WUFDdkUsTUFBTSxFQUFDLENBQUMsY0FBYyxDQUFDO1NBQ3hCLENBQUMsQ0FBQztJQUVMLENBQUM7Q0FFQTtBQXhTRCw0Q0F3U0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBEdXJhdGlvbiwgUmVtb3ZhbFBvbGljeSwgU3RhY2ssIFN0YWNrUHJvcHN9IGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCAqIGFzIGxhbWJkYSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbGFtYmRhJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuaW1wb3J0ICogYXMgZXZlbnRzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1ldmVudHMnO1xuaW1wb3J0ICogYXMgdGFyZ2V0cyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZXZlbnRzLXRhcmdldHMnO1xuaW1wb3J0IHsgTWFuYWdlZFBvbGljeSwgUm9sZSwgU2VydmljZVByaW5jaXBhbCB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1pYW0nO1xuaW1wb3J0ICogYXMgY2xvdWR3YXRjaCBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY2xvdWR3YXRjaCc7XG5jb25zdCBjb25zdGFudCA9IHJlcXVpcmUoXCIuLi9yZXNvdXJjZXMvY29uc3RhbnQuanNvblwiKTtcbmltcG9ydCB7QWxhcm0sTWV0cmljfSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY2xvdWR3YXRjaCdcbmltcG9ydCB7QnVja2V0RGVwbG95bWVudCwgU291cmNlfSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtczMtZGVwbG95bWVudCdcbmltcG9ydCB7IEJ1Y2tldCwgQnVja2V0QWNjZXNzQ29udHJvbCB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1zMyc7XG5pbXBvcnQgKiBhcyBzbnMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXNucyc7XG5pbXBvcnQge0VtYWlsU3Vic2NyaXB0aW9uLCBMYW1iZGFTdWJzY3JpcHRpb259IGZyb20gJ2F3cy1jZGstbGliL2F3cy1zbnMtc3Vic2NyaXB0aW9ucydcbmltcG9ydCAqIGFzIGN3X2FjdGlvbnMgZnJvbSAnYXdzLWNkay1saWIvYXdzLWNsb3Vkd2F0Y2gtYWN0aW9ucyc7XG5pbXBvcnQgKiBhcyBkeW5hbW9kYiBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZHluYW1vZGInO1xuaW1wb3J0IHtMYW1iZGFEZXBsb3ltZW50Q29uZmlnLCBMYW1iZGFEZXBsb3ltZW50R3JvdXB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1jb2RlZGVwbG95J1xuXG5leHBvcnQgY2xhc3MgSGlyYTRTcHJpbnRTdGFjayBleHRlbmRzIFN0YWNrIHtcbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBTdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cbiAgICAvL1JvbGVzXG4gICAgdmFyIHJvbGVzPXRoaXMuY3JlYXRlX3JvbGUoKTtcblxuICAgIC8qLS0tLS0tLS0tLUNyZWF0aW5nIFMzIGJ1Y2tldC0tLS0tLS0tLS0tKi9cbiAgICBjb25zdCBidWNrZXQgPSBuZXcgQnVja2V0KHRoaXMsaWQ9Y29uc3RhbnQuYnVja2V0X2lkLHthY2Nlc3NDb250cm9sOiBCdWNrZXRBY2Nlc3NDb250cm9sLlBVQkxJQ19SRUFELH0pO1xuICAgIHZhciBzM19idWNrZXQ9YnVja2V0LmJ1Y2tldE5hbWVcbiAgICBidWNrZXQucG9saWN5Py5hcHBseVJlbW92YWxQb2xpY3koUmVtb3ZhbFBvbGljeS5ERVNUUk9ZKTtcblxuICAgIC8vVXBsb2FkaW5nIGZpbGUgdG8gUzMgYnVja2V0XG4gICAgdGhpcy5VcGxvYWRfZmlsZShidWNrZXQpO1xuXG5cbiAgICAvKi0tLS0tLS0tLS0tQ2FsbGluZyB3ZWIgaGVhbHRoIGxhbWJkYSBmdW5jdGlvbi0tLS0tLS0tLS0tKi9cbiAgICB2YXIgbGFtYmRhX2Z1bmM9dGhpcy5sYW1iZGFzKHJvbGVzLFwiV2ViSGVhbHRoTGFtYmRhXCIsXCIuL3Jlc291cmNlc1wiLFwid2ViSGVhbHRoTGFtYmRhLndlYmhhbmRsZXJcIixzM19idWNrZXQsXCJidWNrZXRfbmFtZVwiKVxuICAgIHZhciBmdW5jdGlvbl9uYW1lPWxhbWJkYV9mdW5jLmZ1bmN0aW9uTmFtZVxuICAgIGxhbWJkYV9mdW5jLmFkZEVudmlvcm5tZW50KCdidWNrZXRfbmFtZScsczNfYnVja2V0KVxuXG4gICAgLy8gUnVuIExhbWJkYSBwZXJpb2RpY2FsbHlcbiAgICBjb25zdCBydWxlID0gbmV3IGV2ZW50cy5SdWxlKHRoaXMsICdSdWxlJywge1xuICAgICAgICAgICAgICAgICAgc2NoZWR1bGU6IGV2ZW50cy5TY2hlZHVsZS5yYXRlKER1cmF0aW9uLm1pbnV0ZXMoMSkpLFxuICAgICAgICAgICAgICAgICAgdGFyZ2V0czogW25ldyB0YXJnZXRzLkxhbWJkYUZ1bmN0aW9uKGxhbWJkYV9mdW5jKV0sXG4gICAgfSk7XG5cblxuICAgIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tQ3JlYXRpbmcgYW4gU05TIFRPUElDLS0tLS0tLS0tLS0tLS0tLSovXG5cbiAgICBjb25zdCB0b3BpYyA9IG5ldyBzbnMuVG9waWModGhpcywgJ015VG9waWMnKTtcbiAgICB0b3BpYy5hZGRTdWJzY3JpcHRpb24obmV3IEVtYWlsU3Vic2NyaXB0aW9uKGNvbnN0YW50LmVtYWlsKSk7XG4gICBcblxuICAgIGZvciAobGV0IHVybHMgb2YgY29uc3RhbnQudXJsKXtcbiAgICAgICAgICAgICAgbGV0IGRpbWVuc2lvbj17J1VSTCc6dXJsc31cblxuICAgICAgICAgICAgLyogXG4gICAgICAgICAgICBjcmVhdGVfYWxhcm0oKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBkaW1lbnNpb25zIC0+IGtleSB2YWx1ZSBwYWlyICwga2V5ID0gXCJVUkxcIiBhbmQgdmFsdWUgPSB1cmxcbiAgICAgICAgICAgIHVybHMgPSB1cmwgb2Ygd2Vic2l0ZSBcblxuICAgICAgICAgICAgKi9cblxuICAgICAgICAgICAgICBjb25zdCBhbGFybV9hdmFpbD0gdGhpcy5jcmVhdGVfYWxhcm1fYXZhaWwoZGltZW5zaW9uLHVybHMpOyAvLyBDYWxsaW5nIGFuIGFsYXJuIGZvciBsYXRlbmN5XG4gICAgICAgICAgICAgIGNvbnN0IGFsYXJtX2xhdGVuY3k9IHRoaXMuY3JlYXRlX2FsYXJtX2xhdGVuY3koZGltZW5zaW9uLHVybHMpICAvLyBDYWxsaW4gYW4gYWxhcm0gZm9yIGF2YWlsYWJpbGl0eVxuXG4gICAgICAgICAgICAgIGFsYXJtX2F2YWlsLmFkZEFsYXJtQWN0aW9uKG5ldyBjd19hY3Rpb25zLlNuc0FjdGlvbih0b3BpYykpOyAgLy8gQmluZGluZyBhdmFpbCBhbGFybSB0byBzbnNcbiAgICAgICAgICAgICAgYWxhcm1fbGF0ZW5jeS5hZGRBbGFybUFjdGlvbihuZXcgY3dfYWN0aW9ucy5TbnNBY3Rpb24odG9waWMpKTsgIC8vIEJpbmRpbmcgbGF0ZW5jeSBhbGFybSB0byBzbnNcbiAgICB9XG5cblxuICAgIC8qLS0tLS0tLS0tLS0tQ3JlYXRpbmcgVGFibGUtLS0tLS0tLS0tLS0tKi9cblxuICAgIGNvbnN0IG15X3RhYmxlPXRoaXMuY3JlYXRlX3RhYmxlKCk7XG4gICAgdmFyIHRhYmxlX25hbWU9bXlfdGFibGUudGFibGVOYW1lXG4gICAgXG4gICAgLy9DYWxpbmcgRFlOQU1PIERCIGxhbWJkYSBmdW5jdGlvblxuICAgIHZhciBkeW5hbW9fbGFtYmRhPXRoaXMubGFtYmRhcyhyb2xlcyxcIkR5bmFtb0xhbWJkYVwiLFwiLi9yZXNvdXJjZXNcIixcImR5bmFtb2RiLmR5bmFtb2hhbmRsZXJcIix0YWJsZV9uYW1lLFwidGFibGVfbmFtZVwiKVxuICAgIGR5bmFtb19sYW1iZGEuYWRkRW52aW9ybm1lbnQoJ3RhYmxlX25hbWUnLHRhYmxlX25hbWUpXG4gICAgbXlfdGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKGR5bmFtb19sYW1iZGEpXG4gICAgXG4gICAgLy8gaW52b2tlIGxhbWJkYSBhZnRlciBldmVyeSBhbGFybVxuICAgIHRvcGljLmFkZFN1YnNjcmlwdGlvbihuZXcgTGFtYmRhU3Vic2NyaXB0aW9uKGR5bmFtb19sYW1iZGEpKVxuXG5cblxuICAgIC8vIENyZWF0aW5nIEZhaWx1cmVzIEFsYXJtXG4gICAgY29uc3QgbGFtYmRhX2Z1bmMxPWxhbWJkYV9mdW5jLmN1cnJlbnRWZXJzaW9uXG4gICAgXG4gICAgLypcbiAgICBmYWlsdXJlX21ldHJpYygpXG4gICAgZnVuY3Rpb25fbmFtZSA9IG5hbWUgb2YgY3VycmVudCB2ZXJzaW9uIG9mIGxhbWJkYVxuICAgIFxuICAgIHJldHVybnMgbWV0cmljXG4gICAgKi9cbiAgICBjb25zdCBmYWlsdXJlX21ldHJpYz10aGlzLmZhaWx1cmVfbWV0cmljcyhmdW5jdGlvbl9uYW1lKTtcblxuICAgIC8vIEF1dG8gUm9sbCBiYWNrXG4gICAgdGhpcy5yb2xsX2JhY2soZmFpbHVyZV9tZXRyaWMsbGFtYmRhX2Z1bmMxKSBcbiAgfVxuXG5cblxuLyotLS0tLS0tIEZ1bmN0aW9ucy0tLS0tLSovXG5cblxuLy8gQnVja2V0IGRlcGxveW1lbnQgZnVuYyB3aWxsIHVwbG9hZCBhbGwgZmlsZXMgb2YgcmVzb3VyY2UgZm9sZGVyIHRvIHMzIGJ1Y2tldFxuVXBsb2FkX2ZpbGUoYnVja2V0OiBCdWNrZXQpIHtcbiAgY29uc3QgZGVwbG95bWVudCA9IG5ldyBCdWNrZXREZXBsb3ltZW50KHRoaXMsICdEZXBsb3lXZWJzaXRlJywge1xuICAgIHNvdXJjZXM6IFtTb3VyY2UuYXNzZXQoJy4vcmVzb3VyY2VzJyldLFxuICAgIGRlc3RpbmF0aW9uQnVja2V0OiBidWNrZXR9KVxuICB9XG5cblxuLy8gQ2FsbGluZyBMYW1iZGEgRnVuY3Rpb25cbmxhbWJkYXMocm9sZXM6YW55LGlkOnN0cmluZyxhc3NldDpzdHJpbmcsaGFuZGxlcjpzdHJpbmcsZW52aW9yX3ZhcjpzdHJpbmcsZW52X25hbWU6c3RyaW5nKTphbnl7XG5cbiAgLyogY3JlYXRlX2xhbWJkYSgpXG4gICAgICAgIFxuICBpZCAtPiBzdHJpbmcgdmFsdWVcbiAgYXNzZXQgLT4gRm9sZGVyIHRoYXQgY29udGFpbnMgY29kZVxuICBydW50aW1lIC0+IExhbmd1YWdlXG4gIGhhbmRsZXIgLT4gTGFtYmRhIGZ1bmN0aW9uXG4gIHRpbWVvdXQgLT4gQWZ0ZXIgaG93IGxvbmcgbGFtYmRhIHdpbGwgZW5kXG4gIFxuICBSZXR1cm4gOiBMYW1iZGEgRnVuY3Rpb24gKi9cblxuICBjb25zdCBoZWxsbyA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgaWQsIHtcbiAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMTRfWCwgICAgLy8gZXhlY3V0aW9uIGVudmlyb25tZW50XG4gICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KGFzc2V0KSwgIC8vIGNvZGUgbG9hZGVkIGZyb20gXCJyZXNvdXJjZVwiIGRpcmVjdG9yeVxuICAgIGhhbmRsZXI6IGhhbmRsZXIsXG4gICAgdGltZW91dDogRHVyYXRpb24uc2Vjb25kcygxODApICAsXG4gICAgcm9sZTpyb2xlcyxcbiAgICAvLyBlbnZpcm9ubWVudDp7XCJidWNrZXRfdmFsdWVcIjplbnZpb3JfdmFyfSAgICAgICAgICAgICAvLyBmaWxlIGlzIFwid2ViaGFuZGxlclwiLCBmdW5jdGlvbiBpcyBcImhhbmRsZXJcIlxuICB9KTtcbiAgcmV0dXJuIGhlbGxvXG59XG5cblxuLy8gY3JlYXRlIFJvbGVzXG5jcmVhdGVfcm9sZSgpOmFueXtcblxuY29uc3Qgcm9sZSA9IG5ldyBSb2xlKHRoaXMsICdleGFtcGxlLWlhbS1yb2xlJywge1xuICBhc3N1bWVkQnk6IG5ldyBTZXJ2aWNlUHJpbmNpcGFsKCdsYW1iZGEuYW1hem9uYXdzLmNvbScpLFxuICBkZXNjcmlwdGlvbjogJ0FuIGV4YW1wbGUgSUFNIHJvbGUgaW4gQVdTIENESycsXG4gIG1hbmFnZWRQb2xpY2llczogW1xuICAgIE1hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKCdDbG91ZFdhdGNoRnVsbEFjY2VzcycpLFxuICAgIE1hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKCdBbWF6b25EeW5hbW9EQkZ1bGxBY2Nlc3MnKSxcbiAgICBNYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZSgnc2VydmljZS1yb2xlL0FXU0xhbWJkYUJhc2ljRXhlY3V0aW9uUm9sZScpLFxuICAgIE1hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKCdBV1NMYW1iZGFJbnZvY2F0aW9uLUR5bmFtb0RCJyksXG4gIF0sXG59KTtcbnJldHVybiByb2xlXG59XG5cblxuLy8gR2VuZXJhdGUgYXZhaWxhYmlsaXR5IGFsYXJtXG5jcmVhdGVfYWxhcm1fYXZhaWwoZGltZW5zaW9uOmFueSx1cmxzOnN0cmluZykge1xuXG4gIC8qXG4gICAgICAgICAgICBjbG91ZHdhdGNoLk1ldHJpYygpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIG1ldHJpY19uYW1lIC0+ICBOYW1lIG9mIHRoZSBtZXRyaWNcbiAgICAgICAgICAgIG5hbWVzcGFjZSAtPiAgICBOYW1lc3BhY2Ugb2YgdGhlIG1ldHJpYyBkYXRhXG4gICAgICAgICAgICBwZXJpb2QgLT4gICBBZnRlciBob3cgbWFueSBtaW51dGVzIHRoaXMgd2lsbCBjaGVjayBkYXRhcG9pbnRzIGluIHB1Ymxpc2hlZCBtZXRyaWNzXG4gICAgICAgICAgICBkaW1lbnNpb25zIC0+ICAgSXQgdGFrZXMga2V5IGFuZCB2YWx1ZS4gV2hhdCB3ZSBhcmUgbW9uaXRvcmluZ1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBSZXR1cm4gOiBGZXRjaCBtZXRyaWMgb24gYXdzIGNsb3Vkd2F0Y2hcbiAgICAgICAgICAgIFxuICAqL1xuXG5cbiAgY29uc3QgbWV0cmljID0gbmV3IE1ldHJpYyh7XG4gICAgbmFtZXNwYWNlOiBjb25zdGFudC51cmxfbmFtZXNwYWNlLFxuICAgIG1ldHJpY05hbWU6IGNvbnN0YW50Lk1ldHJpY25hbWVfYXZhaWwsXG4gICAgcGVyaW9kOkR1cmF0aW9uLm1pbnV0ZXMoMSksXG4gICAgZGltZW5zaW9uc01hcDogZGltZW5zaW9uXG4gIH0pO1xuXG4gIC8qXG4gICAgICAgICAgICBjbG91ZHdhdGNoLkFsYXJtKClcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWQgLT4gc3RyaW5nIHZhbHVlXG4gICAgICAgICAgICBtZXRyaWMgLT4gRnVuY3Rpb24gdG8gZmV0Y2ggcHVibGlzaGVkIG1ldHJpY3NcbiAgICAgICAgICAgIGV2YWx1YXRpb25fcGVyaW9kcyAtPiBBZnRlciBob3cgbWFueSBldmFsdWF0aW9uIGRhdGEgd2lsbCBiZSBjb21wYXJlZCB0byB0aHJlc2hvbGRcbiAgICAgICAgICAgIGNvbXBhcmlzb25fb3BlcmF0b3IgLT4gdXNlZCB0byBjb21wYXJlXG4gICAgICAgICAgICBkYXRhcG9pbnRzX3RvX2FsYXJtIC0+IEFmdGVyIGhvdyBtYW55IGRhdGEgcG9pbnRzIGJyZWFjaGluZywgYWxhcm0gc2hvdWxkIGJlIHRyaWdnZXJlZC4gXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIFJldHVybiA6IEdlbmVyYXRlZCBhbGFybXMgaWYgZGF0YXBvaW50cyBleGNlZWRzIHRocmVzaG9sZFxuICAgICAgICAgICAgXG4gICovXG4gIGNvbnN0IGFsYXJtPW5ldyBBbGFybSh0aGlzLCAnYXZhaWxhYmlsaXR5X2FsYXJtJyt1cmxzLCB7XG4gICAgbWV0cmljOiBtZXRyaWMsXG5cbiAgICB0aHJlc2hvbGQ6IDEsXG4gICAgY29tcGFyaXNvbk9wZXJhdG9yOlxuICAgICAgY2xvdWR3YXRjaC5Db21wYXJpc29uT3BlcmF0b3IuR1JFQVRFUl9USEFOX1RIUkVTSE9MRCxcbiAgICBldmFsdWF0aW9uUGVyaW9kczogMSxcbiAgICBhbGFybURlc2NyaXB0aW9uOlxuICAgICAgJ0FsYXJtIGlmIHRoZSBTVU0gb2YgRXJyb3JzIGlzIGdyZWF0ZXIgdGhhbiBvciBlcXVhbCB0byB0aGUgdGhyZXNob2xkICgxKSBmb3IgMSBldmFsdWF0aW9uIHBlcmlvZCcsXG4gIH0pO1xuICByZXR1cm4gYWxhcm1cbn1cblxuXG4vLyBHZW5lcmF0ZSBsYXRlbmN5IGFsYXJtXG5jcmVhdGVfYWxhcm1fbGF0ZW5jeShkaW1lbnNpb246YW55LHVybHM6c3RyaW5nKSB7XG5cbiAgY29uc3QgbWV0cmljID0gbmV3IE1ldHJpYyh7XG4gICAgbmFtZXNwYWNlOiBjb25zdGFudC51cmxfbmFtZXNwYWNlLFxuICAgIG1ldHJpY05hbWU6IGNvbnN0YW50Lk1ldHJpY25hbWVfbGF0ZW5jeSxcbiAgICBwZXJpb2Q6RHVyYXRpb24ubWludXRlcygxKSxcbiAgICBkaW1lbnNpb25zTWFwOiBkaW1lbnNpb25cbiAgfSk7XG5cbiAgY29uc3QgYWxhcm0gPSBuZXcgQWxhcm0odGhpcywgJ0xhdGVuY3lfYWxhcm0nK3VybHMsIHtcbiAgICBtZXRyaWM6IG1ldHJpYyxcbiAgICB0aHJlc2hvbGQ6IDAuNCxcbiAgICBjb21wYXJpc29uT3BlcmF0b3I6XG4gICAgICBjbG91ZHdhdGNoLkNvbXBhcmlzb25PcGVyYXRvci5HUkVBVEVSX1RIQU5fT1JfRVFVQUxfVE9fVEhSRVNIT0xELFxuICAgIGV2YWx1YXRpb25QZXJpb2RzOiAxLFxuICAgIGFsYXJtRGVzY3JpcHRpb246XG4gICAgICAnQWxhcm0gaWYgdGhlIFNVTSBvZiBFcnJvcnMgaXMgZ3JlYXRlciB0aGFuIG9yIGVxdWFsIHRvIHRoZSB0aHJlc2hvbGQgKDEpIGZvciAxIGV2YWx1YXRpb24gcGVyaW9kJyxcbiAgfSk7XG4gIHJldHVybiBhbGFybVxufVxuXG5cbi8vIENyZWF0ZSB0YWJsZSBkeW5hbW9kYiBmdW5jdGlvblxuY3JlYXRlX3RhYmxlKCkge1xuXG4gICAgLypcbiAgICBUYWJsZSgpXG4gICAgdGFibGVfaWQgLT4gaWQgb2YgdGFibGVcbiAgICBwYXJ0aXRpb25fa2V5IC0+IHVuaXF1ZSBrZXkgXG4gICAgc29ydF9rZXkgLT4ga2V5IHVzZWQgZm9yIHNvcnRpbmdcbiAgICBcbiAgICBSZXR1cm4gOiBEeW5hbW8gZGIgdGFibGVcbiAgICAqL1xuXG4gIGNvbnN0IGdsb2JhbFRhYmxlID0gbmV3IGR5bmFtb2RiLlRhYmxlKHRoaXMsIGNvbnN0YW50LnRhYmxlX2lkLCB7XG4gICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6IGNvbnN0YW50LnBhcnRpdGlvbl9rZXksIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXG4gICAgcmVwbGljYXRpb25SZWdpb25zOiBbJ3VzLWVhc3QtMSddLCB9KTtcbiAgICByZXR1cm4gZ2xvYmFsVGFibGVcbn1cblxuXG4vLyBHZW5lcmF0ZSBGYWlsdXJlIGFsYXJtc1xuZmFpbHVyZV9tZXRyaWNzKGZ1bmN0aW9uX25hbWU6YW55KXtcblxuICAgICAgLypcbiAgICAgICAgICAgIGNsb3Vkd2F0Y2guTWV0cmljKClcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgbmFtZXNwYWNlIC0+IEFXUy9MYW1iZGFcbiAgICAgICAgICAgIG1ldHJpY19uYW1lIC0+IER1cmF0aW9uXG4gICAgICAgICAgICBkaW1lbnRpb25zX21hcCAtPiBGdW5jdGlvbk5hbWUgYW5kIGxhbWJkYSBmdW5jdGlvbiBuYW1lXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIFJldHVybiA6IEZldGNoIGF3cyBMYW1iZGEgZHVyYXRpb24gdmFsdWVcbiAgICAgICovXG5cblxuICAgICAgICBjb25zdCBtZXRyaWMgPSBuZXcgTWV0cmljKHtcbiAgICAgICAgICAgICAgICBuYW1lc3BhY2U6IGNvbnN0YW50LmZhaWxfbWV0cmljX25hbWVzcGFjZSxcbiAgICAgICAgICAgICAgICBtZXRyaWNOYW1lOiBjb25zdGFudC5mYWlsX21ldHJpY25hbWUsXG4gICAgICAgICAgICAgICAgZGltZW5zaW9uc01hcDoge1wiRnVuY3Rpb25OYW1lXCI6ZnVuY3Rpb25fbmFtZX1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgYWxhcm0gPSBuZXcgQWxhcm0odGhpcywgJ2ZhaWx1cmVfYWxhcm0nLCB7XG4gICAgICAgICAgICAgICAgbWV0cmljOiBtZXRyaWMsXG4gICAgICAgICAgICAgICAgdGhyZXNob2xkOiBjb25zdGFudC5mYWlsX21ldHJpY190aHJlc2hvbGQsXG4gICAgICAgICAgICAgICAgY29tcGFyaXNvbk9wZXJhdG9yOlxuICAgICAgICAgICAgICAgIGNsb3Vkd2F0Y2guQ29tcGFyaXNvbk9wZXJhdG9yLkdSRUFURVJfVEhBTl9PUl9FUVVBTF9UT19USFJFU0hPTEQsXG4gICAgICAgICAgICAgICAgZXZhbHVhdGlvblBlcmlvZHM6IDEsXG4gICAgICAgICAgICAgICAgZGF0YXBvaW50c1RvQWxhcm06MVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGFsYXJtXG59XG5cbnJvbGxfYmFjayhmYWlsdXJlX21ldHJpYzphbnksbGFtYmRhX2Z1bmMxOmFueSl7XG5cbiAgLypcbiAgICAgICAgSWQgKHN0cikgOiBJZFxuICAgICAgICBBbGlhc19uYW1lKHN0cikgOiBOYW1lIG9mIGFsaWFzXG4gICAgICAgIFZlcnNpb246IEN1cnJlbnQgdmVyc2lvbiBvZiBsYW1iZGEgZnVuY3Rpb25cbiAgICAgICAgICAgIFxuICAgICAgICBSZXR1cm4gOiBDdXJyZW5jdCB2ZXJzaW9uIG9mIGxhbWJkYSBmdW5jdGlvblxuICAqL1xuXG4gIGNvbnN0IGFsaWFzID0gbmV3IGxhbWJkYS5BbGlhcyh0aGlzLCAnTGFtYmRhQWxpYXMnLCB7XG4gICAgYWxpYXNOYW1lOiAnQ3VycmVudF9WZXJzaW9uJyxcbiAgICB2ZXJzaW9uIDpsYW1iZGFfZnVuYzEsXG4gIH0pO1xuICBcblxuICAvKlxuICAgICAgICAgICAgTGFtYmRhRGVwbG95bWVudEdyb3VwKClcbiAgICAgICAgXG4gICAgICAgICAgICBJZChzdHIpIDogSWRcbiAgICAgICAgICAgIGFsaWFzKEZ1bmMpIDogQWxpYXNcbiAgICAgICAgICAgIGRlcGxveW1lbnRfY29uZmlnOiBIb3cgbWFueSB0cmFmZmljIHNob3VsZCBiZSBzZW5kIHRvIG5ldyBsYW1iZGEgZnVuY3Rpb24gaW4gc3BlY2lmaWMgdGltZS5cbiAgICAgICAgICAgIEFsYXJtcyhmdW5jKTogdHJpZ2dlcmVkIGFsYXJtXG4gICAgICAgICAgIFxuICAqL1xuICAgICAgICBcbiAgICAgICAgICAgIFxuICAgICAgICAvLyBEZXBsb3kgcHJldmlvdXMgdmVyc2lvbiBvZiBsYW1iZGEgaWYgYWxhcm1zIGdldHMgdHJpZ2dlcmVkXG4gIG5ldyBMYW1iZGFEZXBsb3ltZW50R3JvdXAodGhpcywgJ0RlcGxveW1lbnRHcm91cCcsIHtcbiAgICBhbGlhcyxcbiAgICBkZXBsb3ltZW50Q29uZmlnOiBMYW1iZGFEZXBsb3ltZW50Q29uZmlnLkxJTkVBUl8xMFBFUkNFTlRfRVZFUllfMU1JTlVURSxcbiAgICBhbGFybXM6W2ZhaWx1cmVfbWV0cmljXVxuICB9KTtcblxufVxuXG59XG4iXX0=