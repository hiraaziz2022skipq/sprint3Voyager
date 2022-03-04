from aws_cdk import (
    Stack,
    SecretValue,
    pipelines,
    aws_iam as iam_,
    aws_codepipeline_actions as cpactions_

)
import aws_cdk as cdk
from constructs import Construct
from .hirastage_stack import HirastageStack

class HirapipelineStack(Stack):

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        role_ = self.create_pipeline_role()

        # Connecting to the github
        source = pipelines.CodePipelineSource.git_hub("hiraaziz2022skipq/sprint3Voyager", "main",
                                                      authentication=SecretValue.secrets_manager('webtken'),
                                                      trigger=cpactions_.GitHubTrigger('POLL'))
        
        synth=pipelines.CodeBuildStep("Synth",
                                    input= source,
                                    commands=["cd hira/", "pip install -r requirements.txt",
                                              "npm install -g aws-cdk", "cdk synth"],
                                    primary_output_directory = "hira/cdk.out",
                                    role = role_)

        # Creating Pipeline
        pipeline = pipelines.CodePipeline(self, "web_Pipeline", synth=synth)

        # Instantiate Beta stage
        beta = HirastageStack(self, "beta")

        # Creating Production stage
        prod = HirastageStack(self, "prod")
        
        # Adding Test and commands
        unit_test=pipelines.ShellStep("unit_test", commands=["cd hira/","pip install -r requirements.txt",
                                                             "pip install -r requirements-dev.txt","pytest"])
        
        
        # Adding to the pipeline and  unit test as pre stage
        pipeline.add_stage(beta,pre=[unit_test])

        
        # Adding product to pipeline and manual approval as pre stage
        pipeline.add_stage(prod, pre = [pipelines.ManualApprovalStep("Approve prod stage")])


    # Assigning roles to Pipeline
    def create_pipeline_role(self):
            role = iam_.Role(self, "Hira-Pipeline-Role",
                   assumed_by=iam_.CompositePrincipal(
                       iam_.ServicePrincipal("lambda.amazonaws.com"),
                       iam_.ServicePrincipal("sns.amazonaws.com"),
                       iam_.ServicePrincipal("codebuild.amazonaws.com")),
                   managed_policies=[
                    iam_.ManagedPolicy.from_aws_managed_policy_name('CloudWatchFullAccess'),
                    iam_.ManagedPolicy.from_aws_managed_policy_name('AmazonDynamoDBFullAccess'),
                    iam_.ManagedPolicy.from_aws_managed_policy_name('service-role/AWSLambdaBasicExecutionRole'),
                    # iam_.ManagedPolicy.from_aws_managed_policy_name('AWSLambdaInvocation-DynamoDB'),
                    iam_.ManagedPolicy.from_aws_managed_policy_name("AwsCloudFormationFullAccess"),
                    iam_.ManagedPolicy.from_aws_managed_policy_name("AWSCodePipeline_FullAccess"),
                    iam_.ManagedPolicy.from_aws_managed_policy_name("AmazonS3FullAccess")
                    #iam_.ManagedPolicy.from_aws_managed_policy_name("SecretsManagerReadWrite")
                    ])
            return role









