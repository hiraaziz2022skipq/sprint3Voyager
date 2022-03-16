"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Hirapipelinestack = void 0;
const aws_cdk_lib_1 = require("aws-cdk-lib");
const cdk = require("aws-cdk-lib");
const aws_codepipeline_actions_1 = require("aws-cdk-lib/aws-codepipeline-actions");
const hirastage_1 = require("./hirastage");
const pipelines_1 = require("aws-cdk-lib/pipelines");
const app = new cdk.App();
class Hirapipelinestack extends aws_cdk_lib_1.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // Using Secrets Manager to provide the access token to authenticate to GitHub
        const input = aws_cdk_lib_1.pipelines.CodePipelineSource.gitHub('hiraaziz2022skipq/sprint3Voyager', "main", {
            authentication: cdk.SecretValue.secretsManager('webtken'),
            trigger: aws_codepipeline_actions_1.GitHubTrigger.POLL,
        });
        /**
        ShellStep()
                                            
        id -> 'synth'
        input -> source
        commands -> commands to run in pipeline
        primary_output_directory -> : Directory that will contain primary output fileset when script run
        
        **/
        const synth = new aws_cdk_lib_1.pipelines.ShellStep('Synth', {
            input: input,
            commands: ["cd sprint5hira", "npm ci", "npx cdk synth"],
            primaryOutputDirectory: "sprint5hira/cdk.out"
        });
        // Connecting to the github
        const pipeline = new aws_cdk_lib_1.pipelines.CodePipeline(this, 'Pipeline', { synth: synth });
        // Adding Test and commands
        const unit_test = new pipelines_1.ShellStep("Unit_Test", {
            commands: ["cd sprint5hira", "npm ci", "npm run test"]
        });
        // Instantiate Beta stage
        const stagebeta = new hirastage_1.Hirastage(this, "betastage");
        // Adding beta stage to the pipeline and  unit test as pre stage
        pipeline.addStage(stagebeta, { pre: [unit_test] });
        // Creating Production stage
        const prod = new hirastage_1.Hirastage(this, "prod");
        // Adding product to pipeline and manual approval as pre stage
        pipeline.addStage(prod, { pre: [new pipelines_1.ManualApprovalStep("Waiting for your approval")] });
    }
}
exports.Hirapipelinestack = Hirapipelinestack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGlyYXBpcGVsaW5lc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJoaXJhcGlwZWxpbmVzdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSw2Q0FBMEQ7QUFFMUQsbUNBQW1DO0FBQ25DLG1GQUFxRTtBQUNyRSwyQ0FBcUM7QUFDckMscURBQXNFO0FBQ3RFLE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBRzFCLE1BQWEsaUJBQWtCLFNBQVEsbUJBQUs7SUFDeEMsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUFrQjtRQUMxRCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUd4Qiw4RUFBOEU7UUFDOUUsTUFBTSxLQUFLLEdBQUcsdUJBQVMsQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsa0NBQWtDLEVBQUUsTUFBTSxFQUFDO1lBQ3ZELGNBQWMsRUFBQyxHQUFHLENBQUMsV0FBVyxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUM7WUFDeEQsT0FBTyxFQUFDLHdDQUFhLENBQUMsSUFBSTtTQUFFLENBQUMsQ0FBQTtRQUVqRTs7Ozs7Ozs7V0FRRztRQUVMLE1BQU0sS0FBSyxHQUFHLElBQUksdUJBQVMsQ0FBQyxTQUFTLENBQUMsT0FBTyxFQUFFO1lBQ1QsS0FBSyxFQUFFLEtBQUs7WUFDWixRQUFRLEVBQUUsQ0FBQyxnQkFBZ0IsRUFBQyxRQUFRLEVBQUMsZUFBZSxDQUFDO1lBQ3JELHNCQUFzQixFQUFHLHFCQUFxQjtTQUFDLENBQUMsQ0FBQTtRQUd0RiwyQkFBMkI7UUFDM0IsTUFBTSxRQUFRLEdBQUcsSUFBSSx1QkFBUyxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsVUFBVSxFQUFFLEVBQUMsS0FBSyxFQUFFLEtBQUssRUFBQyxDQUFDLENBQUM7UUFHNUUsMkJBQTJCO1FBQzNCLE1BQU0sU0FBUyxHQUFFLElBQUkscUJBQVMsQ0FBQyxXQUFXLEVBQUM7WUFDM0MsUUFBUSxFQUFDLENBQUMsZ0JBQWdCLEVBQUMsUUFBUSxFQUFDLGNBQWMsQ0FBQztTQUFDLENBQUMsQ0FBQTtRQUdyRCx5QkFBeUI7UUFDekIsTUFBTSxTQUFTLEdBQUcsSUFBSSxxQkFBUyxDQUFDLElBQUksRUFBQyxXQUFXLENBQUMsQ0FBQTtRQUNqRCxnRUFBZ0U7UUFDaEUsUUFBUSxDQUFDLFFBQVEsQ0FBQyxTQUFTLEVBQUMsRUFBQyxHQUFHLEVBQUMsQ0FBQyxTQUFTLENBQUMsRUFBQyxDQUFDLENBQUE7UUFHOUMsNEJBQTRCO1FBQzVCLE1BQU0sSUFBSSxHQUFDLElBQUkscUJBQVMsQ0FBQyxJQUFJLEVBQUMsTUFBTSxDQUFDLENBQUE7UUFDckMsOERBQThEO1FBQzlELFFBQVEsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFDLEVBQUMsR0FBRyxFQUFDLENBQUMsSUFBSSw4QkFBa0IsQ0FBQywyQkFBMkIsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFBO0lBQUEsQ0FBQztDQUd6RjtBQS9DSCw4Q0ErQ0ciLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBwaXBlbGluZXMsIFN0YWNrLCBTdGFja1Byb3BzfSBmcm9tICdhd3MtY2RrLWxpYic7XHJcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xyXG5pbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xyXG5pbXBvcnQgeyBHaXRIdWJUcmlnZ2VyIH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWNvZGVwaXBlbGluZS1hY3Rpb25zJztcclxuaW1wb3J0IHtIaXJhc3RhZ2V9IGZyb20gJy4vaGlyYXN0YWdlJ1xyXG5pbXBvcnQgeyBNYW51YWxBcHByb3ZhbFN0ZXAsIFNoZWxsU3RlcCB9IGZyb20gJ2F3cy1jZGstbGliL3BpcGVsaW5lcyc7XHJcbmNvbnN0IGFwcCA9IG5ldyBjZGsuQXBwKCk7XHJcblxyXG5cclxuZXhwb3J0IGNsYXNzIEhpcmFwaXBlbGluZXN0YWNrIGV4dGVuZHMgU3RhY2sge1xyXG4gICAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBTdGFja1Byb3BzKSB7XHJcbiAgICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xyXG5cclxuICAgICAgXHJcbiAgICAgIC8vIFVzaW5nIFNlY3JldHMgTWFuYWdlciB0byBwcm92aWRlIHRoZSBhY2Nlc3MgdG9rZW4gdG8gYXV0aGVudGljYXRlIHRvIEdpdEh1YlxyXG4gICAgICBjb25zdCBpbnB1dCA9IHBpcGVsaW5lcy5Db2RlUGlwZWxpbmVTb3VyY2UuZ2l0SHViKCdoaXJhYXppejIwMjJza2lwcS9zcHJpbnQzVm95YWdlcicsIFwibWFpblwiLHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdXRoZW50aWNhdGlvbjpjZGsuU2VjcmV0VmFsdWUuc2VjcmV0c01hbmFnZXIoJ3dlYnRrZW4nKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmlnZ2VyOkdpdEh1YlRyaWdnZXIuUE9MTCx9KVxyXG5cclxuICAgICAgICAvKiogXHJcbiAgICAgICAgU2hlbGxTdGVwKClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICBpZCAtPiAnc3ludGgnXHJcbiAgICAgICAgaW5wdXQgLT4gc291cmNlXHJcbiAgICAgICAgY29tbWFuZHMgLT4gY29tbWFuZHMgdG8gcnVuIGluIHBpcGVsaW5lXHJcbiAgICAgICAgcHJpbWFyeV9vdXRwdXRfZGlyZWN0b3J5IC0+IDogRGlyZWN0b3J5IHRoYXQgd2lsbCBjb250YWluIHByaW1hcnkgb3V0cHV0IGZpbGVzZXQgd2hlbiBzY3JpcHQgcnVuXHJcbiAgICAgICAgXHJcbiAgICAgICAgKiovXHJcblxyXG4gICAgICBjb25zdCBzeW50aCA9IG5ldyBwaXBlbGluZXMuU2hlbGxTdGVwKCdTeW50aCcsIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnB1dDogaW5wdXQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tbWFuZHM6IFtcImNkIHNwcmludDVoaXJhXCIsXCJucG0gY2lcIixcIm5weCBjZGsgc3ludGhcIl0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJpbWFyeU91dHB1dERpcmVjdG9yeSA6IFwic3ByaW50NWhpcmEvY2RrLm91dFwifSlcclxuXHJcblxyXG4gICAgICAvLyBDb25uZWN0aW5nIHRvIHRoZSBnaXRodWJcclxuICAgICAgY29uc3QgcGlwZWxpbmUgPSBuZXcgcGlwZWxpbmVzLkNvZGVQaXBlbGluZSh0aGlzLCAnUGlwZWxpbmUnLCB7c3ludGg6IHN5bnRofSk7XHJcblxyXG5cclxuICAgICAgICAvLyBBZGRpbmcgVGVzdCBhbmQgY29tbWFuZHNcclxuICAgICAgICBjb25zdCB1bml0X3Rlc3Q9IG5ldyBTaGVsbFN0ZXAoXCJVbml0X1Rlc3RcIix7XHJcbiAgICAgICAgY29tbWFuZHM6W1wiY2Qgc3ByaW50NWhpcmFcIixcIm5wbSBjaVwiLFwibnBtIHJ1biB0ZXN0XCJdfSlcclxuXHJcblxyXG4gICAgICAgIC8vIEluc3RhbnRpYXRlIEJldGEgc3RhZ2VcclxuICAgICAgICBjb25zdCBzdGFnZWJldGEgPSBuZXcgSGlyYXN0YWdlKHRoaXMsXCJiZXRhc3RhZ2VcIilcclxuICAgICAgICAvLyBBZGRpbmcgYmV0YSBzdGFnZSB0byB0aGUgcGlwZWxpbmUgYW5kICB1bml0IHRlc3QgYXMgcHJlIHN0YWdlXHJcbiAgICAgICAgcGlwZWxpbmUuYWRkU3RhZ2Uoc3RhZ2ViZXRhLHtwcmU6W3VuaXRfdGVzdF19KVxyXG5cclxuXHJcbiAgICAgICAgLy8gQ3JlYXRpbmcgUHJvZHVjdGlvbiBzdGFnZVxyXG4gICAgICAgIGNvbnN0IHByb2Q9bmV3IEhpcmFzdGFnZSh0aGlzLFwicHJvZFwiKVxyXG4gICAgICAgIC8vIEFkZGluZyBwcm9kdWN0IHRvIHBpcGVsaW5lIGFuZCBtYW51YWwgYXBwcm92YWwgYXMgcHJlIHN0YWdlXHJcbiAgICAgICAgcGlwZWxpbmUuYWRkU3RhZ2UocHJvZCx7cHJlOltuZXcgTWFudWFsQXBwcm92YWxTdGVwKFwiV2FpdGluZyBmb3IgeW91ciBhcHByb3ZhbFwiKV19KX1cclxuICBcclxuXHJcbiAgfSJdfQ==