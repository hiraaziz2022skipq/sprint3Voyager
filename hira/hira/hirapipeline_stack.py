from aws_cdk import (
    Stack,
    SecretValue,
    pipelines,
    aws_codepipeline_actions as cpactions_

)
import aws_cdk as cdk
from constructs import Construct
from .hirastage_stack import HirastageStack

class HirapipelineStack(Stack):

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Connecting to the github
        source = pipelines.CodePipelineSource.git_hub("hiraaziz2022skipq/sprint3Voyager", "main",
                                                      authentication=SecretValue.secrets_manager('webtken'),
                                                      trigger=cpactions_.GitHubTrigger('POLL'))

        # Giving source and commands
        synth = pipelines.ShellStep("Synth", input=source,
                                    commands=["cd hira/", "pip install -r requirements.txt",
                                              "npm install -g aws-cdk", "cdk synth"],
                                    primary_output_directory="hira/cdk.out"
                                    )

        # Creating Pipeline
        pipeline = pipelines.CodePipeline(self, "web_Pipeline", synth=synth)

        # Instantiate Beta stage
        beta = HirastageStack(self, "beta")

        # Creating Production stage
        prod = HirastageStack(self, "prod")

        # Adding to the pipeline
        pipeline.add_stage(beta)

        ordered_steps = pipelines.Step.sequence([pipelines.ManualApprovalStep("A")])
        pipeline.add_stage(prod, pre=ordered_steps)










