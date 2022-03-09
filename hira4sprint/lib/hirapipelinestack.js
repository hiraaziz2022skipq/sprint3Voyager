"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Hirapipelinestack = void 0;
const aws_cdk_lib_1 = require("aws-cdk-lib");
const cdk = require("aws-cdk-lib");
const aws_codepipeline_actions_1 = require("aws-cdk-lib/aws-codepipeline-actions");
const hirastagestack_1 = require("./hirastagestack");
const pipelines_1 = require("aws-cdk-lib/pipelines");
// const {Hirastagestack}=require('./hirastagestack')
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
            commands: ["cd hira4sprint", "npm ci", "npx cdk synth"],
            primaryOutputDirectory: "hira4sprint/cdk.out"
        });
        // Connecting to the github
        const pipeline = new aws_cdk_lib_1.pipelines.CodePipeline(this, 'Pipeline', { synth: synth });
        // Adding Test and commands
        const unit_test = new pipelines_1.ShellStep("Unit_Test", {
            commands: ["cd hira4sprint", "npm ci", "npm run test"]
        });
        // Instantiate Beta stage
        const stagebeta = new hirastagestack_1.Hirastagestack(this, "betastage");
        // Adding beta stage to the pipeline and  unit test as pre stage
        pipeline.addStage(stagebeta, { pre: [unit_test] });
        // Creating Production stage
        const prod = new hirastagestack_1.Hirastagestack(this, "prod");
        // Adding product to pipeline and manual approval as pre stage
        pipeline.addStage(prod, { pre: [new pipelines_1.ManualApprovalStep("Waiting for your approval")] });
    }
}
exports.Hirapipelinestack = Hirapipelinestack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGlyYXBpcGVsaW5lc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJoaXJhcGlwZWxpbmVzdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSw2Q0FBbUY7QUFJbkYsbUNBQW1DO0FBQ25DLG1GQUFxRTtBQUNyRSxxREFBK0M7QUFDL0MscURBQXNFO0FBQ3RFLHFEQUFxRDtBQUNyRCxNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUUxQixNQUFhLGlCQUFrQixTQUFRLG1CQUFLO0lBQ3hDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBa0I7UUFDMUQsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFHeEIsOEVBQThFO1FBQzlFLE1BQU0sS0FBSyxHQUFHLHVCQUFTLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLGtDQUFrQyxFQUFFLE1BQU0sRUFBQztZQUN2RCxjQUFjLEVBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDO1lBQ3hELE9BQU8sRUFBQyx3Q0FBYSxDQUFDLElBQUk7U0FBRSxDQUFDLENBQUE7UUFFakU7Ozs7Ozs7O1dBUUc7UUFFTCxNQUFNLEtBQUssR0FBRyxJQUFJLHVCQUFTLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRTtZQUMvQixLQUFLLEVBQUUsS0FBSztZQUNaLFFBQVEsRUFBRSxDQUFDLGdCQUFnQixFQUFDLFFBQVEsRUFBQyxlQUFlLENBQUM7WUFDckQsc0JBQXNCLEVBQUcscUJBQXFCO1NBQUMsQ0FBQyxDQUFBO1FBRWhFLDJCQUEyQjtRQUMzQixNQUFNLFFBQVEsR0FBRyxJQUFJLHVCQUFTLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxVQUFVLEVBQUUsRUFBQyxLQUFLLEVBQUUsS0FBSyxFQUFDLENBQUMsQ0FBQztRQUU1RSwyQkFBMkI7UUFDM0IsTUFBTSxTQUFTLEdBQUUsSUFBSSxxQkFBUyxDQUFDLFdBQVcsRUFBQztZQUN6QyxRQUFRLEVBQUMsQ0FBQyxnQkFBZ0IsRUFBQyxRQUFRLEVBQUMsY0FBYyxDQUFDO1NBQ3BELENBQUMsQ0FBQTtRQUdKLHlCQUF5QjtRQUN6QixNQUFNLFNBQVMsR0FBRyxJQUFJLCtCQUFjLENBQUMsSUFBSSxFQUFDLFdBQVcsQ0FBQyxDQUFBO1FBQ3RELGdFQUFnRTtRQUNoRSxRQUFRLENBQUMsUUFBUSxDQUFDLFNBQVMsRUFBQyxFQUFDLEdBQUcsRUFBQyxDQUFDLFNBQVMsQ0FBQyxFQUFDLENBQUMsQ0FBQTtRQUU5Qyw0QkFBNEI7UUFDNUIsTUFBTSxJQUFJLEdBQUMsSUFBSSwrQkFBYyxDQUFDLElBQUksRUFBQyxNQUFNLENBQUMsQ0FBQTtRQUMxQyw4REFBOEQ7UUFDOUQsUUFBUSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUMsRUFBQyxHQUFHLEVBQUMsQ0FBQyxJQUFJLDhCQUFrQixDQUFDLDJCQUEyQixDQUFDLENBQUMsRUFBQyxDQUFDLENBQUE7SUFDckYsQ0FBQztDQUdGO0FBOUNILDhDQThDRyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IER1cmF0aW9uLCBwaXBlbGluZXMsIFJlbW92YWxQb2xpY3ksIFN0YWNrLCBTdGFja1Byb3BzfSBmcm9tICdhd3MtY2RrLWxpYic7XHJcbmltcG9ydCAqIGFzIGxhbWJkYSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbGFtYmRhJztcclxuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XHJcbmltcG9ydCB7IE1hbmFnZWRQb2xpY3ksIFJvbGUsIFNlcnZpY2VQcmluY2lwYWwgfSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtaWFtJztcclxuaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcclxuaW1wb3J0IHsgR2l0SHViVHJpZ2dlciB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1jb2RlcGlwZWxpbmUtYWN0aW9ucyc7XHJcbmltcG9ydCB7SGlyYXN0YWdlc3RhY2t9IGZyb20gJy4vaGlyYXN0YWdlc3RhY2snXHJcbmltcG9ydCB7IE1hbnVhbEFwcHJvdmFsU3RlcCwgU2hlbGxTdGVwIH0gZnJvbSAnYXdzLWNkay1saWIvcGlwZWxpbmVzJztcclxuLy8gY29uc3Qge0hpcmFzdGFnZXN0YWNrfT1yZXF1aXJlKCcuL2hpcmFzdGFnZXN0YWNrJylcclxuY29uc3QgYXBwID0gbmV3IGNkay5BcHAoKTtcclxuXHJcbmV4cG9ydCBjbGFzcyBIaXJhcGlwZWxpbmVzdGFjayBleHRlbmRzIFN0YWNrIHtcclxuICAgIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogU3RhY2tQcm9wcykge1xyXG4gICAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcclxuXHJcbiAgICAgIFxyXG4gICAgICAvLyBVc2luZyBTZWNyZXRzIE1hbmFnZXIgdG8gcHJvdmlkZSB0aGUgYWNjZXNzIHRva2VuIHRvIGF1dGhlbnRpY2F0ZSB0byBHaXRIdWJcclxuICAgICAgY29uc3QgaW5wdXQgPSBwaXBlbGluZXMuQ29kZVBpcGVsaW5lU291cmNlLmdpdEh1YignaGlyYWF6aXoyMDIyc2tpcHEvc3ByaW50M1ZveWFnZXInLCBcIm1haW5cIix7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXV0aGVudGljYXRpb246Y2RrLlNlY3JldFZhbHVlLnNlY3JldHNNYW5hZ2VyKCd3ZWJ0a2VuJyksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJpZ2dlcjpHaXRIdWJUcmlnZ2VyLlBPTEwsfSlcclxuXHJcbiAgICAgICAgLyoqIFxyXG4gICAgICAgIFNoZWxsU3RlcCgpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgaWQgLT4gJ3N5bnRoJ1xyXG4gICAgICAgIGlucHV0IC0+IHNvdXJjZVxyXG4gICAgICAgIGNvbW1hbmRzIC0+IGNvbW1hbmRzIHRvIHJ1biBpbiBwaXBlbGluZVxyXG4gICAgICAgIHByaW1hcnlfb3V0cHV0X2RpcmVjdG9yeSAtPiA6IERpcmVjdG9yeSB0aGF0IHdpbGwgY29udGFpbiBwcmltYXJ5IG91dHB1dCBmaWxlc2V0IHdoZW4gc2NyaXB0IHJ1blxyXG4gICAgICAgIFxyXG4gICAgICAgICoqL1xyXG5cclxuICAgICAgY29uc3Qgc3ludGggPSBuZXcgcGlwZWxpbmVzLlNoZWxsU3RlcCgnU3ludGgnLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICBpbnB1dDogaW5wdXQsXHJcbiAgICAgICAgICAgICAgICAgICAgICBjb21tYW5kczogW1wiY2QgaGlyYTRzcHJpbnRcIixcIm5wbSBjaVwiLFwibnB4IGNkayBzeW50aFwiXSxcclxuICAgICAgICAgICAgICAgICAgICAgIHByaW1hcnlPdXRwdXREaXJlY3RvcnkgOiBcImhpcmE0c3ByaW50L2Nkay5vdXRcIn0pXHJcblxyXG4gICAgICAvLyBDb25uZWN0aW5nIHRvIHRoZSBnaXRodWJcclxuICAgICAgY29uc3QgcGlwZWxpbmUgPSBuZXcgcGlwZWxpbmVzLkNvZGVQaXBlbGluZSh0aGlzLCAnUGlwZWxpbmUnLCB7c3ludGg6IHN5bnRofSk7XHJcblxyXG4gICAgICAgIC8vIEFkZGluZyBUZXN0IGFuZCBjb21tYW5kc1xyXG4gICAgICAgIGNvbnN0IHVuaXRfdGVzdD0gbmV3IFNoZWxsU3RlcChcIlVuaXRfVGVzdFwiLHtcclxuICAgICAgICAgIGNvbW1hbmRzOltcImNkIGhpcmE0c3ByaW50XCIsXCJucG0gY2lcIixcIm5wbSBydW4gdGVzdFwiXVxyXG4gICAgICAgIH0pXHJcblxyXG5cclxuICAgICAgLy8gSW5zdGFudGlhdGUgQmV0YSBzdGFnZVxyXG4gICAgICBjb25zdCBzdGFnZWJldGEgPSBuZXcgSGlyYXN0YWdlc3RhY2sodGhpcyxcImJldGFzdGFnZVwiKVxyXG4gICAgICAvLyBBZGRpbmcgYmV0YSBzdGFnZSB0byB0aGUgcGlwZWxpbmUgYW5kICB1bml0IHRlc3QgYXMgcHJlIHN0YWdlXHJcbiAgICAgIHBpcGVsaW5lLmFkZFN0YWdlKHN0YWdlYmV0YSx7cHJlOlt1bml0X3Rlc3RdfSlcclxuXHJcbiAgICAgIC8vIENyZWF0aW5nIFByb2R1Y3Rpb24gc3RhZ2VcclxuICAgICAgY29uc3QgcHJvZD1uZXcgSGlyYXN0YWdlc3RhY2sodGhpcyxcInByb2RcIilcclxuICAgICAgLy8gQWRkaW5nIHByb2R1Y3QgdG8gcGlwZWxpbmUgYW5kIG1hbnVhbCBhcHByb3ZhbCBhcyBwcmUgc3RhZ2VcclxuICAgICAgcGlwZWxpbmUuYWRkU3RhZ2UocHJvZCx7cHJlOltuZXcgTWFudWFsQXBwcm92YWxTdGVwKFwiV2FpdGluZyBmb3IgeW91ciBhcHByb3ZhbFwiKV19KVxyXG4gICAgfVxyXG4gIFxyXG5cclxuICB9Il19