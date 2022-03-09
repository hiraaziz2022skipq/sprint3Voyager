"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Hira4SprintStack = void 0;
const aws_cdk_lib_1 = require("aws-cdk-lib");
const lambda = require("aws-cdk-lib/aws-lambda");
const events = require("aws-cdk-lib/aws-events");
const targets = require("aws-cdk-lib/aws-events-targets");
const aws_iam_1 = require("aws-cdk-lib/aws-iam");
const constant = require("../resources/constant.json");
const aws_s3_deployment_1 = require("aws-cdk-lib/aws-s3-deployment");
const aws_s3_1 = require("aws-cdk-lib/aws-s3");
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
        // Run Lambda periodically
        const rule = new events.Rule(this, 'Rule', {
            schedule: events.Schedule.rate(aws_cdk_lib_1.Duration.minutes(1)),
            targets: [new targets.LambdaFunction(lambda_func)],
        });
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
}
exports.Hira4SprintStack = Hira4SprintStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGlyYTRzcHJpbnQtc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJoaXJhNHNwcmludC1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSw2Q0FBd0U7QUFDeEUsaURBQWlEO0FBRWpELGlEQUFpRDtBQUNqRCwwREFBMEQ7QUFDMUQsaURBQTRFO0FBQzVFLE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDO0FBRXZELHFFQUFzRTtBQUN0RSwrQ0FBaUU7QUFNakUsTUFBYSxnQkFBaUIsU0FBUSxtQkFBSztJQUN6QyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQWtCOztRQUMxRCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4QixPQUFPO1FBQ1AsSUFBSSxLQUFLLEdBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBRTdCLHFCQUFxQjtRQUNyQixNQUFNLE1BQU0sR0FBRyxJQUFJLGVBQU0sQ0FBQyxJQUFJLEVBQUMsRUFBRSxHQUFDLFFBQVEsQ0FBQyxTQUFTLEVBQUMsRUFBQyxhQUFhLEVBQUUsNEJBQW1CLENBQUMsV0FBVyxHQUFFLENBQUMsQ0FBQztRQUN4RyxJQUFJLFNBQVMsR0FBQyxNQUFNLENBQUMsVUFBVSxDQUFBO1FBQy9CLE1BQUEsTUFBTSxDQUFDLE1BQU0sMENBQUUsa0JBQWtCLENBQUMsMkJBQWEsQ0FBQyxPQUFPLEVBQUU7UUFFekQsOEJBQThCO1FBQzlCLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUM7UUFFekIsb0NBQW9DO1FBQ3BDLElBQUksV0FBVyxHQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFDLGlCQUFpQixFQUFDLGFBQWEsRUFBQyw0QkFBNEIsRUFBQyxTQUFTLENBQUMsQ0FBQTtRQUUxRywwQkFBMEI7UUFDMUIsTUFBTSxJQUFJLEdBQUcsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxNQUFNLEVBQUU7WUFDbkMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLHNCQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ25ELE9BQU8sRUFBRSxDQUFDLElBQUksT0FBTyxDQUFDLGNBQWMsQ0FBQyxXQUFXLENBQUMsQ0FBQztTQUN6RCxDQUFDLENBQUM7SUFFTCxDQUFDO0lBRUgsWUFBWTtJQUdaLCtFQUErRTtJQUMvRSxXQUFXLENBQUMsTUFBYztRQUN4QixNQUFNLFVBQVUsR0FBRyxJQUFJLG9DQUFnQixDQUFDLElBQUksRUFBRSxlQUFlLEVBQUU7WUFDN0QsT0FBTyxFQUFFLENBQUMsMEJBQU0sQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUM7WUFDdEMsaUJBQWlCLEVBQUUsTUFBTTtTQUFDLENBQUMsQ0FBQTtJQUM3QixDQUFDO0lBSUgsT0FBTyxDQUFDLEtBQVMsRUFBQyxFQUFTLEVBQUMsS0FBWSxFQUFDLE9BQWMsRUFBQyxVQUFpQjtRQUV2RTs7Ozs7Ozs7bUNBUTJCO1FBRTNCLE1BQU0sS0FBSyxHQUFHLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFO1lBQzFDLE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLFdBQVc7WUFDbkMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQztZQUNsQyxPQUFPLEVBQUUsT0FBTztZQUNoQixPQUFPLEVBQUUsc0JBQVEsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDO1lBQzlCLElBQUksRUFBQyxLQUFLO1lBQ1YsV0FBVyxFQUFDLEVBQUMsWUFBWSxFQUFDLFVBQVUsRUFBQyxDQUFhLDhDQUE4QztTQUNqRyxDQUFDLENBQUM7UUFDSCxPQUFPLEtBQUssQ0FBQTtJQUNkLENBQUM7SUFJRCxXQUFXO1FBRVgsTUFBTSxJQUFJLEdBQUcsSUFBSSxjQUFJLENBQUMsSUFBSSxFQUFFLGtCQUFrQixFQUFFO1lBQzlDLFNBQVMsRUFBRSxJQUFJLDBCQUFnQixDQUFDLHNCQUFzQixDQUFDO1lBQ3ZELFdBQVcsRUFBRSxnQ0FBZ0M7WUFDN0MsZUFBZSxFQUFFO2dCQUNmLHVCQUFhLENBQUMsd0JBQXdCLENBQUMsc0JBQXNCLENBQUM7Z0JBQzlELHVCQUFhLENBQUMsd0JBQXdCLENBQUMsMEJBQTBCLENBQUM7Z0JBQ2xFLHVCQUFhLENBQUMsd0JBQXdCLENBQUMsMENBQTBDLENBQUM7Z0JBQ2xGLHVCQUFhLENBQUMsd0JBQXdCLENBQUMsOEJBQThCLENBQUM7YUFDdkU7U0FDRixDQUFDLENBQUM7UUFDSCxPQUFPLElBQUksQ0FBQTtJQUNYLENBQUM7Q0FFQTtBQTlFRCw0Q0E4RUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBEdXJhdGlvbiwgUmVtb3ZhbFBvbGljeSwgU3RhY2ssIFN0YWNrUHJvcHN9IGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCAqIGFzIGxhbWJkYSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbGFtYmRhJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuaW1wb3J0ICogYXMgZXZlbnRzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1ldmVudHMnO1xuaW1wb3J0ICogYXMgdGFyZ2V0cyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZXZlbnRzLXRhcmdldHMnO1xuaW1wb3J0IHsgTWFuYWdlZFBvbGljeSwgUm9sZSwgU2VydmljZVByaW5jaXBhbCB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1pYW0nO1xuY29uc3QgY29uc3RhbnQgPSByZXF1aXJlKFwiLi4vcmVzb3VyY2VzL2NvbnN0YW50Lmpzb25cIik7XG5pbXBvcnQge0FsYXJtLE1ldHJpY30gZnJvbSAnYXdzLWNkay1saWIvYXdzLWNsb3Vkd2F0Y2gnXG5pbXBvcnQge0J1Y2tldERlcGxveW1lbnQsIFNvdXJjZX0gZnJvbSAnYXdzLWNkay1saWIvYXdzLXMzLWRlcGxveW1lbnQnXG5pbXBvcnQgeyBCdWNrZXQsIEJ1Y2tldEFjY2Vzc0NvbnRyb2wgfSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtczMnO1xuaW1wb3J0ICogYXMgc25zIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zbnMnO1xuaW1wb3J0IHtFbWFpbFN1YnNjcmlwdGlvbiwgTGFtYmRhU3Vic2NyaXB0aW9ufSBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtc25zLXN1YnNjcmlwdGlvbnMnXG5pbXBvcnQgKiBhcyBjd19hY3Rpb25zIGZyb20gJ2F3cy1jZGstbGliL2F3cy1jbG91ZHdhdGNoLWFjdGlvbnMnO1xuaW1wb3J0ICogYXMgZHluYW1vZGIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWR5bmFtb2RiJztcblxuZXhwb3J0IGNsYXNzIEhpcmE0U3ByaW50U3RhY2sgZXh0ZW5kcyBTdGFjayB7XG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgLy9Sb2xlc1xuICAgIHZhciByb2xlcz10aGlzLmNyZWF0ZV9yb2xlKCk7XG5cbiAgICAvLyBDcmVhdGluZyBTMyBidWNrZXRcbiAgICBjb25zdCBidWNrZXQgPSBuZXcgQnVja2V0KHRoaXMsaWQ9Y29uc3RhbnQuYnVja2V0X2lkLHthY2Nlc3NDb250cm9sOiBCdWNrZXRBY2Nlc3NDb250cm9sLlBVQkxJQ19SRUFELH0pO1xuICAgIHZhciBzM19idWNrZXQ9YnVja2V0LmJ1Y2tldE5hbWVcbiAgICBidWNrZXQucG9saWN5Py5hcHBseVJlbW92YWxQb2xpY3koUmVtb3ZhbFBvbGljeS5ERVNUUk9ZKTtcblxuICAgIC8vIFVwbG9hZGluZyBmaWxlIHRvIFMzIGJ1Y2tldFxuICAgIHRoaXMuVXBsb2FkX2ZpbGUoYnVja2V0KTtcblxuICAgIC8vQ2FsbGluZyB3ZWIgaGVhbHRoIGxhbWJkYSBmdW5jdGlvblxuICAgIHZhciBsYW1iZGFfZnVuYz10aGlzLmxhbWJkYXMocm9sZXMsXCJXZWJIZWFsdGhMYW1iZGFcIixcIi4vcmVzb3VyY2VzXCIsXCJ3ZWJIZWFsdGhMYW1iZGEud2ViaGFuZGxlclwiLHMzX2J1Y2tldClcblxuICAgIC8vIFJ1biBMYW1iZGEgcGVyaW9kaWNhbGx5XG4gICAgY29uc3QgcnVsZSA9IG5ldyBldmVudHMuUnVsZSh0aGlzLCAnUnVsZScsIHtcbiAgICAgICAgICAgIHNjaGVkdWxlOiBldmVudHMuU2NoZWR1bGUucmF0ZShEdXJhdGlvbi5taW51dGVzKDEpKSxcbiAgICAgICAgICAgIHRhcmdldHM6IFtuZXcgdGFyZ2V0cy5MYW1iZGFGdW5jdGlvbihsYW1iZGFfZnVuYyldLFxuICAgIH0pO1xuXG4gIH1cblxuLy8gRnVuY3Rpb25zXG5cblxuLy8gQnVja2V0IGRlcGxveW1lbnQgZnVuYyB3aWxsIHVwbG9hZCBhbGwgZmlsZXMgb2YgcmVzb3VyY2UgZm9sZGVyIHRvIHMzIGJ1Y2tldFxuVXBsb2FkX2ZpbGUoYnVja2V0OiBCdWNrZXQpIHtcbiAgY29uc3QgZGVwbG95bWVudCA9IG5ldyBCdWNrZXREZXBsb3ltZW50KHRoaXMsICdEZXBsb3lXZWJzaXRlJywge1xuICAgIHNvdXJjZXM6IFtTb3VyY2UuYXNzZXQoJy4vcmVzb3VyY2VzJyldLFxuICAgIGRlc3RpbmF0aW9uQnVja2V0OiBidWNrZXR9KVxuICB9XG5cblxuXG5sYW1iZGFzKHJvbGVzOmFueSxpZDpzdHJpbmcsYXNzZXQ6c3RyaW5nLGhhbmRsZXI6c3RyaW5nLGVudmlvcl92YXI6c3RyaW5nKTphbnl7XG5cbiAgLyogY3JlYXRlX2xhbWJkYSgpXG4gICAgICAgIFxuICBpZCAtPiBzdHJpbmcgdmFsdWVcbiAgYXNzZXQgLT4gRm9sZGVyIHRoYXQgY29udGFpbnMgY29kZVxuICBydW50aW1lIC0+IExhbmd1YWdlXG4gIGhhbmRsZXIgLT4gTGFtYmRhIGZ1bmN0aW9uXG4gIHRpbWVvdXQgLT4gQWZ0ZXIgaG93IGxvbmcgbGFtYmRhIHdpbGwgZW5kXG4gIFxuICBSZXR1cm4gOiBMYW1iZGEgRnVuY3Rpb24gKi9cblxuICBjb25zdCBoZWxsbyA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgaWQsIHtcbiAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMTRfWCwgICAgLy8gZXhlY3V0aW9uIGVudmlyb25tZW50XG4gICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KGFzc2V0KSwgIC8vIGNvZGUgbG9hZGVkIGZyb20gXCJyZXNvdXJjZVwiIGRpcmVjdG9yeVxuICAgIGhhbmRsZXI6IGhhbmRsZXIsXG4gICAgdGltZW91dDogRHVyYXRpb24uc2Vjb25kcygxODApICAsXG4gICAgcm9sZTpyb2xlcyxcbiAgICBlbnZpcm9ubWVudDp7J3RhYmxlX25hbWUnOmVudmlvcl92YXJ9ICAgICAgICAgICAgIC8vIGZpbGUgaXMgXCJ3ZWJoYW5kbGVyXCIsIGZ1bmN0aW9uIGlzIFwiaGFuZGxlclwiXG4gIH0pO1xuICByZXR1cm4gaGVsbG9cbn1cblxuXG5cbmNyZWF0ZV9yb2xlKCk6YW55e1xuXG5jb25zdCByb2xlID0gbmV3IFJvbGUodGhpcywgJ2V4YW1wbGUtaWFtLXJvbGUnLCB7XG4gIGFzc3VtZWRCeTogbmV3IFNlcnZpY2VQcmluY2lwYWwoJ2xhbWJkYS5hbWF6b25hd3MuY29tJyksXG4gIGRlc2NyaXB0aW9uOiAnQW4gZXhhbXBsZSBJQU0gcm9sZSBpbiBBV1MgQ0RLJyxcbiAgbWFuYWdlZFBvbGljaWVzOiBbXG4gICAgTWFuYWdlZFBvbGljeS5mcm9tQXdzTWFuYWdlZFBvbGljeU5hbWUoJ0Nsb3VkV2F0Y2hGdWxsQWNjZXNzJyksXG4gICAgTWFuYWdlZFBvbGljeS5mcm9tQXdzTWFuYWdlZFBvbGljeU5hbWUoJ0FtYXpvbkR5bmFtb0RCRnVsbEFjY2VzcycpLFxuICAgIE1hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKCdzZXJ2aWNlLXJvbGUvQVdTTGFtYmRhQmFzaWNFeGVjdXRpb25Sb2xlJyksXG4gICAgTWFuYWdlZFBvbGljeS5mcm9tQXdzTWFuYWdlZFBvbGljeU5hbWUoJ0FXU0xhbWJkYUludm9jYXRpb24tRHluYW1vREInKSxcbiAgXSxcbn0pO1xucmV0dXJuIHJvbGVcbn1cblxufVxuIl19