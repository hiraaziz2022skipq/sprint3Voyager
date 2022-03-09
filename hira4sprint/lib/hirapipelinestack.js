"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Hirapipelinestack = void 0;
const aws_cdk_lib_1 = require("aws-cdk-lib");
const cdk = require("aws-cdk-lib");
const aws_codepipeline_actions_1 = require("aws-cdk-lib/aws-codepipeline-actions");
const app = new cdk.App();
class Hirapipelinestack extends aws_cdk_lib_1.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        const pipeline = new aws_cdk_lib_1.pipelines.CodePipeline(this, 'Pipeline', {
            synth: new aws_cdk_lib_1.pipelines.ShellStep('Synth', {
                //^ Using Secrets Manager to provide the access token to authenticate to GitHub
                input: aws_cdk_lib_1.pipelines.CodePipelineSource.gitHub('hiraaziz2022skipq/sprint3Voyager', "main", {
                    authentication: cdk.SecretValue.secretsManager('webtken'),
                    trigger: aws_codepipeline_actions_1.GitHubTrigger.POLL,
                }),
                commands: [
                    "cd hira4sprint", "npm ci", "npx cdk synth"
                ],
                primaryOutputDirectory: "hira4sprint/cdk.out"
            })
        });
        // creating pipelines
        // const pipeline = new pipelines.CodePipeline(this, 'Pipeline', {
        //           synth: new pipelines.CodeBuildStep('Synth', {
        //                   input: pipelines.CodePipelineSource.gitHub('hiraaziz2022skipq/sprint3Voyager', 'branch', {
        //                     // This is optional
        //                     authentication: cdk.SecretValue.secretsManager('webtken'),
        //                     trigger:GitHubTrigger.POLL,}),
        //                   // pipelines.CodePipelineSource.connection('hiraaziz2022skipq/Voyager', 'main',{
        //                   //     connectionArn: 'arn:aws:secretsmanager:us-west-1:315997497220:secret:webtken-RRczq1'}),
        //                   commands: ["cd hira4sprint/","npm ci","npx cdk synth"],
        //                   primaryOutputDirectory: "hira3sprint/cdk.out",
        //                   role:this.create_role()
        //           }),
        // });
        // var beta=new Hirastagestack(this,"beta")
        // pipeline.addStage(beta)
        // var prod=new Hirastagestack(this,"prod")
        // pipeline.addStage.arguments(prod)
    }
}
exports.Hirapipelinestack = Hirapipelinestack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGlyYXBpcGVsaW5lc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJoaXJhcGlwZWxpbmVzdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSw2Q0FBbUY7QUFJbkYsbUNBQW1DO0FBQ25DLG1GQUFxRTtBQUVyRSxNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUUxQixNQUFhLGlCQUFrQixTQUFRLG1CQUFLO0lBQ3hDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBa0I7UUFDMUQsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsTUFBTSxRQUFRLEdBQUcsSUFBSSx1QkFBUyxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsVUFBVSxFQUFFO1lBQzVELEtBQUssRUFBRSxJQUFJLHVCQUFTLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRTtnQkFDMUMsK0VBQStFO2dCQUMzRSxLQUFLLEVBQUUsdUJBQVMsQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsa0NBQWtDLEVBQUUsTUFBTSxFQUFDO29CQUNwRixjQUFjLEVBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDO29CQUN4RCxPQUFPLEVBQUMsd0NBQWEsQ0FBQyxJQUFJO2lCQUFFLENBQUM7Z0JBQzlCLFFBQVEsRUFBRTtvQkFDVCxnQkFBZ0IsRUFBQyxRQUFRLEVBQUMsZUFBZTtpQkFDMUM7Z0JBQ0gsc0JBQXNCLEVBQUcscUJBQXFCO2FBQzdDLENBQUM7U0FDRCxDQUFDLENBQUM7UUFLTCxxQkFBcUI7UUFDckIsa0VBQWtFO1FBQ2xFLDBEQUEwRDtRQUMxRCwrR0FBK0c7UUFDL0csMENBQTBDO1FBQzFDLGlGQUFpRjtRQUNqRixxREFBcUQ7UUFFckQscUdBQXFHO1FBQ3JHLG1IQUFtSDtRQUNuSCw0RUFBNEU7UUFDNUUsbUVBQW1FO1FBQ25FLDRDQUE0QztRQUM1QyxnQkFBZ0I7UUFDaEIsTUFBTTtRQUVOLDJDQUEyQztRQUMzQywwQkFBMEI7UUFFMUIsMkNBQTJDO1FBQzNDLG9DQUFvQztJQUN0QyxDQUFDO0NBbUJBO0FBNURMLDhDQTRESyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IER1cmF0aW9uLCBwaXBlbGluZXMsIFJlbW92YWxQb2xpY3ksIFN0YWNrLCBTdGFja1Byb3BzfSBmcm9tICdhd3MtY2RrLWxpYic7XHJcbmltcG9ydCAqIGFzIGxhbWJkYSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbGFtYmRhJztcclxuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XHJcbmltcG9ydCB7IE1hbmFnZWRQb2xpY3ksIFJvbGUsIFNlcnZpY2VQcmluY2lwYWwgfSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtaWFtJztcclxuaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcclxuaW1wb3J0IHsgR2l0SHViVHJpZ2dlciB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1jb2RlcGlwZWxpbmUtYWN0aW9ucyc7XHJcbmltcG9ydCB7SGlyYXN0YWdlc3RhY2t9IGZyb20gJy4vaGlyYXN0YWdlc3RhY2snXHJcbmNvbnN0IGFwcCA9IG5ldyBjZGsuQXBwKCk7XHJcblxyXG5leHBvcnQgY2xhc3MgSGlyYXBpcGVsaW5lc3RhY2sgZXh0ZW5kcyBTdGFjayB7XHJcbiAgICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wcz86IFN0YWNrUHJvcHMpIHtcclxuICAgICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XHJcblxyXG4gICAgICBjb25zdCBwaXBlbGluZSA9IG5ldyBwaXBlbGluZXMuQ29kZVBpcGVsaW5lKHRoaXMsICdQaXBlbGluZScsIHtcclxuICAgICAgICBzeW50aDogbmV3IHBpcGVsaW5lcy5TaGVsbFN0ZXAoJ1N5bnRoJywge1xyXG4gICAgICAvL14gVXNpbmcgU2VjcmV0cyBNYW5hZ2VyIHRvIHByb3ZpZGUgdGhlIGFjY2VzcyB0b2tlbiB0byBhdXRoZW50aWNhdGUgdG8gR2l0SHViXHJcbiAgICAgICAgICBpbnB1dDogcGlwZWxpbmVzLkNvZGVQaXBlbGluZVNvdXJjZS5naXRIdWIoJ2hpcmFheml6MjAyMnNraXBxL3NwcmludDNWb3lhZ2VyJywgXCJtYWluXCIse1xyXG4gICAgICAgICAgICBhdXRoZW50aWNhdGlvbjpjZGsuU2VjcmV0VmFsdWUuc2VjcmV0c01hbmFnZXIoJ3dlYnRrZW4nKSxcclxuICAgICAgICAgICAgdHJpZ2dlcjpHaXRIdWJUcmlnZ2VyLlBPTEwsfSksXHJcbiAgICAgICAgICAgY29tbWFuZHM6IFtcclxuICAgICAgICAgICAgXCJjZCBoaXJhNHNwcmludFwiLFwibnBtIGNpXCIsXCJucHggY2RrIHN5bnRoXCJcclxuICAgICAgICAgIF0sXHJcbiAgICAgICAgcHJpbWFyeU91dHB1dERpcmVjdG9yeSA6IFwiaGlyYTRzcHJpbnQvY2RrLm91dFwiXHJcbiAgICAgICAgfSlcclxuICAgICAgICB9KTtcclxuXHJcblxyXG5cclxuXHJcbiAgICAgIC8vIGNyZWF0aW5nIHBpcGVsaW5lc1xyXG4gICAgICAvLyBjb25zdCBwaXBlbGluZSA9IG5ldyBwaXBlbGluZXMuQ29kZVBpcGVsaW5lKHRoaXMsICdQaXBlbGluZScsIHtcclxuICAgICAgLy8gICAgICAgICAgIHN5bnRoOiBuZXcgcGlwZWxpbmVzLkNvZGVCdWlsZFN0ZXAoJ1N5bnRoJywge1xyXG4gICAgICAvLyAgICAgICAgICAgICAgICAgICBpbnB1dDogcGlwZWxpbmVzLkNvZGVQaXBlbGluZVNvdXJjZS5naXRIdWIoJ2hpcmFheml6MjAyMnNraXBxL3NwcmludDNWb3lhZ2VyJywgJ2JyYW5jaCcsIHtcclxuICAgICAgLy8gICAgICAgICAgICAgICAgICAgICAvLyBUaGlzIGlzIG9wdGlvbmFsXHJcbiAgICAgIC8vICAgICAgICAgICAgICAgICAgICAgYXV0aGVudGljYXRpb246IGNkay5TZWNyZXRWYWx1ZS5zZWNyZXRzTWFuYWdlcignd2VidGtlbicpLFxyXG4gICAgICAvLyAgICAgICAgICAgICAgICAgICAgIHRyaWdnZXI6R2l0SHViVHJpZ2dlci5QT0xMLH0pLFxyXG5cclxuICAgICAgLy8gICAgICAgICAgICAgICAgICAgLy8gcGlwZWxpbmVzLkNvZGVQaXBlbGluZVNvdXJjZS5jb25uZWN0aW9uKCdoaXJhYXppejIwMjJza2lwcS9Wb3lhZ2VyJywgJ21haW4nLHtcclxuICAgICAgLy8gICAgICAgICAgICAgICAgICAgLy8gICAgIGNvbm5lY3Rpb25Bcm46ICdhcm46YXdzOnNlY3JldHNtYW5hZ2VyOnVzLXdlc3QtMTozMTU5OTc0OTcyMjA6c2VjcmV0OndlYnRrZW4tUlJjenExJ30pLFxyXG4gICAgICAvLyAgICAgICAgICAgICAgICAgICBjb21tYW5kczogW1wiY2QgaGlyYTRzcHJpbnQvXCIsXCJucG0gY2lcIixcIm5weCBjZGsgc3ludGhcIl0sXHJcbiAgICAgIC8vICAgICAgICAgICAgICAgICAgIHByaW1hcnlPdXRwdXREaXJlY3Rvcnk6IFwiaGlyYTNzcHJpbnQvY2RrLm91dFwiLFxyXG4gICAgICAvLyAgICAgICAgICAgICAgICAgICByb2xlOnRoaXMuY3JlYXRlX3JvbGUoKVxyXG4gICAgICAvLyAgICAgICAgICAgfSksXHJcbiAgICAgIC8vIH0pO1xyXG4gICAgICBcclxuICAgICAgLy8gdmFyIGJldGE9bmV3IEhpcmFzdGFnZXN0YWNrKHRoaXMsXCJiZXRhXCIpXHJcbiAgICAgIC8vIHBpcGVsaW5lLmFkZFN0YWdlKGJldGEpXHJcblxyXG4gICAgICAvLyB2YXIgcHJvZD1uZXcgSGlyYXN0YWdlc3RhY2sodGhpcyxcInByb2RcIilcclxuICAgICAgLy8gcGlwZWxpbmUuYWRkU3RhZ2UuYXJndW1lbnRzKHByb2QpXHJcbiAgICB9XHJcbiAgXHJcblxyXG5cclxuICAgIC8vIGNyZWF0ZV9yb2xlKCk6YW55e1xyXG4gICAgLy8gICAgIGNvbnN0IHJvbGUgPSBuZXcgUm9sZSh0aGlzLCAnZXhhbXBsZS1pYW0tcm9sZScsIHtcclxuICAgIC8vICAgICAgIGFzc3VtZWRCeTogbmV3IFNlcnZpY2VQcmluY2lwYWwoJ2xhbWJkYS5hbWF6b25hd3MuY29tJyksXHJcbiAgICAvLyAgICAgICBkZXNjcmlwdGlvbjogJ0FuIGV4YW1wbGUgSUFNIHJvbGUgaW4gQVdTIENESycsXHJcbiAgICAvLyAgICAgICBtYW5hZ2VkUG9saWNpZXM6IFtcclxuICAgIC8vICAgICAgICAgTWFuYWdlZFBvbGljeS5mcm9tQXdzTWFuYWdlZFBvbGljeU5hbWUoJ0Nsb3VkV2F0Y2hGdWxsQWNjZXNzJyksXHJcbiAgICAvLyAgICAgICAgIE1hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKCdBbWF6b25EeW5hbW9EQkZ1bGxBY2Nlc3MnKSxcclxuICAgIC8vICAgICAgICAgTWFuYWdlZFBvbGljeS5mcm9tQXdzTWFuYWdlZFBvbGljeU5hbWUoJ3NlcnZpY2Utcm9sZS9BV1NMYW1iZGFCYXNpY0V4ZWN1dGlvblJvbGUnKSxcclxuICAgIC8vICAgICAgICAgTWFuYWdlZFBvbGljeS5mcm9tQXdzTWFuYWdlZFBvbGljeU5hbWUoXCJBV1NDb2RlUGlwZWxpbmVfRnVsbEFjY2Vzc1wiKSxcclxuICAgIC8vICAgICAgICAgTWFuYWdlZFBvbGljeS5mcm9tQXdzTWFuYWdlZFBvbGljeU5hbWUoXCJBbWF6b25TM0Z1bGxBY2Nlc3NcIiksXHJcbiAgICAvLyAgICAgICAgIE1hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKFwiQXdzQ2xvdWRGb3JtYXRpb25GdWxsQWNjZXNzXCIpLFxyXG4gICAgLy8gICAgICAgXSxcclxuICAgIC8vICAgICB9KTtcclxuICAgIC8vICAgICByZXR1cm4gcm9sZVxyXG4gICAgLy8gICB9XHJcbiAgICB9XHJcbiJdfQ==