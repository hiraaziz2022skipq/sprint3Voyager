"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Hirapipelinestack = void 0;
const aws_cdk_lib_1 = require("aws-cdk-lib");
const aws_iam_1 = require("aws-cdk-lib/aws-iam");
const cdk = require("aws-cdk-lib");
const aws_codepipeline_actions_1 = require("aws-cdk-lib/aws-codepipeline-actions");
const app = new cdk.App();
class Hirapipelinestack extends aws_cdk_lib_1.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // creating pipelines
        const pipeline = new aws_cdk_lib_1.pipelines.CodePipeline(this, 'Pipeline', {
            synth: new aws_cdk_lib_1.pipelines.CodeBuildStep('Synth', {
                input: aws_cdk_lib_1.pipelines.CodePipelineSource.gitHub('hiraaziz2022skipq/sprint3Voyager', 'branch', {
                    // This is optional
                    authentication: cdk.SecretValue.secretsManager('webtken'),
                    trigger: aws_codepipeline_actions_1.GitHubTrigger.POLL,
                }),
                // pipelines.CodePipelineSource.connection('hiraaziz2022skipq/Voyager', 'main',{
                //     connectionArn: 'arn:aws:secretsmanager:us-west-1:315997497220:secret:webtken-RRczq1'}),
                commands: ["cd hira4sprint/", "npm ci", "npx cdk synth"],
                primaryOutputDirectory: "hira3sprint/cdk.out",
                role: this.create_role()
            }),
        });
        //   var beta=new Hirastagestack(this,"beta")
        //   pipeline.addStage(beta)
        // var prod=new Hirastagestack(this,"prod")
        // pipeline.addStage.arguments(prod)
    }
    create_role() {
        const role = new aws_iam_1.Role(this, 'example-iam-role', {
            assumedBy: new aws_iam_1.ServicePrincipal('lambda.amazonaws.com'),
            description: 'An example IAM role in AWS CDK',
            managedPolicies: [
                aws_iam_1.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchFullAccess'),
                aws_iam_1.ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess'),
                aws_iam_1.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
                aws_iam_1.ManagedPolicy.fromAwsManagedPolicyName("AWSCodePipeline_FullAccess"),
                aws_iam_1.ManagedPolicy.fromAwsManagedPolicyName("AmazonS3FullAccess"),
                aws_iam_1.ManagedPolicy.fromAwsManagedPolicyName("AwsCloudFormationFullAccess"),
            ],
        });
        return role;
    }
}
exports.Hirapipelinestack = Hirapipelinestack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGlyYXBpcGVsaW5lc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJoaXJhcGlwZWxpbmVzdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSw2Q0FBbUY7QUFHbkYsaURBQTRFO0FBQzVFLG1DQUFtQztBQUNuQyxtRkFBcUU7QUFFckUsTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUM7QUFFMUIsTUFBYSxpQkFBa0IsU0FBUSxtQkFBSztJQUN4QyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQWtCO1FBQzFELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLHFCQUFxQjtRQUNyQixNQUFNLFFBQVEsR0FBRyxJQUFJLHVCQUFTLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxVQUFVLEVBQUU7WUFDcEQsS0FBSyxFQUFFLElBQUksdUJBQVMsQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFO2dCQUNwQyxLQUFLLEVBQUUsdUJBQVMsQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsa0NBQWtDLEVBQUUsUUFBUSxFQUFFO29CQUN2RixtQkFBbUI7b0JBQ25CLGNBQWMsRUFBRSxHQUFHLENBQUMsV0FBVyxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUM7b0JBQ3pELE9BQU8sRUFBQyx3Q0FBYSxDQUFDLElBQUk7aUJBQUUsQ0FBQztnQkFFL0IsZ0ZBQWdGO2dCQUNoRiw4RkFBOEY7Z0JBQzlGLFFBQVEsRUFBRSxDQUFDLGlCQUFpQixFQUFDLFFBQVEsRUFBQyxlQUFlLENBQUM7Z0JBQ3RELHNCQUFzQixFQUFFLHFCQUFxQjtnQkFDN0MsSUFBSSxFQUFDLElBQUksQ0FBQyxXQUFXLEVBQUU7YUFDOUIsQ0FBQztTQUNYLENBQUMsQ0FBQztRQUVMLDZDQUE2QztRQUM3Qyw0QkFBNEI7UUFFMUIsMkNBQTJDO1FBQzNDLG9DQUFvQztJQUN0QyxDQUFDO0lBSUQsV0FBVztRQUNQLE1BQU0sSUFBSSxHQUFHLElBQUksY0FBSSxDQUFDLElBQUksRUFBRSxrQkFBa0IsRUFBRTtZQUM5QyxTQUFTLEVBQUUsSUFBSSwwQkFBZ0IsQ0FBQyxzQkFBc0IsQ0FBQztZQUN2RCxXQUFXLEVBQUUsZ0NBQWdDO1lBQzdDLGVBQWUsRUFBRTtnQkFDZix1QkFBYSxDQUFDLHdCQUF3QixDQUFDLHNCQUFzQixDQUFDO2dCQUM5RCx1QkFBYSxDQUFDLHdCQUF3QixDQUFDLDBCQUEwQixDQUFDO2dCQUNsRSx1QkFBYSxDQUFDLHdCQUF3QixDQUFDLDBDQUEwQyxDQUFDO2dCQUNsRix1QkFBYSxDQUFDLHdCQUF3QixDQUFDLDRCQUE0QixDQUFDO2dCQUNwRSx1QkFBYSxDQUFDLHdCQUF3QixDQUFDLG9CQUFvQixDQUFDO2dCQUM1RCx1QkFBYSxDQUFDLHdCQUF3QixDQUFDLDZCQUE2QixDQUFDO2FBQ3RFO1NBQ0YsQ0FBQyxDQUFDO1FBQ0gsT0FBTyxJQUFJLENBQUE7SUFDYixDQUFDO0NBQ0Y7QUE1Q0wsOENBNENLIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRHVyYXRpb24sIHBpcGVsaW5lcywgUmVtb3ZhbFBvbGljeSwgU3RhY2ssIFN0YWNrUHJvcHN9IGZyb20gJ2F3cy1jZGstbGliJztcclxuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEnO1xyXG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcclxuaW1wb3J0IHsgTWFuYWdlZFBvbGljeSwgUm9sZSwgU2VydmljZVByaW5jaXBhbCB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1pYW0nO1xyXG5pbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xyXG5pbXBvcnQgeyBHaXRIdWJUcmlnZ2VyIH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWNvZGVwaXBlbGluZS1hY3Rpb25zJztcclxuaW1wb3J0IHtIaXJhc3RhZ2VzdGFja30gZnJvbSAnLi9oaXJhc3RhZ2VzdGFjaydcclxuY29uc3QgYXBwID0gbmV3IGNkay5BcHAoKTtcclxuXHJcbmV4cG9ydCBjbGFzcyBIaXJhcGlwZWxpbmVzdGFjayBleHRlbmRzIFN0YWNrIHtcclxuICAgIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogU3RhY2tQcm9wcykge1xyXG4gICAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcclxuXHJcbiAgICAgIC8vIGNyZWF0aW5nIHBpcGVsaW5lc1xyXG4gICAgICBjb25zdCBwaXBlbGluZSA9IG5ldyBwaXBlbGluZXMuQ29kZVBpcGVsaW5lKHRoaXMsICdQaXBlbGluZScsIHtcclxuICAgICAgICAgICAgICAgIHN5bnRoOiBuZXcgcGlwZWxpbmVzLkNvZGVCdWlsZFN0ZXAoJ1N5bnRoJywge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbnB1dDogcGlwZWxpbmVzLkNvZGVQaXBlbGluZVNvdXJjZS5naXRIdWIoJ2hpcmFheml6MjAyMnNraXBxL3NwcmludDNWb3lhZ2VyJywgJ2JyYW5jaCcsIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUaGlzIGlzIG9wdGlvbmFsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgYXV0aGVudGljYXRpb246IGNkay5TZWNyZXRWYWx1ZS5zZWNyZXRzTWFuYWdlcignd2VidGtlbicpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHRyaWdnZXI6R2l0SHViVHJpZ2dlci5QT0xMLH0pLFxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gcGlwZWxpbmVzLkNvZGVQaXBlbGluZVNvdXJjZS5jb25uZWN0aW9uKCdoaXJhYXppejIwMjJza2lwcS9Wb3lhZ2VyJywgJ21haW4nLHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgIGNvbm5lY3Rpb25Bcm46ICdhcm46YXdzOnNlY3JldHNtYW5hZ2VyOnVzLXdlc3QtMTozMTU5OTc0OTcyMjA6c2VjcmV0OndlYnRrZW4tUlJjenExJ30pLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb21tYW5kczogW1wiY2QgaGlyYTRzcHJpbnQvXCIsXCJucG0gY2lcIixcIm5weCBjZGsgc3ludGhcIl0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByaW1hcnlPdXRwdXREaXJlY3Rvcnk6IFwiaGlyYTNzcHJpbnQvY2RrLm91dFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICByb2xlOnRoaXMuY3JlYXRlX3JvbGUoKVxyXG4gICAgICAgICAgICAgICAgfSksXHJcbiAgICAgIH0pO1xyXG4gICAgICBcclxuICAgIC8vICAgdmFyIGJldGE9bmV3IEhpcmFzdGFnZXN0YWNrKHRoaXMsXCJiZXRhXCIpXHJcbiAgICAvLyAgIHBpcGVsaW5lLmFkZFN0YWdlKGJldGEpXHJcblxyXG4gICAgICAvLyB2YXIgcHJvZD1uZXcgSGlyYXN0YWdlc3RhY2sodGhpcyxcInByb2RcIilcclxuICAgICAgLy8gcGlwZWxpbmUuYWRkU3RhZ2UuYXJndW1lbnRzKHByb2QpXHJcbiAgICB9XHJcbiAgXHJcblxyXG5cclxuICAgIGNyZWF0ZV9yb2xlKCk6YW55e1xyXG4gICAgICAgIGNvbnN0IHJvbGUgPSBuZXcgUm9sZSh0aGlzLCAnZXhhbXBsZS1pYW0tcm9sZScsIHtcclxuICAgICAgICAgIGFzc3VtZWRCeTogbmV3IFNlcnZpY2VQcmluY2lwYWwoJ2xhbWJkYS5hbWF6b25hd3MuY29tJyksXHJcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ0FuIGV4YW1wbGUgSUFNIHJvbGUgaW4gQVdTIENESycsXHJcbiAgICAgICAgICBtYW5hZ2VkUG9saWNpZXM6IFtcclxuICAgICAgICAgICAgTWFuYWdlZFBvbGljeS5mcm9tQXdzTWFuYWdlZFBvbGljeU5hbWUoJ0Nsb3VkV2F0Y2hGdWxsQWNjZXNzJyksXHJcbiAgICAgICAgICAgIE1hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKCdBbWF6b25EeW5hbW9EQkZ1bGxBY2Nlc3MnKSxcclxuICAgICAgICAgICAgTWFuYWdlZFBvbGljeS5mcm9tQXdzTWFuYWdlZFBvbGljeU5hbWUoJ3NlcnZpY2Utcm9sZS9BV1NMYW1iZGFCYXNpY0V4ZWN1dGlvblJvbGUnKSxcclxuICAgICAgICAgICAgTWFuYWdlZFBvbGljeS5mcm9tQXdzTWFuYWdlZFBvbGljeU5hbWUoXCJBV1NDb2RlUGlwZWxpbmVfRnVsbEFjY2Vzc1wiKSxcclxuICAgICAgICAgICAgTWFuYWdlZFBvbGljeS5mcm9tQXdzTWFuYWdlZFBvbGljeU5hbWUoXCJBbWF6b25TM0Z1bGxBY2Nlc3NcIiksXHJcbiAgICAgICAgICAgIE1hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKFwiQXdzQ2xvdWRGb3JtYXRpb25GdWxsQWNjZXNzXCIpLFxyXG4gICAgICAgICAgXSxcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gcm9sZVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiJdfQ==