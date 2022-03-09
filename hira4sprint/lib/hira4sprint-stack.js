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
        const bucket = new aws_s3_1.Bucket(this, id = constant.bucket_id, { accessControl: aws_s3_1.BucketAccessControl.PUBLIC_READ, });
        var s3_bucket = bucket.bucketName;
        (_a = bucket.policy) === null || _a === void 0 ? void 0 : _a.applyRemovalPolicy(aws_cdk_lib_1.RemovalPolicy.DESTROY);
        this.Upload_file(bucket);
        //Calling web health lambda function
        var lambda_func = this.lambdas(roles, "WebHealthLambda", "./resources", "webHealthLambda.webhandler", s3_bucket);
        const rule = new events.Rule(this, 'Rule', {
            schedule: events.Schedule.rate(aws_cdk_lib_1.Duration.minutes(1)),
            targets: [new targets.LambdaFunction(lambda_func)],
        });
    }
    // Functions
    Upload_file(bucket) {
        const deployment = new aws_s3_deployment_1.BucketDeployment(this, 'DeployWebsite', {
            sources: [aws_s3_deployment_1.Source.asset('./resources')],
            destinationBucket: bucket
        });
    }
    lambdas(roles, id, asset, handler, envior_var) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGlyYTRzcHJpbnQtc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJoaXJhNHNwcmludC1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSw2Q0FBd0U7QUFDeEUsaURBQWlEO0FBRWpELGlEQUFpRDtBQUNqRCwwREFBMEQ7QUFDMUQsaURBQTRFO0FBQzVFLE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDO0FBRXZELHFFQUFzRTtBQUN0RSwrQ0FBaUU7QUFNakUsTUFBYSxnQkFBaUIsU0FBUSxtQkFBSztJQUN6QyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQWtCOztRQUMxRCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4QixPQUFPO1FBQ1AsSUFBSSxLQUFLLEdBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBRTdCLE1BQU0sTUFBTSxHQUFHLElBQUksZUFBTSxDQUFDLElBQUksRUFBQyxFQUFFLEdBQUMsUUFBUSxDQUFDLFNBQVMsRUFBQyxFQUFDLGFBQWEsRUFBRSw0QkFBbUIsQ0FBQyxXQUFXLEdBQUUsQ0FBQyxDQUFDO1FBQ3hHLElBQUksU0FBUyxHQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUE7UUFDL0IsTUFBQSxNQUFNLENBQUMsTUFBTSwwQ0FBRSxrQkFBa0IsQ0FBQywyQkFBYSxDQUFDLE9BQU8sRUFBRTtRQUN6RCxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBRXpCLG9DQUFvQztRQUNwQyxJQUFJLFdBQVcsR0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBQyxpQkFBaUIsRUFBQyxhQUFhLEVBQUMsNEJBQTRCLEVBQUMsU0FBUyxDQUFDLENBQUE7UUFDMUcsTUFBTSxJQUFJLEdBQUcsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxNQUFNLEVBQUU7WUFDbkMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLHNCQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ25ELE9BQU8sRUFBRSxDQUFDLElBQUksT0FBTyxDQUFDLGNBQWMsQ0FBQyxXQUFXLENBQUMsQ0FBQztTQUN6RCxDQUFDLENBQUM7SUFFTCxDQUFDO0lBRUgsWUFBWTtJQUVaLFdBQVcsQ0FBQyxNQUFjO1FBQ3hCLE1BQU0sVUFBVSxHQUFHLElBQUksb0NBQWdCLENBQUMsSUFBSSxFQUFFLGVBQWUsRUFBRTtZQUM3RCxPQUFPLEVBQUUsQ0FBQywwQkFBTSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUN0QyxpQkFBaUIsRUFBRSxNQUFNO1NBQUMsQ0FBQyxDQUFBO0lBRzdCLENBQUM7SUFHSCxPQUFPLENBQUMsS0FBUyxFQUFDLEVBQVMsRUFBQyxLQUFZLEVBQUMsT0FBYyxFQUFDLFVBQWlCO1FBQ3ZFLE1BQU0sS0FBSyxHQUFHLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFO1lBQzFDLE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLFdBQVc7WUFDbkMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQztZQUNsQyxPQUFPLEVBQUUsT0FBTztZQUNoQixPQUFPLEVBQUUsc0JBQVEsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDO1lBQzlCLElBQUksRUFBQyxLQUFLO1lBQ1YsV0FBVyxFQUFDLEVBQUMsWUFBWSxFQUFDLFVBQVUsRUFBQyxDQUFhLDhDQUE4QztTQUNqRyxDQUFDLENBQUM7UUFDSCxPQUFPLEtBQUssQ0FBQTtJQUNkLENBQUM7SUFHRCxXQUFXO1FBQ1gsTUFBTSxJQUFJLEdBQUcsSUFBSSxjQUFJLENBQUMsSUFBSSxFQUFFLGtCQUFrQixFQUFFO1lBQzlDLFNBQVMsRUFBRSxJQUFJLDBCQUFnQixDQUFDLHNCQUFzQixDQUFDO1lBQ3ZELFdBQVcsRUFBRSxnQ0FBZ0M7WUFDN0MsZUFBZSxFQUFFO2dCQUNmLHVCQUFhLENBQUMsd0JBQXdCLENBQUMsc0JBQXNCLENBQUM7Z0JBQzlELHVCQUFhLENBQUMsd0JBQXdCLENBQUMsMEJBQTBCLENBQUM7Z0JBQ2xFLHVCQUFhLENBQUMsd0JBQXdCLENBQUMsMENBQTBDLENBQUM7Z0JBQ2xGLHVCQUFhLENBQUMsd0JBQXdCLENBQUMsOEJBQThCLENBQUM7YUFDdkU7U0FDRixDQUFDLENBQUM7UUFDSCxPQUFPLElBQUksQ0FBQTtJQUNYLENBQUM7Q0FFQTtBQTNERCw0Q0EyREMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBEdXJhdGlvbiwgUmVtb3ZhbFBvbGljeSwgU3RhY2ssIFN0YWNrUHJvcHN9IGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCAqIGFzIGxhbWJkYSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbGFtYmRhJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuaW1wb3J0ICogYXMgZXZlbnRzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1ldmVudHMnO1xuaW1wb3J0ICogYXMgdGFyZ2V0cyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZXZlbnRzLXRhcmdldHMnO1xuaW1wb3J0IHsgTWFuYWdlZFBvbGljeSwgUm9sZSwgU2VydmljZVByaW5jaXBhbCB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1pYW0nO1xuY29uc3QgY29uc3RhbnQgPSByZXF1aXJlKFwiLi4vcmVzb3VyY2VzL2NvbnN0YW50Lmpzb25cIik7XG5pbXBvcnQge0FsYXJtLE1ldHJpY30gZnJvbSAnYXdzLWNkay1saWIvYXdzLWNsb3Vkd2F0Y2gnXG5pbXBvcnQge0J1Y2tldERlcGxveW1lbnQsIFNvdXJjZX0gZnJvbSAnYXdzLWNkay1saWIvYXdzLXMzLWRlcGxveW1lbnQnXG5pbXBvcnQgeyBCdWNrZXQsIEJ1Y2tldEFjY2Vzc0NvbnRyb2wgfSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtczMnO1xuaW1wb3J0ICogYXMgc25zIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zbnMnO1xuaW1wb3J0IHtFbWFpbFN1YnNjcmlwdGlvbiwgTGFtYmRhU3Vic2NyaXB0aW9ufSBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtc25zLXN1YnNjcmlwdGlvbnMnXG5pbXBvcnQgKiBhcyBjd19hY3Rpb25zIGZyb20gJ2F3cy1jZGstbGliL2F3cy1jbG91ZHdhdGNoLWFjdGlvbnMnO1xuaW1wb3J0ICogYXMgZHluYW1vZGIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWR5bmFtb2RiJztcblxuZXhwb3J0IGNsYXNzIEhpcmE0U3ByaW50U3RhY2sgZXh0ZW5kcyBTdGFjayB7XG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgLy9Sb2xlc1xuICAgIHZhciByb2xlcz10aGlzLmNyZWF0ZV9yb2xlKCk7XG5cbiAgICBjb25zdCBidWNrZXQgPSBuZXcgQnVja2V0KHRoaXMsaWQ9Y29uc3RhbnQuYnVja2V0X2lkLHthY2Nlc3NDb250cm9sOiBCdWNrZXRBY2Nlc3NDb250cm9sLlBVQkxJQ19SRUFELH0pO1xuICAgIHZhciBzM19idWNrZXQ9YnVja2V0LmJ1Y2tldE5hbWVcbiAgICBidWNrZXQucG9saWN5Py5hcHBseVJlbW92YWxQb2xpY3koUmVtb3ZhbFBvbGljeS5ERVNUUk9ZKTtcbiAgICB0aGlzLlVwbG9hZF9maWxlKGJ1Y2tldCk7XG5cbiAgICAvL0NhbGxpbmcgd2ViIGhlYWx0aCBsYW1iZGEgZnVuY3Rpb25cbiAgICB2YXIgbGFtYmRhX2Z1bmM9dGhpcy5sYW1iZGFzKHJvbGVzLFwiV2ViSGVhbHRoTGFtYmRhXCIsXCIuL3Jlc291cmNlc1wiLFwid2ViSGVhbHRoTGFtYmRhLndlYmhhbmRsZXJcIixzM19idWNrZXQpXG4gICAgY29uc3QgcnVsZSA9IG5ldyBldmVudHMuUnVsZSh0aGlzLCAnUnVsZScsIHtcbiAgICAgICAgICAgIHNjaGVkdWxlOiBldmVudHMuU2NoZWR1bGUucmF0ZShEdXJhdGlvbi5taW51dGVzKDEpKSxcbiAgICAgICAgICAgIHRhcmdldHM6IFtuZXcgdGFyZ2V0cy5MYW1iZGFGdW5jdGlvbihsYW1iZGFfZnVuYyldLFxuICAgIH0pO1xuXG4gIH1cblxuLy8gRnVuY3Rpb25zXG5cblVwbG9hZF9maWxlKGJ1Y2tldDogQnVja2V0KSB7XG4gIGNvbnN0IGRlcGxveW1lbnQgPSBuZXcgQnVja2V0RGVwbG95bWVudCh0aGlzLCAnRGVwbG95V2Vic2l0ZScsIHtcbiAgICBzb3VyY2VzOiBbU291cmNlLmFzc2V0KCcuL3Jlc291cmNlcycpXSxcbiAgICBkZXN0aW5hdGlvbkJ1Y2tldDogYnVja2V0fSlcblxuICAgXG4gIH1cblxuXG5sYW1iZGFzKHJvbGVzOmFueSxpZDpzdHJpbmcsYXNzZXQ6c3RyaW5nLGhhbmRsZXI6c3RyaW5nLGVudmlvcl92YXI6c3RyaW5nKTphbnl7XG4gIGNvbnN0IGhlbGxvID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCBpZCwge1xuICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18xNF9YLCAgICAvLyBleGVjdXRpb24gZW52aXJvbm1lbnRcbiAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQoYXNzZXQpLCAgLy8gY29kZSBsb2FkZWQgZnJvbSBcInJlc291cmNlXCIgZGlyZWN0b3J5XG4gICAgaGFuZGxlcjogaGFuZGxlcixcbiAgICB0aW1lb3V0OiBEdXJhdGlvbi5zZWNvbmRzKDE4MCkgICxcbiAgICByb2xlOnJvbGVzLFxuICAgIGVudmlyb25tZW50OnsndGFibGVfbmFtZSc6ZW52aW9yX3Zhcn0gICAgICAgICAgICAgLy8gZmlsZSBpcyBcIndlYmhhbmRsZXJcIiwgZnVuY3Rpb24gaXMgXCJoYW5kbGVyXCJcbiAgfSk7XG4gIHJldHVybiBoZWxsb1xufVxuXG5cbmNyZWF0ZV9yb2xlKCk6YW55e1xuY29uc3Qgcm9sZSA9IG5ldyBSb2xlKHRoaXMsICdleGFtcGxlLWlhbS1yb2xlJywge1xuICBhc3N1bWVkQnk6IG5ldyBTZXJ2aWNlUHJpbmNpcGFsKCdsYW1iZGEuYW1hem9uYXdzLmNvbScpLFxuICBkZXNjcmlwdGlvbjogJ0FuIGV4YW1wbGUgSUFNIHJvbGUgaW4gQVdTIENESycsXG4gIG1hbmFnZWRQb2xpY2llczogW1xuICAgIE1hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKCdDbG91ZFdhdGNoRnVsbEFjY2VzcycpLFxuICAgIE1hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKCdBbWF6b25EeW5hbW9EQkZ1bGxBY2Nlc3MnKSxcbiAgICBNYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZSgnc2VydmljZS1yb2xlL0FXU0xhbWJkYUJhc2ljRXhlY3V0aW9uUm9sZScpLFxuICAgIE1hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKCdBV1NMYW1iZGFJbnZvY2F0aW9uLUR5bmFtb0RCJyksXG4gIF0sXG59KTtcbnJldHVybiByb2xlXG59XG5cbn1cbiJdfQ==