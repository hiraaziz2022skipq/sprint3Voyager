import aws_cdk

from aws_cdk import (
    Stack,
    pipelines,
    Stage,

)
import aws_cdk as cdk
from .hira_stack import HiraStack

from constructs import Construct


class HirastageStack(Stage):

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Instantiate web crawler stack
        self.stage = HiraStack(self, "hiraaziz3stack")