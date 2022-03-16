"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sprint5HiraStack = void 0;
const aws_cdk_lib_1 = require("aws-cdk-lib");
const lambda = require("aws-cdk-lib/aws-lambda");
const aws_iam_1 = require("aws-cdk-lib/aws-iam");
const apigateway = require("aws-cdk-lib/aws-apigateway");
const { path } = require('path');
class Sprint5HiraStack extends aws_cdk_lib_1.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        const roles = this.create_role();
        const layer = new lambda.LayerVersion(this, 'MyLayer', {
            removalPolicy: aws_cdk_lib_1.RemovalPolicy.RETAIN,
            code: lambda.Code.fromAsset('./layers'),
            compatibleRuntimes: [lambda.Runtime.NODEJS_14_X],
        });
        const api_lambda_func = new lambda.Function(this, "api_lambda", {
            runtime: lambda.Runtime.NODEJS_14_X,
            code: lambda.Code.fromAsset("./server"),
            handler: "api_lambda.handler",
            timeout: aws_cdk_lib_1.Duration.minutes(5),
            layers: [layer],
            role: roles,
        });
        const api = new apigateway.LambdaRestApi(this, 'myapi', {
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
exports.Sprint5HiraStack = Sprint5HiraStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3ByaW50NWhpcmEtc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzcHJpbnQ1aGlyYS1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSw2Q0FBeUU7QUFFekUsaURBQWdEO0FBQ2hELGlEQUE0RTtBQUM1RSx5REFBeUQ7QUFDekQsTUFBTSxFQUFDLElBQUksRUFBQyxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQTtBQUc5QixNQUFhLGdCQUFpQixTQUFRLG1CQUFLO0lBQ3pDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBa0I7UUFDMUQsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsTUFBTSxLQUFLLEdBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFBO1FBRTlCLE1BQU0sS0FBSyxHQUFHLElBQUksTUFBTSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsU0FBUyxFQUFFO1lBQ3JELGFBQWEsRUFBRSwyQkFBYSxDQUFDLE1BQU07WUFDbkMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQztZQUN2QyxrQkFBa0IsRUFBRSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDO1NBQ2pELENBQUMsQ0FBQztRQUVILE1BQU0sZUFBZSxHQUFHLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFO1lBQzlELE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLFdBQVc7WUFDbkMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQztZQUN2QyxPQUFPLEVBQUUsb0JBQW9CO1lBQzdCLE9BQU8sRUFBRSxzQkFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDNUIsTUFBTSxFQUFDLENBQUMsS0FBSyxDQUFDO1lBQ2QsSUFBSSxFQUFDLEtBQUs7U0FFWCxDQUFDLENBQUM7UUFFSCxNQUFNLEdBQUcsR0FBRyxJQUFJLFVBQVUsQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRTtZQUN0RCxPQUFPLEVBQUUsZUFBZTtTQUFDLENBQUMsQ0FBQztJQUcvQixDQUFDO0lBS0QsV0FBVztRQUVULE1BQU0sSUFBSSxHQUFHLElBQUksY0FBSSxDQUFDLElBQUksRUFBRSxrQkFBa0IsRUFBRTtZQUM5QyxTQUFTLEVBQUUsSUFBSSwwQkFBZ0IsQ0FBQyxzQkFBc0IsQ0FBQztZQUN2RCxXQUFXLEVBQUUsZ0NBQWdDO1lBQzdDLGVBQWUsRUFBRTtnQkFDZix1QkFBYSxDQUFDLHdCQUF3QixDQUFDLHNCQUFzQixDQUFDO2dCQUM5RCx1QkFBYSxDQUFDLHdCQUF3QixDQUFDLDBCQUEwQixDQUFDO2dCQUNsRSx1QkFBYSxDQUFDLHdCQUF3QixDQUFDLDBDQUEwQyxDQUFDO2dCQUNsRix1QkFBYSxDQUFDLHdCQUF3QixDQUFDLGtDQUFrQyxDQUFDO2dCQUMxRSx1QkFBYSxDQUFDLHdCQUF3QixDQUFDLCtCQUErQixDQUFDO2FBQ3hFO1NBQ0YsQ0FBQyxDQUFDO1FBQ0gsT0FBTyxJQUFJLENBQUE7SUFDWCxDQUFDO0NBQ0o7QUE5Q0QsNENBOENDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRHVyYXRpb24sIFJlbW92YWxQb2xpY3ksIFN0YWNrLCBTdGFja1Byb3BzIH0gZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5pbXBvcnQgKiBhcyBsYW1iZGEgZnJvbSAnYXdzLWNkay1saWIvYXdzLWxhbWJkYSdcbmltcG9ydCB7IE1hbmFnZWRQb2xpY3ksIFJvbGUsIFNlcnZpY2VQcmluY2lwYWwgfSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtaWFtJztcbmltcG9ydCAqIGFzIGFwaWdhdGV3YXkgZnJvbSAnYXdzLWNkay1saWIvYXdzLWFwaWdhdGV3YXknO1xuY29uc3Qge3BhdGh9ID0gcmVxdWlyZSgncGF0aCcpXG5cblxuZXhwb3J0IGNsYXNzIFNwcmludDVIaXJhU3RhY2sgZXh0ZW5kcyBTdGFjayB7XG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgY29uc3Qgcm9sZXM9dGhpcy5jcmVhdGVfcm9sZSgpXG5cbiAgICBjb25zdCBsYXllciA9IG5ldyBsYW1iZGEuTGF5ZXJWZXJzaW9uKHRoaXMsICdNeUxheWVyJywge1xuICAgICAgcmVtb3ZhbFBvbGljeTogUmVtb3ZhbFBvbGljeS5SRVRBSU4sXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQoJy4vbGF5ZXJzJyksXG4gICAgICBjb21wYXRpYmxlUnVudGltZXM6IFtsYW1iZGEuUnVudGltZS5OT0RFSlNfMTRfWF0sXG4gICAgfSk7XG5cbiAgICBjb25zdCBhcGlfbGFtYmRhX2Z1bmMgPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsIFwiYXBpX2xhbWJkYVwiLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMTRfWCwgICAgLy8gZXhlY3V0aW9uIGVudmlyb25tZW50XG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQoXCIuL3NlcnZlclwiKSwgIC8vIGNvZGUgbG9hZGVkIGZyb20gXCJyZXNvdXJjZVwiIGRpcmVjdG9yeVxuICAgICAgaGFuZGxlcjogXCJhcGlfbGFtYmRhLmhhbmRsZXJcIixcbiAgICAgIHRpbWVvdXQ6IER1cmF0aW9uLm1pbnV0ZXMoNSkgICxcbiAgICAgIGxheWVyczpbbGF5ZXJdLFxuICAgICAgcm9sZTpyb2xlcyxcbiAgICAgICAgICAgICAgICAgLy8gZmlsZSBpcyBcIndlYmhhbmRsZXJcIiwgZnVuY3Rpb24gaXMgXCJoYW5kbGVyXCJcbiAgICB9KTtcblxuICAgIGNvbnN0IGFwaSA9IG5ldyBhcGlnYXRld2F5LkxhbWJkYVJlc3RBcGkodGhpcywgJ215YXBpJywge1xuICAgICAgaGFuZGxlcjogYXBpX2xhbWJkYV9mdW5jfSk7XG4gICAgXG5cbiAgfVxuXG5cblxuXG4gIGNyZWF0ZV9yb2xlKCk6YW55e1xuXG4gICAgY29uc3Qgcm9sZSA9IG5ldyBSb2xlKHRoaXMsICdleGFtcGxlLWlhbS1yb2xlJywge1xuICAgICAgYXNzdW1lZEJ5OiBuZXcgU2VydmljZVByaW5jaXBhbCgnbGFtYmRhLmFtYXpvbmF3cy5jb20nKSxcbiAgICAgIGRlc2NyaXB0aW9uOiAnQW4gZXhhbXBsZSBJQU0gcm9sZSBpbiBBV1MgQ0RLJyxcbiAgICAgIG1hbmFnZWRQb2xpY2llczogW1xuICAgICAgICBNYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZSgnQ2xvdWRXYXRjaEZ1bGxBY2Nlc3MnKSxcbiAgICAgICAgTWFuYWdlZFBvbGljeS5mcm9tQXdzTWFuYWdlZFBvbGljeU5hbWUoJ0FtYXpvbkR5bmFtb0RCRnVsbEFjY2VzcycpLFxuICAgICAgICBNYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZSgnc2VydmljZS1yb2xlL0FXU0xhbWJkYUJhc2ljRXhlY3V0aW9uUm9sZScpLFxuICAgICAgICBNYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZSgnQW1hem9uQVBJR2F0ZXdheUludm9rZUZ1bGxBY2Nlc3MnKSxcbiAgICAgICAgTWFuYWdlZFBvbGljeS5mcm9tQXdzTWFuYWdlZFBvbGljeU5hbWUoJ0FtYXpvbkFQSUdhdGV3YXlBZG1pbmlzdHJhdG9yJyksXG4gICAgICBdLFxuICAgIH0pO1xuICAgIHJldHVybiByb2xlXG4gICAgfVxufVxuIl19