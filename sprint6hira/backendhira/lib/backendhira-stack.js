"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackendhiraStack = void 0;
const aws_cdk_lib_1 = require("aws-cdk-lib");
const lambda = require("aws-cdk-lib/aws-lambda");
const aws_iam_1 = require("aws-cdk-lib/aws-iam");
const apigateway = require("aws-cdk-lib/aws-apigateway");
const { path } = require('path');
class BackendhiraStack extends aws_cdk_lib_1.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        const roles = this.create_role(); // Calling create_role function
        /*
          Layer Version ()
                id -> id(str)
                removal policy -> RETAIN
                code -> Directory of layer code
                compatibleRuntimes -> NODEJS_!$_X
        */
        const layer = new lambda.LayerVersion(this, 'MyLayer', {
            removalPolicy: aws_cdk_lib_1.RemovalPolicy.RETAIN,
            code: lambda.Code.fromAsset('./layers'),
            compatibleRuntimes: [lambda.Runtime.NODEJS_14_X],
        });
        // Creating lambda function
        const api_lambda_func = new lambda.Function(this, "api_lambda", {
            runtime: lambda.Runtime.NODEJS_14_X,
            code: lambda.Code.fromAsset("./server"),
            handler: "api_lambda.handler",
            timeout: aws_cdk_lib_1.Duration.minutes(5),
            layers: [layer],
            role: roles,
        });
        // Create an API Gateway to invoke lambda function
        const api = new apigateway.LambdaRestApi(this, 'hiraapi', {
            handler: api_lambda_func
        });
    }
    create_role() {
        const role = new aws_iam_1.Role(this, 'example-iam-role', {
            assumedBy: new aws_iam_1.ServicePrincipal('lambda.amazonaws.com'),
            description: 'An example IAM role in AWS CDK',
            managedPolicies: [
                aws_iam_1.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchFullAccess'),
                aws_iam_1.ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess'),
                aws_iam_1.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
                aws_iam_1.ManagedPolicy.fromAwsManagedPolicyName('AmazonAPIGatewayInvokeFullAccess'),
                aws_iam_1.ManagedPolicy.fromAwsManagedPolicyName('AmazonAPIGatewayAdministrator'),
            ],
        });
        return role;
    }
}
exports.BackendhiraStack = BackendhiraStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFja2VuZGhpcmEtc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJiYWNrZW5kaGlyYS1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSw2Q0FBeUU7QUFFekUsaURBQWdEO0FBQ2hELGlEQUE0RTtBQUM1RSx5REFBeUQ7QUFDekQsTUFBTSxFQUFDLElBQUksRUFBQyxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQTtBQUU5QixNQUFhLGdCQUFpQixTQUFRLG1CQUFLO0lBQ3pDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBa0I7UUFDMUQsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsTUFBTSxLQUFLLEdBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFBLENBQXdDLCtCQUErQjtRQUVyRzs7Ozs7O1VBTUU7UUFFRixNQUFNLEtBQUssR0FBRyxJQUFJLE1BQU0sQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLFNBQVMsRUFBRTtZQUNyRCxhQUFhLEVBQUUsMkJBQWEsQ0FBQyxNQUFNO1lBQ25DLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUM7WUFDdkMsa0JBQWtCLEVBQUUsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQztTQUNqRCxDQUFDLENBQUM7UUFFSCwyQkFBMkI7UUFDM0IsTUFBTSxlQUFlLEdBQUcsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUU7WUFDOUQsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBVztZQUNuQyxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDO1lBQ3ZDLE9BQU8sRUFBRSxvQkFBb0I7WUFDN0IsT0FBTyxFQUFFLHNCQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUM1QixNQUFNLEVBQUMsQ0FBQyxLQUFLLENBQUM7WUFDZCxJQUFJLEVBQUMsS0FBSztTQUVYLENBQUMsQ0FBQztRQUVILGtEQUFrRDtRQUNsRCxNQUFNLEdBQUcsR0FBRyxJQUFJLFVBQVUsQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFLFNBQVMsRUFBRTtZQUN4RCxPQUFPLEVBQUUsZUFBZTtTQUFDLENBQUMsQ0FBQztJQUcvQixDQUFDO0lBRUQsV0FBVztRQUVULE1BQU0sSUFBSSxHQUFHLElBQUksY0FBSSxDQUFDLElBQUksRUFBRSxrQkFBa0IsRUFBRTtZQUM5QyxTQUFTLEVBQUUsSUFBSSwwQkFBZ0IsQ0FBQyxzQkFBc0IsQ0FBQztZQUN2RCxXQUFXLEVBQUUsZ0NBQWdDO1lBQzdDLGVBQWUsRUFBRTtnQkFDZix1QkFBYSxDQUFDLHdCQUF3QixDQUFDLHNCQUFzQixDQUFDO2dCQUM5RCx1QkFBYSxDQUFDLHdCQUF3QixDQUFDLDBCQUEwQixDQUFDO2dCQUNsRSx1QkFBYSxDQUFDLHdCQUF3QixDQUFDLDBDQUEwQyxDQUFDO2dCQUNsRix1QkFBYSxDQUFDLHdCQUF3QixDQUFDLGtDQUFrQyxDQUFDO2dCQUMxRSx1QkFBYSxDQUFDLHdCQUF3QixDQUFDLCtCQUErQixDQUFDO2FBQ3hFO1NBQ0YsQ0FBQyxDQUFDO1FBQ0gsT0FBTyxJQUFJLENBQUE7SUFDWCxDQUFDO0NBQ0o7QUFyREQsNENBcURDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRHVyYXRpb24sIFJlbW92YWxQb2xpY3ksIFN0YWNrLCBTdGFja1Byb3BzIH0gZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5pbXBvcnQgKiBhcyBsYW1iZGEgZnJvbSAnYXdzLWNkay1saWIvYXdzLWxhbWJkYSdcbmltcG9ydCB7IE1hbmFnZWRQb2xpY3ksIFJvbGUsIFNlcnZpY2VQcmluY2lwYWwgfSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtaWFtJztcbmltcG9ydCAqIGFzIGFwaWdhdGV3YXkgZnJvbSAnYXdzLWNkay1saWIvYXdzLWFwaWdhdGV3YXknO1xuY29uc3Qge3BhdGh9ID0gcmVxdWlyZSgncGF0aCcpXG5cbmV4cG9ydCBjbGFzcyBCYWNrZW5kaGlyYVN0YWNrIGV4dGVuZHMgU3RhY2sge1xuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wcz86IFN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIGNvbnN0IHJvbGVzPXRoaXMuY3JlYXRlX3JvbGUoKSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBDYWxsaW5nIGNyZWF0ZV9yb2xlIGZ1bmN0aW9uXG5cbiAgICAvKlxuICAgICAgTGF5ZXIgVmVyc2lvbiAoKVxuICAgICAgICAgICAgaWQgLT4gaWQoc3RyKVxuICAgICAgICAgICAgcmVtb3ZhbCBwb2xpY3kgLT4gUkVUQUlOXG4gICAgICAgICAgICBjb2RlIC0+IERpcmVjdG9yeSBvZiBsYXllciBjb2RlXG4gICAgICAgICAgICBjb21wYXRpYmxlUnVudGltZXMgLT4gTk9ERUpTXyEkX1hcbiAgICAqL1xuXG4gICAgY29uc3QgbGF5ZXIgPSBuZXcgbGFtYmRhLkxheWVyVmVyc2lvbih0aGlzLCAnTXlMYXllcicsIHsgICAgICAgICAgICAgIC8vIENyZWF0ZSBMYXllciBWZXJzaW9uXG4gICAgICByZW1vdmFsUG9saWN5OiBSZW1vdmFsUG9saWN5LlJFVEFJTixcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldCgnLi9sYXllcnMnKSxcbiAgICAgIGNvbXBhdGlibGVSdW50aW1lczogW2xhbWJkYS5SdW50aW1lLk5PREVKU18xNF9YXSxcbiAgICB9KTtcblxuICAgIC8vIENyZWF0aW5nIGxhbWJkYSBmdW5jdGlvblxuICAgIGNvbnN0IGFwaV9sYW1iZGFfZnVuYyA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgXCJhcGlfbGFtYmRhXCIsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18xNF9YLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZXhlY3V0aW9uIGVudmlyb25tZW50XG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQoXCIuL3NlcnZlclwiKSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gY29kZSBsb2FkZWQgZnJvbSBcInNlcnZlclwiIGRpcmVjdG9yeVxuICAgICAgaGFuZGxlcjogXCJhcGlfbGFtYmRhLmhhbmRsZXJcIiwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGZ1bmN0aW9uIGlzIFwiYXBpX2xhbWJkYS5oYW5kbGVyXCJcbiAgICAgIHRpbWVvdXQ6IER1cmF0aW9uLm1pbnV0ZXMoNSkgICxcbiAgICAgIGxheWVyczpbbGF5ZXJdLFxuICAgICAgcm9sZTpyb2xlcyxcbiAgICAgICAgICAgICAgICBcbiAgICB9KTtcblxuICAgIC8vIENyZWF0ZSBhbiBBUEkgR2F0ZXdheSB0byBpbnZva2UgbGFtYmRhIGZ1bmN0aW9uXG4gICAgY29uc3QgYXBpID0gbmV3IGFwaWdhdGV3YXkuTGFtYmRhUmVzdEFwaSh0aGlzLCAnaGlyYWFwaScsIHtcbiAgICAgIGhhbmRsZXI6IGFwaV9sYW1iZGFfZnVuY30pO1xuICAgIFxuXG4gIH1cblxuICBjcmVhdGVfcm9sZSgpOmFueXtcblxuICAgIGNvbnN0IHJvbGUgPSBuZXcgUm9sZSh0aGlzLCAnZXhhbXBsZS1pYW0tcm9sZScsIHtcbiAgICAgIGFzc3VtZWRCeTogbmV3IFNlcnZpY2VQcmluY2lwYWwoJ2xhbWJkYS5hbWF6b25hd3MuY29tJyksXG4gICAgICBkZXNjcmlwdGlvbjogJ0FuIGV4YW1wbGUgSUFNIHJvbGUgaW4gQVdTIENESycsXG4gICAgICBtYW5hZ2VkUG9saWNpZXM6IFtcbiAgICAgICAgTWFuYWdlZFBvbGljeS5mcm9tQXdzTWFuYWdlZFBvbGljeU5hbWUoJ0Nsb3VkV2F0Y2hGdWxsQWNjZXNzJyksXG4gICAgICAgIE1hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKCdBbWF6b25EeW5hbW9EQkZ1bGxBY2Nlc3MnKSxcbiAgICAgICAgTWFuYWdlZFBvbGljeS5mcm9tQXdzTWFuYWdlZFBvbGljeU5hbWUoJ3NlcnZpY2Utcm9sZS9BV1NMYW1iZGFCYXNpY0V4ZWN1dGlvblJvbGUnKSxcbiAgICAgICAgTWFuYWdlZFBvbGljeS5mcm9tQXdzTWFuYWdlZFBvbGljeU5hbWUoJ0FtYXpvbkFQSUdhdGV3YXlJbnZva2VGdWxsQWNjZXNzJyksXG4gICAgICAgIE1hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKCdBbWF6b25BUElHYXRld2F5QWRtaW5pc3RyYXRvcicpLFxuICAgICAgXSxcbiAgICB9KTtcbiAgICByZXR1cm4gcm9sZVxuICAgIH1cbn0iXX0=